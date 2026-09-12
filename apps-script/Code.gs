// Vicksburg Robotics — Parent Form + Club Mailing List Backend
// Deploy as: Web app → Execute as: Me → Who has access: Anyone
// Deployment URL goes into: cte/8126/parent_form.html (SCRIPT_URL) AND
//                            vcs-robotics-club/js/config.js (SCRIPT_URL) — same deployment, both sites hit it.
//
// One-time setup after copying this into the Apps Script project:
//   1. Project Settings → Script Properties → add ADMIN_PASSWORD = <a password only you know>
//   2. (Optional, for "Polish with AI" in the draft review panel) Script Properties → add
//      ANTHROPIC_API_KEY = <an Anthropic API key>. Without it, the Polish button shows a clear
//      error instead of failing silently; everything else works fine without it.
//   3. Confirm SITE_URL below matches your GitHub Pages URL.
//   4. Deploy → Manage deployments → edit the existing deployment → New version → Deploy.
//      (Keeps the same /exec URL that's already pasted into parent_form.html.)
//
// Sheets used (auto-created on first use):
//   "Parent Submissions" — one row per child, from the full family sign-up form (unchanged from before).
//   "Subscribers"         — one row per mailing-list contact, with a token used for unsubscribe links.
//   "Communications"      — team update posts, one per program (Elementary/Middle/High/Sponsors).
//                           Drafted, reviewed, and published directly from admin.html — see
//                           updates-<program>.html.

const SUBMISSIONS_SHEET = 'Parent Submissions';
const SUBSCRIBERS_SHEET = 'Subscribers';
const COMMUNICATIONS_SHEET = 'Communications';
const BACKEND_VERSION = '2.9.0';
// Audience codes shared with LIST_OPTIONS in js/config.js (elementary/middle/
// high subscriber segments) plus 'lightweight' standing in for "Sponsors" —
// every Communication is tagged with exactly one of these.
const COMM_AUDIENCE_CODES = ['elementary', 'middle', 'high', 'lightweight'];
const SITE_URL = 'https://vicksburgcontrolfreaks.github.io/vcs-robotics-club/';
const CLUB_NAME = 'Vicksburg Robotics (Control Freaks)';
const CLAUDE_MODEL = 'claude-opus-5';

