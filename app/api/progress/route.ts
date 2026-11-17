import { headers } from "next/headers";
import { env } from "cloudflare:workers";
import { lessons, isSolved, validSavedPath } from "../../../lib/lessons";

const respond = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
export async function GET() {
  const id = (await headers()).get("oai-authenticated-user-id");
  if (!id) return respond({ local: true, records: [] });
  if (!env.DB) return respond({ error: "Progress service unavailable" }, 503);
  const result = await env.DB.prepare(
    "SELECT lesson, path, completed, updated_at AS updatedAt FROM lesson_progress WHERE user_id=?",
  )
    .bind(id)
    .all<{
      lesson: string;
      path: string;
      completed: number;
      updatedAt: number;
    }>();
  return respond({
    records: result.results.map((r) => ({
      ...r,
      path: JSON.parse(r.path),
      completed: !!r.completed,
    })),
  });
}
export async function POST(request: Request) {
  const id = (await headers()).get("oai-authenticated-user-id");
  if (!id) return respond({ local: true });
  if (!env.DB) return respond({ error: "Progress service unavailable" }, 503);
  if (
    request.headers.get("origin") &&
    request.headers.get("origin") !== new URL(request.url).origin
  )
    return respond({}, 403);
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object")
    return respond({ error: "Invalid progress" }, 400);
  const data = body as Record<string, unknown>;
  const lesson = lessons.find((l) => l.id === data?.lesson);
  if (
    !lesson ||
    !validSavedPath(lesson, data.path) ||
    typeof data.updatedAt !== "number" ||
    !Number.isSafeInteger(data.updatedAt) ||
    data.updatedAt < 1 ||
    data.updatedAt > Date.now() + 300000
  )
    return respond({ error: "Invalid progress" }, 400);
  await env.DB.prepare(
    `INSERT INTO lesson_progress(user_id,lesson,path,completed,updated_at) VALUES(?,?,?,?,?)
    ON CONFLICT(user_id,lesson) DO UPDATE SET
    completed=MAX(lesson_progress.completed,excluded.completed),
    path=CASE WHEN excluded.updated_at>=lesson_progress.updated_at THEN excluded.path ELSE lesson_progress.path END,
    updated_at=MAX(lesson_progress.updated_at,excluded.updated_at)`,
  )
    .bind(
      id,
      lesson.id,
      JSON.stringify(data.path),
      isSolved(lesson, data.path) || data.completed === true ? 1 : 0,
      data.updatedAt,
    )
    .run();
  return respond({ ok: true });
}
