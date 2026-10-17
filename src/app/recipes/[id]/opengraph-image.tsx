import { ImageResponse } from "next/og";
import { getDb } from "@/db";
import { recipes } from "@/db/schema";
import { eq } from "drizzle-orm";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Recipe preview";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);

  let name = "Recipe";
  let imageUrl: string | null = null;

  if (!Number.isNaN(numericId)) {
    const db = getDb();
    const [recipe] = await db
      .select()
      .from(recipes)
      .where(eq(recipes.id, numericId))
      .limit(1);

    if (recipe) {
      name = recipe.name;
      imageUrl = recipe.imageUrl ?? null;
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#1a1410",
          color: "#fff",
          position: "relative",
        }}
      >
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            width={1200}
            height={630}
            style={{
              position: "absolute",
              inset: 0,
              objectFit: "cover",
              opacity: 0.45,
            }}
          />
        )}

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.85) 100%)",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: 70,
            height: "100%",
          }}
        >
          <div
            style={{
              fontSize: 36,
              fontWeight: 500,
              color: "#e8b44a",
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 24,
            }}
          >
            Hicham Today Recipe
          </div>

          <div
            style={{
              fontSize: 80,
              fontWeight: 700,
              lineHeight: 1.1,
              maxWidth: 1000,
            }}
          >
            {name}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}