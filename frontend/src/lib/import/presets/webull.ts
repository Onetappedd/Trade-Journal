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
    console.log('Webull preset detection:', { headers, sampleCount: samples.length });
    
    if (!hasWebullHeaders(headers)) {
      console.log('Webull preset: headers do not match expected pattern');
      return { confidence: 0 };
    }
    
    // Status/Filled hint
    const low = samples.slice(0, 50).map(r => String(r['STATUS'] ?? r['Status'] ?? r['status'] ?? ''));
    const hit = low.some(v => /filled/i.test(v) || /cancel/i.test(v));
    
    console.log('Webull preset: status check', { low: low.slice(0, 5), hit });
    
    return { confidence: hit ? 0.95 : 0.75, reason: 'Typical Webull headers + status markers' };
  },

  transform(raw, ctx) {
    console.log('Webull transform called with:', { raw, ctx });
    
    const get = (keys: string[]) => {
      for (const k of keys) {
        const v = raw[k] ?? raw[k.toUpperCase()] ?? raw[k.toLowerCase()];
        if (v != null && String(v).trim() !== '') return String(v);
      }
      return '';
    };

    const symCell = get(['SYMBOLS','SYMBOL','Ticker','Name']);
    console.log('Webull transform: symbol cell', { symCell, availableKeys: Object.keys(raw) });
    console.log('Webull transform: raw row data', raw);
    if (!symCell) {
      console.log('Webull transform: SKIP - no symbol cell');
      return { ok: false, skip: true };
    }

    const status = get(['STATUS','Status']);
    console.log('Webull transform: status', { status });
    if (status && /cancel/i.test(status)) {
      console.log('Webull transform: SKIP - cancelled order');
      return { ok: false, skip: true }; // skip cancels
    }

    const sideCell = get(['SIDE','Side','Action']);
    console.log('Webull transform: side cell', { sideCell });
    const side = /buy/i.test(sideCell) ? 'BUY' : /sell/i.test(sideCell) ? 'SELL' : undefined;
    if (!side) {
      console.log('Webull transform: SKIP - no valid side');
      return { ok: false, skip: true };
    }

    const qty = nnum(get(['QTY','Quantity','Filled']));
    
    // Try to get price from various possible column names
    let price = moneyToNumber(get(['PRICE','Price','Avg Price','Filled Price']));
    
    // If no price found, try to extract from "quantity @price" format (Column 6)
    if (!price) {
      const qtyAtPrice = get(['QTY_AT_PRICE', 'Filled_At_Price', 'Quantity_At_Price']);
      if (qtyAtPrice && qtyAtPrice.includes('@')) {
        const pricePart = qtyAtPrice.split('@')[1]?.trim();
        price = moneyToNumber(pricePart);
      }
    }
    
    // If still no price, try to get from unlabeled columns (likely Column 7)
    if (!price) {
      // Try common unlabeled column patterns - look for decimal numbers that could be prices
      const possiblePriceKeys = Object.keys(raw).filter(key => 
        !['Name', 'Symbol', 'Side', 'Status', 'Filled'].includes(key) &&
        typeof raw[key] === 'string' && 
        /^\d+\.\d+$/.test(String(raw[key]).trim()) // Must have decimal point for price
      );
      if (possiblePriceKeys.length > 0) {
        price = moneyToNumber(raw[possiblePriceKeys[0]]);
      }
    }
    
    const fee = moneyToNumber(get(['FEE','Fees','Fee']));
    
    // Try to get timestamp from various possible column names
    let when = get(['TRADE TIME','Trade Time','Filled Time','Time','Execute Time','Created Time']);
    
    // If no timestamp found, try to get from unlabeled columns (likely Column 9)
    if (!when) {
      const possibleTimeKeys = Object.keys(raw).filter(key => 
        !['Name', 'Symbol', 'Side', 'Status', 'Filled'].includes(key) &&
        typeof raw[key] === 'string' && 
        /^\d{2}\/\d{2}\/\d{4}/.test(String(raw[key]).trim())
      );
      if (possibleTimeKeys.length > 0) {
        when = String(raw[possibleTimeKeys[0]]).trim();
      }
    }
    
    console.log('Webull transform: required fields', { qty, price, fee, when });
    console.log('Webull transform: all column values', Object.entries(raw).map(([k, v]) => `${k}: "${v}"`).join(', '));
    
    if (!qty || !price || !when) {
      console.log('Webull transform: SKIP - missing required fields', { 
        hasQty: !!qty, 
        hasPrice: !!price, 
        hasWhen: !!when 
      });
      return { ok: false, skip: true };
    }

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
