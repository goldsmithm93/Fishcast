import { checkStock as checkPokemonCenter } from './pokemon-center.js';
import { checkStock as checkBestBuy } from './bestbuy.js';
import { checkStock as checkTarget } from './target.js';
import { checkStock as checkAmazon } from './amazon.js';
import { checkStock as checkWalmart } from './walmart.js';
import { checkOnlineStock as checkCostcoOnline, checkInstoreStock as checkCostcoInstore } from './costco.js';
import { getProducts, updateStock } from '../state.js';
import { sendRestock } from '../notifier.js';
import { log } from '../utils.js';

const CHECKERS = {
  'pokemon-center': checkPokemonCenter,
  'bestbuy': checkBestBuy,
  'target': checkTarget,
  'amazon': checkAmazon,
  'walmart': checkWalmart,
  'costco-online': checkCostcoOnline,
  'costco-instore': checkCostcoInstore,
};

export async function checkAll() {
  const products = getProducts();
  if (products.length === 0) {
    log('MONITOR', 'No products in state yet — run discovery first');
    return;
  }

  log('MONITOR', `Checking ${products.length} product(s)...`);

  // Check all products concurrently (with a small delay between requests per site to be polite)
  const checks = products.map(async product => {
    const checker = CHECKERS[product.site];
    if (!checker) {
      log('MONITOR', `No checker for site "${product.site}" — skipping ${product.name}`);
      return;
    }

    try {
      const { inStock } = await checker(product.url);
      const previous = updateStock(product.id, inStock);

      const statusStr = inStock ? 'IN STOCK' : 'out of stock';
      log('MONITOR', `[${product.site}] ${product.name}: ${statusStr}`);

      // Alert only when transitioning from not-in-stock to in-stock
      if (inStock && previous === false) {
        await sendRestock(product);
      }
    } catch (err) {
      log('MONITOR', `Unexpected error checking ${product.name}: ${err.message}`);
    }
  });

  await Promise.allSettled(checks);
  log('MONITOR', 'Check cycle complete');
}
