// PALM RIOT Cover Studio — the cover renderer.
//
// Everything a Palm Riot cover is made of lives here: six panel layouts (unit-space polygons the
// editor and the exporter share), six colour grades, per-panel photo placement with pan / zoom /
// smart crop, a pop-out layer that breaks a photo out of its frame, title lettering drawn OVER the
// art, comic callout stickers, cast tags, and the poster furniture (seal, billing block, rating
// box, barcode) plus grain, halftone and vignette finishes. Pure canvas, no libraries, and fully
// deterministic: the grain and the barcode derive from fixed seeds, never from the clock.

export const SIZES = {
  square: [1080, 1080],
  portrait: [1080, 1350],
  wide: [1920, 1080],
};

export const GRADES = {
  vice: {
    label: 'Vice Sunset',
    filter: 'saturate(1.35) contrast(1.12) brightness(1.06)',
    wash: ['rgba(255, 94, 58, 0.20)', 'rgba(255, 61, 126, 0.30)'],
    glow: '#ff9a3e',
  },
  heatwave: {
    label: 'Heatwave Dusk',
    filter: 'saturate(1.5) contrast(1.1) brightness(1.08) hue-rotate(-12deg)',
    wash: ['rgba(255, 70, 40, 0.22)', 'rgba(190, 20, 80, 0.32)'],
    glow: '#ff7847',
  },
  neon: {
    label: 'Neon Nights',
    filter: 'saturate(1.55) contrast(1.22) brightness(1.02) hue-rotate(-6deg)',
    wash: ['rgba(120, 0, 180, 0.18)', 'rgba(0, 160, 255, 0.22)'],
    glow: '#ff4fd8',
  },
  golden: {
    label: 'Golden Hour',
    filter: 'sepia(0.28) saturate(1.25) contrast(1.05) brightness(1.09)',
    wash: ['rgba(255, 170, 60, 0.20)', 'rgba(160, 60, 20, 0.22)'],
    glow: '#ffd27a',
  },
  teal: {
    label: 'Midnight Teal',
    filter: 'saturate(1.15) contrast(1.16) brightness(0.97) hue-rotate(10deg)',
    wash: ['rgba(0, 60, 80, 0.25)', 'rgba(0, 16, 40, 0.36)'],
    glow: '#19d3c5',
  },
  ink: {
    label: 'Poster Ink',
    filter: 'contrast(1.32) saturate(0.8) brightness(1.04)',
    wash: ['rgba(20, 20, 40, 0.10)', 'rgba(0, 0, 0, 0.28)'],
    glow: '#ffb35c',
    halftone: true,
  },
};

export const CALLOUT_COLORS = {
  sun: { bg: '#ffd23e', ink: '#241335' },
  pink: { bg: '#ff3d7e', ink: '#ffffff' },
  teal: { bg: '#19d3c5', ink: '#06302c' },
  bone: { bg: '#f7f1e1', ink: '#241335' },
};

const CAST_DEFAULTS = ['RAY SOLANO', 'VESPER LANE', 'DREX MARLOWE', 'LUNA CASTILLO', 'MARCO VANE', 'IVY SOL'];

// ---------------------------------------------------------------- layouts
// Panel polygons in unit space ([0..1] x [0..1]); the renderer scales them to the canvas. Slanted
// edges are deliberate: diagonal cuts are what make a collage read as key art instead of a grid.

