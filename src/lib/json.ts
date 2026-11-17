export function parseList(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) return parsed.map((item) => String(item));
  } catch {
    return [];
  }
  return [];
}

export function toJsonList(values: string[]): string {
  return JSON.stringify(values);
}
