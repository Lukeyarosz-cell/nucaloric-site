/* Film-derived atmosphere and deliberate, user-driven product motion. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let userPaused = false;
  try { userPaused = localStorage.getItem('nucMotionPaused') === 'true'; } catch {}
  const players = [];
  const motionButtons = [...document.querySelectorAll('[data-campaign-motion]')];
  function syncMotion() {
    const paused = reduce.matches || userPaused;
    document.body.classList.toggle('campaign-motion-paused', paused);
    document.body.classList.toggle('motion-paused', paused);
    window.dispatchEvent(new Event('nuc:motion-change'));
    motionButtons.forEach(button => {
      button.textContent = reduce.matches ? 'Motion reduced' : userPaused ? 'Resume motion ↗' : 'Pause motion Ⅱ';
      button.disabled = reduce.matches;
      button.setAttribute('aria-pressed', String(paused));
    });
    document.querySelectorAll('[data-modular-motion]').forEach(button => {
      button.disabled = reduce.matches;
      button.setAttribute('aria-pressed', String(paused));
      button.setAttribute('aria-label', paused ? 'Resume site motion' : 'Pause site motion');
      button.textContent = reduce.matches ? 'Motion reduced' : userPaused ? 'Motion ↗' : 'Motion Ⅱ';
    });
    for (const player of players) {
      const shouldPlay = player.visible && !document.hidden && !paused && !document.querySelector('#campaignFilm[open]');
      if (shouldPlay) {
        const source = player.video.querySelector('source');
        if (source?.dataset.src) { source.src = source.dataset.src; delete source.dataset.src; player.video.load(); }
        player.video.play().catch(() => {});
      } else { player.video.pause(); }
    }
  }
  const visibility = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const player = players.find(item => item.video === entry.target);
      if (player) player.visible = entry.isIntersecting;
    });
    syncMotion();
  }, { threshold: .02 });
  document.querySelectorAll('[data-campaign-ambient]').forEach(video => {
    video.muted = true;
    players.push({ video, visible: false });
    visibility.observe(video);
  });
  motionButtons.forEach(button => button.addEventListener('click', () => {
    userPaused = !userPaused;
    try { localStorage.setItem('nucMotionPaused', String(userPaused)); } catch {}
    window.NUC_DOTS?.setPaused(userPaused);
    syncMotion();
  }));
  document.querySelectorAll('[data-modular-motion],[data-motion-toggle],[data-explore-motion],#deskMotion').forEach(button => button.addEventListener('click', () => {
    queueMicrotask(() => {
      userPaused = button.getAttribute('aria-pressed') === 'true';
      try { localStorage.setItem('nucMotionPaused', String(userPaused)); } catch {}
      syncMotion();
    });
  }));
  reduce.addEventListener('change', syncMotion);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) document.querySelector('#campaignFilm video')?.pause();
    syncMotion();
  });
  syncMotion();

  const ideaForm = document.querySelector('#campaignIdeaForm');
  if (ideaForm) {
    const choices = [...ideaForm.querySelectorAll('[data-idea-workload]')];
    choices.forEach(button => button.addEventListener('click', () => {
      choices.forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
      ideaForm.elements.workload.value = button.dataset.ideaWorkload;
    }));
    ideaForm.addEventListener('submit', event => {
      event.preventDefault();
      const idea = ideaForm.elements.idea.value.trim();
      if (idea.length < 3) { ideaForm.elements.idea.setCustomValidity('Give your idea at least three characters.'); ideaForm.reportValidity(); return; }
      if (!ideaForm.reportValidity()) return;
      const next = new URL('studio.html', location.href);
      next.searchParams.set('project', 'new');
      next.searchParams.set('idea', idea);
      next.searchParams.set('workload', ideaForm.elements.workload.value);
      next.hash = 'brief';
      location.assign(next.href);
    });
    ideaForm.elements.idea.addEventListener('input', () => ideaForm.elements.idea.setCustomValidity(''));
  }

  const tabs = [...document.querySelectorAll('[data-tour-step]')];
  function selectStep(button, focus = false) {
    tabs.forEach(tab => {
      const selected = tab === button;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(tab.getAttribute('aria-controls'));
      panel.hidden = !selected;
      if (selected && !reduce.matches && !userPaused) panel.animate([{ opacity: .25, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 340, easing: 'cubic-bezier(.22,1,.36,1)' });
    });
    if (focus) button.focus();
  }
  tabs.forEach((button, index) => {
    button.addEventListener('click', () => selectStep(button));
    button.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); selectStep(tabs[next], true); }
    });
  });

  const film = document.querySelector('#campaignFilm');
  if (film) {
    const video = film.querySelector('video');
    let opener;
    document.querySelectorAll('[data-campaign-film]').forEach(button => button.addEventListener('click', () => {
      opener = button;
      film.showModal();
      document.body.classList.add('campaign-film-open');
      const source = video.querySelector('source');
      if (source.dataset.src) { source.src = source.dataset.src; delete source.dataset.src; video.load(); }
      video.play().catch(() => {});
      syncMotion();
    }));
    film.querySelector('[data-film-close]').addEventListener('click', () => film.close());
    film.addEventListener('click', event => {
      const box = film.getBoundingClientRect();
      if (event.target === film && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) film.close();
    });
    film.addEventListener('close', () => {
      video.pause();
      document.body.classList.remove('campaign-film-open');
      syncMotion();
      opener?.focus();
    });
  }

  const home = document.querySelector('.campaign-main');
  if (home) {
    const enter = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        enter.unobserve(entry.target);
        if (!reduce.matches && !userPaused) entry.target.animate([{ opacity: .35, transform: 'translateY(20px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 550, easing: 'cubic-bezier(.22,1,.36,1)' });
      });
    }, { threshold: .12 });
    home.querySelectorAll('.campaign-section-heading,.campaign-project,.compute-card,.campaign-ecosystem').forEach(element => enter.observe(element));
  }
})();
