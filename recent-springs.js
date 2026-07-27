// ---------------------------------------------------------------------------
// Poslední navštívené studánky — živý výpis z Firestore.
//
// Čte JEDEN dokument `public/recent_logs`, který plní Cloud Functions
// (onLogCreatedUpdateRecent + rebuildRecentLogs ve functions/index.js).
//
// Proč snapshot a ne přímý dotaz na logy:
//   1. CENA — 1 read místo ~24 na každé načtení stránky.
//   2. SOUKROMÍ — log dokumenty obsahují userEmail/userId. Snapshot má
//      jen neosobní pole, takže prohlížeč osobní údaje vůbec nestahuje.
//
// Výsledek se navíc cachuje v localStorage (15 min).
// ---------------------------------------------------------------------------

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getFirestore, doc, getDoc,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyBKwYzl6zZrxc_WGcwZqQQrjQuMuUFhjMY',
  authDomain: 'studanky-cd394.firebaseapp.com',
  projectId: 'studanky-cd394',
  storageBucket: 'studanky-cd394.firebasestorage.app',
  messagingSenderId: '13925728081',
  appId: '1:13925728081:web:9c790e3d4cbf6014945d70',
};

const SHOW_COUNT = 6;                 // kolik karet zobrazíme (doc jich má 12)
const CACHE_KEY  = 'sp_recent_logs_v2';
const CACHE_TTL  = 15 * 60 * 1000;    // 15 minut

const TYPE_META = {
  studanka: { icon: '⛲', label: 'Studánka' },
  pramen:   { icon: '💧', label: 'Pramen' },
  studna:   { icon: '🪣', label: 'Studna' },
  pitko:    { icon: '🚰', label: 'Pítko' },
};

function typeMeta(typ) {
  return TYPE_META[typ] || { icon: '💧', label: 'Vodní zdroj' };
}

/** "před 3 h" / "včera" / "12. 7." */
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

// --- Lightbox (zvětšení fotky) ---------------------------------------------

let lightboxItems = [];
let lastFocused = null;

function openLightbox(index) {
  const it = lightboxItems[index];
  const box = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  const cap = document.getElementById('lightbox-caption');
  if (!it || !box || !img || !cap) return;

  const meta = typeMeta(it.typ);
  img.src = it.fotoUrl;
  img.alt = it.springName || 'Studánka';
  cap.textContent =
    `${it.springName || 'Studánka'} — ${meta.label} · ${relativeTime(it.ts)}`;

  lastFocused = document.activeElement;
  box.hidden = false;
  document.body.style.overflow = 'hidden';   // stránka pod overlayem nescrolluje
  document.getElementById('lightbox-close')?.focus();
}

function closeLightbox() {
  const box = document.getElementById('lightbox');
  if (!box || box.hidden) return;
  box.hidden = true;
  document.body.style.overflow = '';
  // Uvolnit fotku z paměti a vrátit fokus tam, odkud uživatel přišel
  const img = document.getElementById('lightbox-img');
  if (img) img.src = '';
  if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
}

let lightboxReady = false;

function setupLightbox() {
  if (lightboxReady) return;   // navázat listenery jen jednou
  const box  = document.getElementById('lightbox');
  const grid = document.getElementById('recent-springs-grid');
  if (!box || !grid) return;
  lightboxReady = true;

  // Delegace — karty se vytvářejí dynamicky
  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.recent-card');
    if (card) openLightbox(Number(card.dataset.index));
  });
  // Klávesnice: karty jsou fokusovatelné (tabindex v renderu)
  grid.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.recent-card');
    if (!card) return;
    e.preventDefault();
    openLightbox(Number(card.dataset.index));
  });

  document.getElementById('lightbox-close')
    ?.addEventListener('click', closeLightbox);
  // Klik mimo fotku zavírá; klik na fotku/titulek ne
  box.addEventListener('click', (e) => {
    if (!e.target.closest('.lightbox-inner')) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
}

function render(items) {
  const section = document.getElementById('recent-springs');
  const grid    = document.getElementById('recent-springs-grid');
  if (!section || !grid) return;

  if (!items.length) {
    section.hidden = true;
    return;
  }

  lightboxItems = items;

  grid.innerHTML = items.map((it, i) => {
    const meta = typeMeta(it.typ);
    const name = escapeHtml(it.springName || 'Studánka');
    return `
      <figure class="recent-card" data-index="${i}" tabindex="0"
              role="button" aria-label="Zvětšit fotku: ${name}">
        <img src="${escapeHtml(it.fotoUrl)}" alt="${name}"
             loading="lazy" referrerpolicy="no-referrer">
        <figcaption>
          <span class="recent-name">${name}</span>
          <span class="recent-meta">${meta.icon} ${meta.label} · ${escapeHtml(relativeTime(it.ts))}</span>
        </figcaption>
      </figure>`;
  }).join('');

  section.hidden = false;
  setupLightbox();
}

async function load() {
  const cached = readCache();
  if (cached) {
    render(cached);
    return;
  }

  const db = getFirestore(initializeApp(firebaseConfig));
  const snap = await getDoc(doc(db, 'public', 'recent_logs'));
  if (!snap.exists()) return;    // Cloud Function doc ještě nenaplnila

  // Server už položky deduplikoval podle studánky a seřadil — jen ořízneme.
  const items = (snap.data().items || [])
    .filter((it) => typeof it?.fotoUrl === 'string' && it.fotoUrl.startsWith('http'))
    .slice(0, SHOW_COUNT)
    .map((it) => ({
      springName: it.springName || '',
      typ: it.typ || '',
      fotoUrl: it.fotoUrl,
      // true = fotka je z této návštěvy, false = stávající fotka studánky
      freshFoto: it.freshFoto === true,
      ts: typeof it.ts === 'number' ? it.ts : Date.now(),
    }));

  writeCache(items);
  render(items);
}

load().catch((err) => {
  // Tichý fail — sekce zůstane skrytá, zbytek stránky funguje.
  console.warn('Nepodařilo se načíst poslední studánky:', err);
});
