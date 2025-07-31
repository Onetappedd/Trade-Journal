export type TradeType = 'long' | 'short' | 'call_option' | 'put_option' | 'futures';

export interface Trade {
  id: string;
  date: string; // YYYY-MM-DD
  symbol: string;
  type: TradeType;
  entryPrice: number;
  exitPrice?: number;
  positionSize: number;
  stopLoss?: number;
  takeProfit?: number;
  notes?: string;
}

export const trades: Trade[] = [
  { id: '1', date: '2024-06-01', symbol: 'AAPL', type: 'long', entryPrice: 180, exitPrice: 185, positionSize: 100, stopLoss: 175, takeProfit: 190, notes: 'Breakout trade, strong volume on entry.' },
  { id: '2', date: '2024-05-30', symbol: 'TSLA', type: 'short', entryPrice: 200, exitPrice: 195, positionSize: 50, stopLoss: 205, takeProfit: 190, notes: 'Premature entry, market reversed.' },
  { id: '3', date: '2024-05-29', symbol: 'MSFT', type: 'long', entryPrice: 320, exitPrice: 322, positionSize: 80, stopLoss: 318, takeProfit: 325, notes: 'Quick scalp, tight stop.' },
  { id: '4', date: '2024-05-28', symbol: 'GOOG', type: 'long', entryPrice: 140, exitPrice: 145, positionSize: 60, stopLoss: 138, takeProfit: 150, notes: 'Trend continuation, good setup.' },
  { id: '5', date: '2024-05-27', symbol: 'AMZN', type: 'short', entryPrice: 120, exitPrice: 118, positionSize: 40, stopLoss: 122, takeProfit: 115, notes: 'Choppy market, stopped out.' },
  { id: '6', date: '2024-05-26', symbol: 'NFLX', type: 'long', entryPrice: 400, exitPrice: 410, positionSize: 30, stopLoss: 395, takeProfit: 420, notes: 'Earnings play, high volatility.' },
  { id: '7', date: '2024-05-25', symbol: 'NVDA', type: 'long', entryPrice: 700, exitPrice: 715, positionSize: 20, stopLoss: 690, takeProfit: 730, notes: 'Momentum trade, strong sector.' },
  { id: '8', date: '2024-05-24', symbol: 'AMD', type: 'short', entryPrice: 90, exitPrice: 88, positionSize: 60, stopLoss: 92, takeProfit: 85, notes: 'Counter-trend, small size.' },
  { id: '9', date: '2024-05-23', symbol: 'META', type: 'long', entryPrice: 250, exitPrice: 255, positionSize: 40, stopLoss: 248, takeProfit: 260, notes: 'News catalyst, fast move.' },
  { id: '10', date: '2024-05-22', symbol: 'BABA', type: 'short', entryPrice: 80, exitPrice: 78, positionSize: 70, stopLoss: 82, takeProfit: 75, notes: 'Low conviction, quick exit.' },
  { id: '11', date: '2024-05-21', symbol: 'AAPL', type: 'long', entryPrice: 182, exitPrice: 184, positionSize: 50, stopLoss: 180, takeProfit: 188, notes: 'Small win, partial position.' },
  { id: '12', date: '2024-05-20', symbol: 'TSLA', type: 'short', entryPrice: 205, exitPrice: 202, positionSize: 30, stopLoss: 208, takeProfit: 200, notes: 'Good read, trailed stop.' },
  { id: '13', date: '2024-05-19', symbol: 'MSFT', type: 'long', entryPrice: 318, exitPrice: 319, positionSize: 60, stopLoss: 316, takeProfit: 322, notes: 'Tight stop, minor loss.' },
  { id: '14', date: '2024-05-18', symbol: 'GOOG', type: 'short', entryPrice: 142, exitPrice: 140, positionSize: 35, stopLoss: 144, takeProfit: 138, notes: 'Reversal, good entry.' },
  { id: '15', date: '2024-05-17', symbol: 'AMZN', type: 'long', entryPrice: 122, exitPrice: 125, positionSize: 45, stopLoss: 120, takeProfit: 128, notes: 'Breakout, strong close.' },
  { id: '16', date: '2024-05-16', symbol: 'NFLX', type: 'short', entryPrice: 410, exitPrice: 408, positionSize: 25, stopLoss: 412, takeProfit: 405, notes: 'Fade after earnings.' },
  { id: '17', date: '2024-05-15', symbol: 'NVDA', type: 'long', entryPrice: 710, exitPrice: 705, positionSize: 15, stopLoss: 705, takeProfit: 720, notes: 'Tried to catch a dip, stopped.' },
  { id: '18', date: '2024-05-14', symbol: 'AMD', type: 'long', entryPrice: 92, exitPrice: 95, positionSize: 55, stopLoss: 90, takeProfit: 98, notes: 'Strong bounce, good R:R.' },
  { id: '19', date: '2024-05-13', symbol: 'META', type: 'short', entryPrice: 255, exitPrice: 258, positionSize: 20, stopLoss: 253, takeProfit: 250, notes: 'Short squeeze, quick exit.' },
  { id: '20', date: '2024-05-12', symbol: 'BABA', type: 'long', entryPrice: 78, exitPrice: 80, positionSize: 80, stopLoss: 76, takeProfit: 82, notes: 'Range breakout.' },
  { id: '21', date: '2024-05-11', symbol: 'AAPL', type: 'short', entryPrice: 186, exitPrice: 184, positionSize: 60, stopLoss: 188, takeProfit: 182, notes: 'Fade after news.' },
  { id: '22', date: '2024-05-10', symbol: 'TSLA', type: 'long', entryPrice: 198, exitPrice: 202, positionSize: 35, stopLoss: 196, takeProfit: 205, notes: 'Momentum, trailed stop.' },
  { id: '23', date: '2024-05-09', symbol: 'MSFT', type: 'short', entryPrice: 325, exitPrice: 320, positionSize: 40, stopLoss: 328, takeProfit: 318, notes: 'Earnings miss.' },
  { id: '24', date: '2024-05-08', symbol: 'GOOG', type: 'long', entryPrice: 138, exitPrice: 140, positionSize: 50, stopLoss: 136, takeProfit: 142, notes: 'Bounce from support.' },
  { id: '25', date: '2024-05-07', symbol: 'AMZN', type: 'short', entryPrice: 124, exitPrice: 122, positionSize: 30, stopLoss: 126, takeProfit: 120, notes: 'Weak open, shorted.' },
  { id: '26', date: '2024-05-06', symbol: 'NFLX', type: 'long', entryPrice: 415, exitPrice: 420, positionSize: 20, stopLoss: 412, takeProfit: 425, notes: 'Strong close.' },
  { id: '27', date: '2024-05-05', symbol: 'NVDA', type: 'short', entryPrice: 720, exitPrice: 715, positionSize: 10, stopLoss: 725, takeProfit: 710, notes: 'Fade after run.' },
  { id: '28', date: '2024-05-04', symbol: 'AMD', type: 'long', entryPrice: 95, exitPrice: 97, positionSize: 40, stopLoss: 93, takeProfit: 99, notes: 'Momentum.' },
  { id: '29', date: '2024-05-03', symbol: 'META', type: 'short', entryPrice: 260, exitPrice: 258, positionSize: 25, stopLoss: 262, takeProfit: 255, notes: 'Quick scalp.' },
  { id: '30', date: '2024-05-02', symbol: 'BABA', type: 'long', entryPrice: 80, exitPrice: 82, positionSize: 60, stopLoss: 78, takeProfit: 84, notes: 'Breakout.' },
];
