import * as cheerio from 'cheerio';
import { fetchWithTimeout, BROWSER_HEADERS, log } from '../utils.js';

export async function checkStock(url) {
  try {
    const res = await fetchWithTimeout(url, { headers: BROWSER_HEADERS });

    if (res.status === 503 || res.status === 403) {
      log('Check/Amazon', 'Blocked by Amazon — result skipped');
      return { inStock: false };
    }

    const html = await res.text();

    if (html.includes('Enter the characters you see below') ||
        html.includes('api-services-support@amazon.com') ||
        html.includes('Type the characters you see in this image')) {
      log('Check/Amazon', 'CAPTCHA detected — Amazon is blocking this request');
      return { inStock: false };
    }

    const $ = cheerio.load(html);
    const availText = $('#availability').text().toLowerCase().trim();

    if (!availText) {
      const addToCart = $('#add-to-cart-button').length > 0;
      return { inStock: addToCart };
    }

    const inStock = availText.includes('in stock') && !availText.includes('unavailable');
    return { inStock };
  } catch (err) {
    log('Check/Amazon', `Failed: ${err.message}`);
    return { inStock: false };
  }
}
