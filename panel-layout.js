/* A native, persisted module board. Market data and drafts are independent of layout. */
(() => {
  const grid = document.querySelector('[data-panel-grid]');
  if (!grid) return;
  const panels = new Map([...grid.querySelectorAll(':scope > [data-panel-id]')].map(panel => [panel.dataset.panelId, panel]));
  const ids = [...panels.keys()], sizes = ['small', 'medium', 'wide'];
  const storageKey = grid.dataset.layoutKey || 'nucPanelLayout:v1';
  const edit = document.querySelector('[data-layout-edit]'), dialog = document.querySelector('[data-layout-dialog]');
  const notice = document.querySelector('[data-layout-status]'), empty = document.querySelector('[data-layout-empty]');
  let editing = false, dragging = null;
  const defaults = () => ({ order: [...ids], panels: Object.fromEntries(ids.map(id => [id, { visible: true, collapsed: false, size: panels.get(id).dataset.defaultSize || 'small' }])) });
  function validate(raw) {
    const next = defaults();
    if (!raw || typeof raw !== 'object') return next;
    if (Array.isArray(raw.order)) next.order = [...new Set(raw.order.filter(id => ids.includes(id))), ...ids.filter(id => !raw.order.includes(id))];
    ids.forEach(id => {
      const item = raw.panels?.[id];
      if (!item || typeof item !== 'object') return;
      next.panels[id] = { visible: item.visible !== false, collapsed: item.collapsed === true, size: sizes.includes(item.size) ? item.size : next.panels[id].size };
    });
    return next;
  }
  let prefs;
  try { prefs = validate(JSON.parse(localStorage.getItem(storageKey))); } catch { prefs = defaults(); }
  function apply() {
    const focused = document.activeElement, visibleIds = prefs.order.filter(id => prefs.panels[id].visible);
    grid.classList.toggle('layout-editing', editing);
    edit.setAttribute('aria-pressed', String(editing));
    edit.textContent = editing ? 'DONE EDITING ✓' : 'CUSTOMIZE LAYOUT';
    prefs.order.forEach(id => {
      const panel = panels.get(id), config = prefs.panels[id], index = visibleIds.indexOf(id);
      panel.hidden = !config.visible;
      panel.dataset.panelSize = config.size;
      panel.classList.toggle('panel-collapsed', config.collapsed);
      panel.querySelector('[data-panel-content]').hidden = config.collapsed;
      const collapse = panel.querySelector('[data-panel-collapse]');
      collapse.setAttribute('aria-expanded', String(!config.collapsed));
      collapse.textContent = config.collapsed ? '+' : '−';
      collapse.setAttribute('aria-label', `${config.collapsed ? 'Expand' : 'Collapse'} ${panel.dataset.panelName}`);
      panel.querySelector('[data-panel-size]').value = config.size;
      panel.querySelector('[data-panel-edit]').hidden = !editing;
      panel.querySelector('[data-panel-grip]').hidden = !editing;
      panel.querySelector('[data-panel-grip]').draggable = editing;
      panel.querySelector('[data-panel-earlier]').disabled = index <= 0;
      panel.querySelector('[data-panel-later]').disabled = index === visibleIds.length - 1;
      grid.append(panel);
      dialog.querySelector(`[data-panel-visible="${id}"]`).checked = config.visible;
    });
    empty.hidden = visibleIds.length > 0;
    if (focused?.isConnected && focused !== document.body && !focused.closest('[hidden]')) {
      const target = focused.disabled ? focused.closest('[data-panel-id]')?.querySelector('[data-panel-grip]') : focused;
      target?.focus({ preventScroll: true });
    }
  }
  function persist(message) {
    try { localStorage.setItem(storageKey, JSON.stringify(prefs)); notice.textContent = `${message} Saved on this device.`; }
    catch { notice.textContent = `${message} Browser storage is unavailable; this layout applies to this page only.`; }
    apply();
  }
  function move(id, direction) {
    const visibleIds = prefs.order.filter(key => prefs.panels[key].visible), from = visibleIds.indexOf(id), to = from + direction;
    if (from < 0 || to < 0 || to >= visibleIds.length) return;
    [visibleIds[from], visibleIds[to]] = [visibleIds[to], visibleIds[from]];
    let index = 0;
    prefs.order = prefs.order.map(key => prefs.panels[key].visible ? visibleIds[index++] : key);
    persist(`${panels.get(id).dataset.panelName} moved.`);
  }
  panels.forEach((panel, id) => {
    panel.querySelector('[data-panel-earlier]').addEventListener('click', () => move(id, -1));
    panel.querySelector('[data-panel-later]').addEventListener('click', () => move(id, 1));
    panel.querySelector('[data-panel-size]').addEventListener('change', event => { prefs.panels[id].size = event.target.value; persist(`${panel.dataset.panelName} resized.`); });
    panel.querySelector('[data-panel-collapse]').addEventListener('click', () => { prefs.panels[id].collapsed = !prefs.panels[id].collapsed; persist(`${panel.dataset.panelName} ${prefs.panels[id].collapsed ? 'collapsed' : 'expanded'}.`); });
    panel.querySelector('[data-panel-hide]').addEventListener('click', () => {
      prefs.panels[id].visible = false; persist(`${panel.dataset.panelName} hidden. Add it again from Modules.`); edit.focus({ preventScroll: true });
    });
    panel.querySelector('[data-panel-grip]').addEventListener('dragstart', event => {
      if (!editing) { event.preventDefault(); return; }
      dragging = id; event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', id); panel.classList.add('panel-dragging');
    });
    panel.addEventListener('dragover', event => { if (dragging && dragging !== id) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; panel.classList.add('panel-drop-target'); } });
    panel.addEventListener('dragleave', event => { if (!panel.contains(event.relatedTarget)) panel.classList.remove('panel-drop-target'); });
    panel.addEventListener('drop', event => {
      event.preventDefault(); panel.classList.remove('panel-drop-target');
      if (!dragging || dragging === id || !panels.has(dragging)) return;
      const moving = panels.get(dragging), box = panel.getBoundingClientRect(), movingBox = moving.getBoundingClientRect();
      const after = Math.abs(box.top - movingBox.top) < 30 ? event.clientX > box.left + box.width / 2 : event.clientY > box.top + box.height / 2;
      prefs.order = prefs.order.filter(key => key !== dragging);
      prefs.order.splice(prefs.order.indexOf(id) + Number(after), 0, dragging);
      persist(`${moving.dataset.panelName} moved.`);
      moving.querySelector('[data-panel-grip]').focus({ preventScroll: true });
    });
  });
  grid.addEventListener('dragend', () => { dragging = null; panels.forEach(panel => panel.classList.remove('panel-dragging', 'panel-drop-target')); });
  edit.addEventListener('click', () => { editing = !editing; apply(); });
  document.querySelectorAll('[data-layout-picker]').forEach(button => button.addEventListener('click', () => dialog.showModal()));
  dialog.querySelector('[data-layout-close]').addEventListener('click', () => dialog.close());
  dialog.querySelectorAll('[data-panel-visible]').forEach(input => input.addEventListener('change', () => {
    prefs.panels[input.dataset.panelVisible].visible = input.checked;
    persist(`${panels.get(input.dataset.panelVisible).dataset.panelName} ${input.checked ? 'added' : 'hidden'}.`);
  }));
  document.querySelector('[data-layout-reset]').addEventListener('click', () => { prefs = defaults(); persist('Default modules restored.'); });
  addEventListener('storage', event => {
    if (event.key === storageKey) { try { prefs = validate(JSON.parse(event.newValue)); apply(); notice.textContent = 'Layout updated from another tab.'; } catch {} }
  });
  window.NUC_PANEL_LAYOUT = {
    reveal(id) { if (!panels.has(id)) return; prefs.panels[id].visible = true; prefs.panels[id].collapsed = false; persist(`${panels.get(id).dataset.panelName} opened.`); }
  };
  apply();
})();
