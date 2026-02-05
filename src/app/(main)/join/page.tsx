"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinByLinkPage() {
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  const router = useRouter();

  const extractCode = (input: string): string | null => {
    const trimmed = input.trim();
    // Direct code (alphanumeric, typically nanoid)
    if (/^[a-zA-Z0-9_-]{8,}$/.test(trimmed)) return trimmed;
    // Full URL with /invite/CODE
    const match = trimmed.match(/\/invite\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  const handleJoin = async () => {
    const code = extractCode(link);
    if (!code) {
      setError("Please paste a valid invite link or code");
      return;
    }

    setJoining(true);
    setError("");

    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to join");
        return;
      }

      router.push(`/groups/${data.groupId}`);
    } catch {
      setError("An error occurred");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-dvh bg-white">
      <header className="flex items-center gap-3 px-5 pb-2 pt-safe-top">
        <button
          onClick={() => router.back()}
          className="pt-4 text-lg text-gray-500"
        >
          ←
        </button>
        <h1 className="pt-4 text-lg font-bold text-gray-900">Join by Link</h1>
      </header>

      <div className="px-5 py-6">
        <p className="mb-4 text-sm text-gray-500">
          Paste an invite link or code from a friend
        </p>

        <input
          type="text"
          value={link}
          onChange={(e) => {
            setLink(e.target.value);
            setError("");
          }}
          placeholder="https://...  or invite code"
          className="mb-3 w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none transition-colors focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20"
        />

        {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

        <button
          onClick={handleJoin}
          disabled={joining || !link.trim()}
          className="w-full rounded-xl bg-[var(--color-brand)] px-6 py-3.5 text-base font-semibold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {joining ? "Joining..." : "Join Group"}
        </button>
      </div>
    </div>
  );
}
