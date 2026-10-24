// Kamerafahrt durch das Feuer.
// Scroll steuert Kapitel, Kamera und Texte (normierter Fortschritt P in Viewport-Einheiten).
// Feuer, Rauch und Glut laufen unabhängig davon weiter: Ambient-Loops (Video) + Echtzeit-Rauch (Canvas).
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SmokeField } from './smoke.js';

const root = document.documentElement;
const journey = document.querySelector('[data-journey]');

// Zeitachse in Viewport-Einheiten: Halten / Übergang abwechselnd.
// 0-1 Hero · 1-2 Ü1 · 2-3 Hüftsteak · 3-4 Ü2 · 4-5 Filetspieß · 5-6 Ü3 · 6-7 Holzfäller · 7-8 Ausklang
const UNITS = 8;
const HOLD_CENTER = { start: 0, gerichte: 2.45, hueftsteak: 2.45, filetspiess: 4.45, holzfaellersteak: 6.45 };
const PANELS = [
  { key: 'start', arrive: null, depart: [0.8, 1.25] },
  { key: 'hueftsteak', arrive: [1.62, 2.08], depart: [2.86, 3.3] },
  { key: 'filetspiess', arrive: [3.62, 4.08], depart: [4.86, 5.3] },
  { key: 'holzfaellersteak', arrive: [5.62, 6.08], depart: [6.82, 7.22] },
  { key: 'outro', arrive: [7.35, 7.75], depart: null },
];
// Kamerabewegung je Übergang: Push (Ü1), seitliche Fahrt (Ü2), Abwärtsfahrt (Ü3).
const MOVES = [
  (t) => ({ s: 1 + 0.16 * bell(t), x: 0, y: -2 * bell(t) }),
  (t) => ({ s: 1 + 0.05 * bell(t), x: 5 * bell(t), y: 0, r: 0.8 * bell(t) }),
  (t) => ({ s: 1 + 0.07 * bell(t), x: 0, y: -5 * bell(t) }),
];

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ramp = (v, a, b) => clamp((v - a) / (b - a));
const smooth = (t) => t * t * (3 - 2 * t);
const bell = (t) => Math.sin(Math.PI * clamp(t));

function failToStatic(reason) {
  console.warn('[journey] statische Darstellung:', reason);
  root.classList.remove('is-cinematic');
  ScrollTrigger.getAll().forEach((t) => t.kill());
  journey.style.height = '';
}

if (journey && root.classList.contains('is-cinematic')) {
  try {
    init();
  } catch (e) {
    failToStatic(e);
  }
}

