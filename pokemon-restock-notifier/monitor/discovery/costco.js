import * as cheerio from 'cheerio';
import { fetchWithTimeout, BROWSER_HEADERS, generateId, isRelevantProduct, log } from '../utils.js';
import { PRODUCT_SUFFIXES } from '../config.js';

export async function discoverCostco(sets) {
  const products = [];
  const seen = new Set();
  const inStoreEnabled = !!process.env.COSTCO_ZIP_CODE;

  for (const set of sets) {
    for (const suffix of PRODUCT_SUFFIXES) {
      const query = `Pokemon ${set.name} ${suffix}`;
      try {
        const url = `https://www.costco.com/CatalogSearch?keyword=${encodeURIComponent(query)}&pageSize=24`;
        const res = await fetchWithTimeout(url, { headers: BROWSER_HEADERS });
        if (!res.ok) continue;
        const html = await res.text();
        const $ = cheerio.load(html);

        $('a.product-image-url, a[href*=".product."]').each((_, el) => {
          const href = $(el).attr('href');
          if (!href || seen.has(href)) return;
          const productUrl = href.startsWith('http') ? href : `https://www.costco.com${href}`;

          // Extract item name from nearby DOM or href slug
          const nameEl = $(el).closest('[class*="product"]').find('[class*="description"], [class*="title"], h2, h3').first();
          const name = nameEl.text().trim() || href.split('/').pop().replace(/\.product\.\d+\.html$/, '').replace(/-/g, ' ');

          if (!isRelevantProduct(`pokemon ${name}`)) return;
          seen.add(href);

          // Always add online entry
          products.push({
            id: generateId('costco-online', productUrl),
            name,
            url: productUrl,
            site: 'costco-online',
          });

          // Add in-store entry only if user provided a zip code
          if (inStoreEnabled) {
            products.push({
              id: generateId('costco-instore', productUrl),
              name: `${name} (In-Store)`,
              url: productUrl,
              site: 'costco-instore',
            });
          }
        });
      } catch (err) {
        log('Discovery/Costco', `Search failed for "${query}": ${err.message}`);
      }
    }
  }

  if (!inStoreEnabled) {
    log('Discovery/Costco', 'Tip: set COSTCO_ZIP_CODE in .env to also monitor in-store availability');
  }
  log('Discovery/Costco', `Found ${products.length} product entries`);
  return products;
}
