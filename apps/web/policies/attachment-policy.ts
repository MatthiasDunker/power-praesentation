import type { GenerateDeckRequest } from "@power/contracts";

const allowedMimeTypes = new Set(["text/markdown", "text/plain"]);

export function validateAttachmentPolicy(request: GenerateDeckRequest): void {
  if (!request.attachment) {
    return;
  }

  if (!allowedMimeTypes.has(request.attachment.mimeType)) {
    throw new Error("Unsupported attachment type. Only text/markdown and text/plain are allowed.");
  }

  if (request.attachment.text.length > 200_000) {
    throw new Error("Attachment exceeds maximum size (200k characters).");
  }
}
