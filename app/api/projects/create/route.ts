import { NextResponse } from "next/server";
import { createProject } from "@/lib/data";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const projectName = String(body.projectName ?? "").trim();
    const memberName = String(body.memberName ?? "").trim();

    if (!projectName || !memberName) {
      return NextResponse.json(
        { error: "Project name and your name are required." },
        { status: 400 }
      );
    }

    const project = await createProject(projectName, memberName);
    return NextResponse.json(project);
  } catch (error: unknown) {
    console.error("Project create failed:", error);
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

