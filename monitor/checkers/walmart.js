import * as cheerio from 'cheerio';
import { fetchWithTimeout, BROWSER_HEADERS, log } from '../utils.js';

export async function checkStock(url) {
  try {
    const res = await fetchWithTimeout(url, { headers: BROWSER_HEADERS });
    if (!res.ok) return { inStock: false };
    const html = await res.text();

    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (match) {
      try {
        const nextData = JSON.parse(match[1]);
        const product = nextData?.props?.pageProps?.initialData?.data?.product;
        if (product) {
          const status = product.availabilityStatus;
          return { inStock: status === 'IN_STOCK' };
        }
      } catch {
        // JSON parse failed — fall through to DOM check
      }
    }

    const $ = cheerio.load(html);
    const addToCart = $('[data-testid="add-to-cart-btn"]').length > 0;
    return { inStock: addToCart };
  } catch (err) {
    log('Check/Walmart', `Failed: ${err.message}`);
    return { inStock: false };
  }
}
