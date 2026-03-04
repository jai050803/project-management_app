"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

type Mode = "create" | "join";

export function EntryForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("create");
  const [projectName, setProjectName] = useState("");
  const [memberName, setMemberName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitLabel = useMemo(() => (mode === "create" ? "Create Project" : "Join Project"), [mode]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const path = mode === "create" ? "/api/projects/create" : "/api/projects/join";
      const payload =
        mode === "create"
          ? { projectName, memberName }
          : { code: code.toUpperCase(), memberName };

      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      localStorage.setItem(`member:${data.projectCode}`, data.memberId);
      localStorage.setItem(`memberName:${data.projectCode}`, memberName);
      if (mode === "create") {
        alert(`Project created. Share this code with your team: ${data.projectCode}`);
      }
      router.push(`/project/${data.projectCode}?member=${data.memberId}`);
    } catch {
      setError("Network issue. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8">
      <div className="mb-5 flex gap-3">
        <button
          type="button"
          onClick={() => setMode("create")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            mode === "create" ? "bg-[var(--brand)] text-white" : "bg-white"
          }`}
        >
          New Project
        </button>
        <button
          type="button"
          onClick={() => setMode("join")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            mode === "join" ? "bg-[var(--brand)] text-white" : "bg-white"
          }`}
        >
          Join With Code
        </button>
      </div>

      <form onSubmit={onSubmit} className="grid gap-4">
        {mode === "create" ? (
          <label className="grid gap-2 text-sm font-medium">
            Project Name
            <input
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="rounded-xl border border-[var(--line)] bg-white px-3 py-2"
              placeholder="Website Revamp"
            />
          </label>
        ) : (
          <label className="grid gap-2 text-sm font-medium">
            Project Code
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 uppercase"
              placeholder="AB9KQ2"
            />
          </label>
        )}

        <label className="grid gap-2 text-sm font-medium">
          Your Name
          <input
            required
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            className="rounded-xl border border-[var(--line)] bg-white px-3 py-2"
            placeholder="Ravi"
          />
        </label>

        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-[var(--accent)] px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Please wait..." : submitLabel}
        </button>
      </form>
    </div>
  );
}

