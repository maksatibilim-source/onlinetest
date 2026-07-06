import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Тек бастапқы админді құрады. Демо сұрақ/пән/код ЕНГІЗІЛМЕЙДІ —
// сұрақтар базасын админ панель арқылы толтырасыз.
async function main() {
  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = process.env.ADMIN_PASSWORD ?? "admin123";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { username },
    update: {}, // бар админ өзгертілмейді (пароль сақталады)
    create: { username, passwordHash, role: "admin" },
  });

  console.log(`✔ Админ дайын: ${username}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
