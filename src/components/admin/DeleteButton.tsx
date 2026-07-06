"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteButton({
  url,
  confirmText,
  label = "Жою",
}: {
  url: string;
  confirmText?: string;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    if (!confirm(confirmText ?? "Жоюды растайсыз ба?")) return;
    setLoading(true);
    await fetch(url, { method: "DELETE" }).catch(() => {});
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
    >
      {loading ? "..." : label}
    </button>
  );
}
