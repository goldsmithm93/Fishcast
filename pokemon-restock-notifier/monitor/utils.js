import fetch from 'node-fetch';

export const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
};

export async function fetchWithTimeout(url, options = {}, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export function generateId(site, url) {
  return `${site}-${url.replace(/^https?:\/\/[^/]+/, '').replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').slice(0, 60)}`;
}

export function isRelevantProduct(name) {
  const lower = name.toLowerCase();
  return (lower.includes('booster box') || lower.includes('elite trainer') || lower.includes(' etb')) &&
    lower.includes('pokemon');
}

export function log(tag, msg) {
  console.log(`[${new Date().toLocaleTimeString()}] [${tag}] ${msg}`);
}
