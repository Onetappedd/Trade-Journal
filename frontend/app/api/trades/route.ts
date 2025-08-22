export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { fetchTradesForUser } from "@/lib/server/trades";
import { getUserIdFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") ?? "100");
    const cursor = url.searchParams.get("cursor");
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { items, nextCursor } = await fetchTradesForUser(userId, { limit, cursor });
    return NextResponse.json({ items, nextCursor });
  } catch (e: any) {
    console.error("GET /api/trades failed:", e);
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
