import TradeStats from "@/components/trades/TradeStats";
import TradeTable from "@/components/trades/TradeTable";

export default function TradesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">View Trades</h1>
        <p className="text-sm text-muted-foreground">All of your trades, across assets.</p>
      </div>
      <TradeStats />
      <TradeTable />
    </div>
  );
}