// Pre-generated, verified QR codes (see scan-card.html) — the AI polish step
// inserts these verbatim rather than asking the model to reproduce SVG path
// data itself, which LLMs render unreliably.
const JOIN_QR_SVG_BLOCK = '<div class="comm-qr">\n  <a href="join.html" target="_blank"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 51 51" shape-rendering="crispEdges"><path fill="#ffffff" d="M0 0h51v51H0z"/><path stroke="#1a1a1a" d="M1 1.5h7m1 0h1m5 0h1m1 0h1m3 0h1m1 0h1m1 0h1m1 0h1m1 0h1m2 0h2m3 0h1m3 0h1m1 0h7M1 2.5h1m5 0h1m1 0h3m2 0h2m2 0h4m1 0h1m2 0h1m1 0h5m1 0h3m2 0h3m1 0h1m5 0h1M1 3.5h1m1 0h3m1 0h1m1 0h2m3 0h3m2 0h1m3 0h2m2 0h1m1 0h1m5 0h1m4 0h2m1 0h1m1 0h3m1 0h1M1 4.5h1m1 0h3m1 0h1m2 0h2m1 0h1m3 0h1m2 0h2m1 0h6m3 0h1m1 0h5m1 0h1m2 0h1m1 0h3m1 0h1M1 5.5h1m1 0h3m1 0h1m2 0h1m2 0h1m1 0h2m1 0h3m2 0h5m2 0h1m5 0h3m4 0h1m1 0h3m1 0h1M1 6.5h1m5 0h1m1 0h2m2 0h1m1 0h1m2 0h1m1 0h1m2 0h1m3 0h1m2 0h1m1 0h1m1 0h2m3 0h1m3 0h1m5 0h1M1 7.5h7m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h7M9 8.5h1m1 0h1m1 0h1m2 0h2m1 0h1m1 0h3m3 0h1m2 0h1m3 0h1m1 0h2M3 9.5h3m1 0h1m1 0h3m1 0h3m1 0h2m2 0h9m3 0h1m1 0h1m1 0h1m1 0h1m1 0h4m2 0h3M5 10.5h1m2 0h1m2 0h3m2 0h1m3 0h2m1 0h1m5 0h3m1 0h1m2 0h3m3 0h3m2 0h1M2 11.5h3m1 0h7m1 0h1m1 0h1m1 0h1m1 0h3m1 0h1m1 0h1m1 0h1m1 0h1m4 0h1m1 0h1m1 0h4m1 0h3m1 0h2M2 12.5h2m1 0h1m2 0h2m1 0h2m1 0h1m1 0h6m1 0h2m1 0h4m1 0h1m4 0h1m2 0h1m1 0h2m2 0h1M1 13.5h1m2 0h5m1 0h1m3 0h2m1 0h1m1 0h1m1 0h3m1 0h1m1 0h1m1 0h6m1 0h3m1 0h3m1 0h1m2 0h3M2 14.5h1m1 0h1m1 0h1m1 0h6m2 0h3m1 0h3m1 0h1m8 0h1m3 0h2m1 0h1m1 0h2m1 0h1m1 0h1M4 15.5h1m2 0h2m1 0h2m4 0h1m3 0h2m1 0h1m1 0h2m3 0h2m1 0h3m3 0h3m2 0h6M1 16.5h1m3 0h2m3 0h3m1 0h8m2 0h2m2 0h1m4 0h1m1 0h1m2 0h4m1 0h1m1 0h1m1 0h3M1 17.5h5m1 0h2m3 0h1m1 0h2m1 0h1m2 0h1m3 0h1m1 0h1m1 0h1m1 0h1m1 0h4m1 0h1m2 0h3m1 0h1m2 0h1M2 18.5h2m2 0h1m3 0h1m2 0h3m1 0h1m1 0h10m6 0h6m2 0h6M1 19.5h1m1 0h1m2 0h2m2 0h1m3 0h1m1 0h2m1 0h1m2 0h1m2 0h3m1 0h3m1 0h2m7 0h3m1 0h1m1 0h2M1 20.5h3m2 0h1m5 0h2m2 0h1m2 0h1m1 0h1m4 0h1m2 0h2m3 0h1m3 0h3m2 0h3M2 21.5h3m2 0h2m4 0h3m1 0h1m2 0h1m2 0h2m4 0h1m2 0h1m2 0h1m1 0h5m1 0h2m2 0h1m1 0h1M6 22.5h1m2 0h1m1 0h3m1 0h1m4 0h1m1 0h2m1 0h4m2 0h1m1 0h1m8 0h2M1 23.5h1m3 0h5m1 0h2m2 0h2m2 0h1m2 0h7m3 0h4m1 0h1m1 0h1m1 0h5m2 0h2M5 24.5h1m3 0h1m2 0h3m2 0h2m4 0h1m3 0h1m4 0h1m5 0h1m2 0h1m3 0h1m3 0h1M3 25.5h1m1 0h1m1 0h1m1 0h3m5 0h1m1 0h2m2 0h1m1 0h1m1 0h1m2 0h1m3 0h4m3 0h1m1 0h1m1 0h1m1 0h3M2 26.5h4m3 0h1m4 0h5m1 0h2m1 0h1m3 0h1m3 0h2m3 0h1m1 0h1m2 0h1m3 0h5M1 27.5h3m1 0h12m1 0h3m2 0h5m1 0h1m1 0h1m3 0h2m1 0h8m1 0h1m1 0h1M1 28.5h3m1 0h2m1 0h1m4 0h2m3 0h2m2 0h1m2 0h1m2 0h1m1 0h2m2 0h2m3 0h1m1 0h2m1 0h1m3 0h2M2 29.5h1m1 0h1m1 0h5m2 0h5m1 0h1m2 0h3m4 0h2m1 0h2m2 0h2m2 0h2m1 0h1m3 0h1m1 0h1M1 30.5h4m4 0h6m2 0h1m1 0h2m3 0h2m1 0h1m3 0h1m1 0h1m4 0h1m2 0h2m1 0h3M1 31.5h3m1 0h1m1 0h2m2 0h2m1 0h2m2 0h1m1 0h1m2 0h2m2 0h3m1 0h9m1 0h3m1 0h1m1 0h3M1 32.5h1m2 0h2m3 0h2m2 0h1m2 0h3m1 0h5m4 0h1m4 0h1m2 0h3m1 0h1m2 0h2m2 0h1M3 33.5h5m1 0h1m2 0h6m4 0h2m1 0h1m2 0h1m2 0h3m1 0h2m1 0h6m1 0h1m1 0h1m1 0h1M1 34.5h1m1 0h1m1 0h1m2 0h3m2 0h1m1 0h3m3 0h2m4 0h1m2 0h2m1 0h2m3 0h1m1 0h1m1 0h1m5 0h1M7 35.5h1m1 0h1m2 0h1m2 0h2m1 0h1m8 0h1m2 0h1m1 0h5m1 0h2m2 0h2m1 0h1m2 0h2M1 36.5h6m1 0h3m1 0h1m1 0h2m1 0h3m1 0h2m3 0h1m8 0h1m2 0h2m1 0h1m6 0h1M2 37.5h4m1 0h3m1 0h2m2 0h1m2 0h2m3 0h4m1 0h2m1 0h1m4 0h2m1 0h3m1 0h1m1 0h4M1 38.5h2m1 0h1m1 0h1m2 0h2m4 0h5m2 0h4m3 0h3m9 0h1m4 0h1M2 39.5h1m3 0h3m3 0h2m2 0h2m1 0h1m1 0h1m2 0h2m3 0h2m1 0h5m2 0h1m1 0h5m2 0h2M2 40.5h3m5 0h5m1 0h3m1 0h3m1 0h1m1 0h1m1 0h1m1 0h2m1 0h2m11 0h1m1 0h2M1 41.5h3m3 0h1m2 0h1m1 0h2m4 0h1m4 0h5m1 0h1m2 0h1m3 0h3m1 0h6m2 0h2M9 42.5h4m3 0h1m1 0h2m3 0h1m3 0h1m2 0h1m1 0h1m1 0h1m2 0h1m3 0h1m3 0h1M1 43.5h7m3 0h1m1 0h1m2 0h1m1 0h3m2 0h1m1 0h1m1 0h1m2 0h1m1 0h2m2 0h3m2 0h1m1 0h1m1 0h2m1 0h2M1 44.5h1m5 0h1m2 0h1m3 0h2m4 0h1m2 0h1m3 0h2m1 0h1m2 0h3m2 0h4m3 0h1m2 0h1M1 45.5h1m1 0h3m1 0h1m1 0h2m5 0h1m3 0h8m2 0h2m3 0h11m1 0h1m1 0h1M1 46.5h1m1 0h3m1 0h1m1 0h1m2 0h3m1 0h3m3 0h2m2 0h1m2 0h1m1 0h3m2 0h3m1 0h1m4 0h2m2 0h1M1 47.5h1m1 0h3m1 0h1m1 0h1m4 0h1m1 0h1m1 0h2m3 0h1m1 0h2m1 0h1m1 0h4m1 0h5m1 0h1m4 0h4M1 48.5h1m5 0h1m4 0h3m2 0h3m1 0h1m2 0h1m1 0h6m1 0h2m5 0h6m3 0h1M1 49.5h7m3 0h1m6 0h1m4 0h1m2 0h2m1 0h4m1 0h4m1 0h1m1 0h1m4 0h4"/></svg></a>\n  <p>Scan or <a href="join.html" target="_blank">click here</a> to join the mailing list</p>\n</div>';

