/**
 * RE-TRACK — Motion Controller & Lenis Smooth Scrolling Engine
 * Integrates GSAP + ScrollTrigger + Lenis with zero feature loss
 */

(function () {
  'use strict';

  // 1. Lenis Smooth Scroll Setup
  let lenis = null;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.5,
      infinite: false
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // 2. GSAP Enhanced Interactions
  function initMotionMicroInteractions() {
    if (typeof gsap === 'undefined') return;

    // Register ScrollTrigger if available
    if (typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
    }

    // Hero entrance sequence on Home Tab
    const heroTitle = document.querySelector('.main-heading');
    const heroSubtext = document.querySelector('.hero-subtext');
    const brandBadge = document.querySelector('.home-brand-badge');
    const statCards = document.querySelectorAll('.stat-card');

    if (heroTitle && statCards.length > 0) {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      if (brandBadge) {
        tl.from(brandBadge, { opacity: 0, y: -15, duration: 0.7 });
      }

      tl.from(heroTitle, {
        opacity: 0,
        y: 20,
        filter: 'blur(8px)',
        duration: 0.9
      }, '-=0.4');

      if (heroSubtext) {
        tl.from(heroSubtext, {
          opacity: 0,
          y: 15,
          duration: 0.6
        }, '-=0.5');
      }

      tl.from(statCards, {
        opacity: 0,
        y: 25,
        stagger: 0.12,
        duration: 0.7,
        ease: 'back.out(1.4)'
      }, '-=0.3');
    }

    // Interactive 3D Card Hover Tilt Rig
    const tiltCards = document.querySelectorAll('.stat-card, .chart-card, .table-card, .month-selector-card, .quick-card');
    tiltCards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        const rotX = -(y / (rect.height / 2)) * 4.5;
        const rotY = (x / (rect.width / 2)) * 4.5;

        gsap.to(card, {
          rotateX: rotX,
          rotateY: rotY,
          transformPerspective: 900,
          ease: 'power1.out',
          duration: 0.35
        });
      });

      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          rotateX: 0,
          rotateY: 0,
          ease: 'power2.out',
          duration: 0.5
        });
      });
    });

    // Custom Interactive Magnetic Cursor Glow
    const cursorGlow = document.getElementById('cursor-glow');
    if (cursorGlow) {
      let mouseX = 0, mouseY = 0;
      let posX = 0, posY = 0;

      window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursorGlow.style.opacity = '1';
      }, { passive: true });

      function renderCursor() {
        posX += (mouseX - posX) * 0.12;
        posY += (mouseY - posY) * 0.12;
        cursorGlow.style.transform = `translate3d(${posX}px, ${posY}px, 0)`;
        requestAnimationFrame(renderCursor);
      }
      renderCursor();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMotionMicroInteractions);
  } else {
    initMotionMicroInteractions();
  }
})();
