const calm = matchMedia('(prefers-reduced-motion:reduce)').matches;
const mk = id => { const d = document.createElement('div'); d.id = id; document.body.appendChild(d); return d; };
const fl = mk('flash'), bar = mk('progress'), wipe = mk('wipe');
const imgs = [...document.querySelectorAll('.masonry figure img, .gallery-section figure img')]; // orden original

// galerías: columnas independientes (las fotos se reparten 1,2,3,1,2,3…) y espacio reservado según la proporción real
const M = document.querySelector('.masonry');
if (M) {
  const all = [...M.querySelectorAll('figure')]; let cnt = 0;
  const build = () => {
    const c = innerWidth > 900 ? 3 : 2; if (c === cnt) return; cnt = c;
    M.classList.add('cols'); M.textContent = '';
    const cols = Array.from({ length: c }, () => { const d = document.createElement('div'); d.className = 'mcol'; M.appendChild(d); return d; });
    all.forEach((f, i) => cols[i % c].appendChild(f));
  };
  build(); addEventListener('resize', build);
  all.forEach(f => { const im = f.querySelector('img'), set = () => { if (im.naturalWidth) f.style.aspectRatio = im.naturalWidth + '/' + im.naturalHeight; };
    set(); im.addEventListener('load', set, { once: true }); });
}

// menú móvil
const links = document.querySelector('.navlinks'), btn = document.querySelector('.menu-btn');
btn.addEventListener('click', () => { const o = links.classList.toggle('open'); btn.textContent = o ? 'Cerrar' : 'Menú'; });
links.addEventListener('click', e => { if (e.target.closest('a')) { links.classList.remove('open'); btn.textContent = 'Menú'; } });

// franja de transición entre páginas
document.addEventListener('click', e => {
  const a = e.target.closest('a[href]');
  if (!a || calm || e.ctrlKey || e.metaKey || a.target === '_blank') return;
  const h = a.getAttribute('href');
  if (!h || /^(mailto:|tel:|https?:)/.test(h) || new URL(a.href).pathname === location.pathname) return;
  e.preventDefault();
  wipe.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: 400, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' }).onfinish = () => location.href = h;
});
addEventListener('pageshow', e => { if (e.persisted) wipe.getAnimations().forEach(a => a.cancel()); });

// títulos: letras que reaccionan al ratón
document.querySelectorAll('h1 .word>span').forEach(s => {
  const t = s.textContent; s.textContent = '';
  [...t].forEach(c => { const i = document.createElement('i'); i.textContent = c === ' ' ? '\u00a0' : c; s.appendChild(i); });
});
const letters = [...document.querySelectorAll('h1 i')].map(el => ({ el, x: 0, y: 0, r: 0, s: 1, tx: 0, ty: 0, tr: 0, ts: 1, cx: 0, cy: 0 }));
letters.forEach(L => L.el.addEventListener('click', () => L.el.animate([{ rotate: '0deg' }, { rotate: '360deg' }], { duration: 750, easing: 'cubic-bezier(.2,.8,.2,1)' })));
let ready = false, running = false;
const measure = () => letters.forEach(L => { const r = L.el.getBoundingClientRect(); L.cx = r.left + r.width / 2 - L.x; L.cy = r.top + r.height / 2 - L.y + scrollY; });
setTimeout(() => { document.querySelectorAll('h1').forEach(h => h.classList.add('done')); measure(); ready = true; }, 1300);
addEventListener('resize', () => ready && measure());
function step() {
  let moving = false;
  letters.forEach(L => {
    L.x += (L.tx - L.x) * .18; L.y += (L.ty - L.y) * .18; L.r += (L.tr - L.r) * .18; L.s += (L.ts - L.s) * .18;
    if (Math.abs(L.tx - L.x) > .2 || Math.abs(L.ty - L.y) > .2 || Math.abs(L.ts - L.s) > .005) moving = true;
    L.el.style.translate = `${L.x.toFixed(1)}px ${L.y.toFixed(1)}px`; L.el.style.rotate = L.r.toFixed(1) + 'deg'; L.el.style.scale = L.s.toFixed(2);
    L.el.classList.toggle('hot', L.s > 1.15);
  });
  if (moving) requestAnimationFrame(step); else running = false;
}
if (!calm) addEventListener('mousemove', e => {
  if (!ready || scrollY > 120) return;
  letters.forEach(L => {
    const dx = L.cx - e.clientX, dy = L.cy - scrollY - e.clientY, d = Math.hypot(dx, dy);
    if (d < 240) { const q = 1 - d / 240; L.tx = dx / (d || 1) * q * 90; L.ty = dy / (d || 1) * q * 90; L.tr = dx * .06 * q; L.ts = 1 + q * .4; }
    else { L.tx = L.ty = L.tr = 0; L.ts = 1; }
  });
  if (!running) { running = true; requestAnimationFrame(step); }
}, { passive: true });

