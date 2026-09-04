// VCS Robotics — Parent Form + Club Mailing List Backend
// Deploy as: Web app → Execute as: Me → Who has access: Anyone
// Deployment URL goes into: cte/8126/parent_form.html (SCRIPT_URL) AND
//                            vcs-robotics-club/js/config.js (SCRIPT_URL) — same deployment, both sites hit it.
//
// One-time setup after copying this into the Apps Script project:
//   1. Project Settings → Script Properties → add ADMIN_PASSWORD = <a password only you know>
//   2. Confirm SITE_URL below matches your GitHub Pages URL.
//   3. Deploy → Manage deployments → edit the existing deployment → New version → Deploy.
//      (Keeps the same /exec URL that's already pasted into parent_form.html.)
//
// Sheets used (auto-created on first use):
//   "Parent Submissions" — one row per child, from the full family sign-up form (unchanged from before).
//   "Subscribers"         — one row per mailing-list contact, with a token used for unsubscribe links.

const SUBMISSIONS_SHEET = 'Parent Submissions';
const SUBSCRIBERS_SHEET = 'Subscribers';
const BACKEND_VERSION = '2.1.0';
const SITE_URL = 'https://vicksburgcontrolfreaks.github.io/vcs-robotics-club/';
const CLUB_NAME = 'VCS Robotics (FRC Team 8126 — Vicksburg Control Freaks)';

// ── Entry points ──────────────────────────────────────────────────────────

function doGet(e) {
  const params = (e && e.parameter) || {};
  try {
    if (params.action === 'unsubscribe') return handleUnsubscribe(params);
    if (params.action === 'list') return handleList(params);
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

  // One row per child (parent info repeated for easy filtering)
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
      (child.roles || []).join(', ')
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
      'Child Name', 'Grade', 'Shirt Size', 'Interested Roles'
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
    '— VCS Robotics';

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