// ── Entry points ──────────────────────────────────────────────────────────

function doGet(e) {
  const params = (e && e.parameter) || {};
  try {
    if (params.action === 'unsubscribe') return handleUnsubscribe(params);
    if (params.action === 'list') return handleList(params);
    if (params.action === 'publishedCommunications') return handlePublishedCommunications(params);
    if (params.action === 'communicationsAdmin') return handleCommunicationsAdmin(params);
    if (params.action === 'rosterAdmin') return handleRosterAdmin(params);
    return jsonOut({ status: 'ok', version: BACKEND_VERSION });
  } catch (err) {
    return jsonOut({ status: 'error', message: err.message });
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.action === 'subscribe') {
      return handleSubscribe(data);
    }

    if (data.action === 'postCommunication') {
      return handlePostCommunication(data);
    }

    if (data.action === 'updateCommunication') {
      return handleUpdateCommunication(data);
    }

    if (data.action === 'deleteCommunication') {
      return handleDeleteCommunication(data);
    }

    if (data.action === 'polishCommunication') {
      return handlePolishCommunication(data);
    }

    // Legacy / family sign-up path — same shape parent_form.html has always sent.
    // (No "action" field on these submissions, so this stays the default branch.)
    return handleFamilySignup(data);

  } catch (err) {
    return jsonOut({ status: 'error', message: err.message });
  }
}

