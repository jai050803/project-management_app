import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectByCode, getTaskDetail } from "@/lib/data";
import { TaskDetail } from "@/components/task-detail";

type Params = {
  params: Promise<{ code: string; taskId: string }>;
  searchParams: Promise<{ member?: string }>;
};

export default async function TaskDetailPage({ params, searchParams }: Params) {
  const { code: codeParam, taskId } = await params;
  const code = codeParam.toUpperCase();
  const { member } = await searchParams;

  const project = getProjectByCode(code);
  if (!project) notFound();

  const task = getTaskDetail(taskId);

  if (!task || task.projectId !== project.id) {
    notFound();
  }

  return (
    <main className="container-shell">
      <div className="mb-4">
        <Link
          href={`/project/${project.code}?member=${member ?? ""}`}
          className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm"
        >
          Back to Dashboard
        </Link>
      </div>
      <TaskDetail
        projectCode={project.code}
        task={task}
        members={project.members}
        activeMemberId={member ?? ""}
      />
    </main>
  );
}
