import { z } from "zod";

export const tradeSchema = z.object({
  assetType: z.enum([
    "Common Stock",
    "Options Contract",
    "Futures Contract",
    "Cryptocurrency"
  ]),
  tradeStatus: z.enum(["Open", "Closed"]),
  date: z.string().min(1, "Date is required"),
  tradeTime: z.string().optional(),
  symbol: z.string().min(1, "Symbol is required"),
  type: z.enum(["long", "short", "call_option", "put_option", "futures"], { required_error: "Trade type is required" }),
  entry: z.coerce.number().min(0.01, "Entry price is required"),
  exit: z.coerce.number().optional(),
  positionSize: z.coerce.number().min(0.01, "Position size is required"),
  stopLoss: z.coerce.number().optional(),
  takeProfit: z.coerce.number().optional(),
  notes: z.string().optional(),
  psychologicalState: z.string().optional(),
  preTradePlan: z.string().optional(),
  postTradeReflection: z.string().optional(),
  customTags: z.array(z.string()).optional(),
  direction: z.string().optional(),
  quantity: z.coerce.number().min(1, "Quantity is required"),
  // Asset-specific fields
  commissionFees: z.coerce.number().optional(),
  strikePrice: z.coerce.number().optional(),
  expirationDate: z.string().optional(),
  callPut: z.enum(["Call", "Put"]).optional(),
  underlyingPriceAtEntry: z.coerce.number().optional(),
  underlyingPriceAtExit: z.coerce.number().optional(),
  contractSymbol: z.string().optional(),
  cryptoPair: z.string().optional(),
  exchange: z.string().optional(),
});

export type TradeFormValues = z.infer<typeof tradeSchema>;
