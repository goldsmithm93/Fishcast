import { fetchWithTimeout, generateId, log } from '../utils.js';
import { PRODUCT_SUFFIXES } from '../config.js';

const REDSKY_KEY = 'ff457966e64d5e877fdbad070f276d18ecec4a01';

// Get a guest token from Target — this is what their website does on every visit
async function getGuestToken() {
  try {
    const res = await fetchWithTimeout('https://guestservices.target.com/v3/session', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Origin': 'https://www.target.com',
        'Referer': 'https://www.target.com/',
      },
    });
    if (!res.ok) {
      log('Discovery/Target', `Guest token HTTP ${res.status}`);
      return null;
    }
    const data = await res.json();
    const token = data?.access_token ?? data?.token;
    if (token) log('Discovery/Target', 'Got guest token');
    return token;
  } catch (err) {
    log('Discovery/Target', `Guest token failed: ${err.message}`);
    return null;
  }
}

function randomVisitorId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

export async function discoverTarget(sets) {
  const products = [];
  const seen = new Set();
  const visitorId = randomVisitorId();
  const token = await getGuestToken();

  const authHeaders = token
    ? { 'Authorization': `Bearer ${token}` }
    : {};

  for (const set of sets) {
    for (const suffix of PRODUCT_SUFFIXES) {
      const query = `Pokemon ${set.name} ${suffix}`;
      try {
        const url = `https://redsky.target.com/redsky_aggregations/v1/web/plp_search_v2?key=${REDSKY_KEY}&keyword=${encodeURIComponent(query)}&count=24&default_purchasability_filter=true&pricing_store_id=911&visitor_id=${visitorId}&channel=WEB&platform=desktop`;
        const res = await fetchWithTimeout(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Origin': 'https://www.target.com',
            'Referer': 'https://www.target.com/',
            ...authHeaders,
          },
        });
        if (!res.ok) {
          log('Discovery/Target', `HTTP ${res.status} for "${query}"`);
          continue;
        }
        const data = await res.json();
        const items = data?.data?.search?.products ?? [];

        for (const item of items) {
          const name = item.item?.product_description?.title ?? '';
          const tcin = item.item?.tcin;
          if (!tcin || seen.has(tcin)) continue;
          const productUrl = `https://www.target.com/p/-/A-${tcin}`;
          seen.add(tcin);
          products.push({ id: generateId('target', productUrl), name, url: productUrl, site: 'target' });
        }
      } catch (err) {
        log('Discovery/Target', `Search failed for "${query}": ${err.message}`);
      }
    }
  }

  log('Discovery/Target', `Found ${products.length} products`);
  return products;
}
