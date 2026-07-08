// Railway старт кезінде дерекқорды дайындайды:
//  • Әдепкі: `prisma db push` — схеманы аддитивті синхрондайды, ДЕРЕК САҚТАЛАДЫ.
//  • RESET_DB=true болса: `--force-reset` — дерекқор ТОЛЫҚ ТАЗАЛАНАДЫ (бір реттік көшу үшін).
//  Содан кейін админді қамтамасыз етеді (идемпотентті).
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const reset = process.env.RESET_DB === "true";

const pushCmd = reset
  ? "npx prisma db push --skip-generate --force-reset"
  : "npx prisma db push --skip-generate";

if (reset) {
  console.warn("⚠️  [db-setup] RESET_DB=true — ДЕРЕКҚОР ТОЛЫҚ ТАЗАЛАНАДЫ (--force-reset).");
  console.warn("⚠️  [db-setup] Тазалаудан кейін бұл айнымалыны ӨШІРІҢІЗ!");
} else {
  console.log("[db-setup] db push — схема синхрондалады, дерек сақталады.");
}

execSync(pushCmd, { stdio: "inherit" });

// Админді қамтамасыз ету (бар болса — өзгертілмейді)
const prisma = new PrismaClient();
const username = process.env.ADMIN_USERNAME ?? "admin";
const password = process.env.ADMIN_PASSWORD ?? "admin123";
const passwordHash = await bcrypt.hash(password, 10);

await prisma.user.upsert({
  where: { username },
  update: {},
  create: { username, passwordHash, role: "admin" },
});
console.log(`[db-setup] ✔ Админ дайын: ${username}`);

await prisma.$disconnect();
