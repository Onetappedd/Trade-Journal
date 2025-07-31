"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sidebar } from "@/components/layout/sidebar";

// Helper for sparkline (simple SVG)
function Sparkline({ data }: { data: number[] }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const points = data.map((v, i) => `${i * 10},${40 - ((v - min) / (max - min + 1e-6)) * 40}`).join(" ");
  return (
    <svg width={data.length * 10} height={40} className="inline-block align-middle">
      <polyline fill="none" stroke="#8884d8" strokeWidth="2" points={points} />
    </svg>
  );
}

export default function TrendingPage() {
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch("/api/trending-tickers?window_minutes=10080") // 7d
      .then(res => res.json())
      .then(data => {
        setTrending(data.trending || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch trending tickers");
        setLoading(false);
      });
  }, []);

  // Compute "today" and "this week"
  const topToday = trending.slice(0, 10);
  const weekMovers = trending
    .slice()
    .sort((a, b) => (b.total_mentions - a.total_mentions))
    .slice(0, 10);
  const sentimentLeaderboard = trending
    .slice()
    .sort((a, b) => b.positive_pct - a.positive_pct)
    .slice(0, 10);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 w-full bg-background text-foreground flex flex-col px-4 md:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">Trending Tweets</h1>
        {loading ? (
          <Skeleton className="w-full h-32 rounded" />
        ) : error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : trending.length === 0 ? (
          <div className="text-muted-foreground text-center">No trending tickers found.</div>
        ) : (
          <>
            {/* Top 10 Tickers Today */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-2">📈 Top 10 Tickers Today</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead>
                    <tr className="bg-muted">
                      <th className="px-4 py-2">Symbol</th>
                      <th className="px-4 py-2">Mentions</th>
                      <th className="px-4 py-2">Sentiment</th>
                      <th className="px-4 py-2">Sparkline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topToday.map((t: any) => (
                      <tr key={t.symbol}>
                        <td className="font-bold text-lg text-primary px-4 py-2">
                          <Link href={`/symbol/${t.symbol}`}>{t.symbol}</Link>
                        </td>
                        <td className="px-4 py-2">{t.total_mentions}</td>
                        <td className="px-4 py-2">
                          <span className="text-green-600">{t.positive_pct.toFixed(1)}%+</span> /
                          <span className="text-yellow-600"> {t.neutral_pct.toFixed(1)}% </span>/
                          <span className="text-red-600">{t.negative_pct.toFixed(1)}%-</span>
                        </td>
                        <td className="px-4 py-2"><Sparkline data={[t.total_mentions]} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            {/* This Week's Movers */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-2">📅 This Week’s Movers</h2>
              <ul className="list-disc ml-6">
                {weekMovers.map((t: any) => (
                  <li key={t.symbol}>
                    <Link href={`/symbol/${t.symbol}`} className="font-bold text-primary">{t.symbol}</Link>
                    : {t.total_mentions} mentions, ΔSentiment: {t.positive_pct.toFixed(1)}%+
                  </li>
                ))}
              </ul>
            </section>
            {/* Sentiment Leaderboard */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-2">🧠 Sentiment Leaderboard</h2>
              <ol className="list-decimal ml-6">
                {sentimentLeaderboard.map((t: any) => (
                  <li key={t.symbol}>
                    <Link href={`/symbol/${t.symbol}`} className="font-bold text-primary">{t.symbol}</Link>
                    : {t.positive_pct.toFixed(1)}% bullish, {t.total_mentions} mentions
                  </li>
                ))}
              </ol>
            </section>
            {/* Top Tweets */}
            <section>
              <h2 className="text-xl font-semibold mb-2">🧵 Top Tweets</h2>
              {topToday.map((t: any) => (
                <details key={t.symbol} className="mb-2">
                  <summary className="cursor-pointer font-bold text-primary">{t.symbol}</summary>
                  <ul className="ml-4">
                    {t.top_tweets && t.top_tweets.length > 0 ? (
                      t.top_tweets.map((tw: any, i: number) => (
                        <li key={i} className={tw.sentiment === "Positive" ? "text-green-600" : tw.sentiment === "Negative" ? "text-red-600" : "text-yellow-600"}>
                          <span className="font-semibold">[{tw.sentiment}]</span> {tw.text.slice(0, 120)}
                        </li>
                      ))
                    ) : <span className="text-muted-foreground">No tweets</span>}
                  </ul>
                </details>
              ))}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
