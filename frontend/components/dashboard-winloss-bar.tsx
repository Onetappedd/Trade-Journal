"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";

export function WinLossBar({ wins, losses }: { wins: number; losses: number }) {
  const total = wins + losses;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const data = [
    { name: "Wins", value: wins },
    { name: "Losses", value: losses },
  ];
  const COLORS = ["#22c55e", "#ef4444"];
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle>Win/Loss Distribution</CardTitle>
        <Badge className={winRate >= 50 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>{winRate}% Win Rate</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ResponsiveContainer width="100%" height={80}>
          <BarChart data={data} layout="vertical" margin={{ left: 24, right: 24 }}>
            <XAxis type="number" hide domain={[0, Math.max(wins, losses, 1)]} />
            <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 14 }} />
            <Tooltip formatter={(value: number) => value.toLocaleString()} />
            <Bar dataKey="value" barSize={24} radius={[8, 8, 8, 8]}>
              {data.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Wins: <span className="font-bold text-success">{wins}</span></span>
          <span>Losses: <span className="font-bold text-danger">{losses}</span></span>
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          {total > 0
            ? `You have a ${winRate}% win rate over your last ${total} trades.`
            : "No trades yet. Start trading to see your win/loss stats!"}
        </div>
      </CardContent>
    </Card>
  );
}