// ── Family / roster sign-up (existing behavior, unchanged) ─────────────────

function handleFamilySignup(data) {
  const sheet = getOrCreateSubmissionsSheet();

  const parent = data.parent || {};
  const parent2 = data.parent2 || {};
  const children = data.children || [];
  const submittedAt = data.submittedAt || new Date().toISOString();

  if (children.length === 0) {
    throw new Error('No children included in submission');
  }

  // Format additional contacts as "First Last | email | phone", one per line
  const extraContacts = (data.additionalContacts || []).map(function(c) {
    return [c.firstName, c.lastName].filter(Boolean).join(' ')
      + (c.email ? ' | ' + c.email : '')
      + (c.phone ? ' | ' + c.phone : '');
  }).join('\n');

  // One row per child (parent info repeated for easy filtering). Parent 2's
  // fields are appended at the END of the row, after Interested Roles — never
  // insert new fields in the middle of this array. The sheet's header row is
  // only ever written once, when the sheet is first created (see
  // getOrCreateSubmissionsSheet) — it's never rewritten for an existing
  // sheet, so inserting a field here would silently shift every column after
  // it out of alignment with its header label for every future row, with no
  // error thrown. Appending at the end is always safe: old rows simply have
  // blank cells in the new columns.
  children.forEach(function(child) {
    sheet.appendRow([
      submittedAt,
      parent.firstName || '',
      parent.lastName  || '',
      parent.email     || '',
      parent.phone     || '',
      extraContacts,
      child.name       || '',
      child.grade      || '',
      child.shirtSize  || '',
      (child.roles || []).join(', '),
      parent2.firstName || '',
      parent2.lastName  || '',
      parent2.email     || '',
      parent2.phone     || ''
    ]);
  });

  // Combined join flow: family form also offers a mailing-list opt-in checkbox.
  if (data.subscribeToMailingList && parent.email) {
    const name = [parent.firstName, parent.lastName].filter(Boolean).join(' ');
    const lists = Array.isArray(data.mailingListLists) ? data.mailingListLists.filter(Boolean) : [];
    upsertSubscriber(name, parent.email, 'family-form', true, lists);
  }

  return jsonOut({ status: 'ok' });
}

function getOrCreateSubmissionsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SUBMISSIONS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(SUBMISSIONS_SHEET);
    sheet.appendRow([
      'Submitted At', 'Parent First', 'Parent Last', 'Email', 'Phone',
      'Additional Contacts',
      'Child Name', 'Grade', 'Shirt Size', 'Interested Roles',
      'Parent 2 First', 'Parent 2 Last', 'Parent 2 Email', 'Parent 2 Phone'
    ]);
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 180); // timestamp
    sheet.setColumnWidth(4, 220); // email
  }
  return sheet;
}

// ── Mailing list: subscribe ─────────────────────────────────────────────────

function handleSubscribe(data) {
  const name = (data.name || '').trim();
  const email = (data.email || '').trim().toLowerCase();

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error('A valid email address is required.');
  }

  const lists = Array.isArray(data.lists) ? data.lists.filter(Boolean) : [];
  if (lists.length === 0) {
    throw new Error('Please choose at least one list.');
  }

  const result = upsertSubscriber(name, email, data.source || 'quick-subscribe', true, lists);
  sendConfirmationEmail(name, email, result.token);
  return jsonOut({ status: 'ok' });
}

