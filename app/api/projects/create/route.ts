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

    const project = createProject(projectName, memberName);
    return NextResponse.json(project);
  } catch (error: unknown) {
    console.error("Project create failed:", error);
    return NextResponse.json({ error: "Unable to create project." }, { status: 500 });
  }
}

