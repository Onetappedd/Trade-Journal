"use client";
import { TrendingUp } from "lucide-react";
import { Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export function WinLossPie({ wins, losses }: { wins: number; losses: number }) {
  const chartData = [
    { label: "Wins", value: wins, fill: "var(--success)" },
    { label: "Losses", value: losses, fill: "var(--danger)" },
  ];
  const chartConfig = {
    value: { label: "Trades" },
    Wins: { label: "Wins", color: "var(--success)" },
    Losses: { label: "Losses", color: "var(--danger)" },
  } satisfies ChartConfig;
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Win/Loss Distribution</CardTitle>
        <CardDescription>All Trades</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie data={chartData} dataKey="value" nameKey="label" fill={undefined} />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing win/loss for all trades
        </div>
      </CardFooter>
    </Card>
  );
}
