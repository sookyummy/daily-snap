"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MAX_GROUP_NAME_LENGTH } from "@/lib/constants";

export default function NewGroupPage() {
  const [name, setName] = useState("");
  const [maxMembers, setMaxMembers] = useState(4);
  const [missionMode, setMissionMode] = useState<"auto" | "manual">("auto");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a group name");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), maxMembers, missionMode }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create group");
        return;
      }

      const data = await res.json();
      router.push(`/groups/${data.id}?invite=true`);
    } catch {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-white">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 pb-2 pt-safe-top">
        <button
          onClick={() => router.back()}
          className="pt-4 text-lg text-gray-500"
        >
          ←
        </button>
        <h1 className="pt-4 text-lg font-bold text-gray-900">Create Group</h1>
      </header>

      <form onSubmit={handleSubmit} className="px-5 py-6 space-y-6">
        {/* Group Name */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Group Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="College Friends"
            maxLength={MAX_GROUP_NAME_LENGTH}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition-colors focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20"
          />
          <div className="mt-1 text-right text-xs text-gray-400">
            {name.length}/{MAX_GROUP_NAME_LENGTH}
          </div>
        </div>

        {/* Max Members */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Max Members
          </label>
          <div className="flex gap-2">
            {[2, 3, 4, 5, 6, 7, 8].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setMaxMembers(n)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  maxMembers === n
                    ? "bg-[var(--color-brand)] text-white"
                    : "border border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Mission Mode */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Mission Mode
          </label>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setMissionMode("auto")}
              className={`w-full rounded-xl border p-3 text-left transition-all ${
                missionMode === "auto"
                  ? "border-[var(--color-brand)] bg-[var(--color-brand)]/5"
                  : "border-gray-200"
              }`}
            >
              <div className="text-sm font-medium text-gray-900">
                Auto (Random daily topic)
              </div>
              <div className="text-xs text-gray-500">
                The system picks a new topic every morning
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMissionMode("manual")}
              className={`w-full rounded-xl border p-3 text-left transition-all ${
                missionMode === "manual"
                  ? "border-[var(--color-brand)] bg-[var(--color-brand)]/5"
                  : "border-gray-200"
              }`}
            >
              <div className="text-sm font-medium text-gray-900">
                Manual
              </div>
              <div className="text-xs text-gray-500">
                The group owner sets the mission topic
              </div>
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full rounded-xl bg-[var(--color-brand)] px-6 py-3.5 text-base font-semibold text-white transition-all hover:bg-[var(--color-brand-dark)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create"}
        </button>
      </form>
    </div>
  );
}
