// Public "Updates" page — fetches published team communications and renders
// them newest-first. No admin password: only status=published rows ever come
// back from this endpoint (see handlePublishedCommunications in Code.gs).
(function () {
  function fmtDate(v) {
    if (!v) return '';
    const d = new Date(v);
    return isNaN(d) ? '' : d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  }

  async function load() {
    const listEl = document.getElementById('commList');
    try {
      const res = await fetch(SCRIPT_URL + '?action=publishedCommunications');
      const result = await res.json();

      if (result.status !== 'ok' || !result.communications || result.communications.length === 0) {
        listEl.innerHTML = '<p class="muted">No updates posted yet — check back soon.</p>';
        return;
      }

      listEl.innerHTML = result.communications.map(c => `
        <article class="card comm-card" id="c-${c.id}">
          <div class="comm-date">${fmtDate(c.publishedAt)}</div>
          <h2>${c.title || ''}</h2>
          ${c.body || ''}
        </article>
      `).join('');

      // Jump to a specific post if the URL was a deep link (e.g. from an
      // announcement email): updates.html#c-<id>
      if (location.hash) {
        const target = document.querySelector(location.hash);
        if (target) target.scrollIntoView();
      }
    } catch (err) {
      listEl.innerHTML = '<p class="error-msg" style="display:block;">Couldn\'t load updates right now. Please try again shortly.</p>';
    }
  }

  load();
})();
