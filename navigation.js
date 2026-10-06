/* Native disclosure navigation, with keyboard shortcuts and predictable dismissal. */
(() => {
  const disclosure = document.querySelector('.nav-more');
  if (!disclosure) return;
  const trigger = disclosure.querySelector('summary');
  const panel = disclosure.querySelector('.nav-more-panel');
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
