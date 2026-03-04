import { NextResponse } from "next/server";
import { updateTask } from "@/lib/data";
import { TaskPriority, TaskStatus } from "@/lib/types";

type Params = { params: Promise<{ taskId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { taskId } = await params;
    const body = await req.json();

    const data: {
      status?: TaskStatus;
      priority?: TaskPriority;
      progress?: number;
      assigneeId?: string | null;
      notes?: string;
      dependencies?: string;
      deadline?: Date | null;
    } = {};

    if (body.status) data.status = String(body.status) as TaskStatus;
    if (body.priority) data.priority = String(body.priority) as TaskPriority;
    if (body.progress !== undefined) {
      data.progress = Math.max(0, Math.min(100, Number(body.progress)));
    }
    if (body.assigneeId !== undefined) {
      data.assigneeId = body.assigneeId ? String(body.assigneeId) : null;
    }
    if (body.notes !== undefined) data.notes = String(body.notes);
    if (body.dependencies !== undefined) data.dependencies = String(body.dependencies);
    if (body.deadline !== undefined) {
      data.deadline = body.deadline ? new Date(String(body.deadline)) : null;
    }

    const ok = await updateTask(taskId, {
      ...data,
      deadline: data.deadline ? data.deadline.toISOString() : data.deadline ?? undefined
    });
    if (!ok) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to update task." }, { status: 500 });
  }
}

