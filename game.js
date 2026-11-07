'use strict';

/* =========================================================
   EJDERHA YUVASI — birleştir, üret, büyüt
   Tüm oyun verisi tarayıcıda (localStorage) saklanır.
   ========================================================= */

// ---------- Oyun verisi ----------
const DRAGONS = [
  { name: 'Kor Yumurtası',     emoji: '🥚', color: '#f59e0b' },
  { name: 'Kıvılcım Yavrusu',  emoji: '🐣', color: '#fb923c' },
  { name: 'Duman Ejderi',      emoji: '🦎', color: '#94a3b8' },
  { name: 'Yosun Ejderi',      emoji: '🐊', color: '#4ade80' },
  { name: 'Buz Ejderi',        emoji: '🐉', color: '#7dd3fc' },
  { name: 'Şimşek Ejderi',     emoji: '🐉', color: '#facc15' },
  { name: 'Kristal Ejderi',    emoji: '🐉', color: '#c084fc' },
  { name: 'Lav Ejderi',        emoji: '🐲', color: '#ef4444' },
  { name: 'Gölge Ejderi',      emoji: '🐲', color: '#6366f1' },
  { name: 'Altın Ejderha',     emoji: '🐲', color: '#fbbf24' },
  { name: 'Yıldız Ejderhası',  emoji: '🐲', color: '#22d3ee' },
  { name: 'Kadim Ejderha',     emoji: '🐲', color: '#f472b6' },
];
const MAX_LVL = DRAGONS.length;
const BOARD_SIZE = 16;
const START_UNLOCKED = 12;
const UNLOCK_COST = [2500, 25000, 300000, 4000000];

const prodOf = (L) => Math.round(360 * Math.pow(2.3, L - 1));            // ateş özü / saat
const basePrice = (L) => 100 * Math.pow(2.2, L - 1);
const priceOf = (L) => Math.round(basePrice(L) * Math.pow(1.07, S.bought[L] || 0));
const sellValue = (L) => Math.round(basePrice(L) * 0.3);
const capOf = (lvl) => Math.round(1500 * Math.pow(1.75, lvl - 1));
const upgradeCostOf = (lvl) => Math.round(400 * Math.pow(1.9, lvl - 1));
const xpNeed = (lvl) => Math.round(30 * Math.pow(1.45, lvl - 1));
const FREE_SPIN_MS = 6 * 3600 * 1000;
const BOOST_MS = 30 * 60 * 1000;
const COST = { boost: 10, harvest: 8, spin: 5 };

const WHEEL = [
  { type: 'gold', mult: 0.5, label: '½ sa', icon: '🪙', color: '#b45309', w: 22 },
  { type: 'ruby', n: 5,      label: '5',    icon: '💎', color: '#9d174d', w: 16 },
  { type: 'gold', mult: 1,   label: '1 sa', icon: '🪙', color: '#c2410c', w: 18 },
  { type: 'boost',           label: '2×',   icon: '🔥', color: '#7c2d12', w: 12 },
  { type: 'gold', mult: 2,   label: '2 sa', icon: '🪙', color: '#a16207', w: 10 },
  { type: 'ruby', n: 15,     label: '15',   icon: '💎', color: '#831843', w: 5 },
  { type: 'egg',             label: 'Ejder', icon: '🥚', color: '#6d28d9', w: 9 },
  { type: 'ruby', n: 3,      label: '3',    icon: '💎', color: '#be185d', w: 8 },
];

const TASKS = [
  { id: 'merge',  icon: '✨', name: 'Birleştirme Ustası', desc: (n) => `${n} kez birleştir`,            val: () => S.stats.merges, targets: [5, 25, 75, 200, 500, 1500] },
  { id: 'level',  icon: '🐉', name: 'Ejderha Evrimi',     desc: (n) => `${n}. seviye ejderhaya ulaş`,   val: () => S.highest,      targets: [3, 5, 7, 9, 11, 12] },
  { id: 'eggs',   icon: '🥚', name: 'Yumurta Avcısı',     desc: (n) => `${n} ejderha satın al`,          val: () => S.stats.eggs,   targets: [5, 20, 60, 150, 400, 1000] },
  { id: 'cauld',  icon: '🌋', name: 'Kazan Ustası',       desc: (n) => `Kazanı ${n}. seviyeye yükselt`, val: () => S.cauldronLvl,  targets: [2, 4, 6, 9, 12, 15] },
  { id: 'sell',   icon: '🪙', name: 'Tüccar',             desc: (n) => `${n} kez ateş özü sat`,          val: () => S.stats.sells,  targets: [3, 10, 30, 80, 200] },
  { id: 'spin',   icon: '🎡', name: 'Şans Peşinde',       desc: (n) => `Çarkı ${n} kez çevir`,           val: () => S.stats.spins,  targets: [1, 5, 15, 40, 100] },
  { id: 'plvl',   icon: '👑', name: 'Yuva Bekçisi',       desc: (n) => `Oyuncu seviyesi ${n} ol`,        val: () => S.plvl,         targets: [3, 5, 10, 15, 20, 30] },
];
const TASK_RUBIES = [5, 10, 15, 20, 30, 50];

