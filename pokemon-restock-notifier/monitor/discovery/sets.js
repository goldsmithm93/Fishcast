import { fetchWithTimeout, log } from '../utils.js';
import { MAX_SETS_TO_MONITOR } from '../config.js';

// Fetches recent Pokemon TCG sets from the free pokemontcg.io API.
// Returns set names sorted newest-first so we always monitor the latest releases.
export async function getRecentSets() {
  try {
    const res = await fetchWithTimeout(
      `https://api.pokemontcg.io/v2/sets?orderBy=-releaseDate&pageSize=${MAX_SETS_TO_MONITOR}`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { data } = await res.json();
    const sets = data.map(s => ({ name: s.name, releaseDate: s.releaseDate }));
    log('SETS', `Found ${sets.length} recent sets: ${sets.map(s => s.name).join(', ')}`);
    return sets;
  } catch (err) {
    log('SETS', `pokemontcg.io API failed (${err.message}) — using fallback set list`);
    return FALLBACK_SETS;
  }
}

// Fallback in case the API is unreachable. Covers Scarlet & Violet era through early 2025.
const FALLBACK_SETS = [
  { name: 'Journey Together', releaseDate: '2025-03-28' },
  { name: 'Prismatic Evolutions', releaseDate: '2025-01-17' },
  { name: 'Surging Sparks', releaseDate: '2024-11-08' },
  { name: 'Stellar Crown', releaseDate: '2024-09-13' },
  { name: 'Shrouded Fable', releaseDate: '2024-08-02' },
  { name: 'Twilight Masquerade', releaseDate: '2024-05-24' },
  { name: 'Temporal Forces', releaseDate: '2024-03-22' },
  { name: 'Paldean Fates', releaseDate: '2024-01-26' },
  { name: 'Paradox Rift', releaseDate: '2023-11-03' },
  { name: 'Obsidian Flames', releaseDate: '2023-08-11' },
  { name: 'Paldea Evolved', releaseDate: '2023-06-09' },
  { name: 'Scarlet & Violet', releaseDate: '2023-03-31' },
];
