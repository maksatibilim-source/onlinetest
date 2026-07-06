import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [subjects, questions, students, finished, activeCodes] = await Promise.all([
    prisma.subject.count(),
    prisma.question.count(),
    prisma.student.count(),
    prisma.attempt.count({ where: { status: "finished" } }),
    prisma.oneTimeCode.count({ where: { status: "active" } }),
  ]);

  const cards = [
    { label: "Пәндер", value: subjects, href: "/admin/subjects" },
    { label: "Сұрақтар", value: questions, href: "/admin/questions" },
    { label: "Белсенді кодтар", value: activeCodes, href: "/admin/codes" },
    { label: "Тіркелген оқушы", value: students, href: "/admin/statistics" },
    { label: "Аяқталған тест", value: finished, href: "/admin/statistics" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Басты бет</h1>
      <p className="mt-1 text-sm text-gray-500">Жүйенің жалпы көрінісі</p>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-2xl border border-gray-200 bg-white p-5 transition hover:shadow-md"
          >
            <p className="text-3xl font-extrabold text-gray-900">{c.value}</p>
            <p className="mt-1 text-sm text-gray-500">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/codes"
          className="rounded-2xl bg-brand-500 p-6 text-white transition hover:bg-brand-600"
        >
          <p className="text-lg font-semibold">🔑 Жаңа код беру</p>
          <p className="mt-1 text-sm text-brand-100">Оқушыға бір реттік құпия сөз генерациялау</p>
        </Link>
        <Link
          href="/admin/questions"
          className="rounded-2xl border border-gray-200 bg-white p-6 transition hover:shadow-md"
        >
          <p className="text-lg font-semibold text-gray-900">➕ Сұрақ қосу</p>
          <p className="mt-1 text-sm text-gray-500">LaTeX және сурет қолдауымен</p>
        </Link>
      </div>
    </div>
  );
}
