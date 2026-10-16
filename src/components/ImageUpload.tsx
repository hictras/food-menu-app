"use client";

import { useState } from "react";

type Props = {
  onUploaded: (publicUrl: string) => void;
  initialUrl?: string;
};

export default function ImageUpload({ onUploaded, initialUrl }: Props) {
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      // 1. Get presigned URL from our API
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      if (!res.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, key } = await res.json();

      // 2. Upload directly to R2
      const put = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!put.ok) throw new Error("Upload to R2 failed");

      // 3. Build the public URL
      const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
      const publicUrl = `${base}/${key}`;

      setPreview(publicUrl);
      onUploaded(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <input
        type="file"
        accept="image/*"
        onChange={handleFile}
        disabled={uploading}
        className="block w-full text-sm"
      />

      {uploading && <p className="text-sm text-gray-500">Uploading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {preview && (
        <img
          src={preview}
          alt="Recipe preview"
          className="w-48 h-48 object-cover rounded-lg border"
        />
      )}
    </div>
  );
}
