# Site / backend TODO

Running backlog. Add to this whenever a new idea comes up; check items off as they're built.
Nothing here is implemented yet — this is planning only.

## Sign-up form

- [ ] **Grades K–12, not just 6–12.** [js/config.js](js/config.js) `GRADES` currently only lists
      `6th`–`12th`. Extend to `K, 1st, 2nd, ... 12th`. Also check whether
      `C:\Users\matt\StudioProjects\cte\8126\parent_form.html` has its own hardcoded grade list
      (separate repo, shares the same Apps Script backend but may not share `config.js`) — update
      there too if so.
- [x] **Sponsor option.** Added a "Sponsor the team" card to [join.html](join.html) linking directly
      to RevTrak (opens in a new tab), with a note that donations may be tax-deductible since
      Vicksburg Community Schools is a public district (not a 501(c)(3) claim — worded accordingly).

## Mailing list segmentation ✅ built — needs redeploy

- [x] **Team-interest picker on subscribe.** Added a multi-select (checkboxes) to the quick-subscribe
      form ([join.html](join.html) / [js/subscribe.js](js/subscribe.js)) and the family form's opt-in
      ([js/family-form.js](js/family-form.js)): **Elementary team**, **Middle school team**,
      **High school team**, plus the lightweight option below — pick any/all. Options come from
      `LIST_OPTIONS` in [js/config.js](js/config.js).
- [x] **"Lightweight" list option.** Included in the same checkbox group — quarterly whole-program
      update only, no team-specific mail. Good for sponsors and anyone who wants low-volume updates.
- [x] **Backend: store selections.** [apps-script/Code.gs](apps-script/Code.gs) — `Subscribers` sheet
      gained a `Lists` column (comma-separated codes), threaded through `upsertSubscriber()`,
      `handleSubscribe()`, and the family sign-up's mailing-list opt-in. Bumped to v2.1.0.
- [x] **Admin view: show + filter by segment.** [admin.html](admin.html) / [js/admin.js](js/admin.js)
      — table now has a Lists column, plus a segment filter dropdown that scopes both the on-screen
      list and the CSV export/filename.
- [x] **Redeploy required.** Done — `apps-script/Code.gs` v2.1.0 redeployed live.
- [ ] **Existing subscriber rows** have a blank `Lists` cell (they predate segmentation) — worth a
      one-time pass to ask existing subscribers what they want, or just default them to "all teams"
      manually in the sheet.

## New site pages

- [ ] **Dedicated sponsor page.** The [join.html](join.html) card is just a CTA button; a full page
      could cover sponsorship tiers/benefits, a thank-you list of current sponsors (logos), and the
      RevTrak link — decide whether the join.html card stays as its own quick CTA or links through
      to this page instead.
- [ ] **Per-club pages: Elementary, Middle School, High School.** Three separate pages, each with
      that team's own info (meeting times/location, coaches or leads, roster, season updates
      specific to that level). Ties into the mailing-list segmentation already built — each page
      could deep-link to join.html with that team's checkbox pre-selected. Site nav will need to
      grow to fit three more pages (dropdown vs. three new top-level links — decide when starting).
- [ ] **Class pages: AER (Applied Engineering and Robotics) and DBL (Design and Build Lab).** Two
      more pages, one per class — distinct from the three club-team pages above (these are CTE
      classes, not the extracurricular club). Will likely pull content from the CTE repo's `8AER`,
      `HSAER`, and `Design and Build Lab` folders — design/layout still to be worked out later.

## Team communications ✅ built — needs redeploy

Supersedes the old "season update page" idea — built as an ongoing archive instead of one static
page, with an email loop attached.

- [x] **Public archive page.** [updates.html](updates.html) — every published communication, newest
      first, fetched live from the Communications sheet (no rebuild/redeploy needed per post).
- [x] **Admin draft + review flow.** [admin.html](admin.html) — paste raw notes into "Team
      communications," saved as a `draft` row. Nothing is public yet. Ask Claude to review/reformat
      a draft to match the site's `.comm-*` styles ([css/style.css](css/style.css)) and publish it —
      that's the "conform to page format standards" step, intentionally not a one-click bypass in
      the UI.
- [x] **Backend.** [apps-script/Code.gs](apps-script/Code.gs) — new `Communications` sheet;
      `postCommunication` (draft), `updateCommunication` (Claude-facing refine+publish),
      `publishedCommunications` (public, powers updates.html), `communicationsAdmin` (password-gated,
      powers the admin review lists). Bumped to v2.3.0.
- [x] **Announcement email.** Each published post gets a "Compose announcement →" button in
      admin.html — builds a `mailto:` with a bullet-point summary + a deep link to that post
      (`updates.html#c-<id>`), Bcc'd to subscribed emails **excluding lightweight-only** subscribers
      (they get the quarterly digest instead; anyone on a team list too still gets it).
- [x] **Redeploy required.** Done — `apps-script/Code.gs` v2.3.0 redeployed live.
- [x] **First post live:** "Season Kickoff — Soft-Start Schedule" is published on
      [updates.html](updates.html). Still needs its announcement email sent from admin.html
      ("Compose announcement →") whenever you're ready.
- [ ] **Quarterly lightweight digest** still needs its own thing — a periodic rollup of recent
      communications, sent only to lightweight subscribers. Not built yet; the per-post announcement
      above intentionally excludes them.

## Admin page extras ✅ built — needs redeploy

- [x] **Quick links.** admin.html now links out to the join-page QR scan card and updates.html.
- [x] **Team roster & shirt sizes.** New "Roster admin" section — table of every child (name, grade,
      shirt size, parent, email) pulled straight from Parent Submissions, a size tally for ordering,
      and a CSV export. Backend: `rosterAdmin` action in Code.gs.

## Keeping the list current (process, not code)

- The `Subscribers` sheet already stays accurate on its own: people self-serve subscribe
  (join.html) and self-serve unsubscribe (one click from the confirmation/every email footer) —
  don't hand-edit rows in the sheet, it'll fight the automation.
- When it's time to actually send: export the CSV from [admin.html](admin.html) (once segment
  filtering above is built, export just the segment you're mailing) and import into a Gmail
  contact group / use for a mail merge. Re-export each time rather than keeping a stale Gmail
  group in sync by hand.

## Reference

- **Join-page QR code ("Control Freaks Scan Card")** — printable QR linking to `join.html`, navy/gold
  themed, has a print-flyer button: https://claude.ai/code/artifact/6f310e9f-0205-4cf5-a6e4-304d39c68858
