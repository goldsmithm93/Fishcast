export const MONITOR_INTERVAL_MS = parseInt(process.env.MONITOR_INTERVAL_MS) || 5 * 60 * 1000;
export const DISCOVERY_INTERVAL_MS = parseInt(process.env.DISCOVERY_INTERVAL_MS) || 24 * 60 * 60 * 1000;

// How many recent sets to monitor (sorted by newest first)
export const MAX_SETS_TO_MONITOR = 15;

// Product types to search for per set on retailer sites
export const PRODUCT_SUFFIXES = [
  'Elite Trainer Box',
  'Booster Box',
  'Booster Bundle',
  'Blister Pack',
  'Collection Box',
  'Premium Collection',
  'Ultra Premium Collection',
  'Tin',
  'Build & Battle Box',
  'Special Collection',
];