export function layoutPolys(layout) {
  switch (layout) {
    case 'hero':
      return [
        [[0, 0], [1, 0], [1, 0.52], [0, 0.58]],
        [[0, 0.58], [0.34, 0.545], [0.34, 1], [0, 1]],
        [[0.34, 0.545], [0.67, 0.53], [0.67, 1], [0.34, 1]],
        [[0.67, 0.53], [1, 0.52], [1, 1], [0.67, 1]],
      ];
    case 'grid': {
      const polys = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 2; c++) {
          const x0 = c * 0.5, x1 = x0 + 0.5, y0 = r / 3, y1 = y0 + 1 / 3;
          polys.push([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
        }
      }
      return polys;
    }
    case 'slant': {
      const polys = [];
      const edges = [0, 0.21, 0.42, 0.63, 0.83, 1];
      for (let i = 0; i < 5; i++) {
        const drop = i % 2 === 0 ? 0.055 : -0.015;
        polys.push([[0, edges[i]], [1, edges[i] + drop], [1, edges[i + 1] + drop], [0, edges[i + 1]]]);
      }
      return polys;
    }
    case 'mosaic':
      return [
        [[0, 0], [0.55, 0], [0.55, 1], [0, 1]],
        [[0.55, 0], [1, 0], [1, 0.38], [0.55, 0.44]],
        [[0.55, 0.44], [1, 0.38], [1, 0.7], [0.55, 0.74]],
        [[0.55, 0.74], [0.775, 0.72], [0.775, 1], [0.55, 1]],
        [[0.775, 0.72], [1, 0.7], [1, 1], [0.775, 1]],
      ];
    case 'skyline': {
      const top = (x) => 0.54 - 0.08 * x;
      const polys = [[[0, 0], [1, 0], [1, top(1)], [0, top(0)]]];
      const cuts = [0, 0.25, 0.5, 0.75, 1];
      for (let i = 0; i < 4; i++) {
        polys.push([[cuts[i], top(cuts[i])], [cuts[i + 1], top(cuts[i + 1])], [cuts[i + 1], 1], [cuts[i], 1]]);
      }
      return polys;
    }
    case 'popout':
    default:
      return [
        [[0, 0], [0.58, 0], [0.54, 1], [0, 1]],
        [[0.58, 0], [1, 0], [1, 0.36], [0.565, 0.38]],
        [[0.565, 0.38], [1, 0.36], [1, 0.68], [0.555, 0.7]],
        [[0.555, 0.7], [1, 0.68], [1, 1], [0.54, 1]],
      ];
  }
}

export function panelCount(layout) {
  return layoutPolys(layout).length;
}

// ---------------------------------------------------------------- state

export function defaultPanel(index, photoCount) {
  return {
    photo: photoCount > 0 ? index % photoCount : 0,
    zoom: 1,
    ox: 0.5,
    oy: 0.5,
    smart: false,
    pop: false,
    cast: CAST_DEFAULTS[index % CAST_DEFAULTS.length],
  };
}

export function defaultState(photoCount = 4) {
  const state = {
    size: 'square',
    layout: 'popout',
    mode: 'panels',
    grade: 'vice',
    title: 'SUNSET HEIST',
    kicker: 'ONE CREW · ONE SCORE · NO BRAKES',
    titlePos: 'top',
    titleFill: 'sunset',
    panels: [],
    callouts: [
      { x: 0.155, y: 0.335, rot: -8, text: 'NO BRAKES!', color: 'sun' },
      { x: 0.845, y: 0.585, rot: 6, text: 'VICE CITY HEAT', color: 'pink' },
    ],
    glow: true,
    grain: true,
    halftone: false,
    seal: true,
    billing: true,
    rating: true,
    barcode: true,
    castTags: true,
  };
  syncPanels(state, photoCount);
  state.panels[0].pop = true;
  return state;
}

/** Grows or trims state.panels to the layout's panel count, keeping existing placements. */
export function syncPanels(state, photoCount) {
  const count = panelCount(state.layout);
  while (state.panels.length < count) state.panels.push(defaultPanel(state.panels.length, photoCount));
  state.panels.length = count;
}

// ---------------------------------------------------------------- geometry helpers

function scalePoly(poly, w, h) {
  return poly.map(([x, y]) => [x * w, y * h]);
}

function pathPoly(ctx, poly) {
  ctx.beginPath();
  poly.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
}

function bbox(poly) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of poly) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y);
    x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Which panel of `layout` (at canvas size w x h) contains the point, or -1. */
export function panelAt(layout, w, h, x, y) {
  const polys = layoutPolys(layout).map((p) => scalePoly(p, w, h));
  for (let i = polys.length - 1; i >= 0; i--) {
    if (pointInPoly(x, y, polys[i])) return i;
  }
  return -1;
}

// ---------------------------------------------------------------- photo placement

/** Draws img covering rect (cover-fit) with the placement's zoom and focal point. */
function drawPhotoCover(ctx, img, rect, place) {
  const scale0 = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const scale = scale0 * place.zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  let fx = place.ox;
  let fy = place.oy;
  if (place.smart) fy = Math.min(fy, 0.22); // faces live in the upper third: bias the crop upward
  const x = rect.x - fx * (dw - rect.w);
  const y = rect.y - fy * (dh - rect.h);
  ctx.drawImage(img, x, y, dw, dh);
}

