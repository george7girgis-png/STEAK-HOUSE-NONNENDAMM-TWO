// Reservierungsanfrage: Validierung und ehrliche Statusmeldungen.
// Mit Endpunkt: POST als JSON, Erfolg nur bei positiver Serverantwort.
// Ohne Endpunkt: vorbereitete E-Mail an das Restaurant (mailto), kein vorgetäuschter Versand.

const pad = (n) => String(n).padStart(2, '0');
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const deDate = (iso) => iso.split('-').reverse().join('.');

function messageFor(input, form) {
  const v = input.value.trim();
  const phone = form.dataset.phone;
  switch (input.name) {
    case 'name':
      return v ? '' : 'Bitte geben Sie Ihren Namen an.';
    case 'email':
      if (!v) return 'Bitte geben Sie Ihre E-Mail-Adresse an.';
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Die E-Mail-Adresse ist ungültig.';
    case 'telefon':
      if (!v) return 'Bitte geben Sie eine Rückrufnummer an.';
      return v.replace(/\D/g, '').length >= 6 ? '' : 'Bitte geben Sie eine gültige Telefonnummer an.';
    case 'datum': {
      if (!v) return 'Bitte wählen Sie ein Datum.';
      const today = isoDate(new Date());
      if (v < today) return 'Das Datum liegt in der Vergangenheit.';
      if (v === today) return `Reservierungen für heute nehmen wir gerne telefonisch entgegen: ${phone}.`;
      return '';
    }
    case 'uhrzeit':
      if (!v) return 'Bitte wählen Sie eine Uhrzeit.';
      return v >= input.min && v <= input.max ? '' : 'Wir haben täglich von 12:00 bis 24:00 Uhr geöffnet.';
    case 'personen': {
      if (!v) return 'Bitte geben Sie die Anzahl der Personen an.';
      const n = Number(v);
      return Number.isInteger(n) && n >= 1 ? '' : 'Bitte geben Sie eine ganze Zahl ab 1 an.';
    }
  }
  return '';
}

function showError(form, input, msg) {
  const el = form.querySelector(`[data-error-for="${input.name}"]`);
  el.textContent = msg;
  if (msg) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
}

function setStatus(form, kind, html) {
  const s = form.querySelector('[data-status]');
  s.dataset.kind = kind;
  s.innerHTML = html;
  s.classList.add('is-visible');
  s.focus({ preventScroll: false });
}

function initForm(form) {
  const inputs = [...form.querySelectorAll('input')];
  const date = form.querySelector('[name="datum"]');
  date.min = isoDate(new Date());
  const summary = form.querySelector('[data-summary]');
  const list = form.querySelector('[data-summary-list]');
  const phone = form.dataset.phone;
  const phoneHref = `tel:${phone.replace(/\s/g, '')}`;

  inputs.forEach((i) => {
    i.addEventListener('blur', () => { if (i.value) showError(form, i, messageFor(i, form)); });
    i.addEventListener('input', () => { if (i.getAttribute('aria-invalid')) showError(form, i, messageFor(i, form)); });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    list.innerHTML = '';
    const errors = [];
    inputs.forEach((i) => {
      const m = messageFor(i, form);
      showError(form, i, m);
      if (m) errors.push([i, m]);
    });
    if (errors.length) {
      errors.forEach(([i, m]) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#${i.id}`;
        a.textContent = m;
        a.addEventListener('click', (ev) => { ev.preventDefault(); i.focus(); });
        li.append(a);
        list.append(li);
      });
      summary.classList.add('is-visible');
      summary.focus();
      return;
    }
    summary.classList.remove('is-visible');

    const data = Object.fromEntries(inputs.map((i) => [i.name, i.value.trim()]));
    const endpoint = form.dataset.endpoint;
    const btn = form.querySelector('[type="submit"]');

    if (endpoint) {
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(String(res.status));
        setStatus(form, 'success',
          `<p><strong>Vielen Dank, Ihre Anfrage ist bei uns eingegangen.</strong></p>
           <p>Bitte beachten Sie: Die Reservierung ist erst gültig, wenn wir sie bestätigt haben. Wir melden uns unter der angegebenen Rückrufnummer oder per E-Mail.</p>`);
        form.reset();
        date.min = isoDate(new Date());
      } catch {
        setStatus(form, 'error',
          `<p><strong>Die Anfrage konnte nicht gesendet werden.</strong></p>
           <p>Bitte versuchen Sie es später noch einmal oder rufen Sie uns an: <a href="${phoneHref}">${phone}</a>.</p>`);
      } finally {
        btn.disabled = false;
        btn.removeAttribute('aria-busy');
      }
      return;
    }

    const subject = `Reservierungsanfrage ${deDate(data.datum)}, ${data.uhrzeit} Uhr, ${data.personen} Pers.`;
    const body = [
      'Guten Tag,', '', 'ich möchte gerne einen Tisch anfragen:', '',
      `Name: ${data.name}`, `Datum: ${deDate(data.datum)}`, `Uhrzeit: ${data.uhrzeit} Uhr`,
      `Personen: ${data.personen}`, `Rückrufnummer: ${data.telefon}`, `E-Mail: ${data.email}`, '',
      'Mir ist bewusst, dass die Reservierung erst nach Ihrer Bestätigung gültig ist.', '', 'Viele Grüße',
    ].join('\n');
    const href = `mailto:${form.dataset.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setStatus(form, 'info',
      `<p><strong>Ihre Anfrage ist noch nicht verschickt.</strong></p>
       <p>Wir haben eine E-Mail mit Ihren Angaben vorbereitet. Bitte senden Sie diese in Ihrem E-Mail-Programm ab. Die Reservierung ist erst nach unserer Bestätigung gültig.</p>
       <p><a class="btn btn--solid" href="${href}">E-Mail öffnen</a> &nbsp; oder anrufen: <a href="${phoneHref}">${phone}</a></p>`);
    window.location.href = href;
  });
}

document.querySelectorAll('[data-reservation]').forEach(initForm);
