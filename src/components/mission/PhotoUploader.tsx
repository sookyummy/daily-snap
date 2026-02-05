"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type Props = {
  groupId: string;
  missionId: string;
  hasSubmitted: boolean;
};

export default function PhotoUploader({
  groupId,
  missionId,
  hasSubmitted,
}: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 10 * 1024 * 1024) {
      setError("Photos must be under 10MB");
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setError("");
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const res = await fetch(
        `/api/groups/${groupId}/missions/${missionId}/submit`,
        { method: "POST", body: formData }
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Upload failed");
        return;
      }

      setPreview(null);
      setFile(null);
      router.refresh();
    } catch {
      setError("An error occurred");
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setFile(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/heif,image/webp"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview ? (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl">
            <img
              src={preview}
              alt="Preview"
              className="w-full object-cover"
              style={{ maxHeight: "300px" }}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={uploading}
              className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition-all active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 rounded-xl bg-[var(--color-brand)] py-3 text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-2xl bg-[var(--color-brand)] py-4 text-base font-semibold text-white transition-all active:scale-[0.98]"
        >
          {hasSubmitted ? "📷 Retake Photo" : "📷 Take Photo"}
        </button>
      )}

      {error && <p className="text-center text-sm text-red-500">{error}</p>}
    </div>
  );
}
