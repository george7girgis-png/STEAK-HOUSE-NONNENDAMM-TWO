// Echtzeit-Rauch und Glut über den Videos. Läuft unabhängig vom Scrollen.
// Der "Schleier" (veil) verdichtet den Rauch an den Kapitelgrenzen und verdeckt den Szenenwechsel.

const rand = (a, b) => a + Math.random() * (b - a);

function makeSprite(size, rgb) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, `rgba(${rgb},0.55)`);
  grd.addColorStop(0.4, `rgba(${rgb},0.22)`);
  grd.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  return c;
}

export class SmokeField {
  constructor(canvas) {
    this.c = canvas;
    this.g = canvas.getContext('2d');
    this.veil = 0;
    this.veilShown = 0;
    this.drift = [0, 0];
    this.heat = 0.35; // Glut-Intensität, steigt bei der Eröffnung
    this.running = false;
    this.raf = 0;
    this.last = 0;
    this.sprites = [makeSprite(256, '205,196,182'), makeSprite(256, '150,140,128'), makeSprite(256, '120,96,80')];
    this.puffs = [];
    this.embers = [];
    this.resize();
    this.seed();
    addEventListener('resize', () => this.resize());
    this.tick = this.tick.bind(this);
  }

  resize() {
    // Halbe Auflösung reicht für weichen Rauch und spart Leistung.
    const scale = 0.5;
    this.w = Math.max(1, Math.round(this.c.clientWidth * scale));
    this.h = Math.max(1, Math.round(this.c.clientHeight * scale));
    this.c.width = this.w;
    this.c.height = this.h;
  }

  seed() {
    const area = (innerWidth * innerHeight) / (1440 * 900);
    const puffCount = Math.round(26 * Math.min(1.2, Math.max(0.5, area)));
    for (let i = 0; i < puffCount; i++) this.puffs.push(this.newPuff(true));
    for (let i = 0; i < 60; i++) this.embers.push(this.newEmber(true));
  }

  newPuff(initial) {
    return {
      x: rand(-0.1, 1.1),
      y: initial ? rand(0, 1.1) : rand(1.0, 1.25),
      r: rand(0.18, 0.42),
      vx: rand(-0.008, 0.008),
      vy: rand(-0.035, -0.012),
      rot: rand(0, Math.PI * 2),
      vr: rand(-0.15, 0.15),
      a: rand(0.25, 0.7),
      s: (Math.random() * this.sprites.length) | 0,
      ph: rand(0, 10),
    };
  }

  newEmber(initial) {
    return {
      x: rand(0, 1),
      y: initial ? rand(0.2, 1.05) : rand(0.9, 1.08),
      vx: rand(-0.02, 0.02),
      vy: rand(-0.16, -0.05),
      size: rand(0.6, 1.8),
      life: rand(2, 6),
      age: initial ? rand(0, 4) : 0,
      ph: rand(0, 10),
    };
  }

  setVeil(v) { this.veil = v; if (!this.running) this.draw(0); }
  setDrift(d) { this.drift = d; }
  ignite() {
    const from = this.heat;
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / 1800);
      this.heat = from + (1 - from) * (1 - Math.pow(1 - k, 3));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  setRunning(on) {
    if (on === this.running) return;
    this.running = on;
    if (on) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.tick);
    } else {
      cancelAnimationFrame(this.raf);
    }
  }

  tick(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.update(dt, now / 1000);
    this.draw(now / 1000);
    if (this.running) this.raf = requestAnimationFrame(this.tick);
  }

  update(dt, time) {
    this.veilShown += (this.veil - this.veilShown) * Math.min(1, dt * 6);
    const [dx, dy] = this.drift;
    const boost = 1 + this.veilShown * 2.2;
    for (const p of this.puffs) {
      p.x += (p.vx + dx * 0.06 * this.veilShown + Math.sin(time * 0.3 + p.ph) * 0.004) * dt * boost;
      p.y += (p.vy + dy * 0.05 * this.veilShown) * dt * boost;
      p.rot += p.vr * dt;
      if (p.y < -0.45 || p.x < -0.5 || p.x > 1.5 || p.y > 1.6) Object.assign(p, this.newPuff(false));
    }
    for (const e of this.embers) {
      e.age += dt;
      e.x += (e.vx + Math.sin(time * 2 + e.ph) * 0.01) * dt;
      e.y += e.vy * dt;
      if (e.age > e.life || e.y < -0.05) Object.assign(e, this.newEmber(false));
    }
  }

  draw(time) {
    const { g, w, h } = this;
    g.clearRect(0, 0, w, h);
    const v = this.veilShown;
    const base = 0.32 + v * 0.9;
    const dim = Math.max(w, h);

    g.globalCompositeOperation = 'source-over';
    for (const p of this.puffs) {
      const size = p.r * dim * (1 + v * 0.8);
      const a = Math.min(1, p.a * base * (0.6 + 0.4 * Math.sin(time * 0.4 + p.ph)));
      if (a < 0.01) continue;
      g.globalAlpha = a;
      g.save();
      g.translate(p.x * w, p.y * h);
      g.rotate(p.rot);
      g.drawImage(this.sprites[p.s], -size / 2, -size / 2, size, size);
      g.restore();
    }
    // Dichter Schleier über die ganze Fläche an den Übergängen.
    if (v > 0.02) {
      g.globalAlpha = Math.min(0.92, v * 0.95);
      const grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, dim * 0.75);
      grd.addColorStop(0, 'rgb(96,88,80)');
      grd.addColorStop(0.6, 'rgb(52,46,40)');
      grd.addColorStop(1, 'rgb(20,19,17)');
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
    }

    g.globalCompositeOperation = 'lighter';
    for (const e of this.embers) {
      const lifeK = Math.sin(Math.PI * Math.min(1, e.age / e.life));
      const flicker = 0.6 + 0.4 * Math.sin(time * 14 + e.ph * 3);
      const a = lifeK * flicker * this.heat * (1 - v * 0.6);
      if (a < 0.02) continue;
      g.globalAlpha = a;
      g.fillStyle = e.size > 1.3 ? '#ffb070' : '#e0642d';
      g.beginPath();
      g.arc(e.x * w, e.y * h, e.size, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
  }
}
