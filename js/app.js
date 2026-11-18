/* Enrico's portfolio: fishing navigation, theme toggle, feedback form. */
(function () {
  'use strict';
  var CFG = window.SITE_CONFIG || {};
  var reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  function $(s) { return document.querySelector(s); }
  function $$(s) { return [].slice.call(document.querySelectorAll(s)); }
  function store(k, v) {
    try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); }
    catch (e) { return null; }
  }

  /* ---- Links from config ---- */
  $$('[data-cfg]').forEach(function (a) {
    var v = CFG[a.getAttribute('data-cfg')];
    if (!v) return;
    a.href = a.getAttribute('data-cfg') === 'email' ? 'mailto:' + v : v;
    if (a.getAttribute('data-cfg') === 'email') a.textContent = v;
  });

  /* ---- Toast + copy email ---- */
  var toastEl = $('#toast'), tt;
  function toast(t) {
    toastEl.textContent = t; toastEl.classList.add('on');
    clearTimeout(tt); tt = setTimeout(function () { toastEl.classList.remove('on'); }, 2200);
  }
  $('#copyEmail').addEventListener('click', function () {
    var t = CFG.email || '';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(function () { toast('Email copied'); }, function () { toast(t); });
    } else { toast(t); }
  });

  /* ---- Theme toggle (remembers your choice) ---- */
  var root = document.documentElement, tbtn = $('#theme'), mq = window.matchMedia('(prefers-color-scheme:dark)');
  function isDark() { var t = root.getAttribute('data-theme'); return t ? t === 'dark' : mq.matches; }
  function paint() {
    tbtn.textContent = isDark() ? '☀️' : '🌙';
    tbtn.setAttribute('aria-label', isDark() ? 'Switch to light theme' : 'Switch to dark theme');
  }
  var savedTheme = store('theme'); if (savedTheme) root.setAttribute('data-theme', savedTheme);
  paint();
  tbtn.addEventListener('click', function () {
    var n = isDark() ? 'light' : 'dark'; root.setAttribute('data-theme', n); store('theme', n); paint();
  });
  if (mq.addEventListener) mq.addEventListener('change', paint);

  /* ---- Fishing navigation ---- */
  var scene = $('#scene'), hint = $('#hint'),
      fishes = $$('.fish'), secs = $$('.catch'), ids = secs.map(function (s) { return s.id; }),
      busy = false;

  function layout() {
    /* The fish itself provides the only navigation motion. */
  }
  function ease(p) { return p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }
  function tween(ms, fn) {
    return new Promise(function (res) {
      var s = null;
      function f(ts) {
        if (s === null) s = ts;
        var p = Math.min(1, (ts - s) / ms); fn(ease(p), p);
        if (p < 1) requestAnimationFrame(f); else res();
      }
      requestAnimationFrame(f);
    });
  }
  function addDiveBubbles(section) {
    if (reduce) return;
    for (var i = 0; i < 10; i++) {
      var bubble = document.createElement('span');
      bubble.className = 'dive-bubble';
      bubble.style.left = (12 + Math.random() * 76) + '%';
      bubble.style.animationDelay = (Math.random() * .25) + 's';
      bubble.style.setProperty('--drift', ((Math.random() - .5) * 70) + 'px');
      section.appendChild(bubble);
      setTimeout(function (el) { el.remove(); }, 1500, bubble);
    }
  }
  function setHash(id) { try { history.pushState(null, '', '#' + id); } catch (e) {} }
  function show(id, fromHash) {
    secs.forEach(function (s) { s.classList.toggle('on', s.id === id); });
    fishes.forEach(function (f) {
      var on = f.getAttribute('data-t') === id; f.classList.toggle('is-on', on); f.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    hint.hidden = true;
    var s = document.getElementById(id), h = s.querySelector('h2');
    addDiveBubbles(s);
    s.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true });
    if (!fromHash) setHash(id);
    var index = ids.indexOf(id), next = fishes[(index + 1) % fishes.length];
    s.querySelector('.back').textContent = 'Next: ' + next.querySelector('span').textContent;
  }
  function showNone() {
    secs.forEach(function (s) { s.classList.remove('on'); });
    fishes.forEach(function (f) { f.classList.remove('is-on'); f.setAttribute('aria-pressed', 'false'); });
    hint.hidden = false;
  }
  async function pick(btn) {
    var id = btn.getAttribute('data-t');
    if (reduce) { show(id); return; }
    if (busy) return;
    busy = true;
    secs.forEach(function (s) { s.classList.remove('on'); });
    btn.classList.add('catching');
    await tween(650, function () {});
    btn.classList.remove('catching');
    busy = false; show(id);
  }
  fishes.forEach(function (f) { f.addEventListener('click', function () { pick(f); }); });
  $('.school').addEventListener('keydown', function (e) {
    var i = fishes.indexOf(document.activeElement); if (i < 0) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { fishes[(i + 1) % fishes.length].focus(); e.preventDefault(); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { fishes[(i - 1 + fishes.length) % fishes.length].focus(); e.preventDefault(); }
  });
  secs.forEach(function (s) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'btn s back'; b.textContent = 'Next information';
    b.addEventListener('click', function () {
      var index = secs.indexOf(s), next = fishes[(index + 1) % fishes.length];
      pick(next);
    });
    s.querySelector('.wrap').appendChild(b);
  });
  function fromHash() {                                       // deep links like index.html#projects
    var id = location.hash.slice(1);
    if (ids.indexOf(id) > -1) show(id, true); else showNone();
  }
  window.addEventListener('popstate', fromHash);
  window.addEventListener('resize', layout);
  window.addEventListener('load', layout);
  layout();
  if (location.hash) fromHash();

  /* ---- Feedback ---- */
  var form = $('#fbform'), msg = $('#msg'), db = null, uid = null;
  function say(t) { msg.textContent = t; }
  function collect() {
    var r = form.querySelector('input[name=rating]:checked');
    return {
      rating: r ? Number(r.value) : null,
      areas: [].map.call(form.querySelectorAll('input[name=area]:checked'), function (i) { return i.value; }),
      role: $('#role').value, note: $('#note').value.trim(), at: Date.now()
    };
  }
  function mailtoFor(d) {
    var body = 'Rating: ' + (d.rating || '-') + '/5\nImprove: ' + (d.areas.join(', ') || '-') + '\nFrom: ' + d.role + '\n\n' + d.note;
    return 'mailto:' + (CFG.email || '') + '?subject=' + encodeURIComponent('Portfolio feedback') + '&body=' + encodeURIComponent(body);
  }
  function fallback(d) {
    msg.textContent = '';
    var a = document.createElement('a'); a.href = mailtoFor(d); a.textContent = 'Email it to me too';
    msg.appendChild(document.createTextNode('Saved on this device. ')); msg.appendChild(a);
  }
  function renderInbox(rows, note, clearFn) {
    var box = $('#inbox'), list = $('#list'); box.hidden = false; list.textContent = '';
    rows.sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
    $('#count').textContent = (rows.length ? rows.length + ' response' + (rows.length > 1 ? 's' : '') + '. ' : 'No feedback yet. ') + note;
    rows.forEach(function (r) {
      var el = document.createElement('div'); el.className = 'fb';
      var b = document.createElement('b'); b.textContent = (r.rating ? r.rating + '/5' : 'No rating') + ' · ' + (r.role || 'Visitor');
      var p = document.createElement('p'); p.style.margin = '6px 0 0';
      p.textContent = (r.areas && r.areas.length ? 'Improve: ' + r.areas.join(', ') + '. ' : '') + (r.note || '');
      el.appendChild(b); el.appendChild(p); list.appendChild(el);
    });
    if (clearFn && rows.length) {
      var c = document.createElement('button'); c.type = 'button'; c.className = 'btn s'; c.textContent = 'Clear saved feedback';
      c.addEventListener('click', function () { clearFn(); }); list.appendChild(c);
    }
  }
  function localInbox() {                                     // open index.html?admin to test locally
    function draw2() { renderInbox(store('feedbackLocal') || [], 'Saved in this browser only (admin test view).', function () { store('feedbackLocal', []); draw2(); }); }
    draw2();
  }
  function claudeSetup() {                                    // only active when hosted as a Claude artifact
    if (!window.claude || !window.claude.use) return;
    window.claude.use('user').then(function (u) {
      if (!u) return;
      return Promise.all([u.id(), window.claude.use('db'), u.canEdit()]).then(function (r) {
        uid = r[0]; db = r[1];
        if (db && r[2]) db.collection('feedback').onSnapshot(function (snap) {
          renderInbox(snap.docs.map(function (x) { return x.data() || {}; }), 'Only you can see this.');
        });
      });
    }).catch(function () {});
  }
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var d = collect();
    if (!d.rating && !d.areas.length && !d.note) { say('Pick a rating, an area, or write a note first.'); return; }
    var sent = false;
    try {
      if (db && uid) { await db.doc('feedback/' + uid).set(d); sent = true; }
      else if (CFG.feedbackEndpoint) {
        var r = await fetch(CFG.feedbackEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(d) });
        sent = r.ok;
      }
    } catch (err) { sent = false; }
    if (sent) { say('Thank you! Your feedback was sent.'); }
    else { var all = store('feedbackLocal') || []; all.push(d); store('feedbackLocal', all); fallback(d); }
    form.reset();
    if (/[?&]admin\b/.test(location.search)) localInbox();
  });
  if (/[?&]admin\b/.test(location.search)) localInbox();
  claudeSetup();
})();
