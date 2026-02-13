export function extractJsonObject(text: string): Record<string, unknown> | null {
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (!objectMatch) {
    return null;
  }

  try {
    return JSON.parse(objectMatch[0]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function extractJsonArray(text: string): Array<Record<string, unknown>> | null {
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (!arrayMatch) {
    return null;
  }

  try {
    return JSON.parse(arrayMatch[0]) as Array<Record<string, unknown>>;
  } catch {
    return null;
  }
}
