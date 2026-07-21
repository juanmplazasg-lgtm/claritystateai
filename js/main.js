/* ============================================
   CLARITY STATE AI — main.js
   Vanilla JS, sin dependencias externas.

   2026-05-17: v1.5 — repivot tras feedback JMP.
     - Sección Sectores + form mailing list eliminados.
     - Embudo único = WhatsApp Business (widget flotante + 3 CTAs).
     - Particle field reemplaza foto JMP en el hero (referente aaru.com).
   ============================================ */

/* ---- Navbar scroll effect ----
   Añade la clase .scrolled al pasar 40px — el CSS la usa para el
   fondo semitransparente con blur del navbar fijo. */
const navbar = document.querySelector('.navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }, { passive: true });
}

/* ---- Smooth scroll para anclas internas ----
   Mantiene la navegación del navbar suave hacia las secciones del
   sitio (#manifiesto, #prueba-social, #quienes-somos, #cta-final).
   Trabaja en conjunto con el `scroll-behavior: smooth` declarado en
   CSS — este handler solo previene el salto duro del default browser
   y respeta el scroll-padding del navbar fijo. */
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const targetId = anchor.getAttribute('href');
    if (!targetId || targetId === '#') return;
    const target = document.querySelector(targetId);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* ---- Fade-in con IntersectionObserver ----
   Conservado del v1. Activa la transición visible cuando un elemento
   con clase .fade-in entra al viewport. Disponible para futuras
   secciones aunque no se use en el HTML actual. */
const fadeEls = document.querySelectorAll('.fade-in');
if (fadeEls.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  fadeEls.forEach((el) => observer.observe(el));
}

/* ============================================================
   Particle field del hero — patrón inspirado en aaru.com.
   Canvas 2D vanilla, sin librerías. Respeta prefers-reduced-motion.
   ============================================================ */
(function heroParticleField() {
  const canvas = document.getElementById('hero-particles');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const wrapper = canvas.parentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- Estado --- */
  let particles = [];
  let width = 0;
  let height = 0;
  let dpr = 1;
  let rafId = null;
  let isMobile = false;

  /* --- Configuración --- */
  const LINK_DISTANCE = 120; // px en CSS, no en backing store
  const PARTICLE_COLOR = 'rgba(255, 255, 255, 0.85)';
  const LINK_COLOR_RGB = '59, 130, 246'; // cian de marca

  /* --- Crear partículas por densidad de área ---
     v1.5: el canvas es full-bleed (cubre todo el hero), así que un count
     fijo se ve disperso en pantallas grandes. Densidad ~1 partícula por
     14000 px² da textura sin saturar, clamp [50, 180]. */
  function makeParticles() {
    const area = width * height;
    const target = isMobile ? 11000 : 14000;
    const count = Math.max(50, Math.min(180, Math.round(area / target)));
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5, // rango ±0.25
        vy: (Math.random() - 0.5) * 0.5,
        radius: 1.5 + Math.random(),     // 1.5–2.5
      });
    }
  }

  /* --- Redimensionar canvas con DPR (nitidez retina) --- */
  function resize() {
    const rect = wrapper.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    isMobile = width < 768;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    makeParticles();
  }

  /* --- Un frame de dibujo --- */
  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Partículas
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Mover
      p.x += p.vx;
      p.y += p.vy;

      // Bounce en bordes
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      // Dibujar partícula
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = PARTICLE_COLOR;
      ctx.fill();
    }

    // Líneas entre pares cercanos
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINK_DISTANCE) {
          const opacity = (1 - dist / LINK_DISTANCE) * 0.5;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(${LINK_COLOR_RGB}, ${opacity})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
  }

  /* --- Loop de animación --- */
  function tick() {
    if (document.hidden) {
      rafId = null;
      return;
    }
    draw();
    rafId = requestAnimationFrame(tick);
  }

  /* --- Bootstrap --- */
  resize();

  if (reducedMotion) {
    // Una frame estática y listo
    draw();
    return;
  }

  // ResizeObserver para mantener el canvas alineado al wrapper
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => resize());
    ro.observe(wrapper);
  } else {
    window.addEventListener('resize', resize);
  }

  // Pausa cuando la pestaña no es visible
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !rafId) {
      rafId = requestAnimationFrame(tick);
    }
  });

  rafId = requestAnimationFrame(tick);
})();

/* Lightbox del video "Clarity en un minuto" (C1M) */
(function () {
  const triggers = document.querySelectorAll('[data-c1m-open]');
  const modal = document.getElementById('c1m-modal');
  if (!triggers.length || !modal) return;
  const video = modal.querySelector('video');
  const closeBtn = modal.querySelector('.c1m-close');
  function open(e) {
    if (e) e.preventDefault();
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (video) { try { video.currentTime = 0; video.play(); } catch (_) {} }
  }
  function close() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    if (video) { try { video.pause(); } catch (_) {} }
  }
  triggers.forEach((t) => t.addEventListener('click', open));
  if (closeBtn) closeBtn.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) close();
  });
})();
