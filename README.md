# VCS Robotics Club Website

Public site for VCS Robotics (FRC Team 8126 — Vicksburg Control Freaks), Vicksburg Community Schools'
extracurricular robotics club. Plain HTML/CSS/JS, hosted on GitHub Pages, backed by Google Apps Script.

**Live site:** https://vicksburgcontrolfreaks.github.io/vcs-robotics-club/

## Structure

```
index.html          Landing page
about.html           About / team / roles page
join.html            Mailing-list subscribe + full family/roster sign-up
unsubscribe.html     Landing page for unsubscribe email links (?token=...)
admin.html           Password-gated subscriber list + CSV export (unlisted, not in nav)
css/style.css        Shared styles (navy #1b2a4a + gold/amber theme)
js/config.js         SCRIPT_URL + shared constants (roles, grades, shirt sizes)
js/subscribe.js      Quick mailing-list subscribe form logic
js/family-form.js    Full family/roster sign-up form logic
js/unsubscribe.js    Unsubscribe page logic
js/admin.js          Admin login + subscriber table + CSV export
apps-script/Code.gs  Backend source (copy into the Apps Script project — see below)
```

## Backend (Google Apps Script)

This site shares the **same Apps Script project and deployment** as the CTE class's
`parent_form.html` (`C:\Users\matt\StudioProjects\cte\8126\parent_form.html`). `apps-script/Code.gs`
in this repo is a superset of that project's existing script — the original family/roster
submission logic is unchanged, plus new mailing-list subscribe/unsubscribe/admin-list actions.

**To deploy/update:**

1. Open the existing Apps Script project (linked to the same Google Sheet used by
   `parent_form.html`'s `Parent Submissions` sheet).
2. Replace its script content with [`apps-script/Code.gs`](apps-script/Code.gs) from this repo.
3. **Project Settings → Script Properties** → add a property:
   - `ADMIN_PASSWORD` = a password only you and other club leads know (used by `admin.html`).
4. Confirm the `SITE_URL` constant at the top of `Code.gs` matches this site's GitHub Pages URL.
5. **Deploy → Manage deployments** → edit the existing deployment → set a new version → Deploy.
   This keeps the same `/exec` URL already in use — no need to update `SCRIPT_URL` anywhere.
6. If `SCRIPT_URL` ever does change, update it in both:
   - `js/config.js` (this site)
   - `C:\Users\matt\StudioProjects\cte\8126\parent_form.html`

### Sheets

- **Parent Submissions** — one row per child, from the full family sign-up form (pre-existing).
- **Subscribers** — one row per mailing-list contact: name, email, unsubscribe token, status
  (`subscribed` / `unsubscribed`), source, and timestamps. Created automatically on first subscribe.

### Endpoints (all on the one deployed web app URL)

| Action | Method | Params / body | What it does |
|---|---|---|---|
| Family sign-up (legacy, no `action` field) | POST | `{ parent, additionalContacts, children, subscribeToMailingList, submittedAt }` | Appends to Parent Submissions; optionally upserts a Subscriber row too |
| Subscribe | POST | `{ action: 'subscribe', name, email, source }` | Upserts Subscriber row, generates/reuses a token, sends confirmation email with unsubscribe link |
| Unsubscribe | GET | `?action=unsubscribe&token=...` | Marks the matching Subscriber row `unsubscribed` |
| Admin list | GET | `?action=list&password=...` | Returns all Subscriber rows as JSON if password matches `ADMIN_PASSWORD` |

## Admin page

`admin.html` is intentionally left out of the site nav — it's reachable only by direct URL. Access
is gated by a shared password checked server-side against the `ADMIN_PASSWORD` Script Property (not
committed to this repo). This is a low-stakes convenience gate, not strong security: the password is
sent as a URL query parameter, so avoid reusing a password used elsewhere.

## Local development

No build step. Open any `.html` file directly, or serve the folder locally, e.g.:

```
npx serve .
```

## GitHub Pages setup

Repo Settings → Pages → Source: Deploy from branch → `main` / `/ (root)`.
