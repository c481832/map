import { getStore } from "@netlify/blobs";
import type { Config, Context } from "@netlify/functions";

const STORE_NAME = "explored-locations";

export default async (req: Request, context: Context) => {
  const store = getStore(STORE_NAME);
  const url = new URL(req.url);

  if (req.method === "GET") {
    const key = url.searchParams.get("key");
    if (!key) {
      return Response.json({ error: "key is required" }, { status: 400 });
    }
    const value = await store.get(key, { type: "json" });
    return Response.json({ explored: value?.explored === true });
  }

  if (req.method === "POST") {
    const body = await req.json();
    const { key, explored } = body;
    if (!key) {
      return Response.json({ error: "key is required" }, { status: 400 });
    }
    await store.setJSON(key, { explored: !!explored, updatedAt: new Date().toISOString() });
    return Response.json({ explored: !!explored });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
};

export const config: Config = {
  path: "/api/explored",
  method: ["GET", "POST"],
};
