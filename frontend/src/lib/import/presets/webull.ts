import type { Preset, PresetDetectResult, PresetTransformCtx } from './index';
import { parse } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';

const H = (s: string) => s.toLowerCase();

const WEBULL_HEADERS = [
  'symbols','symbol','ticker',
  'side',
  'status',
  'qty','quantity',
  'price','avg price','filled price',
  'fee','fees',
  'trade time','filled time','time','execute time','created time',
  'gtd','time in force'
];

function hasWebullHeaders(headers: string[]) {
  const set = new Set(headers.map(H));
  const hits = WEBULL_HEADERS.filter(h => set.has(h)).length;
  return hits >= 5;
}

// OCC option code: AAPL240920C00190000
const OCC_RE = /^([A-Z]{1,6})(\d{2})(\d{2})(\d{2})([CP])(\d{8})$/;
function parseOCC(sym: string) {
  const m = sym.toUpperCase().trim().match(OCC_RE);
  if (!m) return null;
  const [, root, yy, mm, dd, cp, strike8] = m;
  const year = 2000 + parseInt(yy, 10);
  const expiry = `${year}-${mm}-${dd}`;
  const strike = parseInt(strike8, 10) / 1000; // OCC last 3 are decimals
  return { underlying: root, expiry, option_type: cp === 'C' ? 'CALL' : 'PUT', strike };
}

function moneyToNumber(s?: unknown): number | undefined {
  if (s == null) return undefined;
  const n = parseFloat(String(s).replace(/[\$,]/g, '').trim());
  return Number.isFinite(n) ? n : undefined;
}
function nnum(s?: unknown): number | undefined {
  if (s == null) return undefined;
  const n = parseFloat(String(s).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : undefined;
}
function toUTC(input: string, tz?: string | 'local') {
  // Try a few common formats seen in Webull exports
  // e.g., "2024-07-05 09:31:15", "07/05/2024 09:31:15"
  const patterns = ['yyyy-MM-dd HH:mm:ss', 'MM/dd/yyyy HH:mm:ss', "yyyy-MM-dd'T'HH:mm:ssXXX"];
  const zone = tz && tz !== 'local' ? tz : Intl.DateTimeFormat().resolvedOptions().timeZone;
  for (const p of patterns) {
    try {
      const d = parse(input, p, new Date());
      return fromZonedTime(d, zone).toISOString();
    } catch {}
  }
  // Fallback
  const d = new Date(input);
  if (!isNaN(+d)) return d.toISOString();
  throw new Error('Unparseable timestamp: ' + input);
}

export const webullPreset: Preset = {
  id: 'webull',
  label: 'Webull',
  detect(headers, samples): PresetDetectResult {
    if (!hasWebullHeaders(headers)) return { confidence: 0 };
    // Status/Filled hint
    const low = samples.slice(0, 50).map(r => String(r['STATUS'] ?? r['Status'] ?? r['status'] ?? ''));
    const hit = low.some(v => /filled/i.test(v) || /cancel/i.test(v));
    return { confidence: hit ? 0.95 : 0.75, reason: 'Typical Webull headers + status markers' };
  },

  transform(raw, ctx) {
    const get = (keys: string[]) => {
      for (const k of keys) {
        const v = raw[k] ?? raw[k.toUpperCase()] ?? raw[k.toLowerCase()];
        if (v != null && String(v).trim() !== '') return String(v);
      }
      return '';
    };

    const symCell = get(['SYMBOLS','SYMBOL','Ticker','Name']);
    if (!symCell) return { ok: false, skip: true };

    const status = get(['STATUS','Status']);
    if (status && /cancel/i.test(status)) return { ok: false, skip: true }; // skip cancels

    const sideCell = get(['SIDE','Action']);
    const side = /buy/i.test(sideCell) ? 'BUY' : /sell/i.test(sideCell) ? 'SELL' : undefined;
    if (!side) return { ok: false, skip: true };

    const qty = nnum(get(['QTY','Quantity','Filled']));
    const price = moneyToNumber(get(['PRICE','Avg Price','Filled Price']));
    const fee = moneyToNumber(get(['FEE','Fees']));
    const when = get(['TRADE TIME','Filled Time','Time','Execute Time','Created Time']);
    if (!qty || !price || !when) return { ok: false, skip: true };

    // Asset inference
    let asset_type: 'equity' | 'option' = 'equity';
    let symbol = symCell.trim().toUpperCase();
    let underlying: string | undefined;
    let expiry: string | undefined;
    let strike: number | undefined;
    let option_type: 'CALL'|'PUT'|undefined;

    const occ = parseOCC(symbol);
    if (occ) {
      asset_type = 'option';
      underlying = occ.underlying;
      expiry = occ.expiry;
      strike = occ.strike;
      option_type = occ.option_type as 'CALL' | 'PUT';
      symbol = underlying; // canonical symbol = underlying
    }

    const trade_time_utc = toUTC(when, ctx.tz);

    return {
      ok: true,
      value: {
        asset_type,
        symbol,
        underlying,
        expiry,
        strike,
        option_type,
        side,
        quantity: Math.abs(qty!),
        price: price!,
        fees: fee,
        trade_time_utc,
        venue: 'Webull',
        source: 'webull',
        raw_json: raw
      }
    };
  }
};
