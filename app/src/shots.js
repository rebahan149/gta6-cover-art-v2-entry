// Fixed scenes for the entry's screenshots. shots.json names each shot as a query on the app:
//   ?shot=cover&scene=sunset     the finished cover alone, filling the frame
//   ?shot=editor&scene=neonpop   the editor mid-edit, the same cover composed in it
// `scene` picks one of the staged compositions below (photos are the bundled samples, in tray
// order: 0 boulevard, 1 pier, 2 neon, 3 marina). window.__shotReady is set once the scene is
// painted with the display font loaded, so the screenshot waits for the real lettering.

const SCENES = {
  // 1-cover: a boulevard sunset poster — slanted strips, heatwave grade, title over the art.
  sunset: {
    size: 'square',
    layout: 'slant',
    mode: 'panels',
    grade: 'heatwave',
    title: 'SUNSET HEIST',
    kicker: 'ONE CREW · ONE SCORE · NO BRAKES',
    titlePos: 'top',
    titleFill: 'sunset',
    panels: [
      { photo: 0, zoom: 1.05, oy: 0.35 },
      { photo: 0, zoom: 1.3, ox: 0.62, oy: 0.55 },
      { photo: 1, zoom: 1.1, oy: 0.45 },
      { photo: 3, zoom: 1.15, oy: 0.5 },
      { photo: 0, zoom: 1.25, ox: 0.3, oy: 0.7 },
    ],
    callouts: [
      { x: 0.155, y: 0.345, rot: -8, text: 'NO BRAKES!', color: 'sun' },
      { x: 0.835, y: 0.615, rot: 6, text: 'VICE CITY HEAT', color: 'pink' },
    ],
  },
  // 3-cover + the editor shot: neon grid with the hero photo popping out of its frame.
  neonpop: {
    size: 'square',
    layout: 'popout',
    mode: 'panels',
    grade: 'neon',
    title: 'NEON PALMS',
    kicker: 'THE CITY NEVER SLEEPS · IT GLOWS',
    titlePos: 'top',
    titleFill: 'neon',
    panels: [
      { photo: 2, zoom: 1.12, oy: 0.42 },
      { photo: 0, zoom: 1.1, oy: 0.4 },
      { photo: 2, pop: true, zoom: 1.3, ox: 0.58, oy: 0.55 },
      { photo: 3, zoom: 1.1, oy: 0.5, cast: '' },
    ],
    callouts: [
      { x: 0.815, y: 0.155, rot: 5, text: 'AFTER DARK', color: 'teal' },
      { x: 0.165, y: 0.815, rot: -6, text: 'ALL NIGHT', color: 'pink' },
    ],
  },
  // 4-wide: the marina cover at the full 1920 x 1080 post size, title over the foot.
  marina: {
    size: 'wide',
    layout: 'skyline',
    mode: 'panels',
    grade: 'vice',
    title: 'MARINA KINGS',
    kicker: 'FIVE CREWS · ONE HARBOUR',
    titlePos: 'bottom',
    titleFill: 'chrome',
    panels: [
      { photo: 3, zoom: 1.05, oy: 0.42 },
      { photo: 1, zoom: 1.15, oy: 0.5 },
      { photo: 0, zoom: 1.2, oy: 0.55 },
      { photo: 3, zoom: 1.3, ox: 0.65, oy: 0.5 },
      { photo: 1, zoom: 1.1, oy: 0.6, cast: '' },
    ],
    callouts: [
      { x: 0.125, y: 0.185, rot: -5, text: 'GOLD RUSH', color: 'sun' },
      { x: 0.885, y: 0.27, rot: 4, text: 'HIGH TIDE', color: 'bone' },
    ],
  },
};

export function sceneFor(name) {
  return SCENES[name] ?? SCENES.sunset;
}

export async function runShot(query, api) {
  const shot = query.get('shot');
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await api.prepareScene(query);
  await document.fonts.ready;
  api.redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
