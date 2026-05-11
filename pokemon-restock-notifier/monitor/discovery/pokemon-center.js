import * as cheerio from 'cheerio';
import { fetchWithTimeout, BROWSER_HEADERS, generateId, isRelevantProduct, log } from '../utils.js';

const CATEGORY_PAGES = [
  'https://www.pokemoncenter.com/category/trading-card-game/booster-boxes',
  'https://www.pokemoncenter.com/category/trading-card-game/elite-trainer-boxes',
];

export async function discoverPokemonCenter() {
  const products = [];
  const seen = new Set();

  for (const pageUrl of CATEGORY_PAGES) {
    try {
      const res = await fetchWithTimeout(pageUrl, { headers: BROWSER_HEADERS });
      if (!res.ok) {
        log('Discovery/PokémonCenter', `HTTP ${res.status} for ${pageUrl}`);
        continue;
      }
      const html = await res.text();
      const $ = cheerio.load(html);

      $('a[href*="/product/"]').each((_, el) => {
        const href = $(el).attr('href');
        if (!href) return;
        const url = href.startsWith('http') ? href : `https://www.pokemoncenter.com${href}`;
        if (seen.has(url)) return;

        const name = (
          $(el).text().trim() ||
          $(el).find('img').attr('alt') ||
          $(el).closest('[class*="product"]').find('[class*="name"], [class*="title"]').first().text().trim()
        );

        if (name && isRelevantProduct(name)) {
          seen.add(url);
          products.push({ id: generateId('pokemon-center', url), name, url, site: 'pokemon-center' });
        }
      });

      log('Discovery/PokémonCenter', `Found ${products.length} products so far from ${pageUrl}`);
    } catch (err) {
      log('Discovery/PokémonCenter', `Failed on ${pageUrl}: ${err.message}`);
    }
  }

  return products;
}
