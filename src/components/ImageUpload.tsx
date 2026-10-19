"use client";

import { useState } from "react";
import imageCompression from "browser-image-compression";

type Props = {
  onUploaded: (publicUrl: string) => void;
  initialUrl?: string;
};

export default function ImageUpload({ onUploaded, initialUrl }: Props) {
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    setStatus("Compressing...");

    try {
      let uploadFile: File | Blob = file;

      if (file.type.startsWith("image/") && file.size > 200 * 1024) {
        try {
          uploadFile = await imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1600,
            useWebWorker: true,
            initialQuality: 0.82,
          });
        } catch (err) {
          console.warn("Compression failed, uploading original:", err);
          uploadFile = file;
        }
      }

      const finalName = file.name;
      const finalType = file.type || "image/jpeg";

      setStatus("Uploading...");

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: finalName, contentType: finalType }),
      });

      if (!res.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, key } = await res.json();

      const put = await fetch(uploadUrl, {
        method: "PUT",
        body: uploadFile,
        headers: { "Content-Type": finalType },
      });

      if (!put.ok) throw new Error("Upload to R2 failed");

      const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
      const publicUrl = `${base}/${key}`;

      setPreview(publicUrl);
      onUploaded(publicUrl);
      setStatus("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setStatus("");
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
      {status && <p className="text-sm text-gray-500">{status}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {preview && (
        <img
          src={preview}
          alt="Recipe preview"
          loading="lazy"
          className="w-48 h-48 object-cover rounded-lg border"
        />
      )}
    </div>
  );
}
