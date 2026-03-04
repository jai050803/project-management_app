import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
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
  } catch (error) {
    console.error("Project create failed:", error);

    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        {
          error:
            "Database not initialized in deployment. Set DATABASE_URL and run Prisma migrations on production DB."
        },
        { status: 500 }
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        {
          error: `Database request failed (${error.code}). Check Vercel logs and DATABASE_URL.`
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Unable to create project. Check server logs for DB error." },
      { status: 500 }
    );
  }
}