function drawPanelPhoto(ctx, img, poly, place, filter) {
  ctx.save();
  pathPoly(ctx, poly);
  ctx.clip();
  ctx.filter = filter;
  drawPhotoCover(ctx, img, bbox(poly), place);
  ctx.filter = 'none';
  ctx.restore();
}

/**
 * The pop-out layer: the panel's photo again, larger and lifted above its frame, white-bordered
 * with a soft shadow — the subject breaks out of the panel instead of sitting inside it.
 */
function drawPopOut(ctx, img, poly, place, filter, wash) {
  const bb = bbox(poly);
  const grow = 1.18;
  const rect = {
    x: bb.x - (bb.w * (grow - 1)) / 2,
    y: bb.y - bb.h * (grow - 1),
    w: bb.w * grow,
    h: bb.h * grow,
  };
  ctx.save();
  ctx.shadowColor = 'rgba(5, 0, 12, 0.6)';
  ctx.shadowBlur = rect.w * 0.06;
  ctx.shadowOffsetY = rect.h * 0.03;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(rect.x - 7, rect.y - 7, rect.w + 14, rect.h + 14);
  ctx.shadowColor = 'transparent';
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.filter = filter;
  drawPhotoCover(ctx, img, rect, place);
  ctx.filter = 'none';
  const tint = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  tint.addColorStop(0, wash[0]);
  tint.addColorStop(0.45, 'rgba(0, 0, 0, 0)');
  tint.addColorStop(1, wash[1]);
  ctx.fillStyle = tint;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 7;
  ctx.strokeRect(rect.x - 7, rect.y - 7, rect.w + 14, rect.h + 14);
  ctx.restore();
}

// ---------------------------------------------------------------- finishes

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let grainTile = null;
function getGrainTile() {
  if (grainTile) return grainTile;
  const tile = document.createElement('canvas');
  tile.width = 256;
  tile.height = 256;
  const tctx = tile.getContext('2d');
  const data = tctx.createImageData(256, 256);
  const rand = mulberry32(20261120);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = Math.floor(rand() * 255);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  tctx.putImageData(data, 0, 0);
  grainTile = tile;
  return tile;
}

