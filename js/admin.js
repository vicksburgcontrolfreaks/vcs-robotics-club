// Password-gated subscriber list + CSV export — admin.html
(function () {
  let currentPassword = null;
  let currentRows = [];

  const LIST_LABELS = LIST_OPTIONS.reduce((map, o) => {
    map[o.value] = o.label;
    return map;
  }, {});

  // Populate the segment filter from the same LIST_OPTIONS the sign-up forms use.
  const listFilterEl = document.getElementById('listFilter');
  LIST_OPTIONS.forEach(o => {
    const opt = document.createElement('option');
    opt.value = o.value;
    opt.textContent = o.label;
    listFilterEl.appendChild(opt);
  });

  function fmtDate(v) {
    if (!v) return '';
    const d = new Date(v);
    return isNaN(d) ? String(v) : d.toLocaleDateString();
  }

  function listCodes(row) {
    return String(row.lists || '').split(',').map(s => s.trim()).filter(Boolean);
  }

  function fmtLists(row) {
    return listCodes(row).map(code => LIST_LABELS[code] || code).join(', ');
  }

  function getFilteredRows() {
    const filter = listFilterEl.value;
    if (!filter) return currentRows;
    return currentRows.filter(r => listCodes(r).includes(filter));
  }

  async function fetchSubscribers(password) {
    const url = SCRIPT_URL + '?action=list&password=' + encodeURIComponent(password);
    const res = await fetch(url);
    return res.json();
  }

  function renderRows(rows) {
    const tbody = document.querySelector('#subTable tbody');
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td>${r.name || ''}</td>
        <td>${r.email || ''}</td>
        <td><span class="badge ${r.status === 'subscribed' ? 'badge-subscribed' : 'badge-unsubscribed'}">${r.status || ''}</span></td>
        <td>${fmtLists(r)}</td>
        <td>${r.source || ''}</td>
        <td>${fmtDate(r.subscribedAt)}</td>
        <td>${fmtDate(r.unsubscribedAt)}</td>
      </tr>
    `).join('');

    const subscribedCount = rows.filter(r => r.status === 'subscribed').length;
    document.getElementById('listSummary').textContent =
      `${subscribedCount} subscribed · ${rows.length - subscribedCount} unsubscribed · ${rows.length} total`;
  }

  function renderFiltered() {
    renderRows(getFilteredRows());
  }

  function downloadCsv(rows) {
    const header = ['Name', 'Email', 'Status', 'Lists', 'Source', 'Subscribed At', 'Unsubscribed At'];
    const escape = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const lines = [header.map(escape).join(',')].concat(
      rows.map(r => [r.name, r.email, r.status, fmtLists(r), r.source, r.subscribedAt, r.unsubscribedAt].map(escape).join(','))
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const suffix = listFilterEl.value ? '-' + listFilterEl.value : '';
    a.download = 'vcs-robotics-subscribers' + suffix + '-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function attemptLogin() {
    const errorEl = document.getElementById('loginError');
    errorEl.style.display = 'none';
    const password = document.getElementById('admin-password').value;
    const btn = document.getElementById('loginBtn');
    btn.disabled = true;
    btn.textContent = 'Checking…';

    try {
      const result = await fetchSubscribers(password);
      if (result.status !== 'ok') throw new Error(result.message || 'Incorrect password.');
      currentPassword = password;
      currentRows = result.subscribers || [];
      document.getElementById('loginCard').style.display = 'none';
      document.getElementById('listWrap').style.display = 'block';
      renderFiltered();
    } catch (err) {
      errorEl.textContent = err.message || 'Something went wrong.';
      errorEl.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.textContent = 'View subscribers →';
    }
  }

  document.getElementById('loginBtn').addEventListener('click', attemptLogin);
  document.getElementById('admin-password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') attemptLogin();
  });

  document.getElementById('refreshBtn').addEventListener('click', async () => {
    if (!currentPassword) return;
    const result = await fetchSubscribers(currentPassword);
    if (result.status === 'ok') {
      currentRows = result.subscribers || [];
      renderFiltered();
    }
  });

  listFilterEl.addEventListener('change', renderFiltered);

  document.getElementById('exportBtn').addEventListener('click', () => {
    downloadCsv(getFilteredRows());
  });
})();
