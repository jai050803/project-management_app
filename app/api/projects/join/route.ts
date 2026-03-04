import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const project = await prisma.project.findUnique({
      where: { code },
      include: { members: true }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const existingMember = project.members.find(
      (m: { name: string }) => m.name.toLowerCase() === memberName.toLowerCase()
    );

    const member =
      existingMember ||
      (await prisma.member.create({
        data: {
          name: memberName,
          projectId: project.id
        }
      }));

    return NextResponse.json({
      projectCode: project.code,
      projectId: project.id,
      memberId: member.id
    });
  } catch {
    return NextResponse.json({ error: "Unable to join project." }, { status: 500 });
  }
}