const HELP = {
  kazan: 'Ejderhaların sürekli <b>ateş özü</b> üretir ve bu öz Volkan Kazanı\'nda birikir.<br><br>Kazan dolunca üretim <b>durur</b>. Özü zamanında satıp altına çevir, gerekirse kazanı büyüt.<br><br>Oyunu kapattığında da üretim devam eder, ama yine kazan kapasitesi kadar.',
  cark: `Kader Çarkı her <b>6 saatte bir</b> ücretsiz döner. Beklemek istemezsen 💎 ${COST.spin} yakutla çevirebilirsin.<br><br>Altın ödülleri saatlik üretimine göre büyür.`,
};

// ---------- Kayıt ----------
const SAVE_KEY = 'ejderha-yuvasi-v1';
function freshState() {
  const cells = Array(BOARD_SIZE).fill(0);
  cells[5] = 1; cells[6] = 1;
  return {
    gold: 400, rubies: 10, essence: 0, cauldronLvl: 1,
    cells, unlocked: START_UNLOCKED, highest: 1, bought: {}, shopLevel: 1,
    xp: 0, plvl: 1,
    stats: { merges: 0, eggs: 0, sells: 0, spins: 0 },
    claimed: {}, discovered: [1],
    lastTick: Date.now(), nextFreeSpin: 0, boostUntil: 0, sound: true,
    tutorialDone: false,
  };
}
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return Object.assign(freshState(), JSON.parse(raw));
  } catch (e) { /* kayıt okunamadı */ }
  return freshState();
}
// ---------- Telegram ----------
const TG = window.Telegram && window.Telegram.WebApp;
const IN_TG = !!(TG && TG.initData);
const CLOUD = IN_TG && TG.isVersionAtLeast && TG.isVersionAtLeast('6.9') && TG.CloudStorage;
let lastCloudSave = 0;
function cloudSave(force) {
  if (!CLOUD) return;
  if (!force && Date.now() - lastCloudSave < 15000) return;
  lastCloudSave = Date.now();
  try { TG.CloudStorage.setItem(SAVE_KEY, JSON.stringify(S), () => {}); } catch (e) { /* bulut yok */ }
}
function cloudLoad() {
  return new Promise((resolve) => {
    if (!CLOUD) return resolve(null);
    const t = setTimeout(() => resolve(null), 2500);
    try {
      TG.CloudStorage.getItem(SAVE_KEY, (err, val) => {
        clearTimeout(t);
        try { resolve(!err && val ? JSON.parse(val) : null); } catch (e) { resolve(null); }
      });
    } catch (e) { clearTimeout(t); resolve(null); }
  });
}
function haptic(kind) {
  if (!IN_TG || !TG.HapticFeedback) return;
  try {
    if (kind === 'success' || kind === 'error' || kind === 'warning') TG.HapticFeedback.notificationOccurred(kind);
    else TG.HapticFeedback.impactOccurred(kind);
  } catch (e) { /* titreşim yok */ }
}
function setupTelegram() {
  if (!IN_TG) return;
  try {
    TG.ready();
    TG.expand();
    if (TG.disableVerticalSwipes) TG.disableVerticalSwipes();   // sürüklerken uygulama kapanmasın
    if (TG.setHeaderColor) TG.setHeaderColor('#2b163a');
    if (TG.setBackgroundColor) TG.setBackgroundColor('#1b1029');
    if (TG.setBottomBarColor) TG.setBottomBarColor('#1a0d24');
  } catch (e) { /* eski Telegram sürümü */ }
}
function playerName() {
  const u = IN_TG && TG.initDataUnsafe && TG.initDataUnsafe.user;
  return u ? [u.first_name, u.last_name].filter(Boolean).join(' ') : 'Yuva Bekçisi';
}

function save(forceCloud) {
  S.lastTick = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* depolama yok */ }
  cloudSave(forceCloud);
}
let S = load();

// ---------- Yardımcılar ----------
const $ = (id) => document.getElementById(id);
function fmt(n) {
  n = Math.floor(n);
  if (n < 1000) return String(n);
  const units = ['B', 'Mn', 'Mr', 'Tn', 'Kt', 'Kn'];
  let i = -1;
  while (n >= 1000 && i < units.length - 1) { n /= 1000; i++; }
  const s = n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : String(Math.floor(n));
  return s.replace('.', ',') + units[i];
}
function fmtTime(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h) return `${h}sa ${m}dk`;
  if (m) return `${m}dk ${sec}sn`;
  return `${sec}sn`;
}
const now = () => Date.now();
const boosted = () => S.boostUntil > now();
const capacity = () => capOf(S.cauldronLvl);
function prodPerHour() {
  let p = 0;
  for (const L of S.cells) if (L) p += prodOf(L);
  return p * (boosted() ? 2 : 1);
}
const goldReward = (mult) => Math.max(200, Math.round(prodPerHour() * mult));
const maxBuyLevel = () => Math.max(1, S.highest - 3);