// Adds a new subscriber row, or reactivates/updates an existing one by email.
// `lists` is an array of segment codes (see LIST_OPTIONS in js/config.js) —
// always overwritten with the latest submission, same as name.
// Returns { token, isNew }.
function upsertSubscriber(name, email, source, sendEmailOnCreate, lists) {
  const sheet = getOrCreateSubscribersSheet();
  const values = sheet.getDataRange().getValues();
  const now = new Date().toISOString();
  const listsStr = (lists || []).join(', ');

  for (let i = 1; i < values.length; i++) {
    const rowEmail = String(values[i][2] || '').trim().toLowerCase();
    if (rowEmail === email) {
      const rowNum = i + 1;
      const token = values[i][3] || Utilities.getUuid();
      if (name) sheet.getRange(rowNum, 2).setValue(name);
      sheet.getRange(rowNum, 4).setValue(token);       // token (in case an old row predates tokens)
      sheet.getRange(rowNum, 5).setValue('subscribed');
      sheet.getRange(rowNum, 7).setValue(now);         // subscribed at (re-subscribed)
      sheet.getRange(rowNum, 8).setValue('');           // clear unsubscribed at
      sheet.getRange(rowNum, 9).setValue(listsStr);
      return { token: token, isNew: false };
    }
  }

  const token = Utilities.getUuid();
  sheet.appendRow([now, name, email, token, 'subscribed', source || '', now, '', listsStr]);
  return { token: token, isNew: true };
}

function getOrCreateSubscribersSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SUBSCRIBERS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(SUBSCRIBERS_SHEET);
    sheet.appendRow([
      'Created At', 'Name', 'Email', 'Token', 'Status', 'Source', 'Subscribed At', 'Unsubscribed At', 'Lists'
    ]);
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(3, 220); // email
    sheet.setColumnWidth(4, 260); // token
    sheet.setColumnWidth(9, 200); // lists
  }
  return sheet;
}

function sendConfirmationEmail(name, email, token) {
  const unsubscribeUrl = SITE_URL + 'unsubscribe.html?token=' + encodeURIComponent(token);
  const greeting = name ? ('Hi ' + name + ',') : 'Hi,';
  const subject = "You're subscribed — " + CLUB_NAME;
  const body =
    greeting + '\n\n' +
    "You're now on the mailing list for " + CLUB_NAME + ". " +
    "We'll use this list to send occasional updates about meetings, competitions, and community events.\n\n" +
    "If you didn't request this, or ever want off the list, click below — no need to contact anyone:\n" +
    unsubscribeUrl + '\n\n' +
    '— Vicksburg Robotics';

  MailApp.sendEmail(email, subject, body);
}

// ── Mailing list: unsubscribe ────────────────────────────────────────────────

function handleUnsubscribe(params) {
  const token = params.token;
  if (!token) throw new Error('Missing unsubscribe token.');

  const sheet = getOrCreateSubscribersSheet();
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][3]) === String(token)) {
      const rowNum = i + 1;
      const alreadyUnsubscribed = values[i][4] === 'unsubscribed';
      sheet.getRange(rowNum, 5).setValue('unsubscribed');
      if (!alreadyUnsubscribed) {
        sheet.getRange(rowNum, 8).setValue(new Date().toISOString());
      }
      return jsonOut({ status: 'ok', email: values[i][2] });
    }
  }

  return jsonOut({ status: 'error', message: 'That unsubscribe link is invalid or has already been used.' });
}

// ── Admin: list subscribers ──────────────────────────────────────────────────

function handleList(params) {
  const expected = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  if (!expected || params.password !== expected) {
    return jsonOut({ status: 'error', message: 'Invalid password.' });
  }

  const sheet = getOrCreateSubscribersSheet();
  const values = sheet.getDataRange().getValues();
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    rows.push({
      createdAt: values[i][0],
      name: values[i][1],
      email: values[i][2],
      status: values[i][4],
      source: values[i][5],
      subscribedAt: values[i][6],
      unsubscribedAt: values[i][7],
      lists: values[i][8] || ''
    });
  }
  return jsonOut({ status: 'ok', subscribers: rows });
}

