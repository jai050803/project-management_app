import { EntryForm } from "@/components/entry-form";

export default function Home() {
  return (
    <main className="container-shell">
      <section className="mx-auto mt-8 max-w-3xl panel p-6 md:p-10">
        <p className="mb-2 text-sm uppercase tracking-widest text-[var(--brand)]">Project Hub</p>
        <h1 className="text-3xl font-bold md:text-4xl">Lightweight Team Dashboard</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          Create a project, share code with team, and collaborate on tasks, progress, docs, and daily updates.
        </p>
        <EntryForm />
      </section>
    </main>
  );
}

