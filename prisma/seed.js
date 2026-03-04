import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const code = "DEMO12";
  const existing = await prisma.project.findUnique({ where: { code } });
  if (existing) return;

  await prisma.project.create({
    data: {
      name: "Demo Team Board",
      code,
      members: {
        create: [{ name: "Asha" }, { name: "Rahul" }]
      },
      tasks: {
        create: [
          {
            title: "Setup initial milestones",
            description: "Break feature work into weekly milestones.",
            status: "IN_PROGRESS",
            priority: "HIGH",
            progress: 40
          },
          {
            title: "Design landing visuals",
            description: "Prepare new hero and feature visuals.",
            status: "TODO",
            priority: "MEDIUM",
            progress: 0
          }
        ]
      }
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

