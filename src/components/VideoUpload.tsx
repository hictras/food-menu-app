"use client";

import { useState } from "react";

type Props = {
  onUploaded: (publicUrl: string) => void;
  initialUrl?: string;
  disabled?: boolean;
};

export default function VideoUpload({ onUploaded, initialUrl, disabled }: Props) {
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setError("Please select a video file (mp4, webm, mov)");
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });

      if (!res.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, key } = await res.json();

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);

        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setProgress(Math.round((ev.loaded / ev.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(file);
      });

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

  function clearVideo() {
    setPreview(null);
    onUploaded("");
    setError(null);
    setProgress(0);
  }

  return (
    <div>
      <input
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        onChange={handleFile}
        disabled={uploading || disabled}
        style={{ display: "block", width: "100%", fontSize: 13 }}
      />

      {uploading && (
        <div style={{ marginTop: 10 }}>
          <div style={{ height: 6, borderRadius: 3, background: "var(--line)", overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${progress}%`, background: "var(--accent)",
              transition: "width 0.2s ease",
            }} />
          </div>
          <p className="helper" style={{ marginTop: 6 }}>Uploading… {progress}%</p>
        </div>
      )}

      {error && <p style={{ color: "var(--accent)", fontSize: 12, marginTop: 8 }}>{error}</p>}

      {preview && !uploading && (
        <div style={{ marginTop: 12 }}>
          <video
            src={preview}
            controls
            preload="metadata"
            playsInline
            style={{ width: "100%", borderRadius: 10, border: "1px solid var(--line)", background: "#000", aspectRatio: "16 / 9", objectFit: "contain" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 8, alignItems: "center" }}>
            <p className="helper" style={{ wordBreak: "break-all", margin: 0, flex: 1 }}>{preview}</p>
            <button type="button" className="icon-btn" onClick={clearVideo} title="Remove video">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
