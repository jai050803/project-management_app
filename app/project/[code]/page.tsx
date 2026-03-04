import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectByCode } from "@/lib/data";
import { Dashboard } from "@/components/dashboard";

type Params = {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ member?: string }>;
};

export default async function ProjectPage({ params, searchParams }: Params) {
  const { code: codeParam } = await params;
  const code = codeParam.toUpperCase();
  const { member } = await searchParams;

  const project = await getProjectByCode(code);

  if (!project) {
    notFound();
  }

  return (
    <main className="container-shell">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm uppercase tracking-wider text-[var(--brand)]">Project Dashboard</p>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-sm text-[var(--muted)]">
            Share code: <span className="font-semibold">{project.code}</span>
          </p>
        </div>
        <Link href="/" className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm">
          Switch Project
        </Link>
      </div>
      <Dashboard project={project} activeMemberId={member ?? ""} />
    </main>
  );
}
