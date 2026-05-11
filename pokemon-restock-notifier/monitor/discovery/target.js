import { fetchWithTimeout, generateId, log } from '../utils.js';
import { PRODUCT_SUFFIXES } from '../config.js';

// Target's internal RedSky search API — no auth required.
const TARGET_KEY = 'ff457966e64d5e877fdbad070f276d18ecec4a01';

export async function discoverTarget(sets) {
  const products = [];
  const seen = new Set();

  for (const set of sets) {
    for (const suffix of PRODUCT_SUFFIXES) {
      const query = `Pokemon ${set.name} ${suffix}`;
      try {
        const url = `https://redsky.target.com/redsky_aggregations/v1/web/plp_search_v2?key=${TARGET_KEY}&keyword=${encodeURIComponent(query)}&count=10&default_purchasability_filter=true&pricing_store_id=911&visitor_id=01234567890123456789&channel=WEB`;
        const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) continue;
        const data = await res.json();
        const items = data?.data?.search?.products ?? [];

        for (const item of items) {
          const name = item.item?.product_description?.title ?? '';
          const tcin = item.item?.tcin;
          if (!tcin || seen.has(tcin)) continue;
          const productUrl = `https://www.target.com/p/-/A-${tcin}`;
          seen.add(tcin);
          products.push({ id: generateId('target', productUrl), name, url: productUrl, site: 'target' });
        }
      } catch (err) {
        log('Discovery/Target', `Search failed for "${query}": ${err.message}`);
      }
    }
  }

  log('Discovery/Target', `Found ${products.length} products`);
  return products;
}
