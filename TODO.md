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
- [x] **Per-program communications pages: Elementary, Middle School, High School, Sponsors.**
      Built as `updates-elementary.html` / `updates-middle.html` / `updates-high.html` /
      `updates-sponsors.html` — see Team communications below. Still open: a fuller "about this
      program" page per team (meeting times/location, coaches or leads, roster) — the updates pages
      are just the communications archive, not a full team-info page. Each could deep-link to
      join.html with that team's checkbox pre-selected once built.
- [ ] **Class pages: AER (Applied Engineering and Robotics) and DBL (Design and Build Lab).** Two
      more pages, one per class — distinct from the three club-team pages above (these are CTE
      classes, not the extracurricular club). Will likely pull content from the CTE repo's `8AER`,
      `HSAER`, and `Design and Build Lab` folders — design/layout still to be worked out later.

## Team communications ✅ built — needs redeploy (v2.4.0)

Supersedes the old "season update page" idea — one archive per program instead of one static page,
with an email loop attached.

- [x] **Four public archive pages, one per program.** `updates-elementary.html` / `updates-middle.html`
      / `updates-high.html` / `updates-sponsors.html` — each fetches only its own program's published
      posts (`?action=publishedCommunications&audience=<code>`), newest first, live (no
      rebuild/redeploy needed per post). [updates.html](updates.html) is now a hub linking to all four
      — nav everywhere still just points to that one hub, per program pages aren't in the top nav.
- [x] **Admin draft + in-browser review/publish flow.** [admin.html](admin.html) — pick the
      **Program**, paste raw notes, save as a `draft` row. Each draft gets **Review & publish →**
      (opens an editable Title/Body/Summary panel with a live preview rendered in the site's
      `.comm-*` styles — plain text auto-formats into paragraphs with links, real HTML passes
      through as-is) and **Delete** (for stale/duplicate drafts). Publishing happens directly from
      the browser now — no Claude round-trip required.
- [x] **Backend.** [apps-script/Code.gs](apps-script/Code.gs) — `Communications` sheet gained an
      `Audience` column (`elementary`/`middle`/`high`/`lightweight`, same codes as `Lists`);
      `postCommunication` requires it, `publishedCommunications` filters by it,
      `updateCommunication`/`communicationsAdmin` carry it through; new `deleteCommunication` removes
      a row entirely. Bumped to v2.5.0.
- [x] **Announcement email, program-scoped.** Each published post's "Compose announcement →" in
      admin.html targets only subscribers whose `Lists` include *that post's own* audience code, and
      copies Bcc/Subject/Body to the clipboard rather than relying on `mailto:`.
- [x] **Redeploy done (v2.6.0).** `deleteCommunication` and `polishCommunication` both live.
- [x] **Existing post retagged.** "Season Kickoff — Soft-Start Schedule" is `audience: 'middle'`,
      body corrected to "FTC Teams 5618 & 6494," SignUpGenius link added to the tailgate sign-up, and
      main dish corrected to hamburgers — all live via direct API calls.
- [ ] **Stale duplicate draft to delete** once v2.5.0 is redeployed: a second, pre-refinement copy
      of "Season Kickoff — Soft-Start Schedule" (id `b3fe76d3...`) was saved via admin.html's own
      form a few seconds before the refined version was published directly — same title, "hot dogs"/
      "FRC Team 8126" (pre-fix wording), no audience set. Safe to delete once Delete is live.
- [ ] **Quarterly lightweight digest** still needs its own thing — a periodic rollup of recent
      communications across all programs, sent only to Sponsors (`lightweight`) subscribers.

## Admin portal polish ✅ built

- [x] **Renamed the entry point.** admin.html's h1 "Mailing list subscribers" → "Admin Portal";
      login button "View subscribers →" → "Enter Portal →" (default label in admin.html, reset
      label in js/admin.js) — the page covers far more than subscribers now.
- [x] **Public scan-card.html.** Real, on-site, publicly-viewable QR flyer (mailing list + Discord
      invite side by side), with a Print flyer button. Replaces admin.html's old "Scan card" quick
      link, which pointed at the private Claude artifact — that link was never actually reachable by
      site visitors. The admin quick link now points here instead.
- [x] **`.comm-qr` embed pattern.** [css/style.css](css/style.css) — a reusable style for embedding
      a self-hosted, clickable QR code directly inside a communication post (used in the
      "Informational Meeting" draft to replace a meta-instruction sentence about sharing a QR code
      with an actual one, linking to join.html).
- [x] **AI-assisted draft polish, built for real.** "✨ Polish with AI" button in the draft review
      panel — [apps-script/Code.gs](apps-script/Code.gs) `handlePolishCommunication()` calls Claude
      (`claude-opus-5`, `UrlFetchApp` to `api.anthropic.com`, no SDK — Apps Script has none) to fix
      mistakes, tighten tone, and catch meta-instructions written to the editor rather than the
      reader — resolving "share the QR code here" into a real `[[QR_JOIN]]`/`[[QR_DISCORD]]`
      placeholder that Code.gs substitutes with the actual pre-generated SVG (the model never
      reproduces QR path data itself). Also returns a `summary` for the announcement email and a
      `notes` field for anything it couldn't confidently resolve. Never auto-saves or auto-publishes
      — the admin still reviews the result and clicks Publish. Bumped to v2.6.0.
- [x] **`ANTHROPIC_API_KEY` Script Property added.** AI polish is live.

## Umbrella-program rebrand ✅ built — needs redeploy

Resolves the branding question flagged above: site-wide chrome (header brand name/logo, footer,
page titles) no longer reads as FRC-8126-specific.

- [x] **Site title.** "VCS Robotics" → "Vicksburg Robotics" everywhere — header, footer, page
      `<title>`s, meta descriptions, the Apps Script `CLUB_NAME`/confirmation email, unsubscribe
      confirmation text, admin email subject lines.
- [x] **Subtitle simplified.** Header used to read "FRC Team 8126 · Control Freaks"; now just
      **Control Freaks**, larger and bold. Content paragraphs that specifically describe the High
      School team (About page, homepage lead, `updates-high.html`) still correctly say "FRC Team
      8126" — only the shared site-wide chrome dropped it.
- [x] **Logo added to every header.** `img/control-freaks-logo.png`, next to the brand name/subtitle
      on all 10 pages.
- [x] **New palette: red/white primary, black/grey secondary** — pulled from the logo. Rewrote
      [css/style.css](css/style.css) tokens (`--red`/`--red-dark`/`--black`/`--black-light` replacing
      `--navy`/`--gold`); `.btn-gold`/`.btn-navy` class *names* are unchanged (would've meant touching
      every page) but now render red/black respectively.
- [ ] **Redeploy required** (CLUB_NAME, confirmation email footer) — folded into the single v2.6.0
      redeploy noted under Team communications above; no separate action needed.
- [ ] **QR scan card still on the old palette.** The join-page QR artifact
      (https://claude.ai/code/artifact/6f310e9f-0205-4cf5-a6e4-304d39c68858) is navy/gold from before
      this rebrand — worth regenerating to match, whenever convenient.
- [ ] **Homepage/About framing still HS-centric.** Intentionally left alone this round: the
      homepage's hero paragraph and About page still describe the club as "home of FRC Team 8126" —
      now that Elementary/Middle School have their own pages, that framing could be revisited to
      present the club as the four-program umbrella from the front door. Separate decision from the
      chrome rename above.

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
