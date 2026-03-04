import { NextResponse } from "next/server";
import { addTaskAttachment } from "@/lib/data";

type Params = { params: Promise<{ taskId: string }> };

const MAX_FILE_BYTES = 3 * 1024 * 1024;

export async function POST(req: Request, { params }: Params) {
  try {
    const { taskId } = await params;
    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      const link = String(body.link ?? "").trim();
      const name = String(body.name ?? "External Link").trim();
      if (!link) {
        return NextResponse.json({ error: "Link is required." }, { status: 400 });
      }

      const ok = await addTaskAttachment(taskId, "LINK", name, link);
      if (!ok) return NextResponse.json({ error: "Task not found." }, { status: 404 });

      return NextResponse.json({ ok: true });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "File too large. Max file size is 3MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const dataUrl = `data:${file.type || "application/octet-stream"};base64,${base64}`;

    const ok = await addTaskAttachment(taskId, "FILE", file.name, dataUrl);
    if (!ok) return NextResponse.json({ error: "Task not found." }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

