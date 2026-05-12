import * as cheerio from 'cheerio';
import { fetchWithTimeout, BROWSER_HEADERS, generateId, log } from '../utils.js';
import { PRODUCT_SUFFIXES } from '../config.js';

export async function discoverBestBuy(sets) {
  const apiKey = process.env.BESTBUY_API_KEY;
  if (!apiKey) {
    log('Discovery/BestBuy', 'No BESTBUY_API_KEY set — skipping discovery (add key to .env for Best Buy support)');
    return [];
  }
  return discoverViaApi(sets, apiKey);
}

async function discoverViaApi(sets, apiKey) {
  const products = [];
  const seen = new Set();

  for (const set of sets) {
    for (const suffix of PRODUCT_SUFFIXES) {
      const query = `Pokemon ${set.name} ${suffix}`;
      try {
        const url = `https://api.bestbuy.com/v1/products(search=${encodeURIComponent(query)}&categoryPath.name=Trading Cards)?show=sku,name,url&apiKey=${apiKey}&format=json&pageSize=5`;
        const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) {
          log('Discovery/BestBuy', `API HTTP ${res.status} for "${query}"`);
          continue;
        }
        const data = await res.json();
        for (const item of data.products ?? []) {
          if (seen.has(item.sku)) continue;
          seen.add(item.sku);
          products.push({ id: generateId('bestbuy', item.url), name: item.name, url: item.url, site: 'bestbuy' });
        }
      } catch (err) {
        log('Discovery/BestBuy', `API search failed for "${query}": ${err.message}`);
      }
    }
  }

  log('Discovery/BestBuy', `Found ${products.length} products via API`);
  return products;
}
