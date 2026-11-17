import { headers } from "next/headers";
import Trainer from "./trainer";
export const dynamic = "force-dynamic";
export default async function Home() {
  const id = (await headers()).get("oai-authenticated-user-id");
  return <Trainer player={id ?? "local"} />;
}
