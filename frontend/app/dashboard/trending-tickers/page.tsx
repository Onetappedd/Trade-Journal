import { TrendingClient } from "./TrendingClient";

async function getTrendingRows(): Promise<{ symbol: string; price?: number; changePct?: number }[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/market/trending`,
      {
        cache: "no-store",
      }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch {
    return [];
  }
}

export default async function Page() {
  const rows = await getTrendingRows();
  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl font-semibold">Trending Tickers</h1>
      <TrendingClient rows={rows} />
    </div>
  );
}
