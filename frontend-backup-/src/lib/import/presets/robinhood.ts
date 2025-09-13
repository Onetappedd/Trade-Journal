import { parse } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import type { Preset, PresetDetectResult, PresetTransformCtx } from './index';

// Helpers
function moneyToNumber(s?: unknown): number | undefined {
  if (typeof s !== 'string') return undefined;
  const t = s.replace(/[\$,]/g, '').trim();
  if (!t) return undefined;
  // Parentheses mean negative
  const neg = /^\(.*\)$/.test(t);
  const n = parseFloat(t.replace(/[()]/g, ''));
  return Number.isFinite(n) ? (neg ? -n : n) : undefined;
}
function num(q?: unknown): number | undefined {
  if (q == null) return undefined;
  const n = typeof q === 'number' ? q : parseFloat(String(q).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : undefined;
}
function dateOnlyToUTC(d: string, tz?: string | 'local'): string {
  // Robinhood history export is *date-only*. Use midnight in provided tz (or local) and convert to UTC.
  const parsed = parse(d, 'M/d/yyyy', new Date());
  const zone = tz && tz !== 'local' ? tz : Intl.DateTimeFormat().resolvedOptions().timeZone;
  return fromZonedTime(parsed, zone).toISOString();
}

// Parse option description like: "AVGO 7/5/2024 Put $1,725.00"
const OPTION_DESC_RE = /^([A-Z]{1,6})\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+(Call|Put)\s+\$([0-9,]+(?:\.\d{2})?)\s*$/;

function parseOptionFromDescription(desc?: string) {
  if (!desc) return null;
  const m = desc.trim().match(OPTION_DESC_RE);
  if (!m) return null;
  const [, underlying, mdy, typ, strikeStr] = m;
  const strike = parseFloat(strikeStr.replace(/,/g, ''));
  return { underlying, expiryISO: parse(mdy, 'M/d/yyyy', new Date()).toISOString().slice(0, 10), option_type: typ.toUpperCase() as 'CALL'|'PUT', strike };
}

const TRADE_CODES = new Set(['BTO','STO','BTC','STC','Buy','Sell']);
const NON_TRADE_CODES = new Set(['INT','GOLD','ACH','RTP','DCF','REC','CDIV']);
const MAYBE_TRADE_CODES = new Set(['OEXP']); // Optional: expiration. Default: skip.

export const robinhoodPreset: Preset = {
  id: 'robinhood',
  label: 'Robinhood',
  detect(headers: string[], samples): PresetDetectResult {
    const have =
      headers.includes('Activity Date') &&
      headers.includes('Process Date') &&
      headers.includes('Settle Date') &&
      headers.includes('Trans Code') &&
      headers.includes('Amount');
    if (!have) return { confidence: 0 };

    // bonus: if we see RH trade codes in samples
    const codeHit = samples.slice(0, 50).some(r => {
      const c = String(r['Trans Code'] ?? '').trim();
      return TRADE_CODES.has(c) || NON_TRADE_CODES.has(c) || MAYBE_TRADE_CODES.has(c);
    });
    return { confidence: codeHit ? 0.98 : 0.8, reason: 'Headers match RH ledger; saw RH trans codes' };
  },

  transform(raw, ctx) {
    const trans = String(raw['Trans Code'] ?? '').trim();
    if (!trans) return { ok: false, skip: true };

    // Skip non-trade ledger rows
    if (NON_TRADE_CODES.has(trans)) return { ok: false, skip: true };
    if (MAYBE_TRADE_CODES.has(trans)) return { ok: false, skip: true }; // flip to include if you want expirations

    const activityDate = String(raw['Activity Date'] ?? '').trim();
    if (!activityDate) return { ok: false, skip: true };

    // Map side/open_close from code
    let side: 'BUY' | 'SELL' | undefined;
    let open_close: 'OPEN' | 'CLOSE' | undefined;
    switch (trans) {
      case 'BTO': side='BUY'; open_close='OPEN'; break;
      case 'BTC': side='BUY'; open_close='CLOSE'; break;
      case 'STO': side='SELL'; open_close='OPEN'; break;
      case 'STC': side='SELL'; open_close='CLOSE'; break;
      case 'Buy': side='BUY'; break;
      case 'Sell': side='SELL'; break;
    }
    if (!side) return { ok: false, skip: true };

    const quantity = Math.abs(num(raw['Quantity']) ?? NaN);
    const price = num(raw['Price']);
    const amount = moneyToNumber(raw['Amount']);
    const description = (raw['Description'] ?? raw['Instrument'] ?? '') as string;

    // Asset inference
    let asset_type: 'equity' | 'option' | 'futures' | 'crypto' = 'equity';
    let symbol = String(raw['Instrument'] ?? '').trim();
    let underlying: string | undefined;
    let expiry: string | undefined;
    let strike: number | undefined;
    let option_type: 'CALL'|'PUT'|undefined;

    const opt = parseOptionFromDescription(description);
    if (opt) {
      asset_type = 'option';
      underlying = opt.underlying;
      expiry = opt.expiryISO;
      strike = opt.strike;
      option_type = opt.option_type;
      symbol = underlying; // keep canonical symbol as underlying
    } else {
      // Equity: try Description if Instrument is empty
      if (!symbol) {
        const m = description?.trim().match(/^([A-Z]{1,6})\b/);
        if (m) symbol = m[1];
      }
    }

    // Derive price if missing but amount & qty present
    let p = price;
    if ((p == null || !Number.isFinite(p)) && Number.isFinite(amount) && Number.isFinite(quantity) && quantity > 0) {
      p = Math.abs((amount as number) / quantity);
    }

    if (!symbol || !Number.isFinite(quantity) || !Number.isFinite(p)) {
      return { ok: false, skip: true, error: 'Missing symbol/qty/price' };
    }

    const trade_time_utc = dateOnlyToUTC(activityDate, ctx.tz);
    const fees = undefined; // RH ledger doesn't break out fees per fill here; keep undefined and preserve raw_json.

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
        open_close,
        quantity,
        price: p!,
        fees,
        trade_time_utc,
        venue: 'Robinhood',
        source: 'robinhood',
        raw_json: raw
      }
    };
  }
};
