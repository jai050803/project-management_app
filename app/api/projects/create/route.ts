import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateProjectCode } from "@/lib/utils";

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

    let code = generateProjectCode();
    let exists = await prisma.project.findUnique({ where: { code } });
    while (exists) {
      code = generateProjectCode();
      exists = await prisma.project.findUnique({ where: { code } });
    }

    const project = await prisma.project.create({
      data: {
        name: projectName,
        code,
        members: {
          create: {
            name: memberName
          }
        }
      },
      include: {
        members: true
      }
    });

    return NextResponse.json({
      projectCode: project.code,
      projectId: project.id,
      memberId: project.members[0]?.id
    });
  } catch {
    return NextResponse.json({ error: "Unable to create project." }, { status: 500 });
  }
}

