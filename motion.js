/* Motion from the approved reel, adapted to visibility and real interactions. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  document.documentElement.classList.add('motion-ready');
  const reveal = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      entry.target.classList.add('motion-visible');
      reveal.unobserve(entry.target);
    }
  }, { threshold: .18 });
  document.querySelectorAll('[data-motion-reveal]').forEach(el => reveal.observe(el));

  const video = document.querySelector('#possibilitiesVisual');
  if (video) {
    const button = document.querySelector('.motion-visual-toggle');
    let visible = false, userPaused = false, userStarted = false;
    button.hidden = false;
    video.muted = true;
    function label() {
      button.textContent = video.paused ? 'PLAY VISUAL ↗' : 'PAUSE VISUAL Ⅱ';
      button.setAttribute('aria-label', video.paused ? 'Play the decorative visual' : 'Pause the decorative visual');
    }
    function sync() {
      if (visible && !document.hidden && !userPaused && (!reduce.matches || userStarted)) {
        video.play().then(label).catch(label);
      } else { video.pause(); label(); }
    }
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { threshold: .15 }).observe(video);
    button.addEventListener('click', () => {
      if (video.paused) { userStarted = true; userPaused = false; }
      else { userPaused = true; userStarted = false; }
      sync();
    });
    video.addEventListener('play', label);
    video.addEventListener('pause', label);
    document.addEventListener('visibilitychange', sync);
    reduce.addEventListener('change', () => { userStarted = false; sync(); });
    label();
  }

  const demo = document.querySelector('[data-workspace-demo]');
  if (demo) {
    const buttons = [...demo.querySelectorAll('[data-demo-step]')];
    const code = demo.querySelector('[data-demo-code]');
    const replay = demo.querySelector('[data-demo-replay]');
    const examples = [
      '# Start with a project plan.\n# Choose the tools for your idea.',
      '# Website, API, or developer scripts.\n# A workspace around what you make.',
      '$ npm install\n$ npm run dev\n$ git status\n# Keep building.'
    ];
    let visible = false, played = false, automatic = false, timer = 0, tick = 0, typing = 0;
    replay.hidden = false;
    function stop() {
      clearTimeout(timer); cancelAnimationFrame(tick);
      demo.classList.remove('demo-playing', 'demo-typing');
    }
    function settle() {
      const finish = automatic; stop(); automatic = false;
      if (finish) setStep(2);
    }
    function setStep(step, animate = false) {
      demo.dataset.demoStage = step;
      buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(step === i)));
      cancelAnimationFrame(tick); demo.classList.remove('demo-typing');
      const value = examples[step];
      if (!animate || reduce.matches) { code.textContent = value; return; }
      typing = performance.now(); demo.classList.add('demo-typing');
      function type(now) {
        const count = Math.min(value.length, Math.floor((now - typing) / 15));
        code.textContent = value.slice(0, count);
        if (count < value.length && visible && !document.hidden && !reduce.matches) tick = requestAnimationFrame(type);
        else { code.textContent = value; demo.classList.remove('demo-typing'); }
      }
      tick = requestAnimationFrame(type);
    }
    function play() {
      stop(); played = true; automatic = false;
      if (reduce.matches) { setStep(2); return; }
      setStep(0); automatic = true;
      // Restart the CSS pointer once, inside the illustrative preview only.
      void demo.offsetWidth;
      demo.classList.add('demo-playing');
      timer = setTimeout(() => {
        setStep(1);
        timer = setTimeout(() => {
          setStep(2, true);
          timer = setTimeout(() => { demo.classList.remove('demo-playing'); automatic = false; }, 1300);
        }, 1200);
      }, 1200);
    }
    buttons.forEach((button, index) => button.addEventListener('click', () => {
      stop(); automatic = false; played = true; setStep(index);
    }));
    replay.addEventListener('click', play);
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible && !document.hidden) {
        demo.classList.add('motion-demo-enter');
        if (!played && !reduce.matches) play();
      } else {
        settle();
      }
    }, { threshold: .3 }).observe(demo);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) settle();
      else if (visible && !played && !reduce.matches) play();
    });
    reduce.addEventListener('change', settle);
    // Aim at the first tile at every breakpoint, using transform-only motion.
    const body = demo.querySelector('.motion-demo-body');
    const target = demo.querySelector('.motion-demo-tool');
    const ripple = demo.querySelector('.motion-demo-ripple');
    function aim() {
      const bounds = body.getBoundingClientRect(), tile = target.getBoundingClientRect();
      const x = tile.left - bounds.left + tile.width * .53;
      const y = tile.top - bounds.top + tile.height * .72;
      demo.style.setProperty('--pointer-x', `${x - bounds.width * .66}px`);
      demo.style.setProperty('--pointer-y', `${y - bounds.height * .73}px`);
      ripple.style.left = `${x - 17.5}px`; ripple.style.top = `${y - 17.5}px`;
    }
    new ResizeObserver(aim).observe(body);
    setStep(0);
  }
})();
