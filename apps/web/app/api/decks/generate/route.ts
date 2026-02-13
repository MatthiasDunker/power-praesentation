import { generateDeckRequestSchema, generationStreamEventSchema } from "@power/contracts";
import { validateAttachmentPolicy } from "@/policies/attachment-policy";
import { generateDeckEvents } from "@/server/services/deck-generation-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = generateDeckRequestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      {
        error: "Invalid request payload",
        issues: parsed.error.issues
      },
      { status: 400 }
    );
  }

  try {
    validateAttachmentPolicy(parsed.data);
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Attachment policy validation failed"
      },
      { status: 400 }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for await (const event of generateDeckEvents(parsed.data)) {
        const validated = generationStreamEventSchema.safeParse(event);
        const payload = validated.success
          ? JSON.stringify(validated.data)
          : JSON.stringify({
              type: "generation_error",
              message: "Internal event schema mismatch"
            });

        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      }

      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive"
    }
  });
}
