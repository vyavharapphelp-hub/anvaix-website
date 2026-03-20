/* ═══════════════════════════════════════════════════════
   ANVAIX — Main Application Script
   SPA Router, Animations, 3D Neural Nexus, Interactions
   ═══════════════════════════════════════════════════════ */

import './style.css';
import { NeuralNexus } from './neural-nexus.js';

// ── State ──
const state = {
  currentPage: 'home',
  isNavOpen: false,
  scrollY: 0,
  mouseX: 0,
  mouseY: 0,
};

// ══════════════════════════════════════════════
// SPA ROUTER (Agent 2: Seamless Navigation)
// ══════════════════════════════════════════════
function initRouter() {
  // Handle all navigation links
  document.querySelectorAll('[data-navigate]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.dataset.navigate;
      navigateTo(target);
    });
  });

  // Handle browser back/forward
  window.addEventListener('popstate', (e) => {
    const page = e.state?.page || getPageFromHash();
    navigateTo(page, false);
  });

  // Initial page from hash
  const initialPage = getPageFromHash();
  if (initialPage !== 'home') {
    navigateTo(initialPage, false);
  }
}

function getPageFromHash() {
  const hash = window.location.hash.replace('#', '');
  return hash || 'home';
}

function navigateTo(pageName, pushState = true) {
  if (pageName === state.currentPage) {
    closeNav();
    return;
  }

  const currentSection = document.querySelector('.page--active');
  const targetSection = document.getElementById(`page-${pageName}`);

  if (!targetSection) return;

  // Close mobile nav
  closeNav();

  // Fade out current
  if (currentSection) {
    currentSection.style.opacity = '0';
    currentSection.style.transform = 'translateY(-10px)';

    setTimeout(() => {
      currentSection.classList.remove('page--active');
      currentSection.style.opacity = '';
      currentSection.style.transform = '';

      // Activate new page
      targetSection.classList.add('page--active');

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'instant' });

      // Trigger enter animation
      requestAnimationFrame(() => {
        // Re-observe scroll animations on new page
        observeScrollAnimations();
        // Trigger stats count if on home
        if (pageName === 'home') {
          triggerStatCounters();
        }
      });
    }, 300);
  }

  // Update active nav link
  document.querySelectorAll('.nav__link').forEach(link => {
    link.classList.toggle('active', link.dataset.navigate === pageName);
  });

  // Update URL
  if (pushState) {
    window.history.pushState({ page: pageName }, '', `#${pageName}`);
  }

  // Update page title
  updatePageTitle(pageName);

  state.currentPage = pageName;
}

function updatePageTitle(pageName) {
  const titles = {
    'home': 'Anvaix — Intelligent Infrastructure for Business',
    'about': 'About Us — Anvaix',
    'services': 'Our Services — Anvaix',
    'ai-solutions': 'AI Solutions — Anvaix',
    'saas': 'SaaS Development — Anvaix',
    'automation': 'Automation & RPA — Anvaix',
    'computer-vision': 'Computer Vision — Anvaix',
    'contact': 'Contact — Anvaix',
  };
  document.title = titles[pageName] || 'Anvaix';
}

// ══════════════════════════════════════════════
// NAVIGATION (Agent 1)
// ══════════════════════════════════════════════
function initNav() {
  const burger = document.getElementById('nav-burger');
  const nav = document.getElementById('main-nav');

  burger.addEventListener('click', toggleNav);

  // Scroll handler
  let ticking = false;
  window.addEventListener('scroll', () => {
    state.scrollY = window.scrollY;
    if (!ticking) {
      requestAnimationFrame(() => {
        nav.classList.toggle('nav--scrolled', state.scrollY > 50);
        ticking = false;
      });
      ticking = true;
    }
  });
}

function toggleNav() {
  state.isNavOpen = !state.isNavOpen;
  document.getElementById('nav-burger').classList.toggle('active', state.isNavOpen);
  document.getElementById('nav-links').classList.toggle('open', state.isNavOpen);
  document.body.style.overflow = state.isNavOpen ? 'hidden' : '';
}

function closeNav() {
  state.isNavOpen = false;
  document.getElementById('nav-burger').classList.remove('active');
  document.getElementById('nav-links').classList.remove('open');
  document.body.style.overflow = '';
}

// ══════════════════════════════════════════════
// SCROLL ANIMATIONS (Agent 3)
// ══════════════════════════════════════════════
let scrollObserver = null;

function observeScrollAnimations() {
  // Disconnect previous observer
  if (scrollObserver) {
    scrollObserver.disconnect();
  }

  scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        scrollObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -60px 0px'
  });

  // Only observe in active page & footer
  const activePage = document.querySelector('.page--active');
  if (activePage) {
    activePage.querySelectorAll('.animate-on-scroll').forEach(el => {
      el.classList.remove('animated');
      scrollObserver.observe(el);
    });
  }

  // Footer animations
  document.querySelectorAll('#footer .animate-on-scroll').forEach(el => {
    scrollObserver.observe(el);
  });
}

