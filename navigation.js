/* Native disclosure navigation, with keyboard shortcuts and predictable dismissal. */
(() => {
  const disclosure = document.querySelector('.nav-more');
  if (!disclosure) return;
  const trigger = disclosure.querySelector('summary');
  const panel = disclosure.querySelector('.nav-more-panel');
  const pricing = document.createElement('a');
  pricing.href = 'pricing.html';
  pricing.setAttribute('data-transition', '');
  pricing.innerHTML = '<span class="nav-item-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/></svg></span><span class="nav-item-copy"><b>Pricing</b><small>Hardware, servers &amp; AI</small></span><span class="nav-item-arrow" aria-hidden="true">↗</span>';
  if (location.pathname.endsWith('/pricing.html')) pricing.setAttribute('aria-current', 'page');
  panel.querySelector('.nav-tools-items')?.prepend(pricing);
  const billing = document.createElement('a');
  billing.href = 'billing.html'; billing.setAttribute('data-transition','');
  billing.innerHTML = '<span class="nav-item-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="8" r="3"/><path d="M5 21v-3a7 7 0 0 1 14 0v3"/></svg></span><span class="nav-item-copy"><b>Billing</b><small>Account &amp; workspace enrollment</small></span><span class="nav-item-arrow" aria-hidden="true">↗</span>';
  if(location.pathname.endsWith('/billing.html'))billing.setAttribute('aria-current','page');
  panel.querySelector('.nav-tools-items')?.append(billing);
  const items = () => [...panel.querySelectorAll('a[href], button:not(:disabled)')];

  function close(returnFocus = false) {
    if (!disclosure.open) return;
    disclosure.open = false;
    trigger.setAttribute('aria-expanded', 'false');
    if (returnFocus) trigger.focus({ preventScroll: true });
  }

  disclosure.addEventListener('toggle', () => {
    trigger.setAttribute('aria-expanded', String(disclosure.open));
  });

  trigger.addEventListener('keydown', event => {
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    disclosure.open = true;
    trigger.setAttribute('aria-expanded', 'true');
    const controls = items();
    (event.key === 'ArrowDown' ? controls[0] : controls.at(-1))?.focus();
  });

  panel.addEventListener('keydown', event => {
    const controls = items();
    const index = controls.indexOf(document.activeElement);
    if (index < 0 || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? controls.length - 1
      : (index + (event.key === 'ArrowDown' ? 1 : -1) + controls.length) % controls.length;
    controls[next].focus();
  });

  // Close before the existing action opens a dialog or navigates to another page.
  panel.addEventListener('click', event => {
    if (event.target.closest('a[href], button')) close(true);
  }, true);

  document.addEventListener('pointerdown', event => {
    if (!disclosure.contains(event.target)) close(disclosure.contains(document.activeElement));
  });
  document.addEventListener('focusin', event => {
    if (!disclosure.contains(event.target)) close();
  });
  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && disclosure.open) {
      close(true);
    }
  }, true);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && disclosure.open) {
      event.preventDefault();
      close(true);
    }
  });

  const smallScreen = matchMedia('(max-width: 900px)');
  smallScreen.addEventListener('change', () => close(disclosure.contains(document.activeElement)));
  document.querySelectorAll('.nav-tab.active').forEach(link => link.setAttribute('aria-current', 'page'));
})();
