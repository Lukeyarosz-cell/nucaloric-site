/* Initials only for the replacement artwork tile; existing page behavior stays in its own modules. */
(() => {
  const form = document.querySelector('#coinWorkbench');
  const avatar = document.querySelector('.identity-artwork [data-coin-avatar]');
  if (!form || !avatar) return;
  const sync = () => {
    const label = form.elements.ticker.value.trim() || form.elements.name.value.trim() || 'N';
    avatar.dataset.initial = label.slice(0, 1).toUpperCase();
  };
  form.addEventListener('input', sync);
  form.addEventListener('change', sync);
  sync();
})();
