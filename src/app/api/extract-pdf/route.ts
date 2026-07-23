import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeText } from "@/lib/utils";

export const maxDuration = 30;

const MAX_PDF_BYTES = 8 * 1024 * 1024; // 8 MB

/** Extracts text from an uploaded PDF (LinkedIn profile export or resume). */
export async function POST(request: Request) {
  try {
    const user = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = rateLimit(`extract-pdf:${user.id}`, 10);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }
    if (file.size > MAX_PDF_BYTES) {
      return NextResponse.json({ error: "PDF is too large (max 8 MB)" }, { status: 400 });
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const { extractText } = await import("unpdf");
    const { text } = await extractText(buffer, { mergePages: true });

    const cleaned = sanitizeText(Array.isArray(text) ? text.join("\n") : text, 30000);

    if (cleaned.length < 50) {
      return NextResponse.json(
        { error: "Could not extract readable text from this PDF. Try pasting the text instead." },
        { status: 422 }
      );
    }

    return NextResponse.json({ data: { text: cleaned } });
  } catch (error) {
    console.error("[extract-pdf]", error);
    return NextResponse.json(
      { error: "Failed to read the PDF. Try pasting the text instead." },
      { status: 500 }
    );
  }
}
