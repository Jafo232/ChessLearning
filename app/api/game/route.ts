import { headers } from "next/headers";
import { env } from "cloudflare:workers";
import { validateGame } from "../../../lib/game-state";
const reply = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
export async function GET() {
  const id = (await headers()).get("oai-authenticated-user-id");
  if (!id) return reply({ local: true });
  if (!env.DB) return reply({}, 503);
  const saved = await env.DB.prepare(
    "SELECT state FROM saved_games WHERE user_id=?",
  )
    .bind(id)
    .first<{ state: string }>();
  return reply({ game: saved ? JSON.parse(saved.state) : null });
}
export async function POST(r: Request) {
  const id = (await headers()).get("oai-authenticated-user-id");
  if (!id) return reply({ local: true });
  if (!env.DB) return reply({}, 503);
  if (
    r.headers.get("origin") &&
    r.headers.get("origin") !== new URL(r.url).origin
  )
    return reply({}, 403);
  const s = await r.json().catch(() => null);
  if (!validateGame(s) || s.updatedAt > Date.now() + 300000)
    return reply({}, 400);
  await env.DB.prepare(
    "INSERT INTO saved_games(user_id,state,updated_at) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET state=excluded.state, updated_at=excluded.updated_at WHERE excluded.updated_at>=saved_games.updated_at",
  )
    .bind(id, JSON.stringify(s), s.updatedAt)
    .run();
  return reply({ ok: true });
}
