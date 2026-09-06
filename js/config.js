// VCS Robotics Club — shared site config
// Paste your deployed Apps Script web app URL here (same project as apps-script/Code.gs).
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxSId_xJpoV06JIPtKC23HvK3F9pmZm417ZRcAo8PJUJeYNsWWXr1J2MXxgPmsquL5W/exec';
const SITE_URL = 'https://vicksburgcontrolfreaks.github.io/vcs-robotics-club/';

const ROLE_OPTIONS = [
  'Programmer',
  'Builder / Fabrication',
  'Media (photos & video)',
  "Engineer's Portfolio"
];
const SHIRT_SIZES = ['Youth XS','Youth S','Youth M','Youth L','Adult S','Adult M','Adult L','Adult XL','Adult XXL'];
const GRADES = ['6th','7th','8th','9th','10th','11th','12th'];

// Mailing-list segments. "lightweight" is a standalone quarterly-only digest
// (no team-specific mail) — aimed at sponsors and anyone who wants low-volume
// updates. Subscribers can pick any combination of these.
const LIST_OPTIONS = [
  { value: 'elementary', label: 'Elementary team' },
  { value: 'middle',     label: 'Middle school team' },
  { value: 'high',       label: 'High school team' },
  { value: 'lightweight', label: 'Quarterly program update only' }
];

// Renders the shared list-picker checkboxes. `namePrefix` keeps multiple
// instances on one page (join.html has two) from colliding.
function listOptionsHtml(namePrefix) {
  return LIST_OPTIONS.map(function (o) {
    return '<label><input type="checkbox" name="' + namePrefix + '" value="' + o.value + '"> ' + o.label + '</label>';
  }).join('');
}

// The four programs VCS Robotics communicates to. `value` codes intentionally
// match LIST_OPTIONS above (elementary/middle/high/lightweight) — a
// communication's audience and a subscriber's list preference are the same
// vocabulary, so "Compose announcement" can match one to the other directly.
// "Sponsors" reuses the 'lightweight' code — same low-volume audience.
const COMM_AUDIENCES = [
  { value: 'elementary',  label: 'Elementary Robotics',  teamLine: 'Team numbers coming soon',    page: 'updates-elementary.html' },
  { value: 'middle',      label: 'Middle School Robotics', teamLine: 'FTC Teams 5618 & 6494',     page: 'updates-middle.html' },
  { value: 'high',        label: 'High School Robotics', teamLine: 'FRC Team 8126',               page: 'updates-high.html' },
  { value: 'lightweight', label: 'Sponsors',             teamLine: 'Quarterly program updates',    page: 'updates-sponsors.html' }
];
