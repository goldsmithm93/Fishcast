import * as cheerio from 'cheerio';
import { fetchWithTimeout, BROWSER_HEADERS, log } from '../utils.js';

export async function checkStock(url) {
  const apiKey = process.env.BESTBUY_API_KEY;
  const skuMatch = url.match(/\/(\d{5,9})\.p/);

  // Use the Best Buy Products API when a key and SKU are available
  if (apiKey && skuMatch) {
    const sku = skuMatch[1];
    try {
      const apiUrl = `https://api.bestbuy.com/v1/products(sku=${sku})?apiKey=${apiKey}&show=sku,name,onlineAvailability&format=json`;
      const res = await fetchWithTimeout(apiUrl, { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        const product = data.products?.[0];
        if (product) return { inStock: product.onlineAvailability === true };
      }
    } catch (err) {
      log('Check/BestBuy', `API check failed: ${err.message} — falling back to scrape`);
    }
  }

  // Fallback: scrape product page
  try {
    const res = await fetchWithTimeout(url, { headers: BROWSER_HEADERS });
    if (!res.ok) return { inStock: false };
    const html = await res.text();
    const $ = cheerio.load(html);
    const addToCart = $('.add-to-cart-button:not([disabled])').length > 0;
    const unavailable = html.toLowerCase().includes('sold out') ||
      html.toLowerCase().includes('coming soon') ||
      html.toLowerCase().includes('unavailable');
    return { inStock: addToCart && !unavailable };
  } catch (err) {
    log('Check/BestBuy', `Scrape failed: ${err.message}`);
    return { inStock: false };
  }
}