// ---------- Görseller (yoksa emoji yedeği) ----------
const ASSETS = {};
function preload(name, src) {
  const img = new Image();
  img.onload = () => { ASSETS[name] = src; renderAll(); };
  img.src = src;
}
for (let L = 1; L <= MAX_LVL; L++) preload('dragon_' + L, `assets/dragon_${L}.png`);
['gold', 'ruby', 'essence'].forEach((n) => preload('icon_' + n, `assets/icon_${n}.png`));
preload('cauldron', 'assets/cauldron.png');

function dragonHTML(L, withLevel = true) {
  const d = DRAGONS[L - 1];
  const src = ASSETS['dragon_' + L];
  const inner = src
    ? `<img src="${src}" alt="${d.name}" draggable="false">`
    : `<span class="emoji" style="background:radial-gradient(circle at 35% 30%, ${d.color}, #2a1020)">${d.emoji}</span>`;
  return `<div class="dragon">${inner}${withLevel ? `<span class="lv">Sv ${L}</span>` : ''}</div>`;
}
function applyIcons() {
  document.querySelectorAll('[data-icon]').forEach((el) => {
    const src = ASSETS['icon_' + el.dataset.icon];
    if (src && !el.querySelector('img')) el.innerHTML = `<img src="${src}" alt="">`;
  });
  const c = $('cauldronImg');
  if (ASSETS.cauldron) { if (!c.querySelector('img')) c.innerHTML = `<img src="${ASSETS.cauldron}" alt="Kazan">`; }
  else c.textContent = '🌋';
}

// ---------- Ses ----------
let audioCtx = null;
function beep(freq = 520, dur = 0.12, type = 'sine', vol = 0.08) {
  if (!S.sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    o.connect(g).connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  } catch (e) { /* ses yok */ }
}
const sfx = {
  merge: () => { haptic('medium'); beep(520, .1, 'triangle'); setTimeout(() => beep(780, .15, 'triangle'), 80); },
  buy: () => { haptic('light'); beep(440, .08, 'square', .04); },
  coin: () => { haptic('light'); beep(988, .08, 'square', .04); setTimeout(() => beep(1319, .12, 'square', .04), 70); },
  error: () => { haptic('error'); beep(160, .18, 'sawtooth', .05); },
  level: () => { haptic('success'); [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, .15, 'triangle'), i * 90)); },
};

// ---------- UI: toast, modal, floater ----------
let toastTimer;
function toast(msg) {
  const t = $('toast');
  t.innerHTML = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}
const modalQueue = [];
const modalOpen = () => !$('modal').classList.contains('hidden');
function modal(title, body, actions = [{ label: 'Tamam', cls: 'primary' }]) {
  if (modalOpen()) { modalQueue.push([title, body, actions]); return; }
  $('modalTitle').innerHTML = title;
  $('modalBody').innerHTML = body;
  const box = $('modalActions');
  box.innerHTML = '';
  actions.forEach((a) => {
    const b = document.createElement('button');
    b.className = 'btn ' + (a.cls || 'primary');
    b.innerHTML = a.label;
    b.onclick = () => {
      closeModal();
      a.onClick && a.onClick();
      if (!modalOpen() && modalQueue.length) modal(...modalQueue.shift());
    };
    box.appendChild(b);
  });
  $('modal').classList.remove('hidden');
}
function closeModal() { $('modal').classList.add('hidden'); }
function floater(text, x, y, color) {
  const f = document.createElement('div');
  f.className = 'floater';
  f.textContent = text;
  f.style.left = x + 'px'; f.style.top = y + 'px';
  if (color) f.style.color = color;
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 1000);
}
function popEl(el) {
  if (!el) return;
  el.classList.add('pop');
  setTimeout(() => el.classList.remove('pop'), 480);
}
function floaterAt(el, text, color) {
  const r = el.getBoundingClientRect();
  floater(text, r.left + r.width / 2, r.top, color);
}

// ---------- Oyun mantığı ----------
function addXP(n) {
  S.xp += n;
  while (S.xp >= xpNeed(S.plvl)) {
    S.xp -= xpNeed(S.plvl);
    S.plvl++;
    const g = goldReward(0.25), r = 5;
    S.gold += g; S.rubies += r;
    sfx.level();
    setTimeout(() => modal('Seviye Atladın! 👑', `Artık <b>${S.plvl}. seviye</b> yuva bekçisisin.<br><br>Ödül: 🪙 ${fmt(g)} &nbsp; 💎 ${r}`), 300);
  }
}

