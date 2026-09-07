import { PrismaClient, Role } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  await prisma.user.upsert({
    where: { email: "employee@company.com" },
    update: {},
    create: {
      email: "employee@company.com",
      passwordHash,
      fullName: "Тестовый Сотрудник",
      role: Role.EMPLOYEE,
      department: "Продажи",
      position: "Менеджер",
    },
  });

  await prisma.user.upsert({
    where: { email: "hr@company.com" },
    update: {},
    create: {
      email: "hr@company.com",
      passwordHash,
      fullName: "HR Админ",
      role: Role.HR_ADMIN,
      department: "HR",
      position: "HR-менеджер",
    },
  });

  console.log("Готово: employee@company.com / hr@company.com, пароль у обоих: password123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });