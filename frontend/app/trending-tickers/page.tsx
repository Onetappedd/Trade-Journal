"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sidebar } from "@/components/layout/sidebar";

export default function TrendingTickersPage() {
  const [trending, setTrending] = useState<any[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [trendingError, setTrendingError] = useState("");

  useEffect(() => {
    setTrendingLoading(true);
    setTrendingError("");
    fetch("/api/trending-tickers")
      .then(res => res.json())
      .then(data => {
        setTrending(data.trending || []);
        setTrendingLoading(false);
      })
      .catch(() => {
        setTrendingError("Failed to fetch trending tickers");
        setTrendingLoading(false);
      });
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 w-full bg-background text-foreground flex flex-col px-4 md:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">Trending Tickers (Twitter/X Sentiment)</h1>
        {trendingLoading ? (
          <Skeleton className="w-full h-32 rounded" />
        ) : trendingError ? (
          <div className="text-red-500 text-center">{trendingError}</div>
        ) : trending.length === 0 ? (
          <div className="text-muted-foreground text-center">No trending tickers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="px-4 py-2">Symbol</th>
                  <th className="px-4 py-2">Mentions</th>
                  <th className="px-4 py-2">Sentiment</th>
                  <th className="px-4 py-2">Avg Score</th>
                  <th className="px-4 py-2">Top Tweets</th>
                </tr>
              </thead>
              <tbody>
                {trending.slice(0, 10).map((t: any) => (
                  <tr key={t.symbol}>
                    <td className="font-bold text-lg text-primary px-4 py-2">{t.symbol}</td>
                    <td className="px-4 py-2">{t.total_mentions}</td>
                    <td className="px-4 py-2">
                      <span className="text-green-600">{t.positive_pct.toFixed(1)}%+</span> /
                      <span className="text-yellow-600"> {t.neutral_pct.toFixed(1)}% </span>/
                      <span className="text-red-600">{t.negative_pct.toFixed(1)}%-</span>
                    </td>
                    <td className="px-4 py-2">{t.avg_sentiment_score.toFixed(2)}</td>
                    <td className="px-4 py-2">
                      {t.top_tweets && t.top_tweets.length > 0 ? (
                        <ul className="list-disc ml-4">
                          {t.top_tweets.slice(0, 2).map((tw: any, i: number) => (
                            <li key={i} className={tw.sentiment === "Positive" ? "text-green-600" : tw.sentiment === "Negative" ? "text-red-600" : "text-yellow-600"}>
                              <span className="font-semibold">[{tw.sentiment}]</span> {tw.text.slice(0, 80)}
                            </li>
                          ))}
                        </ul>
                      ) : <span className="text-muted-foreground">No tweets</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