// ── Team communications ───────────────────────────────────────────────────────
// Flow: teacher pastes raw notes into admin.html → saved here as a 'draft' row.
// Nothing is public yet. Claude reviews/reformats the draft to match the site's
// styling, then calls updateCommunication to set the cleaned-up body + a short
// plain-text summary and flip status to 'published' — only then does it show
// up on updates.html or become eligible for the "Compose announcement" email.

function handlePostCommunication(data) {
  const expected = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  if (!expected || data.password !== expected) {
    return jsonOut({ status: 'error', message: 'Invalid password.' });
  }

  const title = (data.title || '').trim();
  const body = (data.body || '').trim();
  const audience = data.audience;
  if (!title || !body) {
    return jsonOut({ status: 'error', message: 'Title and content are both required.' });
  }
  if (COMM_AUDIENCE_CODES.indexOf(audience) === -1) {
    return jsonOut({ status: 'error', message: 'Please choose which program this is for.' });
  }

  const sheet = getOrCreateCommunicationsSheet();
  const id = Utilities.getUuid();
  const now = new Date().toISOString();
  sheet.appendRow([id, now, title, body, '', 'draft', '', audience]);
  return jsonOut({ status: 'ok', id: id });
}

// Claude-facing: overwrite a draft's title/body/summary and/or flip its status.
// Only fields present in `data` are touched, so a status-only call (publish)
// doesn't require re-sending title/body.
function handleUpdateCommunication(data) {
  const expected = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  if (!expected || data.password !== expected) {
    return jsonOut({ status: 'error', message: 'Invalid password.' });
  }

  const id = data.id;
  if (!id) return jsonOut({ status: 'error', message: 'Missing communication ID.' });

  const sheet = getOrCreateCommunicationsSheet();
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      const rowNum = i + 1;
      if (data.title    !== undefined) sheet.getRange(rowNum, 3).setValue(data.title);
      if (data.body     !== undefined) sheet.getRange(rowNum, 4).setValue(data.body);
      if (data.summary  !== undefined) sheet.getRange(rowNum, 5).setValue(data.summary);
      if (data.status   !== undefined) {
        sheet.getRange(rowNum, 6).setValue(data.status);
        if (data.status === 'published') {
          sheet.getRange(rowNum, 7).setValue(new Date().toISOString());
        }
      }
      if (data.audience !== undefined) {
        if (COMM_AUDIENCE_CODES.indexOf(data.audience) === -1) {
          return jsonOut({ status: 'error', message: 'Unknown audience code.' });
        }
        sheet.getRange(rowNum, 8).setValue(data.audience);
      }
      if (data.announcedAt !== undefined) {
        sheet.getRange(rowNum, 9).setValue(data.announcedAt);
      }
      return jsonOut({ status: 'ok' });
    }
  }

  return jsonOut({ status: 'error', message: 'Communication not found.' });
}

// Removes a row entirely — for stale/duplicate drafts, not a public "unpublish."
function handleDeleteCommunication(data) {
  const expected = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  if (!expected || data.password !== expected) {
    return jsonOut({ status: 'error', message: 'Invalid password.' });
  }

  const id = data.id;
  if (!id) return jsonOut({ status: 'error', message: 'Missing communication ID.' });

  const sheet = getOrCreateCommunicationsSheet();
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return jsonOut({ status: 'ok' });
    }
  }

  return jsonOut({ status: 'error', message: 'Communication not found.' });
}

const AUDIENCE_LABELS_FOR_AI = {
  elementary:  'Elementary Robotics',
  middle:      'Middle School Robotics (FTC Teams 5618 & 6494)',
  high:        'High School Robotics (FRC Team 8126)',
  lightweight: 'Sponsors (a quarterly, low-volume program update)'
};

// Sends a draft's title/body to Claude for copyediting: fixes mistakes,
// interprets intent (e.g. a sentence written to the AI editor rather than
// the reader, like "share the QR code here"), and returns polished HTML +
// a plain-text summary for the announcement email. Never auto-publishes —
// the admin still reviews the result and clicks Publish themselves.
// One-time setup helper — run this manually (▶) from the Apps Script editor
// once to trigger the "Connect to an external service" authorization prompt.
// Calling handlePolishCommunication directly instead won't work for this:
// it throws immediately on the missing `data` argument before ever reaching
// UrlFetchApp.fetch, so Apps Script never detects the scope is needed and
// never prompts for it. This function has no such dependency — it always
// reaches the fetch call. The request itself is expected to fail (no API
// key needed here) — only the permission prompt matters.
function authorizeExternalRequests() {
  UrlFetchApp.fetch('https://api.anthropic.com/v1/models', { muteHttpExceptions: true });
}

