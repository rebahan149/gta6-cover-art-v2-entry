// PALM RIOT Cover Studio — the editor.
//
// Wires the page to the renderer in ./cover.js: a photo tray (bundled samples plus the visitor's
// own photos, read locally and never uploaded), panel selection with drag-to-pan and scroll-to-zoom
// crops, layout / grade / lettering controls, callout sticker editing, poster-furniture toggles and
// one-click PNG export at the three post sizes. A `?shot=` query hands control to ./shots.js, which
// stages a fixed scene for the entry's screenshots instead.
import {
  SIZES,
  drawCover,
  defaultState,
  layoutPolys,
  panelAt,
  syncPanels,
} from './cover.js';
import { runShot, sceneFor } from './shots.js';

const SAMPLES = [
  { name: 'boulevard', label: 'Boulevard' },
  { name: 'pier', label: 'Pier' },
  { name: 'neon', label: 'Neon' },
  { name: 'marina', label: 'Marina' },
];

const canvas = document.getElementById('cover');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
const $ = (id) => document.getElementById(id);

let images = []; // [{ img, label }] — the tray, in order; panels point into it by index
let state = defaultState(SAMPLES.length);
let selected = 0;
let shotMode = null;

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadSamples() {
  images = [];
  for (const sample of SAMPLES) {
    const img = await loadImage(`samples/${sample.name}.jpg`);
    images.push({ img, label: sample.label });
  }
}

function redraw() {
  drawCover(ctx, canvas.width, canvas.height, state, images.map((e) => e.img));
  if (shotMode !== 'cover') drawSelection();
}

function drawSelection() {
  const polys = layoutPolys(state.layout);
  const poly = polys[selected];
  if (!poly) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.save();
  ctx.strokeStyle = '#ffd23e';
  ctx.lineWidth = Math.max(3, w * 0.004);
  ctx.setLineDash([w * 0.016, w * 0.011]);
  ctx.beginPath();
  poly.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x * w, y * h) : ctx.lineTo(x * w, y * h)));
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function setSize(name) {
  state.size = name;
  const [w, h] = SIZES[name];
  canvas.width = w;
  canvas.height = h;
  redraw();
}

// ---------------------------------------------------------------- tray

function renderTray() {
  const tray = $('tray');
  tray.innerHTML = '';
  const activePhoto = state.mode === 'span' ? state.panels[0]?.photo : state.panels[selected]?.photo;
  images.forEach((entry, i) => {
    const fig = document.createElement('figure');
    if (i === activePhoto) fig.classList.add('active');
    const img = document.createElement('img');
    img.src = entry.img.src;
    img.alt = entry.label;
    const cap = document.createElement('figcaption');
    cap.textContent = entry.label;
    fig.append(img, cap);
    fig.addEventListener('click', () => {
      if (state.mode === 'span') state.panels[0].photo = i;
      else if (state.panels[selected]) state.panels[selected].photo = i;
      renderTray();
      redraw();
    });
    tray.append(fig);
  });
}

// ---------------------------------------------------------------- panel controls

function selectPanel(i) {
  if (i < 0 || i >= state.panels.length) return;
  selected = i;
  const place = state.panels[i];
  $('panel-name').textContent = `Panel ${i + 1} of ${state.panels.length}`;
  $('zoom').value = Math.round(place.zoom * 100);
  $('smart').checked = place.smart;
  $('pop').checked = place.pop;
  $('cast').value = place.cast;
  renderTray();
  redraw();
}

function bindPanelControls() {
  $('zoom').addEventListener('input', () => {
    state.panels[selected].zoom = Number($('zoom').value) / 100;
    redraw();
  });
  $('smart').addEventListener('change', () => {
    state.panels[selected].smart = $('smart').checked;
    redraw();
  });
  $('pop').addEventListener('change', () => {
    state.panels[selected].pop = $('pop').checked;
    redraw();
  });
  $('cast').addEventListener('input', () => {
    state.panels[selected].cast = $('cast').value;
    redraw();
  });
}

// ---------------------------------------------------------------- canvas gestures

function bindGestures() {
  let drag = null;
  const toCanvas = (e) => {
    const rect = canvas.getBoundingClientRect();
    return [
      ((e.clientX - rect.left) / rect.width) * canvas.width,
      ((e.clientY - rect.top) / rect.height) * canvas.height,
    ];
  };
  canvas.addEventListener('pointerdown', (e) => {
    const [x, y] = toCanvas(e);
    const hit = panelAt(state.layout, canvas.width, canvas.height, x, y);
    if (hit >= 0 && hit !== selected) selectPanel(hit);
    const place = state.panels[selected];
    if (!place) return;
    drag = { x, y, ox: place.ox, oy: place.oy };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const [x, y] = toCanvas(e);
    const place = state.panels[selected];
    const clamp = (v) => Math.min(1, Math.max(0, v));
    place.ox = clamp(drag.ox - (x - drag.x) / (canvas.width * 0.55));
    place.oy = clamp(drag.oy - (y - drag.y) / (canvas.height * 0.55));
    redraw();
  });
  const end = () => { drag = null; };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const [x, y] = toCanvas(e);
    const hit = panelAt(state.layout, canvas.width, canvas.height, x, y);
    if (hit >= 0 && hit !== selected) selectPanel(hit);
    const place = state.panels[selected];
    if (!place) return;
    place.zoom = Math.min(3.2, Math.max(1, place.zoom * Math.exp(-e.deltaY * 0.0012)));
    $('zoom').value = Math.round(place.zoom * 100);
    redraw();
  }, { passive: false });
}

