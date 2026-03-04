import { TaskPriority, TaskStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const projectCode = String(body.projectCode ?? "")
      .trim()
      .toUpperCase();
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const priority = String(body.priority ?? "MEDIUM") as TaskPriority;
    const status = String(body.status ?? "TODO") as TaskStatus;
    const assigneeId = body.assigneeId ? String(body.assigneeId) : null;
    const deadline = body.deadline ? new Date(String(body.deadline)) : null;
    const progress = Number(body.progress ?? 0);

    if (!projectCode || !title || !description) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const project = await prisma.project.findUnique({ where: { code: projectCode } });
    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority,
        status,
        deadline,
        assigneeId,
        progress: Math.max(0, Math.min(100, progress)),
        projectId: project.id
      }
    });

    return NextResponse.json({ taskId: task.id });
  } catch {
    return NextResponse.json({ error: "Unable to create task." }, { status: 500 });
  }
}

