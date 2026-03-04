"use client";

import { TaskPriority, TaskStatus } from "@prisma/client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Member = {
  id: string;
  name: string;
};

type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  deadline: string | null;
  assigneeId: string | null;
  assignee: Member | null;
};

type DashboardProps = {
  activeMemberId: string;
  project: {
    id: string;
    name: string;
    code: string;
    members: Member[];
    tasks: Task[];
  };
};

const statusOptions: TaskStatus[] = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"];
const priorityOptions: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const statusLabel: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  BLOCKED: "Blocked",
  DONE: "Done"
};

const priorityLabel: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical"
};

export function Dashboard({ project, activeMemberId }: DashboardProps) {
  const [creating, setCreating] = useState(false);
  const [loadingTaskId, setLoadingTaskId] = useState("");
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    priority: "MEDIUM" as TaskPriority,
    status: "TODO" as TaskStatus,
    deadline: "",
    assigneeId: "",
    progress: 0
  });

  const stats = useMemo(() => {
    const total = project.tasks.length;
    const done = project.tasks.filter((t) => t.status === "DONE").length;
    const pending = total - done;
    const overallProgress =
      total === 0 ? 0 : Math.round(project.tasks.reduce((sum, task) => sum + task.progress, 0) / total);

    const today = new Date();
    const approaching = project.tasks.filter((task) => {
      if (!task.deadline || task.status === "DONE") return false;
      const days = Math.ceil((new Date(task.deadline).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= 2;
    });
    const overdue = project.tasks.filter((task) => {
      if (!task.deadline || task.status === "DONE") return false;
      return new Date(task.deadline) < today;
    });

    return { total, done, pending, overallProgress, approaching, overdue };
  }, [project.tasks]);

  const chartData = [
    { name: "Completed", value: stats.done, fill: "#15803d" },
    { name: "Pending", value: stats.pending, fill: "#ea580c" }
  ];

  async function createTask() {
    setCreating(true);
    try {
      const res = await fetch("/api/tasks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectCode: project.code,
          ...formState
        })
      });
      if (!res.ok) throw new Error();
      window.location.reload();
    } catch {
      alert("Unable to create task right now.");
    } finally {
      setCreating(false);
    }
  }

  async function quickUpdate(taskId: string, data: Record<string, unknown>) {
    setLoadingTaskId(taskId);
    try {
      const res = await fetch(`/api/tasks/${taskId}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error();
      window.location.reload();
    } catch {
      alert("Unable to update task right now.");
    } finally {
      setLoadingTaskId("");
    }
  }

  return (
    <div className="grid gap-5">
      <section className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Overall Progress</h2>
            <p className="text-sm text-[var(--muted)]">Tracks team progress across all tasks.</p>
          </div>
          <p className="text-2xl font-bold">{stats.overallProgress}%</p>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full bg-[var(--brand)]" style={{ width: `${stats.overallProgress}%` }} />
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <div className="panel p-5">
          <h3 className="mb-4 text-lg font-semibold">Completed vs Pending</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel p-5">
          <h3 className="text-lg font-semibold">Deadline Alerts</h3>
          <ul className="mt-3 grid gap-2 text-sm">
            {stats.approaching.map((task) => (
              <li key={task.id} className="rounded-xl bg-amber-100 px-3 py-2">
                Approaching: {task.title}
              </li>
            ))}
            {stats.overdue.map((task) => (
              <li key={task.id} className="rounded-xl bg-red-100 px-3 py-2">
                Overdue: {task.title}
              </li>
            ))}
            {stats.approaching.length === 0 && stats.overdue.length === 0 ? (
              <li className="rounded-xl bg-green-100 px-3 py-2">No urgent deadline alerts.</li>
            ) : null}
          </ul>
        </div>
      </section>

      <section className="panel p-5">
        <h3 className="text-lg font-semibold">Roadmap (Timeline)</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {project.tasks
            .filter((task) => task.deadline)
            .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
            .map((task) => (
              <div key={task.id} className="rounded-xl border border-[var(--line)] bg-white p-3">
                <p className="text-sm text-[var(--muted)]">{new Date(task.deadline!).toDateString()}</p>
                <p className="font-semibold">{task.title}</p>
                <p className="text-xs text-[var(--muted)]">{statusLabel[task.status]}</p>
              </div>
            ))}
          {project.tasks.filter((task) => task.deadline).length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Add deadlines to see timeline items.</p>
          ) : null}
        </div>
      </section>

      <section className="panel p-5">
        <h3 className="text-lg font-semibold">Create Task</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            placeholder="Task title"
            className="rounded-xl border border-[var(--line)] px-3 py-2"
            value={formState.title}
            onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
          />
          <input
            placeholder="Deadline"
            type="date"
            className="rounded-xl border border-[var(--line)] px-3 py-2"
            value={formState.deadline}
            onChange={(e) => setFormState((prev) => ({ ...prev, deadline: e.target.value }))}
          />
          <textarea
            placeholder="Description"
            className="md:col-span-2 rounded-xl border border-[var(--line)] px-3 py-2"
            rows={3}
            value={formState.description}
            onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
          />
          <select
            className="rounded-xl border border-[var(--line)] px-3 py-2"
            value={formState.priority}
            onChange={(e) => setFormState((prev) => ({ ...prev, priority: e.target.value as TaskPriority }))}
          >
            {priorityOptions.map((opt) => (
              <option key={opt} value={opt}>
                {priorityLabel[opt]}
              </option>
            ))}
          </select>
          <select
            className="rounded-xl border border-[var(--line)] px-3 py-2"
            value={formState.status}
            onChange={(e) => setFormState((prev) => ({ ...prev, status: e.target.value as TaskStatus }))}
          >
            {statusOptions.map((opt) => (
              <option key={opt} value={opt}>
                {statusLabel[opt]}
              </option>
            ))}
          </select>
          <select
            className="rounded-xl border border-[var(--line)] px-3 py-2"
            value={formState.assigneeId}
            onChange={(e) => setFormState((prev) => ({ ...prev, assigneeId: e.target.value }))}
          >
            <option value="">Unassigned</option>
            {project.members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
          <div className="grid gap-1">
            <label className="text-xs text-[var(--muted)]">Progress: {formState.progress}%</label>
            <input
              type="range"
              min={0}
              max={100}
              value={formState.progress}
              onChange={(e) => setFormState((prev) => ({ ...prev, progress: Number(e.target.value) }))}
            />
          </div>
        </div>
        <button
          type="button"
          disabled={creating}
          onClick={createTask}
          className="mt-4 rounded-xl bg-[var(--accent)] px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {creating ? "Creating..." : "Create Task"}
        </button>
      </section>

      <section className="panel p-5">
        <h3 className="mb-4 text-lg font-semibold">Tasks</h3>
        <div className="grid gap-3">
          {project.tasks.map((task) => (
            <article key={task.id} className="rounded-xl border border-[var(--line)] bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{task.title}</p>
                  <p className="text-sm text-[var(--muted)]">{task.description}</p>
                </div>
                <Link
                  href={`/project/${project.code}/task/${task.id}?member=${activeMemberId}`}
                  className="rounded-lg border border-[var(--line)] px-3 py-1 text-sm"
                >
                  Open Detail
                </Link>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="badge bg-slate-100">{statusLabel[task.status]}</span>
                <span className="badge bg-amber-100">{priorityLabel[task.priority]}</span>
                <span className="badge bg-emerald-100">{task.progress}%</span>
                <span className="text-[var(--muted)]">{task.assignee?.name || "Unassigned"}</span>
              </div>

              <div className="mt-3 grid gap-2 md:grid-cols-4">
                <select
                  value={task.status}
                  onChange={(e) => quickUpdate(task.id, { status: e.target.value })}
                  className="rounded-lg border border-[var(--line)] px-2 py-1 text-sm"
                  disabled={loadingTaskId === task.id}
                >
                  {statusOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {statusLabel[opt]}
                    </option>
                  ))}
                </select>
                <select
                  value={task.assigneeId ?? ""}
                  onChange={(e) => quickUpdate(task.id, { assigneeId: e.target.value || null })}
                  className="rounded-lg border border-[var(--line)] px-2 py-1 text-sm"
                  disabled={loadingTaskId === task.id}
                >
                  <option value="">Unassigned</option>
                  {project.members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={task.progress}
                  onChange={(e) => quickUpdate(task.id, { progress: Number(e.target.value) })}
                  disabled={loadingTaskId === task.id}
                />
                <p className="self-center text-sm text-[var(--muted)]">
                  Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : "Not set"}
                </p>
              </div>
            </article>
          ))}
          {project.tasks.length === 0 ? <p className="text-sm text-[var(--muted)]">No tasks yet.</p> : null}
        </div>
      </section>
    </div>
  );
}

