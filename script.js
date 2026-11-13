'use strict';

(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const menuButton = document.querySelector('.menu-toggle');
  const mobileMenu = document.querySelector('#mobile-menu');
  const desktopBreakpoint = window.matchMedia('(min-width: 1101px)');
  const menuBackground = [...document.querySelectorAll('main, .site-footer, .skip-link, .nav-shell .brand, .nav-cta')];
  const previousInert = new Map();
  const mainContent = document.querySelector('main');
  // Resolve skipped sizes once, before the browser's native anchor action.
  // Fragment entry URLs never opt into containment (see the tiny head boot).
  function prepareAnchorNavigation() {
    if (!document.documentElement.classList.contains('defer-offscreen')) return false;
    document.documentElement.classList.remove('defer-offscreen');
    void mainContent.offsetHeight;
    return true;
  }
  window.addEventListener('hashchange', () => {
    if (!prepareAnchorNavigation()) return;
    // Address-bar/history fragment changes have no preceding anchor click.
    let id;
    try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
    document.getElementById(id)?.scrollIntoView({ behavior: 'instant', block: 'start' });
  });

  function setMenu(open, restoreFocus = false) {
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    mobileMenu.classList.toggle('is-open', open);
    mobileMenu.inert = !open;
    document.body.classList.toggle('menu-open', open);
    // Keep screen readers and pointer focus out of content behind the overlay.
    menuBackground.forEach(element => {
      if (open) {
        if (!previousInert.has(element)) previousInert.set(element, element.inert);
        element.inert = true;
      } else if (previousInert.has(element)) {
        element.inert = previousInert.get(element);
        previousInert.delete(element);
      }
    });
    if (restoreFocus) menuButton.focus();
  }
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  desktopBreakpoint.addEventListener('change', event => { if (event.matches) setMenu(false); });
  document.addEventListener('keydown', event => {
    if (menuButton.getAttribute('aria-expanded') !== 'true') return;
    if (event.key === 'Escape') setMenu(false, true);
    if (event.key !== 'Tab') return;
    const links = [...mobileMenu.querySelectorAll('a')];
    const first = menuButton;
    const last = links[links.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  // Native anchor behavior preserves URLs and works without JavaScript.
  // CSS provides smooth scrolling and an offset for the sticky navigation.
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', () => {
      prepareAnchorNavigation();
      if (link.dataset.service) document.querySelector('#service').value = link.dataset.service;
      if (menuButton.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
          target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
        }
      }
    });
  });

  // Data drives the shared accessible tab panel. No HTML from visitors is inserted.
  const modules = {
    shopify: {
      object: 'storefront', title: 'Commerce that converts.',
      description: 'From bespoke Liquid themes to headless Hydrogen storefronts, every interaction is engineered around your customer’s next click.',
      specs: [['platform', 'Shopify / Shopify Plus'], ['architecture', 'Liquid / Hydrogen'], ['focus', 'Speed. UX. Conversion.'], ['integrations', 'Payments / ERP / CRM']],
      cta: 'Build with Shopify', service: 'Shopify Store Development'
    },
    woocommerce: {
      object: 'commerce', title: 'Your store. Your rules.',
      description: 'A high-performance WordPress foundation, built around your catalog, your checkout, and the integrations your business depends on.',
      specs: [['platform', 'WordPress / WooCommerce'], ['architecture', 'Custom PHP / REST API'], ['focus', 'Flexible, fast checkout'], ['integrations', 'Plugins / Payments / ERP']],
      cta: 'Build with WooCommerce', service: 'WooCommerce Solutions'
    },
    software: {
      object: 'application', title: 'Purpose-built. Future-ready.',
      description: 'From internal operations to customer-facing platforms, we turn complex requirements into reliable software your team can build on.',
      specs: [['platform', 'Next.js / Node.js'], ['architecture', 'Modular / API-first'], ['focus', 'Security. Scale. Reliability.'], ['integrations', 'REST / GraphQL / Databases']],
      cta: 'Engineer your platform', service: 'Custom Software Development'
    },
    marketing: {
      object: 'growthEngine', title: 'Turn attention into action.',
      description: 'Connect creative, acquisition, and on-site conversion in a measurable growth system, with clear experiments and continuous optimization.',
      specs: [['channels', 'Meta / Google / Organic'], ['strategy', 'Full-funnel acquisition'], ['focus', 'ROAS / SEO / Conversion'], ['measurement', 'GA4 / Events / Attribution']],
      cta: 'Build your growth engine', service: 'Performance Marketing & Growth'
    }
  };
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const panel = document.querySelector('#fleet-panel');
  const specsContainer = document.querySelector('#module-specs');
  const moduleCTA = document.querySelector('#module-cta');
  function activateModule(tab, focus = false) {
    const key = tab.dataset.module;
    const module = modules[key];
    if (!module) return;
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', tab.id);
    document.querySelector('#module-path').textContent = `~/modules/${key}.engine`;
    document.querySelector('#module-title').textContent = module.title;
    document.querySelector('#module-description').textContent = module.description;
    document.querySelector('#code-object').textContent = module.object;
    specsContainer.replaceChildren(...module.specs.map(([keyName, value], index) => {
      const line = document.createElement('p');
      const number = document.createElement('span');
      number.className = 'code-line';
      number.textContent = String(index + 2).padStart(2, '0');
      const property = document.createElement('span');
      property.className = 'code-key';
      property.textContent = `${keyName}: `;
      const content = document.createElement('span');
      content.className = 'code-value';
      content.textContent = `"${value}"`;
      line.append(number, property, content, index < module.specs.length - 1 ? ',' : '');
      return line;
    }));
    moduleCTA.firstChild.textContent = `${module.cta} `;
    moduleCTA.dataset.service = module.service;
    if (focus) tab.focus();
  }
  const tablist = document.querySelector('[role="tablist"]');
  const horizontalTabs = window.matchMedia('(max-width: 700px)');
  function syncTabOrientation() { tablist.setAttribute('aria-orientation', horizontalTabs.matches ? 'horizontal' : 'vertical'); }
  syncTabOrientation();
  horizontalTabs.addEventListener('change', syncTabOrientation);
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateModule(tab));
    tab.addEventListener('keydown', event => {
      const previous = horizontalTabs.matches ? 'ArrowLeft' : 'ArrowUp';
      const next = horizontalTabs.matches ? 'ArrowRight' : 'ArrowDown';
      let target;
      if (event.key === next) target = (index + 1) % tabs.length;
      if (event.key === previous) target = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') target = 0;
      if (event.key === 'End') target = tabs.length - 1;
      if (target === undefined) return;
      event.preventDefault();
      activateModule(tabs[target], true);
    });
  });

  // This is a labeled visual simulation, not a live infrastructure claim.
  const logContainer = document.querySelector('#runtime-log');
  const logToggle = document.querySelector('.log-toggle');
  const hero = document.querySelector('.hero');
  const decorativeMotion = [...document.querySelectorAll('.orbit-outer, .floating-ui')];
  const logMessages = ['connecting commerce.engine', 'validating api.routes', 'profiling core.web.vitals', 'syncing growth.pipeline', 'checking security.layers', 'warming application.cache', 'building your.next.chapter', 'system ready for what’s next'];
  let logIndex = 0;
  let logTimer;
  let logsPaused = reducedMotion.matches;
  let sceneVisible = false;
  let terminalVisible = false;
  function appendLog() {
    const line = document.createElement('p');
    const prompt = document.createElement('span');
    prompt.className = 'log-prompt';
    prompt.textContent = '>';
    const result = document.createElement('span');
    result.className = 'log-result';
    result.textContent = '[OK]';
    line.append(prompt, ` ${logMessages[logIndex % logMessages.length]} `, result);
    logContainer.append(line);
    while (logContainer.children.length > 3) logContainer.firstElementChild.remove();
    logIndex++;
  }
  function syncLogTimer() {
    window.clearInterval(logTimer);
    logTimer = undefined;
    if (logToggle.getAttribute('aria-pressed') !== String(logsPaused)) logToggle.setAttribute('aria-pressed', String(logsPaused));
    const action = logsPaused ? 'Play' : 'Pause';
    const accessibleLabel = `${action} hero motion and simulated runtime logs`;
    if (logToggle.getAttribute('aria-label') !== accessibleLabel) logToggle.setAttribute('aria-label', accessibleLabel);
    // Decorative glyphs are painted by CSS; only the action is label text.
    if (logToggle.textContent !== action.toUpperCase()) logToggle.textContent = action.toUpperCase();
    hero.classList.toggle('motion-paused', logsPaused);
    syncDecorativeMotion();
    if (!logsPaused && !document.hidden && terminalVisible) logTimer = window.setInterval(appendLog, 2800);
  }
  logToggle.addEventListener('click', () => { logsPaused = !logsPaused; syncLogTimer(); });
  reducedMotion.addEventListener('change', event => { logsPaused = event.matches; syncLogTimer(); });
  document.addEventListener('visibilitychange', syncLogTimer);
  if ('IntersectionObserver' in window) {
    // On phones the terminal is below the first screen even while the hero
    // copy is visible. Do not re-layout its simulated logs until it is seen.
    const terminalObserver = new IntersectionObserver(entries => {
      terminalVisible = entries[0].isIntersecting;
      syncLogTimer();
    });
    terminalObserver.observe(document.querySelector('.runtime-terminal'));
    const sceneObserver = new IntersectionObserver(entries => {
      sceneVisible = entries[0].isIntersecting && entries[0].intersectionRatio >= .2;
      syncDecorativeMotion();
    }, { threshold: [0, .2] });
    sceneObserver.observe(document.querySelector('.core-scene'));
    const navigationLinks = [...document.querySelectorAll('.desktop-nav a')];
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navigationLinks.forEach(link => {
          const active = link.hash === `#${entry.target.id}`;
          link.classList.toggle('is-active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-15% 0px -60% 0px' });
    document.querySelectorAll('section[id], .service-category[id]').forEach(section => sectionObserver.observe(section));
  } else {
    sceneVisible = terminalVisible = true;
  }
  syncLogTimer();

  const form = document.querySelector('#project-form');
  const submit = form.querySelector('button[type="submit"]');
  const submitLabel = document.querySelector('#submit-label');
  const feedback = document.querySelector('#form-feedback');
  const nameInput = form.querySelector('#name');
  const messageInput = form.querySelector('#message');
  // Child-service CTAs return to the existing form without changing delivery.
  const requestedService = new URLSearchParams(window.location.search).get('service');
  const serviceSelect = form.querySelector('#service');
  if (requestedService && [...serviceSelect.options].some(option => option.value === requestedService)) serviceSelect.value = requestedService;
  const toast = document.querySelector('#toast');
  let toastTimer;
  function showToast(title, message) {
    document.querySelector('#toast-title').textContent = title;
    document.querySelector('#toast-message').textContent = message;
    toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 9000);
  }
  document.querySelector('.toast-close').addEventListener('click', () => { toast.hidden = true; window.clearTimeout(toastTimer); });
  form.addEventListener('invalid', event => {
    event.target.setAttribute('aria-invalid', 'true');
  }, true);
  form.addEventListener('input', event => {
    if (!(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)) return;
    event.target.setCustomValidity('');
    event.target.removeAttribute('aria-invalid');
    if (feedback.classList.contains('is-error') && !form.querySelector('[aria-invalid="true"]')) {
      feedback.hidden = true;
      feedback.classList.remove('is-error');
      feedback.textContent = '';
    }
  });
  form.addEventListener('change', event => {
    if (event.target instanceof HTMLSelectElement) event.target.removeAttribute('aria-invalid');
  });
  if (form.dataset.endpoint.trim()) {
    document.querySelector('#form-note').lastChild.textContent = ' Your brief is sent to our project inquiry handler.';
    submitLabel.textContent = 'Send project inquiry';
  }
  function emailDraftLink(data) {
    const subject = `CodeToScale project inquiry — ${data.service}`;
    const body = [`Name: ${data.name}`, `Email: ${data.email}`, `Service: ${data.service}`, `Budget: ${data.budget}`, '', 'Project brief:', data.message].join('\r\n');
    return `mailto:${form.dataset.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled || !form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    if (data.website) return;
    for (const key of ['name', 'email', 'service', 'budget', 'message']) data[key] = String(data[key] || '').trim();
    nameInput.setCustomValidity(data.name ? '' : 'Please enter your name.');
    messageInput.setCustomValidity(data.message.length >= 10 ? '' : 'Please describe your project in at least 10 non-padding characters.');
    if (!data.name || data.message.length < 10) {
      feedback.hidden = false;
      feedback.classList.add('is-error');
      feedback.textContent = 'Please add your name and at least 10 characters about your project.';
      form.reportValidity();
      return;
    }
    delete data.website;
    const endpoint = form.dataset.endpoint.trim();
    feedback.hidden = true;
    feedback.classList.remove('is-error');
    if (!endpoint) {
      const draftLink = emailDraftLink(data);
      feedback.replaceChildren(document.createTextNode('Your brief is ready. Complete sending it in your email app. '));
      const retry = document.createElement('a');
      retry.href = draftLink;
      retry.textContent = 'Open email draft again';
      feedback.append(retry, document.createTextNode(` or email ${form.dataset.email}.`));
      feedback.hidden = false;
      window.location.href = draftLink;
      showToast('Email draft prepared', 'Review your project brief in your email app, then send it.');
      return;
    }
    submit.disabled = true;
    submitLabel.textContent = 'Sending your brief…';
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const url = new URL(endpoint, window.location.href);
      if (!['http:', 'https:'].includes(url.protocol) || (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname))) throw new Error('Configure an HTTPS form endpoint before sending.');
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data), signal: controller.signal });
      if (!response.ok) throw new Error('Your brief could not be delivered. Please try again or email us directly.');
      form.reset();
      form.querySelectorAll('[aria-invalid]').forEach(field => field.removeAttribute('aria-invalid'));
      feedback.textContent = 'Your project inquiry was submitted successfully. We look forward to learning more.';
      feedback.hidden = false;
      showToast('Transmission complete', 'Your project inquiry has been submitted successfully.');
    } catch (error) {
      feedback.textContent = error.name === 'AbortError' ? 'The request timed out. Please try again or email us directly.' : (error instanceof TypeError ? 'Connection unavailable. Please try again or email us directly.' : error.message);
      feedback.classList.add('is-error');
      feedback.hidden = false;
    } finally {
      window.clearTimeout(timeout);
      submit.disabled = false;
      submitLabel.textContent = 'Send project inquiry';
    }
  });
  // Reveal only nearby content, once. Native content stays visible without JS.
  const revealTargets = [...document.querySelectorAll('.section-heading, .about-intro, .solution, .service-card, .service-category, .fleet-console, .advantages-grid article, .workflow-step, .project-card, .faq-copy, .faq-list, .contact-copy, .project-form')];
  let revealObserver;
  function syncReveals() {
    revealObserver?.disconnect();
    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      revealTargets.forEach(item => item.classList.remove('reveal-pending'));
      return;
    }
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px 80px 0px', threshold: 0.06 });
    // IntersectionObserver supplies visibility without reading layout. Measuring
    // every offscreen descendant would defeat native rendering containment.
    revealTargets.forEach(item => {
      if (item.classList.contains('is-visible')) return;
      item.classList.add('reveal-pending');
      const siblings = [...item.parentElement.children].filter(node => node.matches('.service-card, .workflow-step, .solution, article'));
      item.style.setProperty('--reveal-delay', String((Math.max(0, siblings.indexOf(item)) % 3) * 70) + 'ms');
      revealObserver.observe(item);
    });
  }
  syncReveals();
  reducedMotion.addEventListener('change', syncReveals);
  // Stop decorative loops offscreen and in background tabs.
  function syncDecorativeMotion() {
    decorativeMotion.forEach(element => {
      const playState = document.hidden || !sceneVisible || reducedMotion.matches || logsPaused ? 'paused' : 'running';
      // CSS already starts these animations in the running state. Avoid
      // invalidating hero styles repeatedly when visibility has not changed.
      if (playState === 'running' && !element.style.animationPlayState) return;
      if (element.style.animationPlayState !== playState) element.style.animationPlayState = playState;
    });
  }
  // Visibility/preference changes share synchronization; scene/terminal
  // observers track their actual components rather than the whole tall hero.
  syncDecorativeMotion();
  const year = document.querySelector('#year');
  const currentYear = String(new Date().getFullYear());
  if (year.textContent !== currentYear) year.textContent = currentYear;
})();
