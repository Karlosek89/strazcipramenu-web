// ---------------------------------------------------------------------------
// Poslední navštívené studánky — živý výpis z Firestore.
//
// Čte collection group `logs` (veřejné čtení dle firestore.rules) a vybírá
// poslední logy, které mají fotku. Zobrazuje POUZE neosobní údaje:
// jméno studánky, typ, fotku a čas. Žádná identita uživatele.
//
// Firestore neumí zkombinovat `where(fotoUrl != null)` s `orderBy(timestamp)`
// (nerovnost musí být první v orderBy), proto načteme posledních N logů
// a fotky vyfiltrujeme až na klientovi.
//
// Výsledek se cachuje v localStorage (15 min) — šetří Firestore čtení
// při opakovaných návštěvách.
// ---------------------------------------------------------------------------

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getFirestore, collectionGroup, query, orderBy, limit, getDocs,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyBKwYzl6zZrxc_WGcwZqQQrjQuMuUFhjMY',
  authDomain: 'studanky-cd394.firebaseapp.com',
  projectId: 'studanky-cd394',
  storageBucket: 'studanky-cd394.firebasestorage.app',
  messagingSenderId: '13925728081',
  appId: '1:13925728081:web:9c790e3d4cbf6014945d70',
};

const FETCH_LIMIT = 24;   // kolik logů načteme (mezi nimi hledáme fotky)
const SHOW_COUNT  = 6;    // kolik karet zobrazíme
const CACHE_KEY   = 'sp_recent_logs_v1';
const CACHE_TTL   = 15 * 60 * 1000; // 15 minut

const TYPE_META = {
  studanka: { icon: '⛲', label: 'Studánka' },
  pramen:   { icon: '💧', label: 'Pramen' },
  studna:   { icon: '🪣', label: 'Studna' },
  pitko:    { icon: '🚰', label: 'Pítko' },
};

function typeMeta(typ) {
  return TYPE_META[typ] || { icon: '💧', label: 'Vodní zdroj' };
}

/** "před 3 hodinami" / "včera" / "12. 7." */
function relativeTime(ms) {
  const diff = Date.now() - ms;
  const min = Math.floor(diff / 60000);
  if (min < 1)  return 'právě teď';
  if (min < 60) return `před ${min} min`;
  const hod = Math.floor(min / 60);
  if (hod < 24) return `před ${hod} h`;
  const dny = Math.floor(hod / 24);
  if (dny === 1) return 'včera';
  if (dny < 7)   return `před ${dny} dny`;
  const d = new Date(ms);
  return `${d.getDate()}. ${d.getMonth() + 1}.`;
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s ?? '';
  return div.innerHTML;
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { at, items } = JSON.parse(raw);
    if (!at || !Array.isArray(items)) return null;
    if (Date.now() - at > CACHE_TTL) return null;
    return items;
  } catch { return null; }
}

function writeCache(items) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), items }));
  } catch { /* private mode / plno — nevadí */ }
}

function render(items) {
  const section = document.getElementById('recent-springs');
  const grid    = document.getElementById('recent-springs-grid');
  if (!section || !grid) return;

  if (!items.length) {
    section.hidden = true;
    return;
  }

  grid.innerHTML = items.map((it) => {
    const meta = typeMeta(it.typ);
    return `
      <figure class="recent-card">
        <img src="${escapeHtml(it.fotoUrl)}" alt="${escapeHtml(it.springName || 'Studánka')}"
             loading="lazy" referrerpolicy="no-referrer">
        <figcaption>
          <span class="recent-name">${escapeHtml(it.springName || 'Studánka')}</span>
          <span class="recent-meta">${meta.icon} ${meta.label} · ${escapeHtml(relativeTime(it.ts))}</span>
        </figcaption>
      </figure>`;
  }).join('');

  section.hidden = false;
}

async function load() {
  const cached = readCache();
  if (cached) {
    render(cached);
    return;
  }

  const db = getFirestore(initializeApp(firebaseConfig));
  const snap = await getDocs(query(
    collectionGroup(db, 'logs'),
    orderBy('timestamp', 'desc'),
    limit(FETCH_LIMIT),
  ));

  const items = [];
  const seenSprings = new Set();
  snap.forEach((doc) => {
    if (items.length >= SHOW_COUNT) return;
    const d = doc.data();
    const foto = d.fotoUrl;
    if (typeof foto !== 'string' || !foto.startsWith('http')) return;
    // Jedna studánka jen jednou — ať výpis není zaplněný stejným místem.
    const sid = d.springId || doc.ref.parent.parent?.id || '';
    if (sid && seenSprings.has(sid)) return;
    if (sid) seenSprings.add(sid);
    // Ukládáme jen neosobní údaje (bez userId / userEmail).
    items.push({
      springName: d.springName || '',
      typ: d.typ || '',
      fotoUrl: foto,
      ts: d.timestamp?.toMillis?.() ?? Date.now(),
    });
  });

  writeCache(items);
  render(items);
}

load().catch((err) => {
  // Tichý fail — sekce zůstane skrytá, zbytek stránky funguje.
  console.warn('Nepodařilo se načíst poslední studánky:', err);
});
