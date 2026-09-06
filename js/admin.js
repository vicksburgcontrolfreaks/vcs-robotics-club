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

  const COMM_AUDIENCE_BY_CODE = COMM_AUDIENCES.reduce((map, a) => {
    map[a.value] = a;
    return map;
  }, {});

  // Populate the "which program is this post for" dropdown (both the new-draft
  // form and the review editor use the same option set).
  const commAudienceEl = document.getElementById('comm-audience');
  const editAudienceEl = document.getElementById('edit-audience');
  COMM_AUDIENCES.forEach(a => {
    [commAudienceEl, editAudienceEl].forEach(sel => {
      const opt = document.createElement('option');
      opt.value = a.value;
      opt.textContent = a.label;
      sel.appendChild(opt);
    });
  });

  // Turns a plain-text draft into readable HTML: blank-line-separated
  // paragraphs, escaped, with bare URLs auto-linked. If the text already
  // contains a tag, it's trusted as authored HTML and passed through as-is
  // (e.g. a post someone hand-wrote with .comm-day/.comm-event markup).
  function plainTextToHtml(text) {
    const str = String(text || '').trim();
    if (!str) return '';
    if (/<[a-z][\s\S]*>/i.test(str)) return str;

    const escapeHtml = s => s
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const linkify = s => s.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank">$1</a>');

    return str.split(/\n\s*\n/)
      .map(para => '<p>' + linkify(escapeHtml(para.trim())).replace(/\n/g, '<br>') + '</p>')
      .join('\n');
  }

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

  // Subscribed-only emails for the current list filter — this is the set
  // that's actually safe to mail (unsubscribed rows can linger in a list's
  // filter match since unsubscribing doesn't clear the Lists column).
  function subscribedEmails() {
    return getFilteredRows()
      .filter(r => r.status === 'subscribed')
      .map(r => (r.email || '').trim())
      .filter(Boolean);
  }

  function currentFilterLabel() {
    const val = listFilterEl.value;
    return val ? (LIST_LABELS[val] || val) : 'All Subscribers';
  }

  // Subscribed emails for one specific program's list (elementary/middle/
  // high/lightweight) — used to announce a communication only to the people
  // who actually opted into that program. Ignores the table's list filter
  // above (that's for the manual Compose/CSV tools); this always targets the
  // post's own audience.
  function emailsForAudience(code) {
    return currentRows
      .filter(r => r.status === 'subscribed' && listCodes(r).includes(code))
      .map(r => (r.email || '').trim())
      .filter(Boolean);
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
      loadCommunications();
      loadRoster();
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
    loadCommunications();
    loadRoster();
  });

  listFilterEl.addEventListener('change', renderFiltered);

  document.getElementById('exportBtn').addEventListener('click', () => {
    downloadCsv(getFilteredRows());
  });

  // A mailto: URL that's too long gets silently truncated by some mail
  // clients/OSes — rather than risk a Bcc list quietly losing names, refuse
  // past a safe length and point to the copy-to-clipboard fallback instead.
  const MAILTO_SAFE_LENGTH = 1800;

  // Clicking a mailto: link with no default mail app registered fails
  // completely silently in most browsers — no error, no dialog, nothing
  // visibly happens. There's no way for JS to detect whether it worked, so:
  // trigger it via a real <a> click (more reliable than location.href), copy
  // the recipient list to the clipboard regardless, and always show the full
  // subject/body so there's a manual path forward either way.
  function triggerMailto(mailto, emails, subjectText, bodyText) {
    const a = document.createElement('a');
    a.href = mailto;
    document.body.appendChild(a);
    a.click();
    a.remove();

    navigator.clipboard.writeText(emails.join(', ')).catch(() => {});

    alert(
      "If your email app didn't just open, your browser has no default mail handler set.\n\n" +
      'The recipient list (' + emails.length + ' emails) has been copied to your clipboard — ' +
      'compose a new email yourself, paste it into Bcc, and use this subject/body:\n\n' +
      'Subject: ' + subjectText + (bodyText ? '\n\n' + bodyText : '')
    );
  }

  document.getElementById('composeBtn').addEventListener('click', () => {
    const emails = subscribedEmails();
    if (emails.length === 0) {
      alert('No subscribed emails match the current filter.');
      return;
    }
    const subjectText = 'Vicksburg Robotics — ' + currentFilterLabel() + ' update';
    const mailto = 'mailto:?bcc=' + encodeURIComponent(emails.join(',')) + '&subject=' + encodeURIComponent(subjectText);

    if (mailto.length > MAILTO_SAFE_LENGTH) {
      alert(
        'This list (' + emails.length + ' emails) is too long for a mailto link to carry reliably.\n\n' +
        'Use "Copy Bcc list" instead, then paste into Gmail\'s Bcc field.'
      );
      return;
    }
    triggerMailto(mailto, emails, subjectText, null);
  });

  document.getElementById('copyBccBtn').addEventListener('click', async () => {
    const btn = document.getElementById('copyBccBtn');
    const emails = subscribedEmails();
    if (emails.length === 0) {
      alert('No subscribed emails match the current filter.');
      return;
    }
    const text = emails.join(', ');
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = 'Copied ' + emails.length + ' emails ✓';
    } catch (err) {
      window.prompt('Copy these emails manually (Ctrl/Cmd+C, then Enter):', text);
    } finally {
      setTimeout(() => { btn.textContent = 'Copy Bcc list'; }, 2500);
    }
  });

  // ── Team communications ──────────────────────────────────────────────────
  let currentCommunications = [];

  async function fetchCommunications(password) {
    const url = SCRIPT_URL + '?action=communicationsAdmin&password=' + encodeURIComponent(password);
    const res = await fetch(url);
    return res.json();
  }

  async function loadCommunications() {
    if (!currentPassword) return;
    const result = await fetchCommunications(currentPassword);
    if (result.status === 'ok') {
      currentCommunications = result.communications || [];
      renderCommunications();
    }
  }

  async function composeAnnouncement(comm, btn) {
    const audience = COMM_AUDIENCE_BY_CODE[comm.audience];
    const emails = emailsForAudience(comm.audience);
    if (emails.length === 0) {
      alert('No subscribed emails for ' + (audience ? audience.label : comm.audience) + ' yet.');
      return;
    }

    const page = audience ? audience.page : 'updates.html';
    const link = SITE_URL + page + '#c-' + comm.id;
    const bulletLines = String(comm.summary || '').split('\n').map(s => s.trim()).filter(Boolean);
    const body = ['New team communication posted: ' + comm.title, '']
      .concat(bulletLines.map(b => '• ' + b))
      .concat(['', 'Read the full post: ' + link])
      .join('\n');
    const subject = 'Vicksburg Robotics — ' + comm.title;

    const announcementText = 'Bcc: ' + emails.join(', ') + '\nSubject: ' + subject + '\n\n' + body;
    const originalLabel = btn.textContent;

    try {
      await navigator.clipboard.writeText(announcementText);
      btn.textContent = 'Announcement copied to clipboard';
    } catch (err) {
      window.prompt('Copy this announcement manually (Ctrl/Cmd+C, then Enter):', announcementText);
    } finally {
      setTimeout(() => { btn.textContent = originalLabel; }, 2500);
    }
  }

  function renderCommunications() {
    const drafts = currentCommunications.filter(c => c.status !== 'published');
    const published = currentCommunications.filter(c => c.status === 'published');

    const audienceLabel = code => (COMM_AUDIENCE_BY_CODE[code] || {}).label || code || '(no program set)';

    const draftsEl = document.getElementById('commDrafts');
    draftsEl.innerHTML = drafts.length === 0
      ? '<p class="muted">No drafts waiting.</p>'
      : drafts.map(c => {
          const preview = String(c.body || '').slice(0, 200);
          const truncated = String(c.body || '').length > 200;
          return `
            <div class="card" style="margin-bottom:10px;">
              <strong>${c.title || '(untitled)'}</strong>
              <div class="muted" style="font-size:12px; margin:2px 0 8px;">
                ${audienceLabel(c.audience)} · saved ${fmtDate(c.createdAt)}
              </div>
              <div style="font-size:13px; color:var(--muted); white-space:pre-wrap; margin-bottom:10px;">${preview}${truncated ? '…' : ''}</div>
              <div style="display:flex; gap:10px;">
                <button type="button" class="btn btn-gold" data-review-id="${c.id}">Review &amp; publish →</button>
                <button type="button" class="btn btn-navy" data-delete-id="${c.id}">Delete</button>
              </div>
            </div>
          `;
        }).join('');

    draftsEl.querySelectorAll('button[data-review-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const comm = drafts.find(c => c.id === btn.getAttribute('data-review-id'));
        if (comm) openDraftEditor(comm);
      });
    });

    draftsEl.querySelectorAll('button[data-delete-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const comm = drafts.find(c => c.id === btn.getAttribute('data-delete-id'));
        if (!comm) return;
        if (!confirm('Delete this draft permanently? "' + (comm.title || '(untitled)') + '"')) return;
        const res = await fetch(SCRIPT_URL, {
          method: 'POST',
          body: JSON.stringify({ action: 'deleteCommunication', password: currentPassword, id: comm.id })
        });
        const result = await res.json();
        if (result.status === 'ok') loadCommunications();
        else alert(result.message || 'Could not delete this draft.');
      });
    });

    const publishedEl = document.getElementById('commPublished');
    publishedEl.innerHTML = published.length === 0
      ? '<p class="muted">Nothing published yet.</p>'
      : published.map(c => `
          <div class="card" style="margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
            <div>
              <strong>${c.title || ''}</strong>
              <div class="muted" style="font-size:12px;">${audienceLabel(c.audience)} · published ${fmtDate(c.publishedAt)}</div>
            </div>
            <button type="button" class="btn btn-gold" data-comm-id="${c.id}">Compose announcement →</button>
          </div>
        `).join('');

    publishedEl.querySelectorAll('button[data-comm-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const comm = published.find(c => c.id === btn.getAttribute('data-comm-id'));
        if (comm) composeAnnouncement(comm, btn);
      });
    });
  }

  // ── Draft review & publish (in-browser, no round-trip needed) ────────────
  let editingCommId = null;

  function renderDraftPreview() {
    const title = document.getElementById('edit-title').value.trim();
    const body = document.getElementById('edit-body').value;
    document.getElementById('draftPreview').innerHTML =
      '<div class="comm-date">' + fmtDate(new Date().toISOString()) + '</div>' +
      '<h2>' + (title || '(untitled)') + '</h2>' +
      plainTextToHtml(body);
  }

  function openDraftEditor(comm) {
    editingCommId = comm.id;
    document.getElementById('edit-audience').value = comm.audience || '';
    document.getElementById('edit-title').value = comm.title || '';
    document.getElementById('edit-body').value = comm.body || '';
    document.getElementById('edit-summary').value = comm.summary || '';
    document.getElementById('editError').style.display = 'none';
    renderDraftPreview();
    const editor = document.getElementById('draftEditor');
    editor.style.display = 'block';
    editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  ['edit-title', 'edit-body'].forEach(id => {
    document.getElementById(id).addEventListener('input', renderDraftPreview);
  });

  document.getElementById('cancelEditBtn').addEventListener('click', () => {
    editingCommId = null;
    document.getElementById('draftEditor').style.display = 'none';
  });

  document.getElementById('publishDraftBtn').addEventListener('click', async () => {
    if (!editingCommId) return;
    const errorEl = document.getElementById('editError');
    errorEl.style.display = 'none';

    const audience = document.getElementById('edit-audience').value;
    const title = document.getElementById('edit-title').value.trim();
    const rawBody = document.getElementById('edit-body').value.trim();
    const summary = document.getElementById('edit-summary').value.trim();

    if (!audience) {
      errorEl.textContent = 'Please choose which program this is for.';
      errorEl.style.display = 'block';
      return;
    }
    if (!title || !rawBody) {
      errorEl.textContent = 'Title and body are both required.';
      errorEl.style.display = 'block';
      return;
    }

    const btn = document.getElementById('publishDraftBtn');
    btn.disabled = true;
    btn.textContent = 'Publishing…';

    try {
      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'updateCommunication',
          password: currentPassword,
          id: editingCommId,
          audience,
          title,
          body: plainTextToHtml(rawBody),
          summary,
          status: 'published'
        })
      });
      const result = await res.json();
      if (result.status !== 'ok') throw new Error(result.message || 'Server error');

      editingCommId = null;
      document.getElementById('draftEditor').style.display = 'none';
      loadCommunications();
    } catch (err) {
      errorEl.textContent = err.message || 'Something went wrong.';
      errorEl.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Publish →';
    }
  });

  document.getElementById('commSaveBtn').addEventListener('click', async () => {
    if (!currentPassword) return;
    const errorEl = document.getElementById('commError');
    const infoEl = document.getElementById('commInfo');
    errorEl.style.display = 'none';
    infoEl.style.display = 'none';

    const audience = commAudienceEl.value;
    const title = document.getElementById('comm-title').value.trim();
    const body = document.getElementById('comm-body').value.trim();
    if (!audience) {
      errorEl.textContent = 'Please choose which program this is for.';
      errorEl.style.display = 'block';
      return;
    }
    if (!title || !body) {
      errorEl.textContent = 'Title and content are both required.';
      errorEl.style.display = 'block';
      return;
    }

    const btn = document.getElementById('commSaveBtn');
    btn.disabled = true;
    btn.textContent = 'Saving…';

    try {
      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'postCommunication', password: currentPassword, title, body, audience })
      });
      const result = await res.json();
      if (result.status !== 'ok') throw new Error(result.message || 'Server error');

      commAudienceEl.value = '';
      document.getElementById('comm-title').value = '';
      document.getElementById('comm-body').value = '';
      infoEl.textContent = 'Draft saved — ask Claude to review and publish it.';
      infoEl.style.display = 'block';
      loadCommunications();
    } catch (err) {
      errorEl.textContent = err.message || 'Something went wrong.';
      errorEl.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Save draft';
    }
  });

  // ── Team roster & shirt sizes ─────────────────────────────────────────────
  let currentRoster = [];

  async function loadRoster() {
    if (!currentPassword) return;
    const url = SCRIPT_URL + '?action=rosterAdmin&password=' + encodeURIComponent(currentPassword);
    const res = await fetch(url);
    const result = await res.json();
    if (result.status === 'ok') {
      currentRoster = result.roster || [];
      renderRoster();
    }
  }

  function renderRoster() {
    const tbody = document.querySelector('#rosterTable tbody');
    tbody.innerHTML = currentRoster.map(r => `
      <tr>
        <td>${r.childName || ''}</td>
        <td>${r.grade || ''}</td>
        <td>${r.shirtSize || ''}</td>
        <td>${r.parentName || ''}</td>
        <td>${r.email || ''}</td>
      </tr>
    `).join('');

    // Tally by size, in the same order as SHIRT_SIZES, so ordering shirts is
    // a straight read down the list (even sizes with zero show up as 0, not
    // silently missing).
    const counts = SHIRT_SIZES.reduce((map, size) => { map[size] = 0; return map; }, {});
    let unspecified = 0;
    currentRoster.forEach(r => {
      if (r.shirtSize && counts.hasOwnProperty(r.shirtSize)) counts[r.shirtSize]++;
      else if (r.shirtSize) counts[r.shirtSize] = (counts[r.shirtSize] || 0) + 1;
      else unspecified++;
    });

    const tallyEl = document.getElementById('rosterSizeTally');
    const tallyEntries = Object.keys(counts).filter(size => counts[size] > 0 || SHIRT_SIZES.includes(size));
    tallyEl.innerHTML = tallyEntries.map(size => `
      <div class="stat card"><div class="num">${counts[size]}</div><div class="label">${size}</div></div>
    `).join('') + (unspecified > 0
      ? `<div class="stat card"><div class="num">${unspecified}</div><div class="label">Not specified</div></div>`
      : '');
  }

  document.getElementById('rosterExportBtn').addEventListener('click', () => {
    const header = ['Child', 'Grade', 'Shirt Size', 'Parent', 'Email'];
    const escape = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const lines = [header.map(escape).join(',')].concat(
      currentRoster.map(r => [r.childName, r.grade, r.shirtSize, r.parentName, r.email].map(escape).join(','))
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'vcs-robotics-roster-shirt-sizes-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
  });
})();
