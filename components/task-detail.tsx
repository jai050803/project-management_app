"use client";

import { TaskPriority, TaskStatus } from "@prisma/client";
import { useState } from "react";

type Member = { id: string; name: string };
type Attachment = { id: string; type: string; name: string; url: string };
type Update = { id: string; author: string; message: string; createdAt: string };

type TaskDetailProps = {
  activeMemberId: string;
  projectCode: string;
  members: Member[];
  task: {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    progress: number;
    notes: string;
    dependencies: string;
    deadline: string | null;
    assigneeId: string | null;
    attachments: Attachment[];
    updates: Update[];
  };
};

export function TaskDetail({ task, members, projectCode, activeMemberId }: TaskDetailProps) {
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState(task.notes ?? "");
  const [dependencies, setDependencies] = useState(task.dependencies ?? "");
  const [remark, setRemark] = useState("");
  const [link, setLink] = useState("");
  const [linkName, setLinkName] = useState("");
  const [file, setFile] = useState<File | null>(null);

  async function updateTask(data: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error();
      window.location.reload();
    } catch {
      alert("Unable to update task.");
    } finally {
      setBusy(false);
    }
  }

  async function addRemark() {
    if (!remark.trim()) return;
    setBusy(true);
    try {
      const memberName =
        members.find((m) => m.id === activeMemberId)?.name || localStorage.getItem(`memberName:${projectCode}`) || "Member";
      const res = await fetch(`/api/tasks/${task.id}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: memberName, message: remark })
      });
      if (!res.ok) throw new Error();
      window.location.reload();
    } catch {
      alert("Unable to add remark.");
    } finally {
      setBusy(false);
    }
  }

  async function addLink() {
    if (!link.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link, name: linkName || "External Link" })
      });
      if (!res.ok) throw new Error();
      window.location.reload();
    } catch {
      alert("Unable to add link.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadFile() {
    if (!file) return;
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/tasks/${task.id}/attachments`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      window.location.reload();
    } catch {
      alert("Unable to upload file. Keep size under 3MB.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5">
      <section className="panel p-5">
        <h1 className="text-2xl font-bold">{task.title}</h1>
        <p className="mt-2 text-[var(--muted)]">{task.description}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <select
            className="rounded-xl border border-[var(--line)] px-3 py-2"
            value={task.status}
            onChange={(e) => updateTask({ status: e.target.value })}
            disabled={busy}
          >
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="BLOCKED">Blocked</option>
            <option value="DONE">Done</option>
          </select>
          <select
            className="rounded-xl border border-[var(--line)] px-3 py-2"
            value={task.priority}
            onChange={(e) => updateTask({ priority: e.target.value })}
            disabled={busy}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <select
            className="rounded-xl border border-[var(--line)] px-3 py-2"
            value={task.assigneeId ?? ""}
            onChange={(e) => updateTask({ assigneeId: e.target.value || null })}
            disabled={busy}
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
          <input
            className="rounded-xl border border-[var(--line)] px-3 py-2"
            type="date"
            value={task.deadline ? new Date(task.deadline).toISOString().slice(0, 10) : ""}
            onChange={(e) => updateTask({ deadline: e.target.value || null })}
            disabled={busy}
          />
        </div>
        <div className="mt-4 grid gap-2">
          <label className="text-sm font-medium">Progress: {task.progress}%</label>
          <input
            type="range"
            min={0}
            max={100}
            defaultValue={task.progress}
            onMouseUp={(e) => updateTask({ progress: Number((e.target as HTMLInputElement).value) })}
            onTouchEnd={(e) => updateTask({ progress: Number((e.target as HTMLInputElement).value) })}
          />
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="text-lg font-semibold">Important Notes & Dependencies</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <textarea
            rows={4}
            className="rounded-xl border border-[var(--line)] px-3 py-2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Critical notes..."
          />
          <textarea
            rows={4}
            className="rounded-xl border border-[var(--line)] px-3 py-2"
            value={dependencies}
            onChange={(e) => setDependencies(e.target.value)}
            placeholder="Dependencies..."
          />
        </div>
        <button
          type="button"
          className="mt-3 rounded-xl bg-[var(--brand)] px-4 py-2 font-semibold text-white"
          onClick={() => updateTask({ notes, dependencies })}
          disabled={busy}
        >
          Save Notes
        </button>
      </section>

      <section className="panel p-5">
        <h2 className="text-lg font-semibold">Docs Upload (PDF, Images, Links)</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-[var(--line)] p-3">
            <p className="mb-2 text-sm font-semibold">Upload File (max 3MB)</p>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <button
              type="button"
              onClick={uploadFile}
              disabled={busy || !file}
              className="mt-3 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Upload
            </button>
          </div>
          <div className="rounded-xl border border-[var(--line)] p-3">
            <p className="mb-2 text-sm font-semibold">Add Document Link</p>
            <input
              className="mb-2 w-full rounded-xl border border-[var(--line)] px-3 py-2"
              placeholder="Link name"
              value={linkName}
              onChange={(e) => setLinkName(e.target.value)}
            />
            <input
              className="w-full rounded-xl border border-[var(--line)] px-3 py-2"
              placeholder="https://..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
            <button
              type="button"
              onClick={addLink}
              disabled={busy || !link}
              className="mt-3 rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Add Link
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          {task.attachments.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm"
            >
              {item.name} ({item.type})
            </a>
          ))}
          {task.attachments.length === 0 ? <p className="text-sm text-[var(--muted)]">No docs added yet.</p> : null}
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="text-lg font-semibold">Daily Updates / Remarks</h2>
        <div className="mt-3 flex gap-2">
          <input
            className="flex-1 rounded-xl border border-[var(--line)] px-3 py-2"
            placeholder="Write today's update..."
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />
          <button
            type="button"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            onClick={addRemark}
            disabled={busy || !remark.trim()}
          >
            Post
          </button>
        </div>
        <div className="mt-4 grid gap-2">
          {task.updates.map((update) => (
            <article key={update.id} className="rounded-xl border border-[var(--line)] bg-white p-3">
              <p className="text-sm text-[var(--muted)]">
                {update.author} | {new Date(update.createdAt).toLocaleString()}
              </p>
              <p>{update.message}</p>
            </article>
          ))}
          {task.updates.length === 0 ? <p className="text-sm text-[var(--muted)]">No remarks yet.</p> : null}
        </div>
      </section>
    </div>
  );
}

