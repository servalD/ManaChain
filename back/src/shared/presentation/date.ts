export function toIso(d: Date): string;
export function toIso(d: Date | null | undefined): string | null;
export function toIso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}
