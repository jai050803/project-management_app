import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TaskDetail } from "@/components/task-detail";

type Params = {
  params: Promise<{ code: string; taskId: string }>;
  searchParams: Promise<{ member?: string }>;
};

export default async function TaskDetailPage({ params, searchParams }: Params) {
  const { code: codeParam, taskId } = await params;
  const code = codeParam.toUpperCase();
  const { member } = await searchParams;

  const project = await prisma.project.findUnique({
    where: { code },
    include: { members: true }
  });
  if (!project) notFound();

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignee: true,
      attachments: {
        orderBy: { createdAt: "desc" }
      },
      updates: {
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!task || task.projectId !== project.id) {
    notFound();
  }

  const serializedTask = {
    ...task,
    deadline: task.deadline ? task.deadline.toISOString() : null,
    attachments: task.attachments.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString()
    })),
    updates: task.updates.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString()
    }))
  };

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
        task={serializedTask}
        members={project.members}
        activeMemberId={member ?? ""}
      />
    </main>
  );
}