function discover(L) {
  if (S.discovered.includes(L)) return;
  S.discovered.push(L);
  sfx.level();
  const extra = L === MAX_LVL ? '<br><br>🏆 <b>Kadim Ejderha\'ya ulaştın, efsanesin!</b>' : '';
  modal('Yeni Ejderha!', `${dragonHTML(L, false)}<p><b>${DRAGONS[L - 1].name}</b><br>Saatte ${fmt(prodOf(L))} ateş özü üretir.</p>${
    L - 3 >= 1 && L - 3 > maxBuyLevelBefore ? `<p>Artık dükkânda <b>${DRAGONS[L - 4].name}</b> satın alabilirsin!</p>` : ''}${extra}`);
}
let maxBuyLevelBefore = 1;

function buy() {
  const L = S.shopLevel;
  const price = priceOf(L);
  const idx = S.cells.findIndex((c, i) => c === 0 && i < S.unlocked);
  if (idx < 0) { sfx.error(); return toast('Yuva dolu! Ejderhaları birleştir ya da sat.'); }
  if (S.gold < price) { sfx.error(); return toast('Yeterli altının yok. Kazandaki özü sat!'); }
  S.gold -= price;
  S.bought[L] = (S.bought[L] || 0) + 1;
  S.cells[idx] = L;
  S.stats.eggs++;
  addXP(1);
  sfx.buy();
  renderAll();
  const cell = $('board').children[idx];
  cell && popEl(cell.firstChild);
}

function merge(from, to) {
  const L = S.cells[from];
  const nl = L + 1;
  maxBuyLevelBefore = maxBuyLevel();
  S.cells[to] = nl; S.cells[from] = 0;
  S.stats.merges++;
  const xp = nl * 3;
  if (nl > S.highest) {
    S.highest = nl;
    S.shopLevel = maxBuyLevel();
  }
  sfx.merge();
  renderAll();
  const cell = $('board').children[to];
  if (cell) { popEl(cell.firstChild); floaterAt(cell, `+${xp} XP`, '#d8a8ff'); }
  addXP(xp);
  discover(nl);
  save();
}

function sellDragon(i) {
  const L = S.cells[i];
  const v = sellValue(L);
  S.cells[i] = 0; S.gold += v;
  sfx.coin();
  renderAll();
  floaterAt($('sellZone'), `+${fmt(v)} 🪙`);
}

function sellEssence() {
  const e = Math.floor(S.essence);
  if (e < 1) { sfx.error(); return toast('Kazanda satılacak öz yok.'); }
  S.gold += e; S.essence -= e; S.stats.sells++;
  sfx.coin();
  floaterAt($('sellBtn'), `+${fmt(e)} 🪙`);
  renderAll(); save();
}

function upgradeCauldron() {
  const c = upgradeCostOf(S.cauldronLvl);
  if (S.gold < c) { sfx.error(); return toast('Yeterli altının yok.'); }
  S.gold -= c; S.cauldronLvl++;
  sfx.level(); addXP(5 * S.cauldronLvl);
  toast(`Kazan ${S.cauldronLvl}. seviye! Kapasite: ${fmt(capacity())}`);
  renderAll(); save();
}

function spendRubies(n) {
  if (S.rubies < n) { sfx.error(); toast('Yeterli yakutun yok. Görevleri ve çarkı dene!'); return false; }
  S.rubies -= n; return true;
}
function buyBoost() {
  if (!spendRubies(COST.boost)) return;
  S.boostUntil = Math.max(now(), S.boostUntil) + BOOST_MS;
  sfx.level(); toast('🔥 Üretim 30 dakika boyunca 2 katı!');
  renderAll(); save();
}
function instantHarvest() {
  if (S.essence >= capacity()) return toast('Kazan zaten dolu, önce sat!');
  if (!spendRubies(COST.harvest)) return;
  S.essence = Math.min(capacity(), S.essence + prodPerHour());
  sfx.coin(); renderAll(); save();
}

function unlockCell() {
  const k = S.unlocked - START_UNLOCKED;
  if (k >= UNLOCK_COST.length) return;
  const c = UNLOCK_COST[k];
  modal('Yeni Yuva Alanı', `Bu alanı açmak için <b>🪙 ${fmt(c)}</b> gerekiyor.`, [
    { label: 'Vazgeç', cls: 'ghost-btn' },
    { label: `Aç 🪙 ${fmt(c)}`, cls: 'gold', onClick: () => {
      if (S.gold < c) { sfx.error(); return toast('Yeterli altının yok.'); }
      S.gold -= c; S.unlocked++; sfx.level(); renderAll(); save();
    } },
  ]);
}

function giveFreeDragon() {
  const idx = S.cells.findIndex((c, i) => c === 0 && i < S.unlocked);
  const L = maxBuyLevel();
  if (idx < 0) { const g = Math.round(basePrice(L)); S.gold += g; return `Yuva dolu olduğu için 🪙 ${fmt(g)} aldın.`; }
  S.cells[idx] = L;
  return `<b>${DRAGONS[L - 1].name}</b> yuvana katıldı!`;
}

