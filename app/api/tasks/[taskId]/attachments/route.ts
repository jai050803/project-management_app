import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

      await prisma.attachment.create({
        data: {
          type: "LINK",
          name,
          url: link,
          taskId
        }
      });

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

    await prisma.attachment.create({
      data: {
        type: "FILE",
        name: file.name,
        url: dataUrl,
        taskId
      }
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to attach document." }, { status: 500 });
  }
}

