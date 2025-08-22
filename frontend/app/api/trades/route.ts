// app/api/trades/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const Q = z.object({
  limit: z.string().transform((v) => Number(v)).pipe(z.number().int().positive().max(500)).optional(),
  cursor: z.string().optional(),
  symbol: z.string().trim().optional(),
  assetType: z.enum(["stock","option","future","crypto"]).optional(),
  side: z.enum(["buy","sell"]).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sort: z.enum(["executedAt.desc","executedAt.asc"]).default("executedAt.desc").optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate/parse query
    const parsed = Q.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const q = parsed.data;

    const take = q.limit ?? 100;
    const orderBy =
      q.sort === "executedAt.asc" ? { executedAt: "asc" as const } : { executedAt: "desc" as const };

    const where: any = { userId: session.user.id };
    if (q.symbol) where.symbol = q.symbol.toUpperCase();
    if (q.assetType) where.assetType = q.assetType;
    if (q.side) where.side = q.side;
    if (q.dateFrom || q.dateTo) {
      where.executedAt = {};
      if (q.dateFrom) where.executedAt.gte = new Date(q.dateFrom);
      if (q.dateTo) where.executedAt.lte = new Date(q.dateTo);
    }

    // cursor-based pagination (by id)
    const items = await prisma.trade.findMany({
      where,
      take: take + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
      orderBy,
    });

    const hasMore = items.length > take;
    const data = hasMore ? items.slice(0, take) : items;
    const nextCursor = hasMore ? data[data.length - 1]?.id ?? null : null;

    return NextResponse.json({ items: data, nextCursor }, { status: 200 });
  } catch (err: any) {
    // Server-side logging with useful context; won’t leak to client.
    console.error("[GET /api/trades] failed", {
      msg: err?.message,
      stack: err?.stack,
      url: req.url,
      envHasDb: Boolean(process.env.DATABASE_URL),
    });
    return NextResponse.json(
      { error: "E_TRADES_FETCH", message: "Failed to load trades" },
      { status: 500 },
    );
  }
}
