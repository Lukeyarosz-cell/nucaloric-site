/* Status reflects actual requests. No simulated percentage or progress. */
(() => {
  window.NUC_WORK_ACTIVITY = (id, host, before = null) => {
    const element = document.createElement('div');
    element.id = id;
    element.className = 'nuc-work-activity';
    element.hidden = true;
    const pixels = document.createElement('span');
    pixels.className = 'nuc-work-pixels';
    pixels.setAttribute('aria-hidden', 'true');
    for (let index = 0; index < 9; index++) {
      const pixel = document.createElement('i');
      pixel.style.setProperty('--step', index);
      pixels.append(pixel);
    }
    const copy = document.createElement('div');
    const label = document.createElement('strong');
    label.setAttribute('role', 'status');
    const detail = document.createElement('small');
    copy.append(label, detail);
    const elapsed = document.createElement('time');
    elapsed.setAttribute('aria-hidden', 'true');
    element.append(pixels, copy, elapsed);
    host.insertBefore(element, before);
    let timer = null, started = 0;
    const clock = () => {
      const seconds = Math.floor((Date.now() - started) / 1000);
      elapsed.textContent = seconds < 60 ? seconds + 's' : Math.floor(seconds / 60) + 'm ' + seconds % 60 + 's';
    };
    return {
      set(phase, title = '', description = '') {
        const active = !['idle', 'error'].includes(phase);
        element.hidden = phase === 'idle';
        element.dataset.phase = phase;
        element.classList.toggle('is-active', active);
        if (label.textContent !== title) label.textContent = title;
        detail.textContent = description;
        if (active && !timer) { started = Date.now(); clock(); timer = setInterval(clock, 1000); }
        if (!active && timer) { clearInterval(timer); timer = null; }
        elapsed.hidden = !active;
      }
    };
  };
})();
