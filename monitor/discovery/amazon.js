import { log } from '../utils.js';

export async function discoverAmazon() {
  log('Discovery/Amazon', 'Amazon discovery skipped (bot protection). Add URLs manually to state.json if needed.');
  return [];
}
