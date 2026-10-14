const calm = matchMedia('(prefers-reduced-motion:reduce)').matches;
const still = !!document.querySelector('.masonry'); // galerías: las fotos no se mueven
const mk = id => { const d = document.createElement('div'); d.id = id; document.body.appendChild(d); return d; };
const fl = mk('flash'), bar = mk('progress'), wipe = mk('wipe');

// scroll con inercia (Lenis)
const lenis = window.Lenis && !calm ? new Lenis({ lerp: .09 }) : null;
const lock = on => lenis && (on ? lenis.stop() : lenis.start());

let mx = -999, my = -999, lastMove = 0;
addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; lastMove = performance.now(); }, { passive: true });

// menú móvil
const links = document.querySelector('.navlinks'), btn = document.querySelector('.menu-btn');
btn.addEventListener('click', () => { const o = links.classList.toggle('open'); btn.textContent = o ? 'Cerrar' : 'Menú'; lock(o); });
links.addEventListener('click', e => { if (e.target.closest('a')) { links.classList.remove('open'); btn.textContent = 'Menú'; lock(false); } });

// enlaces: ancla suave en la misma página, franja de transición entre páginas
document.addEventListener('click', e => {
  const a = e.target.closest('a[href]');
  if (!a || e.ctrlKey || e.metaKey || a.target === '_blank') return;
  const h = a.getAttribute('href');
  if (!h || /^(mailto:|tel:|https?:)/.test(h)) return;
  const u = new URL(a.href);
  if (u.pathname === location.pathname) { if (u.hash && lenis) { e.preventDefault(); lenis.scrollTo(u.hash); } return; }
  if (calm) return;
  e.preventDefault();
  wipe.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: 550, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' }).onfinish = () => location.href = h;
});
addEventListener('pageshow', e => { if (e.persisted) wipe.getAnimations().forEach(a => a.cancel()); });

// títulos: cada letra reacciona al ratón
document.querySelectorAll('h1 .word>span').forEach(s => {
  const t = s.textContent; s.textContent = '';
  [...t].forEach(c => { const i = document.createElement('i'); i.textContent = c === ' ' ? '\u00a0' : c; s.appendChild(i); });
});
setTimeout(() => document.querySelectorAll('h1').forEach(h => h.classList.add('done')), 1700);
const H = document.querySelector('h1');
const letters = [...document.querySelectorAll('h1 i')].map(el => ({ el, x: 0, y: 0, r: 0, s: 1 }));
letters.forEach(L => L.el.addEventListener('click', () => L.el.animate([{ rotate: '0deg' }, { rotate: '360deg' }], { duration: 750, easing: 'cubic-bezier(.2,.8,.2,1)' })));

// fotos
const figs = [...document.querySelectorAll('figure')];
const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .12 });
figs.forEach(f => {
  io.observe(f);
  f.addEventListener('mousedown', () => { if (f.closest('.masonry,.gallery-section')) { fl.classList.remove('go'); void fl.offsetWidth; fl.classList.add('go'); } });
  if (still || calm) return; // en las galerías no hay inclinación ni movimiento
  f.addEventListener('mouseenter', () => f.classList.add('hov'));
  f.addEventListener('mousemove', e => {
    if (!f.classList.contains('in')) return;
    const r = f.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    f.style.setProperty('--mx', x * 100 + '%'); f.style.setProperty('--my', y * 100 + '%');
    f.style.transform = `perspective(900px) rotateX(${(.5 - y) * 18}deg) rotateY(${(x - .5) * 18}deg) scale(1.05)`;
  }, { passive: true });
  f.addEventListener('mouseleave', () => { f.classList.remove('hov'); f.style.transform = ''; });
});

// imanes en botones y enlaces
const mags = [...document.querySelectorAll('.navlinks>a,.send,footer .big a,.footgrid a,.brand')];
mags.forEach(m => { m.classList.add('mag'); m._x = m._y = 0; });
if (!calm) addEventListener('mousemove', e => mags.forEach(m => {
  const r = m.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2 - m._x), dy = e.clientY - (r.top + r.height / 2 - m._y);
  const on = Math.hypot(dx, dy) < 120; m._x = on ? dx * .4 : 0; m._y = on ? dy * .4 : 0;
  m.style.translate = on ? `${m._x}px ${m._y}px` : '';
}), { passive: true });

