import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { log } from './utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_FILE = join(__dirname, '..', 'state.json');

let state = { products: [], stock: {} };

log('STATE', `Looking for state.json at: ${STATE_FILE}`);

if (existsSync(STATE_FILE)) {
  try {
    let raw = readFileSync(STATE_FILE, 'utf8');
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1); // strip BOM
    state = JSON.parse(raw);
    log('STATE', `Loaded ${state.products?.length ?? 0} products from state.json`);
  } catch (err) {
    log('STATE', `Could not parse state.json: ${err.message} — starting fresh`);
  }
} else {
  log('STATE', 'state.json not found — starting with empty product list');
}

function save() {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

export function getProducts() {
  return state.products ?? [];
}

export function mergeProducts(newProducts) {
  const existing = new Map((state.products ?? []).map(p => [p.id, p]));
  let added = 0;
  for (const p of newProducts) {
    if (!existing.has(p.id)) {
      existing.set(p.id, p);
      added++;
    }
  }
  state.products = [...existing.values()];
  if (added > 0) {
    log('STATE', `Added ${added} new product(s) — total: ${state.products.length}`);
    save();
  }
}

export function updateStock(id, inStock) {
  const previous = state.stock[id];
  state.stock[id] = inStock;
  save();
  return previous;
}
