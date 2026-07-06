// Railway старт кезінде админ бар екеніне көз жеткізеді (идемпотентті).
// Таза JS — продакшнде tsx болмаса да node тікелей іске қосады.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = process.env.ADMIN_PASSWORD ?? "admin123";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { username },
    update: {}, // бар админді өзгертпейміз — дерек сақталады
    create: { username, passwordHash, role: "admin" },
  });

  console.log(`✔ Админ дайын: ${username}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("Админ құру қатесі:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
