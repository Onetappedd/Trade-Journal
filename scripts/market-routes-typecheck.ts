// Type-only import smoke test for surface check
import { GET as trendingGET } from '../frontend/app/api/market/trending/route';
import { GET as quoteGET } from '../frontend/app/api/market/quote/[symbol]/route';
import { GET as batchGET } from '../frontend/app/api/market/batch-quotes/route';
import { GET as searchGET } from '../frontend/app/api/market/search/route';
import { GET as snapshotGET } from '../frontend/app/api/market/snapshot-hybrid/[ticker]/route';
import { GET as trendingHGET } from '../frontend/app/api/market/trending-hybrid/route';

type X = typeof trendingGET;
type Y = typeof quoteGET;
type Z = typeof batchGET;
type A = typeof searchGET;
type B = typeof snapshotGET;
type C = typeof trendingHGET;