// ---------------------------------------------------------------- callouts

function renderCallouts() {
  const box = $('callouts');
  box.innerHTML = '';
  state.callouts.forEach((callout, i) => {
    const row = document.createElement('div');
    row.className = 'callout-row';
    const text = document.createElement('input');
    text.type = 'text';
    text.maxLength = 22;
    text.value = callout.text;
    text.addEventListener('input', () => { callout.text = text.value; redraw(); });
    const color = document.createElement('select');
    for (const name of ['sun', 'pink', 'teal', 'bone']) {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      if (callout.color === name) opt.selected = true;
      color.append(opt);
    }
    color.addEventListener('change', () => { callout.color = color.value; redraw(); });
    const del = document.createElement('button');
    del.type = 'button';
    del.textContent = '✕';
    del.addEventListener('click', () => {
      state.callouts.splice(i, 1);
      renderCallouts();
      redraw();
    });
    row.append(text, color, del);
    box.append(row);
  });
}

// ---------------------------------------------------------------- control bindings

function syncControls() {
  $('layout').value = state.layout;
  $('mode').value = state.mode;
  $('grade').value = state.grade;
  $('title').value = state.title;
  $('kicker').value = state.kicker;
  $('title-pos').value = state.titlePos;
  $('title-fill').value = state.titleFill;
  $('opt-glow').checked = state.glow;
  $('opt-grain').checked = state.grain;
  $('opt-halftone').checked = state.halftone;
  $('opt-seal').checked = state.seal;
  $('opt-billing').checked = state.billing;
  $('opt-rating').checked = state.rating;
  $('opt-barcode').checked = state.barcode;
  $('opt-casttags').checked = state.castTags;
  renderTray();
  renderCallouts();
  selectPanel(Math.min(selected, state.panels.length - 1));
}

function bindControls() {
  $('layout').addEventListener('change', () => {
    state.layout = $('layout').value;
    syncPanels(state, images.length);
    selectPanel(Math.min(selected, state.panels.length - 1));
    redraw();
  });
  $('mode').addEventListener('change', () => { state.mode = $('mode').value; renderTray(); redraw(); });
  $('grade').addEventListener('change', () => { state.grade = $('grade').value; redraw(); });
  $('title').addEventListener('input', () => { state.title = $('title').value; redraw(); });
  $('kicker').addEventListener('input', () => { state.kicker = $('kicker').value; redraw(); });
  $('title-pos').addEventListener('change', () => { state.titlePos = $('title-pos').value; redraw(); });
  $('title-fill').addEventListener('change', () => { state.titleFill = $('title-fill').value; redraw(); });
  const toggles = [
    ['opt-glow', 'glow'], ['opt-grain', 'grain'], ['opt-halftone', 'halftone'],
    ['opt-seal', 'seal'], ['opt-billing', 'billing'], ['opt-rating', 'rating'],
    ['opt-barcode', 'barcode'], ['opt-casttags', 'castTags'],
  ];
  for (const [id, key] of toggles) {
    $(id).addEventListener('change', () => { state[key] = $(id).checked; redraw(); });
  }
  $('add-callout').addEventListener('click', () => {
    state.callouts.push({ x: 0.5, y: 0.46, rot: -4, text: 'NEW HEAT!', color: 'teal' });
    renderCallouts();
    redraw();
  });
  $('upload').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    for (const file of files) {
      const img = await loadImage(URL.createObjectURL(file));
      images.push({ img, label: file.name.replace(/\.[^.]+$/, '').slice(0, 14) || 'Photo' });
      if (state.mode === 'panels' && state.panels[selected]) {
        state.panels[selected].photo = images.length - 1;
      }
    }
    if (files.length) status.textContent = `${files.length} photo(s) added — they never leave this machine.`;
    renderTray();
    redraw();
  });
  const exportAt = (name) => () => {
    setSize(name);
    canvas.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `palm-riot-${name}.png`;
      a.click();
      const [w, h] = SIZES[name];
      status.textContent = `Saved palm-riot-${name}.png (${w} × ${h})`;
    }, 'image/png');
  };
  $('exp-square').addEventListener('click', exportAt('square'));
  $('exp-portrait').addEventListener('click', exportAt('portrait'));
  $('exp-wide').addEventListener('click', exportAt('wide'));
}

// ---------------------------------------------------------------- shot scenes

const api = {
  async prepareScene(query) {
    await loadSamples();
    const scene = sceneFor(query.get('scene') ?? 'sunset');
    const { panels: scenePanels, callouts: sceneCallouts, ...rest } = scene;
    state = { ...defaultState(images.length), ...rest };
    syncPanels(state, images.length);
    if (scenePanels) {
      scenePanels.forEach((p, i) => { if (state.panels[i]) Object.assign(state.panels[i], p); });
    }
    if (sceneCallouts) state.callouts = sceneCallouts;
    selected = 0;
    syncControls();
    setSize(state.size);
    selectPanel(0);
  },
  redraw,
};

// ---------------------------------------------------------------- boot

const query = new URLSearchParams(location.search);
shotMode = query.get('shot');
bindControls();
bindPanelControls();
bindGestures();
if (shotMode) {
  runShot(query, api);
} else {
  loadSamples().then(() => {
    syncControls();
    setSize('square');
    selectPanel(0);
    status.textContent = 'Samples loaded — make it yours.';
  });
}
