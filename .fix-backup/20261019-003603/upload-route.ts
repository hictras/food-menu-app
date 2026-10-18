import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, R2_BUCKET } from "@/lib/r2";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/webm", "video/quicktime",
];

export async function POST(req: NextRequest) {
  try {
    const { filename, contentType } = await req.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: "filename and contentType are required" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    const ext = filename.split(".").pop() ?? "bin";
    const isVideo = contentType.startsWith("video/");
    const folder = isVideo ? "videos" : "recipes";
    const key = `${folder}/${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(r2, command, {
      expiresIn: isVideo ? 900 : 60,
      unhoistableHeaders: new Set(["x-amz-checksum-crc32"]),
    });

    return NextResponse.json({ uploadUrl, key, isVideo });
  } catch (err) {
    console.error("Upload presign error:", err);
    return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
  }
}
