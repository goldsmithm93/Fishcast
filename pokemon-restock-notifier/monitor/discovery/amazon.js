import { log } from '../utils.js';

// Amazon blocks automated scraping aggressively. Discovery is skipped.
// You can still monitor specific Amazon product URLs by adding them manually to state.json:
//
//   "products": [
//     { "id": "amazon-manual-1", "name": "Prismatic Evolutions ETB", "url": "https://www.amazon.com/dp/BXXXXXXXX", "site": "amazon" }
//   ]

export async function discoverAmazon() {
  log('Discovery/Amazon', 'Amazon discovery skipped (bot protection). Add URLs manually to state.json if needed.');
  return [];
}
