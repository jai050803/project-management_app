import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    await prisma.taskUpdate.create({
      data: {
        author,
        message,
        taskId
      }
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to add update." }, { status: 500 });
  }
}

