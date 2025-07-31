"use client";
import { useParams } from "next/navigation";
import { useTradeStore } from "@/components/trade-store";
import { TradeForm } from "@/components/trade-form";

export default function TradeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getTrade, updateTrade } = useTradeStore();
  const trade = getTrade(id);

  if (!trade) {
    return <div className="text-center text-destructive mt-10">Trade not found.</div>;
  }

  // Map backend trade to TradeForm fields
  const initialData = {
    ...trade,
    entry: trade.entryPrice,
    exit: trade.exitPrice,
  };

  return (
    <TradeForm
      initialData={initialData}
      onSubmit={(values) =>
        updateTrade(id, {
          ...trade,
          ...values,
          entryPrice: values.entry,
          exitPrice: values.exit === undefined ? undefined : values.exit,
          })
      }
      isEditMode
    />
  );
}
