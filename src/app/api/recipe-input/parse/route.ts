import { NextResponse } from "next/server";

import { importRecipeFromUrl } from "@/lib/recipe-import.server";

type ParseBody = {
  url?: string;
};

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as ParseBody;
  const rawUrl = body.url?.trim();

  if (!rawUrl) {
    return NextResponse.json({ error: "Recipe URL is required." }, { status: 400 });
  }

  try {
    const normalizedUrl = new URL(rawUrl);
    if (!["http:", "https:"].includes(normalizedUrl.protocol)) {
      return NextResponse.json(
        { error: "Please enter an http or https recipe URL." },
        { status: 400 }
      );
    }

    const draft = await importRecipeFromUrl(normalizedUrl.toString());

    return NextResponse.json({ draft });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Please enter a valid absolute URL (including https://).",
      },
      {
        status:
          error instanceof TypeError ||
          (error instanceof Error &&
            error.message.includes("valid absolute URL"))
            ? 400
            : 500,
      }
    );
  }
}
