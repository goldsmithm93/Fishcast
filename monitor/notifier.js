import fetch from 'node-fetch';
import { log } from './utils.js';

export async function sendRestock(product) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  const message = [
    '🎉 **RESTOCK ALERT!**',
    '',
    `**${product.name}** is now **IN STOCK** at ${formatSite(product.site)}!`,
    '',
    `🔗 Buy Now → ${product.url}`,
  ].join('\n');

  log('ALERT', `RESTOCK: ${product.name} at ${product.site} — ${product.url}`);

  if (!webhookUrl || webhookUrl.includes('YOUR_ID')) {
    log('ALERT', 'Discord webhook not configured — alert logged only');
    return;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message }),
    });
    if (!res.ok) {
      log('ALERT', `Discord webhook returned HTTP ${res.status}`);
    }
  } catch (err) {
    log('ALERT', `Failed to send Discord alert: ${err.message}`);
  }
}

function formatSite(site) {
  const names = {
    'pokemon-center': 'Pokemon Center',
    'bestbuy': 'Best Buy',
    'target': 'Target',
    'walmart': 'Walmart',
    'amazon': 'Amazon',
    'costco-online': 'Costco (Online)',
    'costco-instore': 'Costco (In-Store)',
  };
  return names[site] ?? site;
}
