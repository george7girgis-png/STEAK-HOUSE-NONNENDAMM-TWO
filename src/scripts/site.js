import './reservation.js';

// Navigation
const toggle = document.querySelector('[data-nav-toggle]');
const navEl = document.querySelector('[data-nav]');
if (toggle && navEl) {
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    navEl.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  navEl.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navEl.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
  });
}

const header = document.querySelector('[data-header]');
const onScroll = () => header?.classList.toggle('is-solid', window.scrollY > 40);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Einwilligungen: nur Google Maps. Gespeichert lokal im Browser, jederzeit änderbar.
const KEY = 'nd-consent-v1';
const read = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
};
const write = (v) => {
  try { localStorage.setItem(KEY, JSON.stringify({ ...v, ts: Date.now() })); } catch { /* privater Modus */ }
};

function loadMap(box) {
  if (box.querySelector('iframe')) return;
  const f = document.createElement('iframe');
  f.src = box.dataset.src;
  f.title = 'Google Maps: Lage des Steakhaus Nonnendamm, Nonnendammallee 98, 13629 Berlin';
  f.loading = 'lazy';
  f.referrerPolicy = 'no-referrer-when-downgrade';
  box.querySelector('[data-map-placeholder]').hidden = true;
  box.append(f);
}
function unloadMap(box) {
  box.querySelector('iframe')?.remove();
  box.querySelector('[data-map-placeholder]').hidden = false;
}
const maps = [...document.querySelectorAll('[data-map]')];
const applyConsent = () => {
  const c = read();
  maps.forEach((b) => (c.maps ? loadMap(b) : unloadMap(b)));
};
maps.forEach((box) => {
  box.querySelector('[data-map-load]').addEventListener('click', () => {
    if (box.querySelector('[data-map-remember]').checked) write({ ...read(), maps: true });
    loadMap(box);
  });
});
applyConsent();

const dialog = document.querySelector('[data-consent-dialog]');
document.querySelectorAll('[data-consent-open]').forEach((b) =>
  b.addEventListener('click', () => {
    const c = read();
    dialog.querySelectorAll('[data-consent-toggle]').forEach((t) => (t.checked = !!c[t.dataset.consentToggle]));
    dialog.showModal();
  }),
);
dialog?.addEventListener('close', () => {
  if (dialog.returnValue === 'save') {
    const v = {};
    dialog.querySelectorAll('[data-consent-toggle]').forEach((t) => (v[t.dataset.consentToggle] = t.checked));
    write(v);
  } else if (dialog.returnValue === 'reject') {
    write({ maps: false });
  } else return;
  applyConsent();
});
