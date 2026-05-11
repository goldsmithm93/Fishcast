import { fetchWithTimeout } from './utils.js';
import { log } from './utils.js';

const SITE_NAMES = {
  'pokemon-center': 'Pokemon Center',
  'bestbuy': 'Best Buy',
  'target': 'Target',
  'amazon': 'Amazon',
  'walmart': 'Walmart',
};

export async function sendRestock({ name, url, site, price }) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl || webhookUrl.includes('YOUR_ID')) {
    log('NOTIFIER', `DISCORD_WEBHOOK_URL not configured — skipping alert for: ${name}`);
    return;
  }

  const siteName = SITE_NAMES[site] || site;
  const priceField = price ? `\n💰 **Price:** ${price}` : '';

  const payload = {
    embeds: [{
      title: '🎉 RESTOCK ALERT!',
      description: `**${name}** is now **IN STOCK** at **${siteName}**!${priceField}\n\n🔗 [Buy Now](${url})`,
      color: 0xFFCB05,
      timestamp: new Date().toISOString(),
      footer: { text: 'Pokemon Restock Notifier' },
    }],
  };

  try {
    const res = await fetchWithTimeout(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      log('NOTIFIER', `Discord alert sent: ${name} @ ${siteName}`);
    } else {
      log('NOTIFIER', `Discord webhook returned ${res.status} for: ${name}`);
    }
  } catch (err) {
    log('NOTIFIER', `Failed to send alert: ${err.message}`);
  }
}
