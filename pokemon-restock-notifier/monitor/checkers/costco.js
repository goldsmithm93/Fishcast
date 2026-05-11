import * as cheerio from 'cheerio';
import { fetchWithTimeout, BROWSER_HEADERS, log } from '../utils.js';

// Extracts Costco item number from URL: .../some-product.product.4000236282.html
function getItemNumber(url) {
  const match = url.match(/\.product\.(\d+)\.html/);
  return match ? match[1] : null;
}

// Looks up the nearest Costco warehouse number for a given zip code.
// Cached in memory so we only call this once per run.
let cachedWarehouseId = null;
async function getWarehouseId() {
  if (cachedWarehouseId) return cachedWarehouseId;
  const zip = process.env.COSTCO_ZIP_CODE;
  if (!zip) return null;

  try {
    const url = `https://www.costco.com/AjaxFindAWarehouseJson?q=${encodeURIComponent(zip)}&regionCd=US`;
    const res = await fetchWithTimeout(url, { headers: { ...BROWSER_HEADERS, Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Response is typically an array of warehouses; take the nearest one
    const warehouses = Array.isArray(data) ? data : data.warehouses ?? data.data ?? [];
    const first = warehouses[0];
    const id = first?.storeNumber ?? first?.locationNumber ?? first?.warehouseNumber ?? first?.id;
    if (id) {
      cachedWarehouseId = String(id);
      log('Costco', `Nearest warehouse to ${zip}: #${cachedWarehouseId} (${first?.name ?? 'unknown'})`);
      return cachedWarehouseId;
    }
  } catch (err) {
    log('Check/Costco', `Warehouse lookup failed for zip ${zip}: ${err.message}`);
  }
  return null;
}

export async function checkOnlineStock(url) {
  try {
    const res = await fetchWithTimeout(url, { headers: BROWSER_HEADERS });
    if (!res.ok) return { inStock: false };
    const html = await res.text();

    // Schema.org availability (most reliable when present)
    if (html.includes('"availability":"https://schema.org/InStock"') ||
        html.includes('"availability": "https://schema.org/InStock"')) {
      return { inStock: true };
    }
    if (html.includes('"availability":"https://schema.org/OutOfStock"') ||
        html.includes('"availability": "https://schema.org/OutOfStock"')) {
      return { inStock: false };
    }

    const $ = cheerio.load(html);

    // Costco product page — check for active add-to-cart button
    const addToCart = $('#add-to-cart-btn:not([disabled]), .add-to-cart-btn:not([disabled]), button[id*="add-to-cart"]:not([disabled])').length > 0;

    // Check for explicit out-of-stock indicators
    const pageText = $('body').text().toLowerCase();
    const outOfStock = pageText.includes('out of stock') ||
      pageText.includes('temporarily out of stock') ||
      pageText.includes('no longer available') ||
      pageText.includes('sold out');

    return { inStock: addToCart && !outOfStock };
  } catch (err) {
    log('Check/Costco-Online', `Failed: ${err.message}`);
    return { inStock: false };
  }
}

export async function checkInstoreStock(url) {
  const warehouseId = await getWarehouseId();
  if (!warehouseId) {
    log('Check/Costco-InStore', 'No warehouse found — set COSTCO_ZIP_CODE in .env');
    return { inStock: false };
  }

  const itemNumber = getItemNumber(url);
  if (!itemNumber) {
    log('Check/Costco-InStore', `Could not extract item number from: ${url}`);
    return { inStock: false };
  }

  try {
    const apiUrl = `https://www.costco.com/AjaxCheckOnHandInventory?skuId=${itemNumber}&warehouseId=${warehouseId}`;
    const res = await fetchWithTimeout(apiUrl, {
      headers: { ...BROWSER_HEADERS, Accept: 'application/json' },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Response shape varies — check common patterns
    const inStock =
      data?.onHandInventory > 0 ||
      data?.available === true ||
      data?.inStock === true ||
      data?.status === 'IN_STOCK';

    return { inStock };
  } catch (err) {
    log('Check/Costco-InStore', `Warehouse inventory check failed for item ${itemNumber}: ${err.message}`);
    return { inStock: false };
  }
}