function drawGrain(ctx, w, h) {
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(getGrainTile(), 'repeat');
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawHalftone(ctx, w, h) {
  const step = Math.max(9, w * 0.011);
  ctx.save();
  ctx.fillStyle = 'rgba(10, 4, 18, 0.20)';
  for (let y = step / 2, row = 0; y < h; y += step, row++) {
    for (let x = step / 2 + (row % 2 ? step / 2 : 0); x < w; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, step * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawVignette(ctx, w, h) {
  const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.78);
  grad.addColorStop(0, 'rgba(8, 0, 16, 0)');
  grad.addColorStop(1, 'rgba(8, 0, 16, 0.44)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

// ---------------------------------------------------------------- lettering

const TITLE_FILLS = {
  sunset: ['#ffe259', '#ffa751', '#ff3d7e'],
  chrome: ['#f8f9fa', '#adb5bd', '#e9ecef', '#6c757d'],
  neon: ['#ff9ff3', '#ff71ce', '#b967ff'],
  bone: ['#f7f1e1', '#f7f1e1'],
};

function titleLines(ctx, title, maxW, size) {
  ctx.font = `${size}px Anton, sans-serif`;
  if (ctx.measureText(title).width <= maxW) return [title];
  const words = title.split(/\s+/);
  if (words.length < 2) return [title];
  let best = null;
  for (let i = 1; i < words.length; i++) {
    const lines = [words.slice(0, i).join(' '), words.slice(i).join(' ')];
    const m = Math.max(ctx.measureText(lines[0]).width, ctx.measureText(lines[1]).width);
    if (!best || m < best.m) best = { lines, m };
  }
  return best.lines;
}

function drawTitleBlock(ctx, w, h, state, billingH) {
  const title = state.title.trim().toUpperCase();
  const top = state.titlePos === 'top';
  // A soft shade behind the lettering keeps it readable over bright photo areas.
  const shade = ctx.createLinearGradient(0, top ? 0 : h, 0, top ? h * 0.34 : h * 0.66);
  shade.addColorStop(0, 'rgba(10, 2, 16, 0.42)');
  shade.addColorStop(1, 'rgba(10, 2, 16, 0)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, top ? 0 : h * 0.6, w, h * 0.4);

  const kicker = state.kicker.trim().toUpperCase();
  const kickerSize = h * 0.021;
  let cursor = top ? h * 0.055 : h - billingH - h * 0.028;
  ctx.textAlign = 'center';
  if (kicker) {
    ctx.font = `600 ${kickerSize}px "Segoe UI", system-ui, sans-serif`;
    try { ctx.letterSpacing = `${kickerSize * 0.42}px`; } catch { /* older canvas: no letterspacing */ }
    ctx.fillStyle = 'rgba(255, 244, 214, 0.95)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = kickerSize * 0.5;
    if (top) {
      ctx.fillText(kicker, w / 2, cursor);
      cursor += h * 0.028;
    }
    ctx.shadowBlur = 0;
    try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
  }
  if (!title) return;

  let size = h * 0.148;
  let lines = titleLines(ctx, title, w * 0.94, size);
  while (size > 14) {
    ctx.font = `${size}px Anton, sans-serif`;
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (widest <= w * 0.94) break;
    size -= 3;
    lines = titleLines(ctx, title, w * 0.94, size);
  }
  const lineH = size * 0.94;
  const blockH = lineH * lines.length;
  let firstBaseline;
  if (top) {
    firstBaseline = cursor + size * 0.82;
  } else {
    firstBaseline = cursor - blockH + size * 0.82;
    if (kicker) {
      // kicker sits just above the title block when the title is at the foot
      ctx.font = `600 ${kickerSize}px "Segoe UI", system-ui, sans-serif`;
      try { ctx.letterSpacing = `${kickerSize * 0.42}px`; } catch { /* ignore */ }
      ctx.fillStyle = 'rgba(255, 244, 214, 0.95)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
      ctx.shadowBlur = kickerSize * 0.5;
      ctx.fillText(kicker, w / 2, firstBaseline - size * 0.82 - kickerSize * 0.9);
      ctx.shadowBlur = 0;
      try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
    }
  }
  const stops = TITLE_FILLS[state.titleFill] ?? TITLE_FILLS.sunset;
  lines.forEach((line, i) => {
    const y = firstBaseline + i * lineH;
    const grad = ctx.createLinearGradient(0, y - size * 0.8, 0, y + size * 0.15);
    stops.forEach((color, j) => grad.addColorStop(stops.length === 1 ? 0 : j / (stops.length - 1), color));
    ctx.font = `${size}px Anton, sans-serif`;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(22, 6, 26, 0.92)';
    ctx.lineWidth = size * 0.075;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = size * 0.14;
    ctx.shadowOffsetY = size * 0.045;
    ctx.strokeText(line, w / 2, y);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = grad;
    ctx.fillText(line, w / 2, y);
  });
}

function drawCallout(ctx, w, h, callout) {
  const colors = CALLOUT_COLORS[callout.color] ?? CALLOUT_COLORS.sun;
  const size = h * 0.033;
  ctx.save();
  ctx.translate(callout.x * w, callout.y * h);
  ctx.rotate((callout.rot * Math.PI) / 180);
  ctx.font = `${size}px Anton, sans-serif`;
  const text = callout.text.toUpperCase();
  const tw = ctx.measureText(text).width;
  const padX = size * 0.55;
  const padY = size * 0.34;
  const bw = tw + padX * 2;
  const bh = size + padY * 2;
  ctx.shadowColor = 'rgba(5, 0, 12, 0.5)';
  ctx.shadowBlur = size * 0.35;
  ctx.shadowOffsetY = size * 0.12;
  ctx.fillStyle = colors.bg;
  ctx.beginPath();
  ctx.roundRect(-bw / 2, -bh / 2, bw, bh, size * 0.28);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.lineWidth = Math.max(2, size * 0.09);
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.fillStyle = colors.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, size * 0.04);
  ctx.restore();
  ctx.textBaseline = 'alphabetic';
}

function drawCastTag(ctx, poly, name, h) {
  const bb = bbox(poly);
  if (bb.w < 90 || bb.h < 90 || !name.trim()) return;
  const size = Math.min(h * 0.021, bb.h * 0.13);
  ctx.save();
  pathPoly(ctx, poly);
  ctx.clip();
  ctx.font = `${size}px Anton, sans-serif`;
  const text = name.trim().toUpperCase();
  const tw = ctx.measureText(text).width;
  const x = bb.x + bb.w * 0.055;
  const y = bb.y + bb.h - bb.h * 0.055;
  ctx.fillStyle = 'rgba(10, 4, 18, 0.62)';
  ctx.fillRect(x - size * 0.45, y - size * 1.06, tw + size * 0.9, size * 1.42);
  ctx.fillStyle = '#ffd23e';
  ctx.fillRect(x - size * 0.45, y - size * 1.06, size * 0.16, size * 1.42);
  ctx.fillStyle = '#fff7e8';
  ctx.textAlign = 'left';
  ctx.fillText(text, x, y);
  ctx.restore();
}

// ---------------------------------------------------------------- poster furniture

function drawSeal(ctx, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  const ring = ctx.createLinearGradient(0, -r, 0, r);
  ring.addColorStop(0, '#ffe98a');
  ring.addColorStop(0.5, '#e8a91c');
  ring.addColorStop(1, '#fff3b0');
  ctx.shadowColor = 'rgba(5, 0, 12, 0.5)';
  ctx.shadowBlur = r * 0.3;
  ctx.fillStyle = ring;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#7c1d3f';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 233, 138, 0.9)';
  ctx.lineWidth = r * 0.045;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.68, 0, Math.PI * 2);
  ctx.stroke();
  // five-point star
  ctx.fillStyle = '#ffe98a';
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r * 0.4 : r * 0.17;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = Math.cos(a) * rad;
    const py = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  // arc lettering
  ctx.fillStyle = '#ffe98a';
  ctx.font = `${r * 0.21}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const word = 'PALM RIOT';
  const spread = Math.PI * 0.92;
  for (let i = 0; i < word.length; i++) {
    const a = -spread / 2 + (spread * i) / (word.length - 1) - Math.PI / 2;
    ctx.save();
    ctx.translate(Math.cos(a) * r * 0.565, Math.sin(a) * r * 0.565);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillText(word[i], 0, 0);
    ctx.restore();
  }
  ctx.restore();
  ctx.textBaseline = 'alphabetic';
}

function drawRating(ctx, x, y, s) {
  ctx.save();
  ctx.fillStyle = 'rgba(8, 8, 10, 0.88)';
  ctx.fillRect(x, y, s, s);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(2, s * 0.045);
  ctx.strokeRect(x, y, s, s);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = `${s * 0.52}px Anton, sans-serif`;
  ctx.fillText('R', x + s / 2, y + s * 0.56);
  ctx.font = `600 ${s * 0.13}px "Segoe UI", system-ui, sans-serif`;
  ctx.fillText('RIOT RATED', x + s / 2, y + s * 0.78);
  ctx.restore();
}

function stringHash(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function drawBarcode(ctx, x, y, w, h, seedText) {
  ctx.save();
  ctx.fillStyle = '#f7f1e1';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#14100c';
  const rand = mulberry32(stringHash(seedText));
  let cx = x + w * 0.06;
  const end = x + w * 0.94;
  while (cx < end) {
    const barW = (0.5 + rand() * 2.2) * (w / 90);
    if (rand() > 0.42) ctx.fillRect(cx, y + h * 0.1, barW, h * 0.66);
    cx += barW + (0.5 + rand() * 1.6) * (w / 90);
  }
  ctx.font = `600 ${h * 0.2}px "Segoe UI", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('PR-2026 · LEONIDA', x + w / 2, y + h * 0.95);
  ctx.restore();
}

export function billingHeight(h, state) {
  return state.billing ? h * 0.062 : 0;
}

function drawBilling(ctx, w, h, state) {
  const bh = billingHeight(h, state);
  if (!bh) return;
  const grad = ctx.createLinearGradient(0, h - bh * 1.7, 0, h);
  grad.addColorStop(0, 'rgba(8, 2, 14, 0)');
  grad.addColorStop(1, 'rgba(8, 2, 14, 0.78)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, h - bh * 1.7, w, bh * 1.7);
  const cast = [...new Set(state.panels.map((p) => p.cast.trim().toUpperCase()).filter(Boolean))].slice(0, 3);
  const stars = cast.length ? cast.join(' · ') : 'RAY SOLANO · VESPER LANE · DREX MARLOWE';
  const title = state.title.trim().toUpperCase() || 'UNTITLED';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 247, 232, 0.92)';
  try { ctx.letterSpacing = `${h * 0.004}px`; } catch { /* ignore */ }
  // shrink-to-fit: a billing block that runs off the poster's edges is worse than a smaller one
  let size1 = h * 0.0175;
  const line1 = `PALM RIOT STUDIO presents “${title}” starring ${stars}`;
  ctx.font = `${size1}px Anton, sans-serif`;
  while (ctx.measureText(line1).width > w * 0.92 && size1 > h * 0.011) {
    size1 -= 0.5;
    ctx.font = `${size1}px Anton, sans-serif`;
  }
  ctx.fillText(line1, w / 2, h - bh * 0.52);
  let size2 = h * 0.0125;
  const line2 = 'directed by A. PALMS · photography by THE GOLDEN HOUR UNIT · music by NEON ORCHESTRA';
  ctx.font = `600 ${size2}px "Segoe UI", system-ui, sans-serif`;
  while (ctx.measureText(line2).width > w * 0.92 && size2 > h * 0.009) {
    size2 -= 0.5;
    ctx.font = `600 ${size2}px "Segoe UI", system-ui, sans-serif`;
  }
  ctx.fillStyle = 'rgba(255, 247, 232, 0.66)';
  ctx.fillText(line2, w / 2, h - bh * 0.18);
  try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
}

// ---------------------------------------------------------------- the render

export function drawCover(ctx, w, h, state, images) {
  const grade = GRADES[state.grade] ?? GRADES.vice;
  ctx.fillStyle = '#1b0f26';
  ctx.fillRect(0, 0, w, h);
  const polys = layoutPolys(state.layout).map((p) => scalePoly(p, w, h));

  // photos
  if (state.mode === 'span') {
    const place = state.panels[0] ?? defaultPanel(0, 1);
    const img = images[place.photo];
    if (img) {
      ctx.save();
      ctx.filter = grade.filter;
      drawPhotoCover(ctx, img, { x: 0, y: 0, w, h }, place);
      ctx.filter = 'none';
      ctx.restore();
    }
  } else {
    polys.forEach((poly, i) => {
      const place = state.panels[i];
      const img = place && images[place.photo];
      if (img) drawPanelPhoto(ctx, img, poly, place, grade.filter);
    });
  }

  // sky glow: a low sun burning through the top of the frame
  if (state.glow) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const glow = ctx.createRadialGradient(w * 0.5, -h * 0.12, 10, w * 0.5, -h * 0.12, w * 0.95);
    glow.addColorStop(0, grade.glow + 'aa');
    glow.addColorStop(0.5, grade.glow + '38');
    glow.addColorStop(1, grade.glow + '00');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // grade wash unifies every panel into one poster
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  wash.addColorStop(0, grade.wash[0]);
  wash.addColorStop(0.45, 'rgba(0, 0, 0, 0)');
  wash.addColorStop(1, grade.wash[1]);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);

  if (state.halftone || grade.halftone) drawHalftone(ctx, w, h);

  // white poster gutters between panels
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(3, w * 0.006);
  ctx.lineJoin = 'round';
  for (const poly of polys) {
    pathPoly(ctx, poly);
    ctx.stroke();
  }
  ctx.restore();

  // pop-out layers sit above the frames they break
  if (state.mode === 'panels') {
    polys.forEach((poly, i) => {
      const place = state.panels[i];
      const img = place && images[place.photo];
      if (place && place.pop && img) drawPopOut(ctx, img, poly, place, grade.filter, grade.wash);
    });
  }

  // cast tags ride inside their panels
  if (state.castTags && state.mode === 'panels') {
    polys.forEach((poly, i) => {
      const place = state.panels[i];
      if (place) drawCastTag(ctx, poly, place.cast, h);
    });
  }

  const bh = billingHeight(h, state);
  drawTitleBlock(ctx, w, h, state, bh);
  for (const callout of state.callouts) drawCallout(ctx, w, h, callout);

  // furniture
  const margin = w * 0.028;
  if (state.seal) {
    const r = Math.min(w, h) * 0.072;
    const sx = w - margin - r;
    // at the foot, the seal stacks above the barcode so the two never print over each other
    const lift = state.barcode && state.titlePos === 'top' ? h * 0.036 + h * 0.014 : 0;
    const sy = state.titlePos === 'top' ? h - bh - margin - r - lift : margin + r;
    drawSeal(ctx, sx, sy, r);
  }
  if (state.rating) {
    const s = Math.min(w, h) * 0.088;
    drawRating(ctx, margin, h - bh - margin - s, s);
  }
  if (state.barcode) {
    const bw = w * 0.105;
    const bht = h * 0.036;
    drawBarcode(ctx, w - margin - bw, h - bh - margin - bht, bw, bht, state.title + state.kicker);
  }
  drawBilling(ctx, w, h, state);

  drawVignette(ctx, w, h);
  if (state.grain) drawGrain(ctx, w, h);
}