// ══════════════════════════════════════════════
// STAT COUNTERS (Agent 3: Dynamic Elements)
// ══════════════════════════════════════════════
function triggerStatCounters() {
  const statElements = document.querySelectorAll('.hero__stat-number[data-count]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count);
        animateCounter(el, 0, target, 2000);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  statElements.forEach(el => {
    el.textContent = '0';
    observer.observe(el);
  });
}

function animateCounter(el, start, end, duration) {
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (end - start) * eased);

    el.textContent = current;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

// ══════════════════════════════════════════════
// CURSOR GLOW (Agent 3: Power Elements)
// ══════════════════════════════════════════════
function initCursorGlow() {
  const glow = document.getElementById('cursor-glow');
  if (!glow || window.innerWidth < 768) return;

  let animating = false;

  document.addEventListener('mousemove', (e) => {
    state.mouseX = e.clientX;
    state.mouseY = e.clientY;

    if (!animating) {
      animating = true;
      requestAnimationFrame(() => {
        glow.style.transform = `translate(${state.mouseX - 300}px, ${state.mouseY - 300}px)`;
        animating = false;
      });
    }
  });
}

// ══════════════════════════════════════════════
// 3D NEURAL NEXUS (Agent 1: 3D Visualization)
// Persistent across all pages, never resets
// ══════════════════════════════════════════════
let nexusInstance = null;

function initNeuralNexus() {
  const container = document.getElementById('canvas-bg');
  if (!container) return;

  // Only create once — persists across page transitions
  if (!nexusInstance) {
    nexusInstance = new NeuralNexus(container);
  }
}

// ══════════════════════════════════════════════
// CONTACT FORM — Web3Forms Integration
// Displayed email: hello@anvaix.com
// Actual recipient: aumsai@anvaix.com (via Web3Forms)
// ══════════════════════════════════════════════

// ⚠️ REPLACE THIS with your real Web3Forms access key
// Get it free at: https://web3forms.com (enter aumsai@anvaix.com)
const WEB3FORMS_KEY = '9abbee91-44a0-4225-b268-a1eee7b8c743';

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Basic client-side validation
    const name = form.querySelector('#contact-name');
    const email = form.querySelector('#contact-email');
    const message = form.querySelector('#contact-message');

    let valid = true;

    [name, email, message].forEach(field => {
      field.style.borderColor = '';
      if (!field.value.trim()) {
        field.style.borderColor = '#ff4444';
        valid = false;
      }
    });

    // Email validation
    if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      email.style.borderColor = '#ff4444';
      valid = false;
    }

    if (!valid) return;

    // Sanitize inputs (XSS prevention)
    const sanitize = (str) => {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    };

    const btn = form.querySelector('#contact-submit');
    const originalHTML = btn.innerHTML;

    // Show loading state
    btn.innerHTML = '<span>Sending...</span>';
    btn.disabled = true;
    btn.style.opacity = '0.7';

    // Build form payload for Web3Forms
    const payload = {
      access_key: WEB3FORMS_KEY,
      subject: `New Inquiry from ${sanitize(name.value.trim())}${form.querySelector('#contact-urgent').checked ? ' ⚡ URGENT' : ''}`,
      from_name: sanitize(name.value.trim()),
      email: sanitize(email.value.trim()),
      company: sanitize(form.querySelector('#contact-company').value.trim()) || 'Not specified',
      service_area: form.querySelector('#contact-service').value || 'Not selected',
      message: sanitize(message.value.trim()),
      urgent: form.querySelector('#contact-urgent').checked ? 'Yes' : 'No',
      // Honeypot for spam prevention
      botcheck: '',
    };

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        // Success
        btn.innerHTML = '<span>Message Sent ✓</span>';
        btn.style.background = 'linear-gradient(135deg, #00cc88, #00f0ff)';
        btn.style.opacity = '1';
        form.reset();

        setTimeout(() => {
          btn.innerHTML = originalHTML;
          btn.style.background = '';
          btn.disabled = false;
        }, 4000);
      } else {
        throw new Error(result.message || 'Submission failed');
      }
    } catch (err) {
      // Error state
      btn.innerHTML = '<span>Failed — Try Again</span>';
      btn.style.background = 'linear-gradient(135deg, #ff4444, #ff6666)';
      btn.style.opacity = '1';
      console.error('Form submission error:', err);

      setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.style.background = '';
        btn.disabled = false;
      }, 3000);
    }
  });

  // Real-time validation feedback
  form.querySelectorAll('input, textarea').forEach(field => {
    field.addEventListener('input', () => {
      if (field.style.borderColor === 'rgb(255, 68, 68)') {
        field.style.borderColor = '';
      }
    });
  });
}

// ══════════════════════════════════════════════
// SERVICE CARD CLICKS
// ══════════════════════════════════════════════
function initServiceCards() {
  document.querySelectorAll('.service-card[data-navigate], .service-detailed[data-navigate]').forEach(card => {
    card.addEventListener('click', () => {
      const target = card.dataset.navigate;
      if (target) navigateTo(target);
    });
  });
}

// ══════════════════════════════════════════════
// SMOOTH HOVER EFFECTS (Agent 3: Micro-animations)
// ══════════════════════════════════════════════
function initHoverEffects() {
  // Add tilt effect to cards
  document.querySelectorAll('.service-card, .why-card, .vision-module__card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / centerY * -3;
      const rotateY = (x - centerX) / centerX * 3;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// ══════════════════════════════════════════════
// INITIALIZE (Agent 4: Performance)
// ══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initRouter();
  initCursorGlow();
  initNeuralNexus(); // 3D Neural Nexus replaces 2D particles
  initContactForm();
  initServiceCards();
  initHoverEffects();

  // Initial animations
  observeScrollAnimations();
  triggerStatCounters();

  // Performance: defer non-critical
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Preload fonts
      document.fonts.ready.then(() => {
        document.body.classList.add('fonts-loaded');
      });
    });
  }
});

// CSP-friendly: no inline scripts, all event handlers attached programmatically
// All user inputs sanitized before display
// No external dependencies loaded at runtime
