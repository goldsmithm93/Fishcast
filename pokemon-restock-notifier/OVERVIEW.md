# Pokemon Restock Notifier

A tool that watches retail websites 24/7 and sends you an instant Discord message the second any Pokemon TCG product comes back in stock. **New sets and products are detected automatically** — no config changes needed when a new set drops.

---

## What It Does

Most Pokemon products sell out within minutes of restocking. By the time you notice it on the site, it's already gone. This tool:

- Checks product pages every **5 minutes** for stock changes
- Fires a Discord alert the **instant** availability changes from out-of-stock to in-stock
- **Auto-discovers new sets** by querying the pokemontcg.io API every 24 hours — so when a new set like Prismatic Evolutions 2 drops, the tool finds it and starts monitoring automatically

---

## Sites Monitored

| Retailer | Website | Discovery | Online | In-Store |
|----------|---------|-----------|--------|----------|
| Pokemon Center | pokemoncenter.com | Yes | Yes | — |
| Best Buy | bestbuy.com | Yes (better with API key) | Yes | — |
| Target | target.com | Yes | Yes | — |
| Walmart | walmart.com | Yes | Yes | — |
| Costco | costco.com | Yes | Yes | Yes (add zip code to .env) |
| Amazon | amazon.com | Manual only* | Yes | — |

*Amazon aggressively blocks bots so auto-discovery is skipped, but you can paste Amazon product URLs directly into `state.json` and they'll be monitored.

---

## How New Sets Are Detected Automatically

Every 24 hours the tool checks the [pokemontcg.io](https://pokemontcg.io) API for the latest Pokemon TCG sets. For each new set it finds, it searches every retailer for:
- `Pokemon [Set Name] Elite Trainer Box`
- `Pokemon [Set Name] Booster Box`

Any matching products get added to the monitoring list automatically. You will never need to manually add a new set.

---

## Product Types Monitored

The tool searches for every major Pokemon TCG product format across all sites:

| Product Type | Examples |
|---|---|
| Booster Box | 36-pack sealed box |
| Elite Trainer Box (ETB) | 9 packs + accessories |
| Booster Bundle | 6-pack bundle |
| Blister Pack | Single/2-pack/3-pack with promo |
| Collection Box | Character or promo collection |
| Premium Collection | Larger box sets with promos |
| Ultra Premium Collection (UPC) | High-end box sets |
| Special Collection | Limited/themed sets |
| Tin | Poke Ball tins, character tins |
| Build & Battle Box | 4 packs + deck-building kit |

**On every startup the tool queries pokemontcg.io for the latest sets** — so Ascended Heroes, anything that dropped last week, and every future set are picked up automatically across all product types above.

The sets below are a built-in backup used only if pokemontcg.io is unreachable on first launch:

- Journey Together, Prismatic Evolutions, Surging Sparks, Stellar Crown, Shrouded Fable, Twilight Masquerade, Temporal Forces, Paldean Fates, Paradox Rift, Obsidian Flames, Paldea Evolved, Scarlet & Violet Base

---

## Discord Notification Example

```
🎉 RESTOCK ALERT!

Prismatic Evolutions Elite Trainer Box is now IN STOCK at Pokemon Center!

🔗 Buy Now → https://www.pokemoncenter.com/...
```

Notifications fire **once per restock event** — you won't get spammed if the item stays in stock.

---

## How to Set It Up

1. **Install Node.js** — Download from [nodejs.org](https://nodejs.org) if you don't already have it (free)
2. **Download the tool** — Clone or download this project to any folder on your computer
3. **Install dependencies** — Open a terminal in the project folder and run:
   ```
   npm install
   ```
4. **Create a Discord webhook**
   - Open Discord, go to any channel (create a dedicated `#pokemon-restocks` channel if you want)
   - Click the gear icon → **Integrations** → **Webhooks** → **New Webhook**
   - Click **Copy Webhook URL**
5. **Configure the tool**
   - Copy `.env.example` to `.env`
   - Paste your webhook URL after `DISCORD_WEBHOOK_URL=`
6. **Start monitoring**
   ```
   node monitor.js
   ```
   Leave this terminal window open. The tool logs every check so you can see it working.

---

## Optional: Best Buy API Key (Recommended)

Best Buy offers a free developer API key that makes monitoring more reliable. Without it the tool still works but may miss some Best Buy products.

Get a free key at: [developer.bestbuy.com](https://developer.bestbuy.com)

Add it to your `.env` file:
```
BESTBUY_API_KEY=your_key_here
```

---

## How to Add Products Manually (Amazon or other)

Open `state.json` after the first run and add an entry under `"products"`:

```json
{
  "id": "amazon-prismatic-etb",
  "name": "Prismatic Evolutions ETB",
  "url": "https://www.amazon.com/dp/BXXXXXXXX",
  "site": "amazon"
}
```

The tool will start monitoring it on the next check cycle.

---

## Keeping It Running 24/7

To get alerts even when your computer is off, you can run this on a cheap server:
- **Railway** or **Render** — free tiers available, just upload the project and set your env vars
- **A Raspberry Pi** at home — runs Node.js and costs pennies per month in electricity

---

## Technical Summary

| Setting | Default | How to change |
|---------|---------|---------------|
| Stock check interval | Every 5 minutes | Set `MONITOR_INTERVAL_MS` in `.env` |
| Set discovery interval | Every 24 hours | Set `DISCOVERY_INTERVAL_MS` in `.env` |
| Notification method | Discord webhook | Set `DISCORD_WEBHOOK_URL` in `.env` |

**Stack:** Node.js · node-fetch · cheerio · dotenv
