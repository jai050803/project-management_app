import { NextResponse } from "next/server";
import { addTaskUpdate } from "@/lib/data";

type Params = { params: Promise<{ taskId: string }> };

export async function POST(req: Request, { params }: Params) {
  try {
    const { taskId } = await params;
    const body = await req.json();
    const author = String(body.author ?? "").trim();
    const message = String(body.message ?? "").trim();

    if (!author || !message) {
      return NextResponse.json({ error: "Author and message required." }, { status: 400 });
    }

    const ok = await addTaskUpdate(taskId, author, message);
    if (!ok) return NextResponse.json({ error: "Task not found." }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