// ---------- Görevler ----------
function taskState(t) {
  const i = S.claimed[t.id] || 0;
  if (i >= t.targets.length) return { done: true };
  const target = t.targets[i];
  const v = t.val();
  return { i, target, v, ready: v >= target };
}
function claimTask(id) {
  const t = TASKS.find((x) => x.id === id);
  const st = taskState(t);
  if (!st.ready) return;
  const r = TASK_RUBIES[Math.min(st.i, TASK_RUBIES.length - 1)];
  const g = goldReward(0.5 + st.i * 0.25);
  S.rubies += r; S.gold += g;
  S.claimed[id] = st.i + 1;
  sfx.coin();
  toast(`Görev ödülü: 💎 ${r} &nbsp; 🪙 ${fmt(g)}`);
  addXP(10);
  renderAll(); save();
}
const anyTaskReady = () => TASKS.some((t) => taskState(t).ready);

// ---------- Çark ----------
let wheelRot = 0, spinning = false;
function drawWheel() {
  const cv = $('wheel'), ctx = cv.getContext('2d');
  const W = cv.width, R = W / 2, n = WHEEL.length, seg = (Math.PI * 2) / n;
  ctx.clearRect(0, 0, W, W);
  WHEEL.forEach((s, i) => {
    const a0 = -Math.PI / 2 + i * seg, a1 = a0 + seg;
    ctx.beginPath(); ctx.moveTo(R, R); ctx.arc(R, R, R - 4, a0, a1); ctx.closePath();
    ctx.fillStyle = s.color; ctx.fill();
    ctx.strokeStyle = '#ffc94a'; ctx.lineWidth = 4; ctx.stroke();
    ctx.save();
    ctx.translate(R, R); ctx.rotate(a0 + seg / 2);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '52px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
    ctx.fillText(s.icon, R * 0.68, 0);
    ctx.font = '800 34px "Baloo 2", sans-serif'; ctx.fillStyle = '#fff4e6';
    ctx.fillText(s.label, R * 0.4, 0);
    ctx.restore();
  });
  ctx.beginPath(); ctx.arc(R, R, 46, 0, Math.PI * 2);
  ctx.fillStyle = '#3a1d00'; ctx.fill(); ctx.strokeStyle = '#ffc94a'; ctx.lineWidth = 8; ctx.stroke();
  ctx.font = '50px "Segoe UI Emoji", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('🐉', R, R + 2);
}
function pickSegment() {
  const total = WHEEL.reduce((a, s) => a + s.w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < WHEEL.length; i++) { r -= WHEEL[i].w; if (r <= 0) return i; }
  return 0;
}
function spin(paid) {
  if (spinning) return;
  if (!paid && now() < S.nextFreeSpin) return;
  if (paid && !spendRubies(COST.spin)) return;
  if (!paid) S.nextFreeSpin = now() + FREE_SPIN_MS;
  spinning = true;
  const idx = pickSegment();
  const seg = 360 / WHEEL.length;
  const targetAngle = 360 - (idx * seg + seg / 2) + (Math.random() - 0.5) * seg * 0.6;
  const cur = ((wheelRot % 360) + 360) % 360;
  wheelRot += 360 * 6 + ((targetAngle - cur + 360) % 360);
  $('wheel').style.transform = `rotate(${wheelRot}deg)`;
  let ticks = 0;
  const tickTimer = setInterval(() => { if (ticks++ < 30) beep(900 + Math.random() * 200, .03, 'square', .02); }, 120);
  renderAll(); save();
  setTimeout(() => {
    clearInterval(tickTimer);
    spinning = false;
    S.stats.spins++;
    const s = WHEEL[idx];
    let msg = '';
    if (s.type === 'gold') { const g = goldReward(s.mult); S.gold += g; msg = `🪙 <b>${fmt(g)}</b> altın kazandın!`; }
    else if (s.type === 'ruby') { S.rubies += s.n; msg = `💎 <b>${s.n}</b> yakut kazandın!`; }
    else if (s.type === 'boost') { S.boostUntil = Math.max(now(), S.boostUntil) + BOOST_MS; msg = '🔥 30 dakika <b>2× üretim</b> kazandın!'; }
    else if (s.type === 'egg') { msg = giveFreeDragon(); }
    sfx.level();
    modal('Çark Ödülü', msg);
    renderAll(); save();
  }, 4300);
}