// bucle único de animación
const h1 = document.querySelector('.hero h1');
const mq = document.querySelector('.marquee');
const rows = [...document.querySelectorAll('.row')];
const imgs = [...document.querySelectorAll('.masonry figure img, .gallery-section figure img')];
let lastY = scrollY, vel = 0, mqx = 0, drawnY = -1, first = true;
function tick(t) {
  if (lenis) lenis.raf(t);
  const y = scrollY;
  vel += ((y - lastY) - vel) * .15; lastY = y;
  if (y !== drawnY) {
    drawnY = y;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    if (h1) { h1.style.transform = `translateY(${y * .15}px)`; h1.style.opacity = Math.max(1 - y / 500, 0); }
  }
  if (!calm) {
    if (mq) { const half = mq.scrollWidth / 2; mqx -= 2 + vel * 1.2; mqx = ((mqx % half) + half) % half; mq.style.transform = `translateX(${mqx - half}px)`; }
    if (!still && (first || Math.abs(vel) > .02)) { // portada: filas a contramarcha + parallax dentro de la foto
      first = false;
      const rr = rows.map(r => r.getBoundingClientRect()), fr = figs.map(f => f.getBoundingClientRect());
      rows.forEach((row, i) => row.style.translate = `${(i % 2 ? 1 : -1) * ((rr[i].top + rr[i].height / 2 - innerHeight / 2) / innerHeight) * -140}px 0`);
      figs.forEach((f, i) => {
        const r = fr[i]; if (r.bottom < 0 || r.top > innerHeight || !f.firstElementChild) return;
        f.firstElementChild.style.translate = `0 ${(-((r.top + r.height / 2 - innerHeight / 2) / innerHeight) * r.height * .08).toFixed(1)}px`;
      });
    }
    // letras: solo mientras se mueve el ratón cerca de la cabecera
    if (y < innerHeight * .8 && H.classList.contains('done') && t - lastMove < 2500) letters.forEach(L => {
      const r = L.el.getBoundingClientRect(), cx = r.left + r.width / 2 - L.x, cy = r.top + r.height / 2 - L.y, d = Math.hypot(cx - mx, cy - my);
      let tx = 0, ty = 0, tr = 0, ts = 1;
      if (d < 240) { const q = 1 - d / 240; tx = (cx - mx) / (d || 1) * q * 90; ty = (cy - my) / (d || 1) * q * 90; tr = (cx - mx) * .06 * q; ts = 1 + q * .4; }
      L.x += (tx - L.x) * .18; L.y += (ty - L.y) * .18; L.r += (tr - L.r) * .18; L.s += (ts - L.s) * .18;
      L.el.style.translate = `${L.x.toFixed(1)}px ${L.y.toFixed(1)}px`; L.el.style.rotate = L.r.toFixed(1) + 'deg'; L.el.style.scale = L.s.toFixed(2);
      L.el.classList.toggle('hot', ts > 1.15);
    });
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// lightbox
if (imgs.length) {
  const lb = document.createElement('div');
  lb.id = 'lb';
  lb.innerHTML = '<img alt=""><button class="x" aria-label="Cerrar">✕</button><button class="p" aria-label="Anterior">←</button><button class="n" aria-label="Siguiente">→</button>';
  document.body.appendChild(lb);
  let cur = 0;
  const show = i => { cur = (i + imgs.length) % imgs.length; lb.querySelector('img').src = imgs[cur].src; lb.classList.add('open'); lock(true); };
  const close = () => { lb.classList.remove('open'); lock(false); };
  imgs.forEach((im, i) => im.closest('figure').addEventListener('click', () => show(i)));
  lb.addEventListener('click', e => {
    if (e.target.classList.contains('p')) show(cur - 1);
    else if (e.target.classList.contains('n')) show(cur + 1);
    else close();
  });
  addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(cur - 1);
    if (e.key === 'ArrowRight') show(cur + 1);
  });
}

// modo claro / oscuro (con onda circular desde el botón)
const root = document.documentElement;
const setTheme = t => { root.dataset.theme = t; try { localStorage.setItem('theme', t); } catch (e) {} };
document.querySelector('.theme-btn').addEventListener('click', e => {
  const next = root.dataset.theme === 'light' ? 'dark' : 'light';
  if (!document.startViewTransition || calm) return setTheme(next);
  const r = e.currentTarget.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
  const rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  document.startViewTransition(() => setTheme(next)).ready.then(() => root.animate(
    { clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${rad}px at ${x}px ${y}px)`] },
    { duration: 700, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' }));
});
