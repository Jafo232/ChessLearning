import { lessons, validSavedPath } from "./lessons";
export type RecordEntry = {
  lesson: string;
  path: string[];
  completed: boolean;
  updatedAt: number;
};
export type Records = Record<string, RecordEntry>;
export function mergeRecords(a: Records, entries: unknown[]): Records {
  const out = { ...a };
  for (const row of entries) {
    if (!row || typeof row !== "object") continue;
    const r = row as RecordEntry;
    const lesson = lessons.find((l) => l.id === r.lesson);
    if (
      !lesson ||
      !validSavedPath(lesson, r.path) ||
      !Number.isSafeInteger(r.updatedAt)
    )
      continue;
    const old = out[r.lesson];
    out[r.lesson] = {
      ...(!old || r.updatedAt >= old.updatedAt ? r : old),
      completed: !!(r.completed || old?.completed),
    };
  }
  return out;
}
export function readLocal(key: string): Records {
  try {
    return mergeRecords(
      {},
      Object.values(JSON.parse(localStorage.getItem(key) || "{}")),
    );
  } catch {
    return {};
  }
}
