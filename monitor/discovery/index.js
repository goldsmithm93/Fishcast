import { getRecentSets } from './sets.js';
import { discoverPokemonCenter } from './pokemon-center.js';
import { discoverBestBuy } from './bestbuy.js';
import { discoverTarget } from './target.js';
import { discoverWalmart } from './walmart.js';
import { discoverAmazon } from './amazon.js';
import { discoverCostco } from './costco.js';
import { mergeProducts } from '../state.js';
import { log } from '../utils.js';

export async function discoverAll() {
  log('DISCOVERY', 'Starting product discovery across all sites...');

  const sets = await getRecentSets();

  const results = await Promise.allSettled([
    discoverPokemonCenter(),
    discoverBestBuy(sets),
    discoverTarget(sets),
    discoverWalmart(sets),
    discoverAmazon(),
    discoverCostco(sets),
  ]);

  const allProducts = results.flatMap((r, i) => {
    if (r.status === 'rejected') {
      log('DISCOVERY', `Site ${i} discovery threw unexpectedly: ${r.reason}`);
      return [];
    }
    return r.value;
  });

  log('DISCOVERY', `Discovery complete — ${allProducts.length} products found across all sites`);
  mergeProducts(allProducts);
}
