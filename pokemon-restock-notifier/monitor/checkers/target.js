import { fetchWithTimeout, log } from '../utils.js';

const TARGET_KEY = 'ff457966e64d5e877fdbad070f276d18ecec4a01';

export async function checkStock(url) {
  // Extract TCIN from Target URL: .../p/product-name/-/A-89578527
  const tcinMatch = url.match(/\/A-(\d+)/);
  if (!tcinMatch) {
    log('Check/Target', `Could not extract TCIN from URL: ${url}`);
    return { inStock: false };
  }
  const tcin = tcinMatch[1];

  try {
    const apiUrl = `https://redsky.target.com/redsky_aggregations/v1/web/pdp_client_v1?key=${TARGET_KEY}&tcin=${tcin}&store_id=911&zip=55402&state=MN&pricing_store_id=911&visitor_id=01234567890123456789&channel=WEB&page=%2Fp%2F-${tcin}`;
    const res = await fetchWithTimeout(apiUrl, { headers: { Accept: 'application/json' } });
    if (!res.ok) return { inStock: false };
    const data = await res.json();
    const status = data?.data?.product?.fulfillment?.shipping_options?.availability_status;
    return { inStock: status === 'IN_STOCK' };
  } catch (err) {
    log('Check/Target', `Failed: ${err.message}`);
    return { inStock: false };
  }
}