function init() {
  gsap.registerPlugin(ScrollTrigger);
  // Echtzeit statt gedehnter Zeit bei langsamen Frames: Intro und Nachführen holen sofort auf.
  gsap.ticker.lagSmoothing(false);

  const stage = journey.querySelector('[data-stage]');
  const cam = journey.querySelector('[data-cam]');
  const shade = journey.querySelector('[data-shade]');
  const introDark = journey.querySelector('[data-intro-dark]');
  const hospitality = journey.querySelector('[data-hospitality]');
  const scenes = [...journey.querySelectorAll('[data-scene]')].map((el) => ({
    el,
    key: el.dataset.scene,
    img: el.querySelector('img'),
    video: el.querySelector('video'),
    failed: false,
    loaded: false,
  }));
  const transitions = [...journey.querySelectorAll('[data-transition-scene]')].map((el) => ({
    el,
    key: el.dataset.transitionScene,
    video: el.querySelector('video'),
    failed: false,
    loaded: false,
    lastT: -1,
  }));
  const panels = PANELS.map((p) => ({
    ...p,
    el: journey.querySelector(`[data-panel="${p.key}"]`),
    chapter: journey.querySelector(`[data-chapter="${p.key}"]`),
  }));

  const smoke = new SmokeField(journey.querySelector('[data-fx]'));

  // ---------- Medien ----------
  let variant = '';
  let motionPaused = false;
  let inView = true;
  const pickVariant = () => (innerWidth / innerHeight < 0.85 ? 'mobile' : 'desktop');

  function setSources() {
    const v = pickVariant();
    if (v === variant) return;
    variant = v;
    root.dataset.mediaVariant = v;
    scenes.forEach((s) => {
      s.img.src = `/media/poster/${s.img.dataset.poster}-${v}.jpg`;
      s.video.poster = s.img.src;
      if (s.loaded) load(s, true);
    });
    transitions.forEach((t) => { if (t.loaded) load(t, true); });
  }

  function load(item, force = false) {
    if (item.failed || (item.loaded && !force)) return;
    const isAmbient = !!item.img;
    const v = item.video;
    item.loaded = true;
    v.classList.remove('is-ready');
    v.src = isAmbient
      ? `/media/ambient/${item.key}-${variant}.mp4`
      : `/media/transition/${item.key}-${variant}.mp4`;
    v.preload = 'auto';
    v.load();
  }

  function wireErrors(item) {
    const v = item.video;
    const fail = () => {
      if (item.failed) return;
      item.failed = true;
      v.removeAttribute('src');
      v.load();
      v.remove();
    };
    v.addEventListener('error', fail);
    v.addEventListener('loadeddata', () => { v.classList.add('is-ready'); });
    v.addEventListener('playing', () => v.classList.add('is-ready'));
  }
  scenes.forEach(wireErrors);
  transitions.forEach(wireErrors);

  function playAmbient(s, on) {
    if (s.failed || !s.loaded) return;
    const v = s.video;
    if (on && !motionPaused && inView) {
      if (v.paused) v.play().catch(() => { /* Autoplay blockiert: Poster bleibt sichtbar */ });
    } else if (!v.paused) v.pause();
  }

  function seekTransition(tr, t) {
    const v = tr.video;
    if (tr.failed || !tr.loaded || v.readyState < 1 || !v.duration) return;
    const time = clamp(t) * (v.duration - 0.05);
    if (Math.abs(time - tr.lastT) < 1 / 40) return;
    tr.lastT = time;
    if (typeof v.fastSeek === 'function' && Math.abs(v.currentTime - time) > 0.5) v.fastSeek(time);
    else v.currentTime = time;
  }

  // ---------- Layout ----------
  let vh = innerHeight;
  function layout() {
    vh = innerHeight;
    journey.style.height = `${(UNITS + 1) * vh}px`;
    setSources();
  }
  layout();

  // ---------- Fortschritt ----------
  const state = { p: 0 };
  let introLevel = 0; // 0..1, Eröffnungssequenz

  function render() {
    const P = state.p;
    const seg = Math.min(Math.floor(P), UNITS - 1);
    const t = P - seg;
    const isTransition = seg % 2 === 1 && seg < 7;
    const k = (seg - 1) / 2; // Index des Übergangs
    const vis = new Array(scenes.length).fill(0);
    let veil = 0;
    let move = { s: 1, x: 0, y: 0, r: 0 };

    if (isTransition) {
      const from = k;
      const to = k + 1;
      const tr = transitions[k];
      const trUsable = tr && !tr.failed && tr.video.classList.contains('is-ready');
      veil = bell(t) * (trUsable ? 0.55 : 0.95);
      vis[from] = t < 0.5 ? 1 : 0;
      vis[to] = t >= 0.5 ? 1 : 0;
      transitions.forEach((x, i) => {
        const on = i === k && trUsable;
        const o = on ? smooth(ramp(t, 0.02, 0.14)) * (1 - smooth(ramp(t, 0.86, 0.98))) : 0;
        x.el.style.opacity = o;
        x.el.classList.toggle('is-on', o > 0);
      });
      if (tr) seekTransition(tr, t);
      move = MOVES[k](t);
    } else {
      transitions.forEach((x) => { x.el.style.opacity = 0; x.el.classList.remove('is-on'); });
      const sceneIndex = seg === 7 ? 3 : seg / 2;
      vis[sceneIndex] = 1;
      // Langsame Drift während des Lesens, Richtung Essensseite.
      const dir = [0, -1, 1, -1][sceneIndex];
      move = { s: 1.02 + 0.025 * t, x: dir * 1.2 * t, y: 0 };
      if (seg === 7) {
        // Ausklang: Kamera zieht sich zurück, warmer Gastraum öffnet sich.
        const out = smooth(t);
        move = { s: 1.045 - 0.2 * out, x: 0, y: 2 * out };
        vis[3] = 1 - smooth(ramp(t, 0.15, 0.85));
        veil = 0.35 * bell(ramp(t, 0, 0.8));
      }
    }

    // Leichter Push vor dem ersten Übergang, damit die Kamera im Hero schon lebt.
    if (seg === 0) move = { s: 1 + 0.03 * t, x: 0, y: 0 };
    // Bildkanten nie zeigen: Skalierung deckt Verschiebung und Drehung immer ab
    // (gilt nicht für den Ausklang, der bewusst zurückzieht).
    if (seg !== 7) {
      const cover = 1 + (2 * Math.abs(move.x) + 2 * Math.abs(move.y)) / 100 + 0.035 * Math.abs(move.r || 0) + 0.01;
      move.s = Math.max(move.s, cover);
    }
    // Hero-Bild sitzt tiefer, damit Logo und Titel über dem Steak Platz haben.
    // Im ersten Rauchschleier gleitet es auf die native Kadrierung des Übergangsclips zurück.
    const drop = P < 1 ? 1 : P < 2 ? 1 - smooth(ramp(P, 1, 1.45)) : 0;
    move.y += drop * (variant === 'mobile' ? 26 : 20);
    // Hochformat: Essen in die obere Bildhälfte, darunter Platz für den Text.
    if (variant === 'mobile') move.y -= 17 * (1 - drop);

    scenes.forEach((s, i) => {
      s.el.style.opacity = vis[i];
      s.el.classList.toggle('is-on', vis[i] > 0);
    });
    const hosp = seg === 7 ? smooth(ramp(t, 0.2, 0.9)) : 0;
    hospitality.style.opacity = hosp;
    hospitality.style.transform = `scale(${1.12 - 0.12 * hosp})`;

    cam.style.transform = `translate3d(${move.x}%, ${move.y}%, 0) scale(${move.s}) rotate(${move.r || 0}deg)`;
    smoke.setVeil(veil);
    smoke.setDrift(isTransition ? [[-0.6, 0], [1, 0], [0, 1]][k] : [0, 0]);

    // Lesbarkeits-Schatten je nach Seite des Textes.
    shade.style.background = shadeFor(P);

    // Texte
    panels.forEach((p) => {
      let o = 1;
      if (p.arrive) o *= smooth(ramp(P, p.arrive[0], p.arrive[1]));
      if (p.depart) o *= 1 - smooth(ramp(P, p.depart[0], p.depart[1]));
      if (p.key === 'start') o *= introLevel;
      const enter = p.arrive ? 1 - ramp(P, p.arrive[0], p.arrive[1]) : 0;
      const leave = p.depart ? ramp(P, p.depart[0], p.depart[1]) : 0;
      p.chapter.style.opacity = o;
      p.el.style.transform = `translate3d(0, ${(enter * 28 - leave * 28).toFixed(1)}px, 0)`;
      p.el.style.filter = o < 0.98 ? `blur(${((1 - o) * 6).toFixed(1)}px)` : '';
      p.chapter.classList.toggle('is-active', o > 0.5);
    });

    // Medien: aktuelle Szene spielen, Nachbarn vorladen, Rest pausieren.
    const near = Math.round(clamp(P / 2, 0, 3));
    scenes.forEach((s, i) => {
      if (Math.abs(i - near) <= 1 || vis[i] > 0) load(s);
      playAmbient(s, vis[i] > 0);
    });
    transitions.forEach((tr, i) => {
      if (Math.abs(P - (2 * i + 1.5)) < 1.6) load(tr);
    });
  }

  function shadeFor(P) {
    const mobile = variant === 'mobile';
    if (mobile) {
      return P < 1
        ? 'linear-gradient(180deg, rgba(16,16,14,0.9) 0%, rgba(16,16,14,0.45) 42%, rgba(16,16,14,0.05) 62%, rgba(16,16,14,0.6) 100%)'
        : 'linear-gradient(180deg, rgba(16,16,14,0.55) 0%, rgba(16,16,14,0) 22%, rgba(16,16,14,0) 40%, rgba(16,16,14,0.85) 64%, rgba(16,16,14,0.97) 100%)';
    }
    if (P > 7.2) return 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(16,16,14,0.7), rgba(16,16,14,0) 80%)';
    if (P < 1) return 'radial-gradient(ellipse 70% 60% at 50% 22%, rgba(16,16,14,0.78), rgba(16,16,14,0) 70%), linear-gradient(180deg, rgba(16,16,14,0.5), rgba(16,16,14,0) 30%, rgba(16,16,14,0) 80%, rgba(16,16,14,0.7))';
    const side = P < 3.5 ? 'left' : P < 5.5 ? 'right' : 'left';
    const dir = side === 'left' ? '90deg' : '270deg';
    return `linear-gradient(${dir}, rgba(16,16,14,0.88) 0%, rgba(16,16,14,0.55) 34%, rgba(16,16,14,0) 58%), linear-gradient(180deg, rgba(16,16,14,0.45), rgba(16,16,14,0) 25%, rgba(16,16,14,0) 80%, rgba(16,16,14,0.6))`;
  }

  // Weiches Nachführen: gleichmäßig auch bei schnellem Vor- und Zurückscrollen.
  const follow = gsap.quickTo(state, 'p', { duration: 0.55, ease: 'power3.out', onUpdate: render });
  const trigger = ScrollTrigger.create({
    trigger: journey,
    start: 'top top',
    end: 'bottom bottom',
    invalidateOnRefresh: true,
    onUpdate: (self) => follow(self.progress * UNITS),
    onRefresh: (self) => { state.p = self.progress * UNITS; follow(state.p, state.p); render(); },
  });

  // ---------- Sichtbarkeit / Pause ----------
  new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    smoke.setRunning(inView && !motionPaused);
    render();
  }).observe(stage);
  document.addEventListener('visibilitychange', () => {
    smoke.setRunning(!document.hidden && inView && !motionPaused);
    if (document.hidden) scenes.forEach((s) => playAmbient(s, false));
    else render();
  });

  const toggle = journey.querySelector('[data-motion-toggle]');
  const label = toggle.querySelector('[data-motion-label]');
  let stored = null;
  try { stored = sessionStorage.getItem('nd-motion'); } catch { /* ignoriert */ }
  const setPaused = (p) => {
    motionPaused = p;
    toggle.setAttribute('aria-pressed', String(p));
    label.textContent = p ? 'Bewegung fortsetzen' : 'Bewegung pausieren';
    toggle.querySelector('[data-icon-pause]').hidden = p;
    toggle.querySelector('[data-icon-play]').hidden = !p;
    smoke.setRunning(!p && inView);
    try { sessionStorage.setItem('nd-motion', p ? 'paused' : 'on'); } catch { /* ignoriert */ }
    render();
  };
  toggle.addEventListener('click', () => setPaused(!motionPaused));
  if (stored === 'paused') setPaused(true);

  // ---------- Direkte Kapitel-Links ----------
  const scrollToChapter = (key, instant) => {
    const top = journey.getBoundingClientRect().top + scrollY + HOLD_CENTER[key] * vh;
    window.scrollTo({ top, behavior: instant ? 'auto' : 'smooth' });
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="#"]');
    if (!a) return;
    const url = new URL(a.href, location.href);
    const key = url.hash.slice(1);
    if (url.pathname !== location.pathname || !(key in HOLD_CENTER)) return;
    e.preventDefault();
    history.pushState(null, '', `#${key}`);
    scrollToChapter(key, matchMedia('(prefers-reduced-motion: reduce)').matches);
  });
  // Tastatur: Fokus in einem Kapitel bringt dieses Kapitel ins Bild.
  journey.addEventListener('focusin', (e) => {
    const ch = e.target.closest('[data-chapter]');
    if (!ch || ch.classList.contains('is-active')) return;
    const key = ch.dataset.chapter;
    // Nach dem browsereigenen Fokus-Scroll ausführen, sonst wird er überschrieben.
    if (key in HOLD_CENTER) setTimeout(() => scrollToChapter(key, true), 0);
  });

  // ---------- Resize ----------
  let rt;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      // Mobile Adressleiste: nur bei deutlicher Höhenänderung neu berechnen.
      if (Math.abs(innerHeight - vh) > 120 || pickVariant() !== variant || !matchMedia('(pointer: coarse)').matches) {
        layout();
        ScrollTrigger.refresh();
      }
    }, 150);
  });

  // ---------- Eröffnung ----------
  load(scenes[0]);
  load(scenes[1]);
  ScrollTrigger.refresh();
  state.p = trigger.progress * UNITS;
  if (location.hash.slice(1) in HOLD_CENTER && location.hash !== '#start') {
    scrollToChapter(location.hash.slice(1), true);
  }

  const heroLines = [...journey.querySelectorAll('[data-hero-line]')];
  const heroLogo = journey.querySelector('[data-hero-logo]');
  const intro = { v: 0 };
  gsap.set([heroLogo, ...heroLines], { opacity: 0, y: 14 });
  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
  tl.to(introDark, { opacity: 0, duration: 1.6, ease: 'power1.inOut' }, 0)
    .to(intro, { v: 1, duration: 0.6, onUpdate: () => { introLevel = intro.v; render(); } }, 0)
    .add(() => smoke.ignite(), 0)
    .to(heroLogo, { opacity: 1, y: 0, duration: 1.1 }, 0.35)
    .to(heroLines, { opacity: 1, y: 0, duration: 0.9, stagger: 0.12, clearProps: 'transform' }, 0.7)
    .add(() => { introDark.style.display = 'none'; });
  // Kein erzwungenes Warten: spätestens nach 2,6 s steht der Hero vollständig.
  setTimeout(() => tl.progress(1), 2600);
  addEventListener('scroll', () => { if (tl.progress() < 1) tl.timeScale(3); }, { once: true, passive: true });
  smoke.setRunning(!motionPaused);
  render();

  // Nur in der Entwicklung: Testzugriff ohne laufende Animation-Frames (z. B. Hintergrund-Tabs).
  if (import.meta.env.DEV) {
    window.__journey = {
      setP: (p) => { state.p = p; tl.progress(1); render(); },
      scenes, transitions,
    };
  }
}