function handlePolishCommunication(data) {
  const expected = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  if (!expected || data.password !== expected) {
    return jsonOut({ status: 'error', message: 'Invalid password.' });
  }

  const apiKey = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return jsonOut({ status: 'error', message: "AI polish isn't configured yet — add an ANTHROPIC_API_KEY Script Property (see the setup note at the top of Code.gs)." });
  }

  const title = (data.title || '').trim();
  const body = (data.body || '').trim();
  const instructions = (data.instructions || '').trim();
  if (!title || !body) {
    return jsonOut({ status: 'error', message: 'Title and body are required before polishing.' });
  }
  const audienceLabel = AUDIENCE_LABELS_FOR_AI[data.audience] || 'the team';

  const systemPrompt = [
    'You copyedit team communications for Vicksburg Robotics (Control Freaks), a school robotics',
    'program with four audiences: Elementary Robotics, Middle School Robotics (FTC Teams 5618 & 6494),',
    'High School Robotics (FRC Team 8126), and Sponsors. This draft is addressed to: ' + audienceLabel + '.',
    '',
    'Rewrite the draft into clean HTML for direct embedding in a web page:',
    '- Wrap each paragraph in <p>...</p>.',
    '- If the content describes a schedule of dated events, you may use:',
    '  <div class="comm-day">DATE</div>',
    '  <div class="comm-event"><div class="comm-event-time">TIME</div><div class="comm-event-title">TITLE</div><p>DESCRIPTION</p></div>',
    '- For an important safety/logistics warning, you may use:',
    '  <div class="comm-alert"><div class="comm-alert-title">⚠️ TITLE</div><p>DESCRIPTION</p></div>',
    '',
    'CRITICAL — meta-instructions: the draft may contain a sentence written TO YOU (the editor)',
    'rather than for the reader — e.g. "I also want to share the QR code for X" or "add a link here."',
    'Never include such a sentence verbatim in the output. Instead:',
    '  - If it asks to share/include the mailing-list sign-up QR code or link, insert exactly this',
    '    placeholder on its own line — nothing wrapped around it, it already renders as a complete,',
    '    styled block: [[QR_JOIN]]',
    '  - Never invent your own QR markup, and never use the placeholder more than once.',
    '  - For any other meta-instruction you cannot confidently resolve, leave it out of the body',
    '    entirely and describe what\'s needed in the "notes" field instead — never invent a link,',
    '    date, or fact to satisfy it.',
    '',
    'If an "Additional instructions for this revision" section is given below, follow it — it may',
    'ask for tone adjustments, layout changes, or content changes. The same placeholder rule still',
    'applies: never draw a QR code yourself, only place the placeholder.',
    '',
    'Also fix grammar/typos and tighten the wording — warm but professional, matching a school',
    'robotics program\'s voice. Preserve every concrete fact (dates, times, locations, names, links)',
    'exactly as given; never invent or alter one.',
    '',
    'Also write "summary": 3-6 short plain-text lines (no bullet characters), one concrete fact per',
    'line, for a quick email digest.',
    '',
    'Respond with ONLY a JSON object, no markdown fences, no other text:',
    '{"body": "<html>", "summary": "line1\\nline2\\n...", "notes": "anything needing human attention, or empty string"}'
  ].join('\n');

  let userContent = 'Title: ' + title + '\n\nDraft body:\n' + body;
  if (instructions) {
    userContent += '\n\nAdditional instructions for this revision:\n' + instructions;
  }

  const payload = {
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    output_config: { effort: 'medium' },
    system: systemPrompt,
    messages: [
      { role: 'user', content: userContent }
    ]
  };

  let response;
  try {
    response = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  } catch (err) {
    return jsonOut({ status: 'error', message: 'Could not reach the AI service: ' + err.message });
  }

  const code = response.getResponseCode();
  if (code !== 200) {
    return jsonOut({ status: 'error', message: 'AI service error (' + code + '): ' + response.getContentText().slice(0, 300) });
  }

  const result = JSON.parse(response.getContentText());
  if (result.stop_reason === 'refusal') {
    return jsonOut({ status: 'error', message: 'The AI declined to process this draft. Please edit it manually.' });
  }

  const textBlock = (result.content || []).filter(function (b) { return b.type === 'text'; })[0];
  if (!textBlock) {
    return jsonOut({ status: 'error', message: 'AI response had no usable text.' });
  }

  let parsed;
  try {
    const cleaned = textBlock.text.trim()
      .replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
    parsed = JSON.parse(cleaned);
  } catch (err) {
    return jsonOut({ status: 'error', message: 'Could not parse the AI response as JSON.' });
  }

  let polishedBody = String(parsed.body || '');
  polishedBody = polishedBody.split('[[QR_JOIN]]').join(JOIN_QR_SVG_BLOCK);

  return jsonOut({
    status: 'ok',
    body: polishedBody,
    summary: String(parsed.summary || ''),
    notes: String(parsed.notes || '')
  });
}

