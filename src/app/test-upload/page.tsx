"use client";

import { useState } from "react";
import ImageUpload from "@/components/ImageUpload";

export default function TestUploadPage() {
  const [url, setUrl] = useState<string | null>(null);

  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-4">R2 Upload Test</h1>
      <ImageUpload onUploaded={setUrl} />
      {url && (
        <p className="mt-4 text-sm break-all">
          Uploaded: <code>{url}</code>
        </p>
      )}
    </div>
  );
}
