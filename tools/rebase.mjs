// Setzt wurzel-absolute Pfade (/img/…, /presse/…) in einem fertigen Build auf einen Unterordner.
// Nur für Vorschau-Hosting wie GitHub Pages: node tools/rebase.mjs dist /repo-name
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const [dir, base] = process.argv.slice(2);
if (!dir || !base?.startsWith('/')) throw new Error('Usage: node tools/rebase.mjs <dist> </base>');
const b = base.replace(/\/$/, '');
const skip = `(?!/|${b.slice(1)}/)`; // keine //protokoll-URLs, nichts doppelt
const rules = [
  [new RegExp(String.raw`(\s(?:src|href|data-src|poster|action)=["'])/${skip}`, 'g'), `$1${b}/`],
  [new RegExp(String.raw`([\x60'"])/${skip}(media|img|brand|presse|ueber-uns|reservierung|so-finden-sie-uns|impressum-datenschutz)/`, 'g'), `$1${b}/$2/`],
  [new RegExp(String.raw`url\((['"]?)/${skip}`, 'g'), `url($1${b}/`],
];

const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
let n = 0;
for (const file of walk(dir)) {
  if (!['.html', '.js', '.css'].includes(extname(file))) continue;
  const src = readFileSync(file, 'utf8');
  const out = rules.reduce((s, [re, to]) => s.replace(re, to), src);
  if (out !== src) { writeFileSync(file, out); n++; }
}
console.log(`rebase: ${n} Dateien auf ${b}/ umgestellt`);
