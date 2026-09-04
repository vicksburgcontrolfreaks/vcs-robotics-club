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
- [ ] **Redeploy required.** This changed `apps-script/Code.gs` — follow the [Backend](#backend-google-apps-script)
      steps above (paste updated script in, **Deploy → Manage deployments → New version → Deploy**)
      before these changes take effect live. No new Script Properties needed.
- [ ] **Existing subscriber rows** have a blank `Lists` cell (they predate segmentation) — worth a
      one-time pass to ask existing subscribers what they want, or just default them to "all teams"
      manually in the sheet.

## Season update page

- [ ] **Build a public "season update" page** on the site — current build season status, event
      results, next milestones. This becomes the single source of truth other things pull from.
- [ ] **Quarterly digest pulls from that page.** The "lightweight" list's quarterly email should be
      a summary of whatever's on the season update page at send time — write it once as content,
      reuse it for the page *and* the email, not two separate write-ups.
- [ ] **Reminder to keep it fresh.** Needs a recurring nudge (e.g. a scheduled reminder — Claude's
      `/schedule` skill can do this once the page exists) so the season page doesn't go stale
      between quarterly sends.

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