// Public — no password. Only published posts, newest first, optionally
// scoped to one program via ?audience=. Powers updates-<program>.html.
function handlePublishedCommunications(params) {
  const audienceFilter = params && params.audience;
  const sheet = getOrCreateCommunicationsSheet();
  const values = sheet.getDataRange().getValues();
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    if (values[i][5] !== 'published') continue;
    if (audienceFilter && values[i][7] !== audienceFilter) continue;
    rows.push({
      id: values[i][0],
      title: values[i][2],
      body: values[i][3],
      audience: values[i][7] || '',
      publishedAt: values[i][6] || values[i][1]
    });
  }
  rows.sort(function (a, b) { return new Date(b.publishedAt) - new Date(a.publishedAt); });
  return jsonOut({ status: 'ok', communications: rows });
}

// Password-gated — every draft and published row, for admin.html's review lists.
function handleCommunicationsAdmin(params) {
  const expected = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  if (!expected || params.password !== expected) {
    return jsonOut({ status: 'error', message: 'Invalid password.' });
  }

  const sheet = getOrCreateCommunicationsSheet();
  const values = sheet.getDataRange().getValues();
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    rows.push({
      id: values[i][0],
      createdAt: values[i][1],
      title: values[i][2],
      body: values[i][3],
      summary: values[i][4],
      status: values[i][5],
      publishedAt: values[i][6],
      audience: values[i][7] || '',
      announcedAt: values[i][8] || ''
    });
  }
  rows.sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
  return jsonOut({ status: 'ok', communications: rows });
}

function getOrCreateCommunicationsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(COMMUNICATIONS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(COMMUNICATIONS_SHEET);
    sheet.appendRow([
      'ID', 'Created At', 'Title', 'Body', 'Summary', 'Status', 'Published At', 'Audience', 'Announced At'
    ]);
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 220); // id
    sheet.setColumnWidth(4, 400); // body
    sheet.setColumnWidth(5, 300); // summary
    sheet.setColumnWidth(8, 120); // audience
    sheet.setColumnWidth(9, 160); // announced at
  }
  return sheet;
}

// ── Admin: roster / t-shirt sizes ─────────────────────────────────────────────
// Reads Parent Submissions directly — already one row per child, so this is
// naturally one row per shirt needed. Powers admin.html's roster/shirt list.

function handleRosterAdmin(params) {
  const expected = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  if (!expected || params.password !== expected) {
    return jsonOut({ status: 'error', message: 'Invalid password.' });
  }

  const sheet = getOrCreateSubmissionsSheet();
  const values = sheet.getDataRange().getValues();
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    rows.push({
      submittedAt: values[i][0],
      parentName:  [values[i][1], values[i][2]].filter(Boolean).join(' '),
      email:       values[i][3],
      phone:       values[i][4],
      childName:   values[i][6],
      grade:       values[i][7],
      shirtSize:   values[i][8],
      roles:       values[i][9]
    });
  }
  return jsonOut({ status: 'ok', roster: rows });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
