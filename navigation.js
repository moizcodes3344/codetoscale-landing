'use strict';
// Shared keyboard-accessible navigation for static content pages. The homepage
// keeps its existing richer script and form integration.
(() => {
  const button = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#mobile-menu');
  if (!button || !menu) return;
  const background = [...document.querySelectorAll('main, .site-footer, .skip-link, .nav-shell .brand, .nav-cta')];
  const previous = new Map();
  function setMenu(open, focus = false) {
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    menu.classList.toggle('is-open', open);
    menu.inert = !open;
    document.body.classList.toggle('menu-open', open);
    background.forEach(element => {
      if (open) { if (!previous.has(element)) previous.set(element, element.inert); element.inert = true; }
      else if (previous.has(element)) { element.inert = previous.get(element); previous.delete(element); }
    });
    if (focus) button.focus();
  }
  button.addEventListener('click', () => setMenu(button.getAttribute('aria-expanded') !== 'true'));
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  window.matchMedia('(min-width: 1101px)').addEventListener('change', event => { if (event.matches) setMenu(false); });
  document.addEventListener('keydown', event => {
    if (button.getAttribute('aria-expanded') !== 'true') return;
    if (event.key === 'Escape') setMenu(false, true);
    if (event.key !== 'Tab') return;
    const last = [...menu.querySelectorAll('a')].at(-1);
    if (event.shiftKey && document.activeElement === button) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); button.focus(); }
  });
})();
