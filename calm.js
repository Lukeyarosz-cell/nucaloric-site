/* GSAP owns entrances. anime.js owns short feedback. Content works without either. */
(() => {
  const gsap = window.gsap, anime = window.anime, reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const canMove = () => !reduced.matches && !window.NUC_DOTS?.isPaused();
  const revealSelector = '.reveal,[data-motion-reveal],[data-creative-reveal],[data-calm-reveal]';
  const feedback = new Set(), feedbackFor = new WeakMap();
  let context, registered = new WeakSet(), navigating = false;

  function animate(target, properties) {
    if (!anime?.animate || !canMove()) return null;
    feedbackFor.get(target)?.revert();
    const instance = anime.animate(target, { duration: 280, ease: 'out(3)', ...properties,
      onComplete: self => { feedback.delete(self); feedbackFor.delete(target); } });
    feedback.add(instance); feedbackFor.set(target, instance);
    return instance;
  }

  function register(root) {
    if (!context || !canMove()) return;
    const elements = [...root.querySelectorAll(revealSelector)];
    if (root.matches?.(revealSelector)) elements.unshift(root);
    context.add(() => elements.forEach(element => {
      if (registered.has(element) || element.dataset.calmSeen) return;
      registered.add(element);
      // Keep the legacy fallback visible when an engine is unavailable or reverted.
      element.classList.add('visible', 'motion-visible', 'creative-visible');
      if (element.getBoundingClientRect().bottom < 0) return;
      gsap.fromTo(element, { opacity: 0, y: 14 }, {
        opacity: 1, y: 0, duration: .6, ease: 'power2.out', clearProps: 'opacity,transform',
        scrollTrigger: { trigger: element, start: 'top 94%', once: true },
        onComplete: () => { element.dataset.calmSeen = 'true'; }
      });
    }));
  }

  function rebuild() {
    context?.revert(); context = null; registered = new WeakSet();
    for (const instance of feedback) instance.revert();
    feedback.clear();
    if (!gsap || !window.ScrollTrigger || !canMove()) return;
    gsap.registerPlugin(window.ScrollTrigger);
    context = gsap.context(() => {});
    register(document);
  }

  // A single persisted preference is shared with the existing canvas surfaces.
  const control = document.createElement('button');
  control.type = 'button'; control.className = 'calm-motion-control';
  document.body.append(control);
  function motionState() {
    const paused = Boolean(window.NUC_DOTS?.isPaused());
    document.body.classList.toggle('motion-paused', paused);
    control.disabled = reduced.matches;
    control.textContent = reduced.matches ? 'MOTION REDUCED' : paused ? 'MOTION OFF · RESUME' : 'MOTION ON · PAUSE';
    control.setAttribute('aria-label', reduced.matches ? 'Motion reduced by your device preference' : paused ? 'Resume decorative motion' : 'Pause decorative motion');
    control.setAttribute('aria-pressed', String(paused || reduced.matches));
    rebuild(); renderChecklist(false);
    document.dispatchEvent(new CustomEvent('nuc:motionchange'));
  }
  if (window.NUC_DOTS) {
    const original = window.NUC_DOTS.setPaused.bind(window.NUC_DOTS);
    window.NUC_DOTS.setPaused = value => { original(value); motionState(); };
  }
  control.addEventListener('click', () => window.NUC_DOTS?.setPaused(!window.NUC_DOTS.isPaused()));
  reduced.addEventListener('change', motionState);

  const checklist = document.querySelector('[data-calm-checklist]');
  const boxes = checklist ? [...checklist.querySelectorAll('input[type="checkbox"]')] : [];
  const storageKey = 'nucNextSteps:v1';
  let storageAvailable = true;
  if (checklist) {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      boxes.forEach(box => { box.checked = Array.isArray(saved) && saved.includes(box.value); });
      localStorage.setItem(storageKey, JSON.stringify(boxes.filter(box => box.checked).map(box => box.value)));
    } catch { storageAvailable = false; }
  }
  function renderChecklist(moving = true) {
    if (!checklist) return;
    const count = boxes.filter(box => box.checked).length, percent = boxes.length ? count / boxes.length * 100 : 0;
    const bar = checklist.querySelector('[data-calm-progress]');
    if (moving && canMove() && anime?.animate) animate(bar, { width: `${percent}%`, duration: 450 });
    else bar.style.width = `${percent}%`;
    checklist.querySelector('[data-calm-count]').textContent = count === boxes.length ? 'All set. Keep building at your own pace.' : `${count} of ${boxes.length} steps complete`;
    const meter = checklist.querySelector('[role="progressbar"]');
    meter.setAttribute('aria-valuenow', String(count));
    checklist.querySelector('[data-calm-storage]').textContent = storageAvailable ? 'Saved in this browser. Export a copy to keep it with you.' : 'Saving is unavailable in this browser. Export a copy to keep your progress.';
  }
  function saveChecklist() {
    try { localStorage.setItem(storageKey, JSON.stringify(boxes.filter(box => box.checked).map(box => box.value))); storageAvailable = true; }
    catch { storageAvailable = false; }
    renderChecklist();
  }
  boxes.forEach(box => box.addEventListener('change', () => {
    saveChecklist(); animate(box.nextElementSibling, { opacity: [.6, 1], x: [3, 0] });
  }));
  checklist?.querySelector('[data-calm-reset]').addEventListener('click', () => { boxes.forEach(box => { box.checked = false; }); saveChecklist(); });
  checklist?.querySelector('[data-calm-export]').addEventListener('click', () => {
    const steps = boxes.map(box => `${box.checked ? '[x]' : '[ ]'} ${box.nextElementSibling.textContent.trim()}`);
    const text = ['NUCALORIC / My next steps', new Date().toLocaleDateString(), '', ...steps, '', 'Plan your project: studio.html', 'Find your tools: registry.html', 'Choose a workspace: hosting.html'].join('\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'nucaloric-next-steps.txt';
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  document.querySelectorAll('.calm-faq details').forEach(details => details.addEventListener('toggle', () => {
    if (details.open) animate(details.querySelector('.calm-faq-answer'), { opacity: [0, 1], y: [4, 0] });
  }));
  document.addEventListener('click', event => {
    const button = event.target.closest('button:not(:disabled):not(.calm-motion-control)');
    if (button) animate(button, { scale: [1, .98, 1], duration: 240 });
  });
  document.addEventListener('focusin', event => {
    const reveal = event.target.closest(revealSelector);
    if (reveal && gsap) { gsap.killTweensOf(reveal); gsap.set(reveal, { clearProps: 'opacity,transform' }); reveal.dataset.calmSeen = 'true'; }
  });

  if (gsap && window.ScrollTrigger) document.documentElement.classList.add('calm-ready');
  motionState();
  if (context) context.add(() => {
    const hero = document.querySelector('.hero-center');
    if (hero) gsap.fromTo([...hero.children], { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .65, stagger: .075, ease: 'power2.out', clearProps: 'opacity,transform' });
  });
  const observer = new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) if (node.nodeType === 1) register(node);
  });
  observer.observe(document.querySelector('main') || document.body, { childList: true, subtree: true });
  // The native scroll position and browser history remain in charge.
  window.NUC_MOTION = {
    navigate(href) {
      if (navigating) return;
      if (!gsap || !canMove()) { location.href = href; return; }
      navigating = true;
      // Bound the exit even when the tab is hidden midway through a tween.
      let exited = false;
      const exit = () => { if (exited) return; exited = true; clearTimeout(timer); location.href = href; };
      const timer = setTimeout(exit, 240);
      gsap.to('main', { opacity: 0, y: -4, duration: .16, ease: 'power1.in', onComplete: exit });
    }
  };
  addEventListener('pageshow', event => {
    navigating = false;
    if (gsap) gsap.set('main', { clearProps: 'opacity,transform' });
    if (event.persisted) rebuild();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { for (const instance of feedback) instance.complete(); context?.getTweens().forEach(tween => tween.progress(1)); }
    else window.ScrollTrigger?.refresh();
  });
})();