// ---------- Sürükle & bırak ----------
let drag = null;
function onPointerDown(e) {
  const cell = e.target.closest('.cell');
  if (!cell || spinning) return;
  const i = +cell.dataset.i;
  if (i >= S.unlocked) return unlockCell();
  const L = S.cells[i];
  if (!L) return;
  e.preventDefault();
  drag = { from: i, x0: e.clientX, y0: e.clientY, moved: false, ghost: null, over: null };
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
}
function onPointerMove(e) {
  if (!drag) return;
  const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
  if (!drag.moved && Math.hypot(dx, dy) < 8) return;
  if (!drag.moved) {
    drag.moved = true;
    const L = S.cells[drag.from];
    const g = document.createElement('div');
    g.className = 'ghost';
    g.innerHTML = dragonHTML(L);
    document.body.appendChild(g);
    drag.ghost = g;
    const cells = $('board').children;
    cells[drag.from].classList.add('dragging');
    S.cells.forEach((c, j) => { if (j !== drag.from && c === L && L < MAX_LVL) cells[j].classList.add('match'); });
  }
  drag.ghost.style.left = e.clientX + 'px';
  drag.ghost.style.top = e.clientY + 'px';
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const over = el && (el.closest('.cell') || el.closest('#sellZone'));
  if (over !== drag.over) {
    drag.over && drag.over.classList.remove('hover');
    over && over.classList.add('hover');
    drag.over = over;
  }
}
function onPointerUp() {
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
  window.removeEventListener('pointercancel', onPointerUp);
  if (!drag) return;
  const d = drag; drag = null;
  d.ghost && d.ghost.remove();
  document.querySelectorAll('.cell, #sellZone').forEach((c) => c.classList.remove('hover', 'match', 'dragging'));
  const from = d.from, L = S.cells[from];
  if (!d.moved) {
    return toast(`<b>${DRAGONS[L - 1].name}</b> · Sv ${L}<br>🔥 ${fmt(prodOf(L))}/sa · aynısıyla birleştir!`);
  }
  if (!d.over) return renderGrid();
  if (d.over.id === 'sellZone') {
    if (S.cells.filter(Boolean).length <= 1) { sfx.error(); return toast('Son ejderhanı satamazsın!'); }
    return modal('Ejderhayı Sat?', `${dragonHTML(L)}<p><b>${DRAGONS[L - 1].name}</b> için 🪙 <b>${fmt(sellValue(L))}</b> alırsın.</p>`, [
      { label: 'Vazgeç', cls: 'ghost-btn' },
      { label: 'Sat', cls: 'gold', onClick: () => sellDragon(from) },
    ]);
  }
  const to = +d.over.dataset.i;
  if (to === from) return renderGrid();
  if (to >= S.unlocked) { sfx.error(); return renderGrid(); }
  const T = S.cells[to];
  if (T === L && L < MAX_LVL) return merge(from, to);
  S.cells[to] = L; S.cells[from] = T;   // taşı ya da yer değiştir
  renderGrid(); save();
}