// fotos: aparición suave y destello al hacer clic
const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .05, rootMargin: '0px 0px 120px 0px' });
document.querySelectorAll('figure').forEach(f => {
  io.observe(f);
  f.addEventListener('mousedown', () => { if (f.closest('.masonry,.gallery-section')) { fl.classList.remove('go'); void fl.offsetWidth; fl.classList.add('go'); } });
});

// imanes en el menú
const mags = [...document.querySelectorAll('.navlinks>a,.brand')];
const mm = () => mags.forEach(m => { const r = m.getBoundingClientRect(); m._cx = r.left + r.width / 2; m._cy = r.top + r.height / 2; });
if (!calm && matchMedia('(hover:hover)').matches) {
  mags.forEach(m => m.classList.add('mag')); addEventListener('load', mm); addEventListener('resize', mm);
  let pend = 0, me;
  addEventListener('mousemove', e => {
    me = e; if (pend) return;
    pend = requestAnimationFrame(() => { pend = 0;
      mags.forEach(m => { const dx = me.clientX - m._cx, dy = me.clientY - m._cy, on = Math.hypot(dx, dy) < 110; m.style.translate = on ? `${dx * .35}px ${dy * .35}px` : ''; });
    });
  }, { passive: true });
}

// lightbox
if (imgs.length) {
  const lb = document.createElement('div');
  lb.id = 'lb';
  lb.innerHTML = '<img alt=""><button class="x" aria-label="Cerrar">✕</button><button class="p" aria-label="Anterior">←</button><button class="n" aria-label="Siguiente">→</button>';
  document.body.appendChild(lb);
  let cur = 0;
  const show = i => { cur = (i + imgs.length) % imgs.length; lb.querySelector('img').src = imgs[cur].src; lb.classList.add('open'); document.body.style.overflow = 'hidden'; };
  const close = () => { lb.classList.remove('open'); document.body.style.overflow = ''; };
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

// modo claro / oscuro
const root = document.documentElement;
const setTheme = t => { root.dataset.theme = t; try { localStorage.setItem('theme', t); } catch (e) {} };
document.querySelector('.theme-btn').addEventListener('click', e => {
  const next = root.dataset.theme === 'light' ? 'dark' : 'light';
  if (!document.startViewTransition || calm) { root.classList.add('tfade'); setTheme(next); setTimeout(() => root.classList.remove('tfade'), 500); return; }
  const r = e.currentTarget.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
  const rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  document.startViewTransition(() => setTheme(next)).ready.then(() => root.animate(
    { clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${rad}px at ${x}px ${y}px)`] },
    { duration: 700, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' }));
});

const SUPABASE_URL = "https://mwafyhywpiygxkenqnhh.supabase.co";
const SUPABASE_KEY = "sb_publishable_xMjIVu9VxHJY-cR6EnQgyw_wpG1mwEY";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

document.getElementById("contactForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const email = document.getElementById("email").value;
    const mensaje = document.getElementById("mensaje").value;

    console.log(nombre, email, mensaje);

    // envío a Supabase aquí
});