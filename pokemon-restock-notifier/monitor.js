import 'dotenv/config';
import { discoverAll } from './monitor/discovery/index.js';
import { checkAll } from './monitor/checkers/index.js';
import { MONITOR_INTERVAL_MS, DISCOVERY_INTERVAL_MS } from './monitor/config.js';
import { log } from './monitor/utils.js';

async function main() {
  log('STARTUP', 'Pokemon Restock Notifier starting...');
  log('STARTUP', `Check interval: every ${MONITOR_INTERVAL_MS / 60000} minutes`);
  log('STARTUP', `Discovery interval: every ${DISCOVERY_INTERVAL_MS / 3600000} hours`);

  if (!process.env.DISCORD_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL.includes('YOUR_ID')) {
    log('STARTUP', 'WARNING: DISCORD_WEBHOOK_URL is not set in .env — alerts will be logged but not sent');
  }

  // Run discovery immediately so we have products to monitor right away
  await discoverAll();

  // Initial stock check
  await checkAll();

  // Schedule recurring discovery (every 24h by default)
  setInterval(async () => {
    await discoverAll();
  }, DISCOVERY_INTERVAL_MS);

  // Schedule recurring stock checks
  setInterval(async () => {
    await checkAll();
  }, MONITOR_INTERVAL_MS);

  log('STARTUP', 'Monitoring active. Press Ctrl+C to stop.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
