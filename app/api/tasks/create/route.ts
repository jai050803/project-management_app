import { NextResponse } from "next/server";
import { createTask } from "@/lib/data";
import { TaskPriority, TaskStatus } from "@/lib/types";

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

    const created = await createTask({
      projectCode,
      title,
      description,
      priority,
      status,
      deadline: deadline ? deadline.toISOString() : null,
      assigneeId,
      progress
    });
    if (!created) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }
    return NextResponse.json(created);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