// ---------- Çizim ----------
function renderGrid() {
  const b = $('board');
  if (b.children.length !== BOARD_SIZE) {
    b.innerHTML = '';
    for (let i = 0; i < BOARD_SIZE; i++) {
      const c = document.createElement('div');
      c.className = 'cell'; c.dataset.i = i;
      b.appendChild(c);
    }
  }
  const nextLock = S.unlocked;
  [...b.children].forEach((c, i) => {
    const L = S.cells[i];
    let html, key;
    if (i >= S.unlocked) {
      key = 'lock' + (i === nextLock);
      html = i === nextLock ? `<span class="lock">🔒</span><b>${fmt(UNLOCK_COST[i - START_UNLOCKED])}</b>` : '<span class="lock">🔒</span>';
      c.classList.add('locked');
    } else {
      c.classList.remove('locked');
      key = 'd' + L + (ASSETS['dragon_' + L] ? 'i' : 'e');
      html = L ? dragonHTML(L) : '';
    }
    if (c.dataset.key !== key) { c.innerHTML = html; c.dataset.key = key; }
  });
}
function renderShop() {
  const max = maxBuyLevel();
  if (S.shopLevel > max) S.shopLevel = max;
  if (S.shopLevel < 1) S.shopLevel = 1;
  const L = S.shopLevel;
  const key = L + (ASSETS['dragon_' + L] ? 'i' : 'e');
  if ($('shopDragon').dataset.key !== key) {
    $('shopDragon').dataset.key = key;
    $('shopDragon').innerHTML = dragonHTML(L);
    $('shopName').textContent = DRAGONS[L - 1].name;
    $('shopProd').textContent = `🔥 ${fmt(prodOf(L))}/sa`;
  }
  $('buyPrice').textContent = fmt(priceOf(L));
  $('buyBtn').disabled = S.gold < priceOf(L);
  $('shopPrev').disabled = L <= 1;
  $('shopNext').disabled = L >= max;
}
function renderTop() {
  $('gold').textContent = fmt(S.gold);
  $('rubies').textContent = fmt(S.rubies);
  $('plvl').textContent = S.plvl;
  const need = xpNeed(S.plvl);
  $('xpfill').style.width = (100 * S.xp / need) + '%';
  $('xptext').textContent = `${fmt(S.xp)}/${fmt(need)} XP`;
  $('prod').textContent = fmt(prodPerHour());
  $('boostTag').classList.toggle('hidden', !boosted());
  const cap = capacity(), pct = Math.min(100, 100 * S.essence / cap);
  $('miniFill').style.width = pct + '%';
  $('miniText').textContent = `🔥 ${fmt(S.essence)} / ${fmt(cap)}`;
  const full = S.essence >= cap;
  $('miniCauldron').classList.toggle('full', full);
  $('dotKazan').classList.toggle('hidden', !full);
  $('dotCark').classList.toggle('hidden', now() < S.nextFreeSpin);
  $('dotGorev').classList.toggle('hidden', !anyTaskReady());
}
function renderKazan() {
  const cap = capacity(), full = S.essence >= cap;
  $('bigFill').style.width = Math.min(100, 100 * S.essence / cap) + '%';
  $('bigText').textContent = `🔥 ${fmt(S.essence)} / ${fmt(cap)}`;
  $('cauldronLvl').textContent = `Seviye ${S.cauldronLvl}`;
  document.querySelector('.cauldron-stage').classList.toggle('full', full);
  const p = prodPerHour();
  $('cauldronHint').innerHTML = full
    ? '⚠️ Kazan dolu, üretim durdu! Hemen sat.'
    : p > 0 ? `Dolmasına <b>${fmtTime((cap - S.essence) / p * 3600000)}</b> kaldı` : 'Ejderha olmadan üretim olmaz!';
  $('sellBtn').innerHTML = `Ateş Özünü Sat &nbsp;→&nbsp; 🪙 ${fmt(S.essence)}`;
  $('sellBtn').disabled = S.essence < 1;
  const uc = upgradeCostOf(S.cauldronLvl);
  $('upgradeInfo').textContent = `Kapasite ${fmt(cap)} → ${fmt(capOf(S.cauldronLvl + 1))}`;
  $('upgradeCost').textContent = fmt(uc);
  $('upgradeBtn').disabled = S.gold < uc;
  $('boostInfo').textContent = boosted() ? `Aktif: ${fmtTime(S.boostUntil - now())}` : '30 dakika';
  $('boostBtn').disabled = S.rubies < COST.boost;
  $('harvestBtn').disabled = S.rubies < COST.harvest || full;
}
function renderSpin() {
  const left = S.nextFreeSpin - now();
  $('spinBtn').disabled = spinning || left > 0;
  $('spinBtn').textContent = left > 0 ? `Ücretsiz çevirme: ${fmtTime(left)}` : 'Ücretsiz Çevir!';
  $('paidSpinBtn').disabled = spinning || S.rubies < COST.spin;
  $('spinInfo').innerHTML = `Altın ödülleri saatlik üretimine göre: şu an <b>1 sa = 🪙 ${fmt(goldReward(1))}</b>`;
}
function renderTasks() {
  $('tasks').innerHTML = TASKS.map((t) => {
    const st = taskState(t);
    if (st.done) return `<div class="task done"><span class="task-ico">${t.icon}</span><div class="task-main"><div class="task-name">${t.name}</div><div class="task-desc">Tamamlandı ✔</div></div></div>`;
    const pct = Math.min(100, 100 * st.v / st.target);
    const r = TASK_RUBIES[Math.min(st.i, TASK_RUBIES.length - 1)];
    return `<div class="task"><span class="task-ico">${t.icon}</span><div class="task-main">
      <div class="task-name">${t.name} <small style="color:var(--muted)">${st.i + 1}/${t.targets.length}</small></div>
      <div class="task-desc">${t.desc(st.target)} · ${fmt(Math.min(st.v, st.target))}/${fmt(st.target)}</div>
      <div class="task-bar"><div style="width:${pct}%"></div></div></div>
      <button class="btn ${st.ready ? 'gold' : 'ghost-btn'}" data-claim="${t.id}" ${st.ready ? '' : 'disabled'}>💎 ${r}</button></div>`;
  }).join('');
}
function renderBook() {
  $('bookInfo').textContent = `${S.discovered.length} / ${MAX_LVL} ejderha keşfedildi`;
  $('book').innerHTML = DRAGONS.map((d, i) => {
    const L = i + 1, known = S.discovered.includes(L);
    return `<div class="page ${known ? '' : 'unknown'}">${dragonHTML(L, false)}
      <div class="page-name">${known ? d.name : '???'}</div>
      <div class="page-prod">Sv ${L}${known ? ` · 🔥 ${fmt(prodOf(L))}/sa` : ''}</div></div>`;
  }).join('');
}
let currentTab = 'yuva';
function renderAll() {
  applyIcons();
  renderTop();
  renderGrid();
  renderShop();
  if (currentTab === 'kazan') renderKazan();
  if (currentTab === 'cark') renderSpin();
  if (currentTab === 'gorev') renderTasks();
  if (currentTab === 'kitap') renderBook();
}
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === 'view-' + tab));
  renderAll();
}

