import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const runtime = "nodejs"; // fs үшін Node runtime керек

// Сұраққа сурет жүктеу (локал public/uploads-қа сақтайды).
// ПРОДАКШНДЕ: S3 / Cloudinary / UploadThing қолданыңыз — serverless-те локал файл сақталмайды.
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Рұқсат жоқ" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл жоқ" }, { status: 400 });
  }

  // Қарапайым валидация
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Тек сурет файлдары рұқсат етіледі" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Файл 5 МБ-тан аспауы керек" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = (file.name.split(".").pop() ?? "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), bytes);

  return NextResponse.json({ ok: true, url: `/uploads/${filename}` });
}
