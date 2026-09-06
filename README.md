# Vicksburg Robotics Website

Public site for Vicksburg Robotics (Control Freaks), Vicksburg Community Schools' extracurricular
robotics program — four teams under one umbrella: Elementary Robotics, Middle School Robotics
(FTC 5618 & 6494), High School Robotics (FRC 8126), and a Sponsors/community list. Plain HTML/CSS/JS,
hosted on GitHub Pages, backed by Google Apps Script.

**Live site:** https://vicksburgcontrolfreaks.github.io/vcs-robotics-club/

## Structure

```
index.html          Landing page
about.html           About / team / roles page
join.html            Mailing-list subscribe + full family/roster sign-up
updates.html         Hub page — links to the four program update pages below
updates-elementary.html   Public archive, Elementary Robotics only
updates-middle.html       Public archive, Middle School Robotics (FTC 5618 & 6494) only
updates-high.html         Public archive, High School Robotics (FRC 8126) only
updates-sponsors.html     Public archive, Sponsors (quarterly) only
unsubscribe.html     Landing page for unsubscribe email links (?token=...)
admin.html           Password-gated subscriber list, CSV export, communications posting (unlisted, not in nav)
img/control-freaks-logo.png  Team logo, used in every page's header
css/style.css        Shared styles (red/white primary, black/grey secondary — from the team logo)
js/config.js         SCRIPT_URL/SITE_URL + shared constants (roles, grades, shirt sizes, mailing-list
                     segments, COMM_AUDIENCES — the four programs)
js/subscribe.js      Quick mailing-list subscribe form logic
js/family-form.js    Full family/roster sign-up form logic
js/unsubscribe.js    Unsubscribe page logic
js/updates.js        Shared by the four updates-<program>.html pages — each sets PAGE_AUDIENCE
                     before loading this script, which fetches + renders just that program's posts
js/admin.js          Admin login + subscriber table + CSV export + communications posting/review
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
3. **Project Settings → Script Properties** → add:
   - `ADMIN_PASSWORD` = a password only you and other club leads know (used by `admin.html`).
   - `ANTHROPIC_API_KEY` = an Anthropic API key (optional — powers the "✨ Polish with AI" button in
     the draft review panel; everything else works fine without it, the button just shows a clear
     error instead).
4. Confirm the `SITE_URL` constant at the top of `Code.gs` matches this site's GitHub Pages URL.
5. **Deploy → Manage deployments** → edit the existing deployment → set a new version → Deploy.
   This keeps the same `/exec` URL already in use — no need to update `SCRIPT_URL` anywhere.
6. If `SCRIPT_URL` ever does change, update it in both:
   - `js/config.js` (this site)
   - `C:\Users\matt\StudioProjects\cte\8126\parent_form.html`

### Sheets

- **Parent Submissions** — one row per child, from the full family sign-up form (pre-existing).
- **Subscribers** — one row per mailing-list contact: name, email, unsubscribe token, status
  (`subscribed` / `unsubscribed`), source, timestamps, and a `Lists` column (comma-separated segment
  codes — see `LIST_OPTIONS` in [js/config.js](js/config.js): `elementary`, `middle`, `high`,
  `lightweight`). Created automatically on first subscribe.
- **Communications** — team update posts: ID, timestamps, title, body (HTML), a plain-text summary
  (used for the announcement email), status (`draft` / `published`), an `Audience` column — one
  of `elementary` / `middle` / `high` / `lightweight` (same codes as `Lists` above; `lightweight` =
  Sponsors) — and an `Announced At` timestamp, set when the admin clicks "Mark as announced" on a
  published post (purely bookkeeping — doesn't unpublish or touch the live page either way).
  Drafts are written from admin.html; review, edit, optional AI polish, and publish all
  happen there (in-browser, no Claude Code session needed) — publishing is what makes a post appear
  on that program's `updates-<program>.html` page.
- **AI polish + QR placeholders.** The "✨ Polish with AI" button sends a draft's raw title/body to
  Claude to copyedit and catch meta-instructions written to the editor rather than the reader (e.g.
  "share the QR code here"). Rather than have the model reproduce QR SVG path data (unreliable), it's
  told to emit a literal `[[QR_JOIN]]` / `[[QR_DISCORD]]` placeholder, which `Code.gs` substitutes
  with the real, pre-generated SVG block (`JOIN_QR_SVG_BLOCK` / `DISCORD_QR_SVG_BLOCK`) before
  returning the result — the model only ever decides *where*, never *what*.

### Endpoints (all on the one deployed web app URL)

| Action | Method | Params / body | What it does |
|---|---|---|---|
| Family sign-up (legacy, no `action` field) | POST | `{ parent, additionalContacts, children, subscribeToMailingList, mailingListLists, submittedAt }` | Appends to Parent Submissions; optionally upserts a Subscriber row too |
| Subscribe | POST | `{ action: 'subscribe', name, email, lists, source }` | Upserts Subscriber row, generates/reuses a token, sends confirmation email with unsubscribe link |
| Unsubscribe | GET | `?action=unsubscribe&token=...` | Marks the matching Subscriber row `unsubscribed` |
| Admin list | GET | `?action=list&password=...` | Returns all Subscriber rows as JSON if password matches `ADMIN_PASSWORD` |
| Post communication | POST | `{ action: 'postCommunication', password, title, body, audience }` | Appends a Communications row with status `draft`; `audience` must be one of `COMM_AUDIENCE_CODES` |
| Update communication | POST | `{ action: 'updateCommunication', password, id, title?, body?, summary?, status?, audience?, announcedAt? }` | Overwrites only the fields given; `status: 'published'` also stamps Published At. Used by admin.html's review/publish flow and by "Mark as announced" (sets `announcedAt`) |
| Delete communication | POST | `{ action: 'deleteCommunication', password, id }` | Removes a Communications row entirely — for stale/duplicate drafts |
| Polish communication | POST | `{ action: 'polishCommunication', password, title, body, audience, instructions? }` | Sends the draft to Claude (`claude-opus-5`) to copyedit and interpret intent, optionally following a free-form `instructions` note (e.g. "add the Discord QR too, side by side") — returns `{ body, summary, notes }`; doesn't save anything itself. Requires `ANTHROPIC_API_KEY` |
| Published communications | GET | `?action=publishedCommunications&audience=<code>` | Public, no password — only `published` rows, newest first, optionally scoped to one program. Powers each updates-<program>.html |
| Communications admin | GET | `?action=communicationsAdmin&password=...` | All Communications rows (draft + published, every program), for admin.html's review lists |
| Roster admin | GET | `?action=rosterAdmin&password=...` | Parent Submissions rows as JSON (child, grade, shirt size, parent, email) — one row per child, doubles as the shirt-order list |

## Admin page

`admin.html` is intentionally left out of the site nav — it's reachable only by direct URL. Access
is gated by a shared password checked server-side against the `ADMIN_PASSWORD` Script Property (not
committed to this repo). This is a low-stakes convenience gate, not strong security: the password is
sent as a URL query parameter, so avoid reusing a password used elsewhere.

Once logged in, a left-side nav (`.admin-layout`/`.admin-side-nav` in css/style.css) jumps between
Subscribers/New Draft/Drafts/Published/Roster & Shirt Sizes — sticky on desktop, a wrapping row
above the content on narrow screens. Note: switching to `flex-direction: column` at that breakpoint
also swaps which axis `align-items` governs, so the mobile rule explicitly sets `align-items:
stretch` there — omitting it lets `.admin-main` size to its widest child (the subscriber table)
instead of the container, which blows out the whole page width silently.

Besides the subscriber list/export, admin.html also holds: quick links out to the join-page QR
scan card and updates.html; a communications draft form with an in-browser review/edit/publish
flow (live preview, plain-text auto-formatted into paragraphs) and per-draft delete (see
Communications above); and the team roster with a shirt-size tally + CSV export, pulled straight
from Parent Submissions.

## Local development

No build step. Open any `.html` file directly, or serve the folder locally, e.g.:

```
npx serve .
```

## GitHub Pages setup

Repo Settings → Pages → Source: Deploy from branch → `main` / `/ (root)`.

## Resources

- **Join-page QR code ("Control Freaks Scan Card")** — printable QR linking to `join.html`, with a
  print-flyer button: https://claude.ai/code/artifact/6f310e9f-0205-4cf5-a6e4-304d39c68858
  (still navy/gold themed from before the red/black/white rebrand — see TODO.md)
- **Backlog** — see [TODO.md](TODO.md) for planned form/mailing-list changes.