// ---------- Ana döngü ----------
let last = now();
function tick() {
  const t = now(), dt = (t - last) / 1000;
  last = t;
  const cap = capacity();
  if (S.essence < cap) S.essence = Math.min(cap, S.essence + prodPerHour() * dt / 3600);
  renderTop();
  renderShop();
  if (currentTab === 'kazan') renderKazan();
  if (currentTab === 'cark') renderSpin();
}

function offlineProgress() {
  const away = now() - (S.lastTick || now());
  if (away < 60000) return;
  // boost'un çevrimdışı süresini adil hesapla
  const base = prodPerHour() / (boosted() ? 2 : 1);
  const boostMs = Math.max(0, Math.min(away, S.boostUntil - S.lastTick));
  const made = base * (away + boostMs) / 3600000;
  const before = S.essence;
  S.essence = Math.min(capacity(), S.essence + made);
  const gained = S.essence - before;
  if (gained >= 1) {
    const full = S.essence >= capacity();
    modal('Tekrar Hoş Geldin! 🐉', `Sen <b>${fmtTime(away)}</b> yokken ejderhaların<br>🔥 <b>${fmt(gained)}</b> ateş özü üretti.${
      full ? '<br><br>⚠️ Kazan doldu ve üretim durdu. Daha sık uğra ya da kazanı büyüt!' : ''}`,
      [{ label: 'Kazana Git', cls: 'primary', onClick: () => switchTab('kazan') }]);
  }
}

function tutorial() {
  if (S.tutorialDone) return;
  S.tutorialDone = true;
  modal('Ejderha Yuvası\'na Hoş Geldin! 🐉',
    `<p style="text-align:left;line-height:1.5">
    🥚 <b>Satın al:</b> Dükkândan yumurta al.<br>
    ✨ <b>Birleştir:</b> Aynı seviyedeki iki ejderhayı üst üste sürükle, daha güçlüsü doğsun.<br>
    🔥 <b>Üret:</b> Ejderhalar sürekli ateş özü üretir, öz kazanda birikir.<br>
    🪙 <b>Sat:</b> Kazan dolmadan özü sat, altınla yeni yumurtalar al.<br>
    📖 <b>Hedef:</b> 12 ejderhanın hepsini keşfet!</p>`,
    [{ label: 'Hadi Başlayalım!', cls: 'primary' }]);
}

// ---------- Olaylar ----------
function bind() {
  $('board').addEventListener('pointerdown', onPointerDown);
  $('buyBtn').onclick = buy;
  $('shopPrev').onclick = () => { S.shopLevel--; renderShop(); };
  $('shopNext').onclick = () => { S.shopLevel++; renderShop(); };
  $('sellBtn').onclick = sellEssence;
  $('upgradeBtn').onclick = upgradeCauldron;
  $('boostBtn').onclick = buyBoost;
  $('harvestBtn').onclick = instantHarvest;
  $('spinBtn').onclick = () => spin(false);
  $('paidSpinBtn').onclick = () => spin(true);
  $('miniCauldron').onclick = () => switchTab('kazan');
  $('tasks').addEventListener('click', (e) => { const b = e.target.closest('[data-claim]'); if (b) claimTask(b.dataset.claim); });
  document.querySelectorAll('.tab').forEach((t) => (t.onclick = () => switchTab(t.dataset.tab)));
  document.querySelectorAll('[data-help]').forEach((b) => (b.onclick = () => modal('Nasıl Çalışır?', `<p style="text-align:left">${HELP[b.dataset.help]}</p>`)));
  $('settingsBtn').onclick = () => modal('Ayarlar', `<p>Ses: <b>${S.sound ? 'Açık' : 'Kapalı'}</b></p>`, [
    { label: S.sound ? '🔇 Sesi Kapat' : '🔊 Sesi Aç', cls: 'ghost-btn', onClick: () => { S.sound = !S.sound; save(); } },
    { label: 'İlerlemeyi Sıfırla', cls: 'ruby', onClick: () => modal('Emin misin?', 'Tüm ilerlemen silinecek. Bu geri alınamaz.', [
      { label: 'Vazgeç', cls: 'ghost-btn' },
      { label: 'Evet, Sıfırla', cls: 'ruby', onClick: () => { localStorage.removeItem(SAVE_KEY); S = freshState(); wheelRot = 0; save(true); renderAll(); tutorial(); } },
    ]) },
    { label: 'Kapat', cls: 'primary' },
  ]);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(true); else { last = now(); } });
  window.addEventListener('beforeunload', () => save(true));
}

async function start() {
  setupTelegram();
  $('pname').textContent = playerName();
  // Telegram bulutundaki kayıt daha yeniyse onu kullan (başka cihazda oynanmış olabilir)
  const cloud = await cloudLoad();
  if (cloud && (cloud.lastTick || 0) > (S.lastTick || 0)) S = Object.assign(freshState(), cloud);
  bind();
  drawWheel();
  if (document.fonts) document.fonts.ready.then(drawWheel);
  offlineProgress();
  last = now();
  renderAll();
  tutorial();
  setInterval(tick, 250);
  setInterval(save, 5000);
}
start();
