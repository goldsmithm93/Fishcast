import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { log } from './utils.js';

const STATE_FILE = join(dirname(fileURLToPath(import.meta.url)), '..', 'state.json');

function load() {
  if (!existsSync(STATE_FILE)) return { products: [], stock: {} };
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return { products: [], stock: {} };
  }
}

function save(state) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

export function getProducts() {
  return load().products;
}

export function mergeProducts(newProducts) {
  const state = load();
  const existingIds = new Set(state.products.map(p => p.id));
  let added = 0;
  for (const product of newProducts) {
    if (!existingIds.has(product.id)) {
      state.products.push(product);
      existingIds.add(product.id);
      added++;
    }
  }
  if (added > 0) {
    save(state);
    log('STATE', `Added ${added} new product(s) to monitoring`);
  }
  return state.products;
}

// Returns the previous stock value (null if never seen before)
export function updateStock(productId, inStock) {
  const state = load();
  const previous = state.stock[productId] ?? null;
  state.stock[productId] = inStock;
  save(state);
  return previous;
}
