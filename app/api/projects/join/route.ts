import { NextResponse } from "next/server";
import { joinProject } from "@/lib/data";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const code = String(body.code ?? "")
      .trim()
      .toUpperCase();
    const memberName = String(body.memberName ?? "").trim();

    if (!code || !memberName) {
      return NextResponse.json(
        { error: "Project code and your name are required." },
        { status: 400 }
      );
    }

    const joined = joinProject(code, memberName);
    if (!joined) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    return NextResponse.json(joined);
  } catch {
    return NextResponse.json({ error: "Unable to join project." }, { status: 500 });
  }
}

