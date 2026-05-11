import * as cheerio from 'cheerio';
import { fetchWithTimeout, BROWSER_HEADERS, generateId, log } from '../utils.js';

// Every page below is a Pokemon TCG product category — any product link on these
// pages is by definition a Pokemon TCG product, so no name filtering needed.
const CATEGORY_PAGES = [
  'https://www.pokemoncenter.com/category/trading-card-game/booster-boxes',
  'https://www.pokemoncenter.com/category/trading-card-game/elite-trainer-boxes',
  'https://www.pokemoncenter.com/category/trading-card-game/blister-packs',
  'https://www.pokemoncenter.com/category/trading-card-game/collections',
  'https://www.pokemoncenter.com/category/trading-card-game/special-collections',
  'https://www.pokemoncenter.com/category/trading-card-game/tins',
  'https://www.pokemoncenter.com/category/trading-card-game/booster-bundles',
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
        seen.add(url);

        const name = (
          $(el).text().trim() ||
          $(el).find('img').attr('alt') ||
          $(el).closest('[class*="product"]').find('[class*="name"], [class*="title"]').first().text().trim() ||
          href.split('/').pop().replace(/-/g, ' ')
        );

        products.push({ id: generateId('pokemon-center', url), name, url, site: 'pokemon-center' });
      });

      log('Discovery/PokémonCenter', `${products.length} products so far (checked ${pageUrl.split('/').pop()})`);
    } catch (err) {
      log('Discovery/PokémonCenter', `Failed on ${pageUrl.split('/').pop()}: ${err.message}`);
    }
  }

  return products;
}
