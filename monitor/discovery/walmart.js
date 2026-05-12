import { fetchWithTimeout, generateId, isRelevantProduct, log } from '../utils.js';
import { PRODUCT_SUFFIXES } from '../config.js';

export async function discoverWalmart(sets) {
  const products = [];
  const seen = new Set();

  for (const set of sets) {
    for (const suffix of PRODUCT_SUFFIXES) {
      const query = `Pokemon ${set.name} ${suffix}`;
      try {
        // Use Walmart's internal JSON search API instead of scraping HTML
        const url = `https://www.walmart.com/search/api?query=${encodeURIComponent(query)}&cat_id=0&sort=best_match&page=1&affinityOverride=default&rawFacets=&facet=&pref=&prg=desktop`;
        const res = await fetchWithTimeout(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Referer': 'https://www.walmart.com/',
          },
        });
        if (!res.ok) {
          log('Discovery/Walmart', `HTTP ${res.status} for "${query}"`);
          continue;
        }

        let data;
        try {
          data = await res.json();
        } catch {
          log('Discovery/Walmart', `Non-JSON response for "${query}" — bot detection active`);
          continue;
        }

        const items = data?.items ?? data?.searchResult?.items ?? data?.payload?.searchData?.paginatedV2?.props?.initialData?.searchResult?.itemStacks?.[0]?.items ?? [];

        for (const item of items) {
          const name = item.name ?? item.title ?? '';
          const canonicalUrl = item.canonicalUrl ?? item.productPageUrl;
          const productUrl = canonicalUrl
            ? (canonicalUrl.startsWith('http') ? canonicalUrl : `https://www.walmart.com${canonicalUrl}`)
            : null;
          if (!productUrl || seen.has(productUrl)) continue;
          if (!isRelevantProduct(name)) continue;
          seen.add(productUrl);
          products.push({ id: generateId('walmart', productUrl), name, url: productUrl, site: 'walmart' });
        }
      } catch (err) {
        log('Discovery/Walmart', `Search failed for "${query}": ${err.message}`);
      }
    }
  }

  log('Discovery/Walmart', `Found ${products.length} products`);
  return products;
}
