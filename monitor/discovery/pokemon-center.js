import { fetchWithTimeout, BROWSER_HEADERS, generateId, log } from '../utils.js';

const CATEGORIES = [
  'booster-boxes',
  'elite-trainer-boxes',
  'blister-packs',
  'collections',
  'special-collections',
  'tins',
  'booster-bundles',
];

export async function discoverPokemonCenter() {
  const products = [];
  const seen = new Set();

  for (const category of CATEGORIES) {
    try {
      // Use Pokemon Center's internal SFCC catalog API — returns JSON, no scraping needed
      const url = `https://www.pokemoncenter.com/api/catalog/en-us/product-catalog?q=&sz=48&start=0&format=page-element&srule=best-sellers&pmid=tcg-${category}`;
      const res = await fetchWithTimeout(url, {
        headers: {
          ...BROWSER_HEADERS,
          'Accept': 'application/json, text/javascript, */*',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': `https://www.pokemoncenter.com/category/trading-card-game/${category}`,
        },
      });

      if (!res.ok) {
        log('Discovery/PokémonCenter', `HTTP ${res.status} for ${category}`);
        continue;
      }

      const data = await res.json();
      const hits = data?.hits ?? data?.productSearchResult?.hits ?? [];

      for (const hit of hits) {
        const productUrl = hit.productUrl
          ? (hit.productUrl.startsWith('http') ? hit.productUrl : `https://www.pokemoncenter.com${hit.productUrl}`)
          : null;
        if (!productUrl || seen.has(productUrl)) continue;
        seen.add(productUrl);
        const name = hit.productName ?? hit.name ?? productUrl.split('/').pop().replace(/-/g, ' ');
        products.push({ id: generateId('pokemon-center', productUrl), name, url: productUrl, site: 'pokemon-center' });
      }

      log('Discovery/PokémonCenter', `${products.length} products so far (checked ${category})`);
    } catch (err) {
      log('Discovery/PokémonCenter', `Failed on ${category}: ${err.message}`);
    }
  }

  return products;
}
