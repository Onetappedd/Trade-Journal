import { KpiCard } from "../../components/KpiCard";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useTheme } from "next-themes";

const kpis = [
  {
    title: "Total P&L",
    value: "$12,345.67",
    positive: true,
    description: "Since inception",
  },
  {
    title: "Win Rate",
    value: "65%",
    positive: true,
    description: "Last 12 months",
  },
  {
    title: "Average R:R",
    value: "1.5x",
    description: "Risk/Reward",
  },
  {
    title: "Number of Trades",
    value: "500",
    description: "Total trades logged",
  },
];

// Dummy chart data
const equityCurveData = [
  { date: "May 1", pnl: 0 },
  { date: "May 5", pnl: 500 },
  { date: "May 10", pnl: 1200 },
  { date: "May 15", pnl: 900 },
  { date: "May 20", pnl: 1800 },
  { date: "May 25", pnl: 2200 },
  { date: "May 30", pnl: 2500 },
];

const dailyPnlData = [
  { date: "May 24", pnl: 200 },
  { date: "May 25", pnl: -100 },
  { date: "May 26", pnl: 300 },
  { date: "May 27", pnl: 0 },
  { date: "May 28", pnl: 400 },
  { date: "May 29", pnl: -50 },
  { date: "May 30", pnl: 150 },
];

const winLossData = [
  { name: "Wins", value: 65 },
  { name: "Losses", value: 35 },
];
const winLossColors = ["#22c55e", "#ef4444"];

const recentTrades = [
  { date: "2024-06-01", symbol: "AAPL", pnl: "+$500.00", rr: "2.0" },
  { date: "2024-05-30", symbol: "TSLA", pnl: "-$200.00", rr: "-1.0" },
  { date: "2024-05-29", symbol: "MSFT", pnl: "+$150.00", rr: "1.2" },
  { date: "2024-05-28", symbol: "GOOG", pnl: "+$300.00", rr: "1.8" },
  { date: "2024-05-27", symbol: "AMZN", pnl: "-$100.00", rr: "-0.5" },
];

export default function DashboardPlaceholder() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <p className="text-lg text-muted-foreground">This is the dashboard page. UI coming soon.</p>
    </main>
  );
}
