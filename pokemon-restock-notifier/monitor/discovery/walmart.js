import { fetchWithTimeout, BROWSER_HEADERS, generateId, isRelevantProduct, log } from '../utils.js';
import { PRODUCT_SUFFIXES } from '../config.js';

export async function discoverWalmart(sets) {
  const products = [];
  const seen = new Set();

  for (const set of sets) {
    for (const suffix of PRODUCT_SUFFIXES) {
      const query = `Pokemon ${set.name} ${suffix}`;
      try {
        const url = `https://www.walmart.com/search?q=${encodeURIComponent(query)}`;
        const res = await fetchWithTimeout(url, { headers: BROWSER_HEADERS });
        if (!res.ok) continue;
        const html = await res.text();

        // Walmart embeds product data in __NEXT_DATA__
        const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
        if (!match) continue;

        const nextData = JSON.parse(match[1]);
        const items =
          nextData?.props?.pageProps?.initialData?.searchResult?.itemStacks?.[0]?.items ?? [];

        for (const item of items) {
          const name = item.name ?? '';
          const productUrl = item.canonicalUrl
            ? `https://www.walmart.com${item.canonicalUrl}`
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
