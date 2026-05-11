import * as cheerio from 'cheerio';
import { fetchWithTimeout, BROWSER_HEADERS, log } from '../utils.js';

export async function checkStock(url) {
  try {
    const res = await fetchWithTimeout(url, { headers: BROWSER_HEADERS });
    if (!res.ok) return { inStock: false };
    const html = await res.text();
    const $ = cheerio.load(html);

    // Salesforce Commerce Cloud patterns
    const addToCartBtn = $('button[data-button-state="ADD_TO_CART"], button.add-to-cart-button').length > 0;
    const outOfStockBtn = $('[data-button-state="OUT_OF_STOCK"], .out-of-stock-button').length > 0;

    // Embedded JSON availability (schema.org)
    if (html.includes('"availability":"https://schema.org/InStock"') ||
        html.includes('"availability": "https://schema.org/InStock"')) {
      return { inStock: true };
    }
    if (html.includes('"availability":"https://schema.org/OutOfStock"') ||
        html.includes('"availability": "https://schema.org/OutOfStock"')) {
      return { inStock: false };
    }

    return { inStock: addToCartBtn && !outOfStockBtn };
  } catch (err) {
    log('Check/PokémonCenter', `Failed: ${err.message}`);
    return { inStock: false };
  }
}
