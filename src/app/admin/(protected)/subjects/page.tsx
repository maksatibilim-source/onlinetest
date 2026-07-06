import { prisma } from "@/lib/prisma";
import { SubjectForm } from "@/components/admin/SubjectForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { GRADES } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SubjectsPage() {
  const subjects = await prisma.subject.findMany({
    orderBy: [{ grade: "asc" }, { name: "asc" }],
    include: { _count: { select: { questions: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Пәндер</h1>
      <p className="mt-1 text-sm text-gray-500">Пәнді нақты бір сыныпқа бекітіңіз</p>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
        <SubjectForm />
      </div>

      <div className="mt-8 space-y-6">
        {GRADES.map((grade) => {
          const list = subjects.filter((s) => s.grade === grade);
          if (list.length === 0) return null;
          return (
            <div key={grade}>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
                {grade}-сынып
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-500">{s._count.questions} сұрақ</p>
                    </div>
                    <DeleteButton
                      url={`/api/subjects/${s.id}`}
                      confirmText={`«${s.name}» пәнін және оған тиесілі барлық сұрақтарды жоясыз ба?`}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {subjects.length === 0 && (
          <p className="text-sm text-gray-500">Әзірге пән жоқ. Жоғарыдан қосыңыз.</p>
        )}
      </div>
    </div>
  );
}
