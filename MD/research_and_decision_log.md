# Queue Management System: Research & Decision Log

> A record of this planning conversation, created 13 Nov 2026.
> It contains only what was discussed and found in this chat. **No code has been written yet.**
> Status: Phase 1 (research), stack validation and UI/UX planning are done. Phase 2 has not started.

---

## 1. The Assignment (as given)

1. Queue Manager can login and create Queues.
2. Each Queue has a Name.
3. The Manager can add new persons / tokens into the queue. [once added a token is created]
4. The queue displays the list of people / tokens waiting in the queue.
5. The manager can move tokens up and down in the queue.
6. The manager can assign the token at the top of the queue for service. [With a simple button click]
7. The manager shall be able cancel a token from the queue.
8. There shall be a dashboard which shows analytics on wait times, queue length trends etc.

**Evaluation:**
1. Working application
2. Code in GitHub
3. Good UI will get additional score
4. Bug-free application will get additional score

### Working approach (agreed)
- Do proper research before every step.
- Let the AI make the decisions, but back each one with sources.
- Validate the solution against multiple papers and sources before building the pipeline.

---

## 2. What We Are Making (plain explanation)

A **digital token system**, like the ones at a bank, hospital, passport office or restaurant: you get a number, wait, and get called. This app is the screen the staff member (the "Queue Manager") uses to run the line.

**Example flow (clinic):**
- The receptionist logs in and creates a queue, e.g. "General OPD" or "Billing Counter".
- A patient walks in, the receptionist clicks "Add", and the patient gets a token, e.g. **#17**.
- The screen shows everyone waiting, in order, with how long each person has waited.
- For an emergency or priority case, the receptionist moves a token up. If someone steps out, they move it down.
- When the doctor is free, the receptionist clicks **"Serve next"** and the top token is called.
- If someone leaves without being served, the receptionist cancels their token.
- A **dashboard** shows things like average wait today, the busiest times, and how many people left without being served. This helps decide staffing.

**What it replaces:** paper registers, shouting names, "I came before him" arguments, and guesswork about how busy the place is.

**Why research first:**
- Little's Law and the wait-time studies show how to calculate estimated waits correctly.
- Maister's psychology of waiting shows that uncertain or unfair waits feel longer, so we show estimated waits and log every reorder.
- Database locking prevents the worst queue bug: two people getting called at once after a double-click on "Serve next".
- The hosting comparison makes sure the evaluator's link opens quickly.

---

## 3. Phase 1: Domain Research → Decisions

### 3.1 Design the data around time, not just the list (Requirement 8)
- **Finding:** queue performance is measured by mean delay (time in system and time in queue), mean queue length, server utilization and throughput. All of these come from timestamps.
- **Decision:** each token stores `created_at`, `served_at` and `cancelled_at`. A separate `queue_events` table logs every action (add, move, serve, cancel). The dashboard reads from this log.

### 3.2 Estimate wait times with Little's Law
- **Finding:** L = λ·W (queue length = arrival or throughput rate × wait time). If two of these are known, the third can be calculated. It holds for almost any steady-state queue, whatever the arrival and service patterns.
- **Caveat:** it needs the system to be stable enough that average inflow and outflow are related over time.
- **Decision:** show each waiting token an estimated wait based on its position and the recent service rate. When there isn't enough history, show "—" instead of a made-up number.

### 3.3 Report percentiles, not only averages
- **Finding:** the Waitwhile / UChicago wait-time prediction project focused on the long tail. It reports improved 90th-percentile error and fewer long-wait underpredictions.
- **Finding:** queue analytics vendors treat high abandonment as a sign that service levels are failing.
- **Decision:** the dashboard shows average **and p90** wait, queue length over time, throughput per hour, and cancellation rate (our closest equivalent to abandonment).

### 3.4 Shape the UI around how people experience waiting (Maister, 1985)
- **Finding:** two of Maister's eight propositions apply directly: uncertain waits seem longer than known waits, and unfair waits seem longer than equitable ones.
- **Decision:** every token shows its position and estimated wait. Every reorder (move up or down) is logged with who did it and when, as an audit trail.

### 3.5 Use simple swaps for reordering
- **Finding:** fractional indexing is the standard for drag-and-drop and multi-user lists. For simpler single-user apps, an integer gap strategy is sufficient, and fractional indexing isn't needed when renumbering is acceptable.
- **Decision:** the requirement is up/down buttons for one manager, so each move swaps the integer positions of two neighbouring tokens inside one database transaction.

### 3.6 Design out bugs from the start
Edge cases to handle and test:

| Risk | Handling |
|---|---|
| Double-click on "Serve" serves two tokens | Serve runs in a transaction that locks the top waiting token; the button is disabled while the request is running |
| Move first token up / last token down | Handled on the server as "nothing to do", not an error |
| Serve from an empty queue | Rejected with a clear message |
| Acting on an already cancelled or served token | Rejected with a clear message |
| Duplicate token numbers | Unique per queue, never reused after a cancellation |
| One manager reaching another's queue | Every API call checks queue ownership |

---

## 4. Tech Stack Validation

The first proposal was: Next.js (TypeScript), Prisma + PostgreSQL, Auth.js, Tailwind + shadcn/ui, Recharts, Vitest + Playwright, Vercel + Neon.

Each layer was then compared against its alternatives. **The check changed two of the seven picks.**

### 4.1 Database: PostgreSQL ✅ confirmed
**Compared:** PostgreSQL vs MongoDB vs SQLite

The deciding requirement is that "Serve next" must lock the top token (`SELECT ... FOR UPDATE`), so a double-click can't serve two people. That needs row-level locking inside a transaction.

| Option | Verdict | Reason |
|---|---|---|
| MongoDB | ❌ | Multi-document transactions exist but are the exception path; its defaults assume single-document atomicity. Our data is relational (manager → queues → tokens → events). |
| SQLite | ❌ | Free hosts like Render have an ephemeral filesystem, so local SQLite databases are lost on redeploy, restart or spin-down. |
| PostgreSQL | ✅ | Full row locking and transactions. Most-used database in the 2025 Stack Overflow survey (55.6% of all respondents, 58.2% of professional developers). |

### 4.2 ORM: Prisma → **Drizzle** 🔄 changed
- **Finding:** Prisma has no built-in `SELECT ... FOR UPDATE`. There's an open GitHub issue (#17136) requesting row locking, and developers report using raw SQL for it.
- **Finding:** Drizzle supports `.for('update')` natively and type-safely inside a transaction.
- **Decision:** Drizzle. The core correctness guarantee is written in the ORM's normal syntax instead of raw SQL.

### 4.3 Auth: Auth.js → **Better Auth** 🔄 changed
- **Finding:** Auth.js (formerly NextAuth.js) moved to the Better Auth team in September 2025. It still receives security patches, but Better Auth is recommended for new projects (Best of JS gives the same recommendation).
- **Decision:** Better Auth. Starting a fresh project on a library in maintenance mode is an unnecessary risk.

### 4.4 Framework: Next.js ✅ kept, with a known risk
**Compared:** Next.js vs React (Vite) + Express vs Astro

- **Risk:** State of JS 2025 shows Next.js leads in usage but its satisfaction is falling. There's a 39-point satisfaction gap with Astro, and the main complaint is the complexity of Server Components and the App Router.
- **Astro:** built for content sites (islands architecture). Our app is an interactive dashboard. ❌
- **React + Express:** two services to deploy. State of JS describes Express as showing its age in satisfaction. It would also need a server host (see 4.5). ❌
- **How we limit the risk:** keep Server Components simple. Pages fetch data, and all changes go through plain API routes.

### 4.5 Hosting: Vercel + Neon ✅ confirmed
**Compared:** Vercel + Neon vs Render (free)

- **Render free:** spins down after 15 minutes without traffic. Render's dashboard warns of delays of 50+ seconds on the next request. That's a bad first impression for an evaluator. ❌
- **Neon free (official FAQ):** 100 projects, 10 branches each, 100 CU-hours per project per month, 1 GB storage per project, no credit card. (Some third-party sources list 0.5 GB per project; the official Neon FAQ updated 2026-10-01 says 1 GB.) ✅
- **Trade-off:** Neon also pauses when idle, so the first query after a pause is slower. This is much smaller than Render's full restart, and we'll warm it up before the demo.

### 4.6 UI and testing ✅ kept (lower risk)
Tailwind + shadcn/ui, Recharts, and Vitest + Playwright are kept. Swapping these affects looks or developer comfort, not correctness, so no separate comparisons were run.

### 4.7 Final validated stack
**Next.js (TypeScript) · PostgreSQL on Neon · Drizzle ORM · Better Auth · Tailwind + shadcn/ui · Recharts · Vitest + Playwright · Vercel**

---

## 5. UI/UX Plan

**Core idea:** the user is a busy receptionist with people waiting in front of them. The screen must be calm, quick to scan, and hard to get wrong.

### 5.1 Screens
1. **Login:** simple and centered.
2. **My queues:** a card per queue (name, number waiting, average wait) and a "+ New queue" button.
3. **Queue screen (main):** the waiting list, a big "Serve next" button, and a "Now serving" panel.
4. **Dashboard:** numbers and charts.

### 5.2 Research-backed design rules

| # | Rule | Research basis | Applied as |
|---|---|---|---|
| 1 | One huge "Serve next" button | Fitts's Law: maximize size for high-frequency targets; slightly smaller destructive actions reduce accidental clicks | Serve is the largest button; move/cancel are small |
| 2 | Every click feels instant | Nielsen: 0.1 s feels instantaneous; 1 s keeps the flow of thought | Optimistic UI: the change shows immediately; if the server rejects it, it rolls back with an error message |
| 3 | Undo instead of "Are you sure?" | Too many confirmation dialogs make users click through without reading; undo toasts are preferred for reversible actions | Cancel happens immediately, and a toast shows "Token #17 cancelled · Undo" |
| 4 | Never rely on color alone | WCAG 1.4.1 (color must not be the only means of conveying information); text contrast 4.5:1 (AA); ~1 in 12 men are red-green colour blind | Long waits get color **and** a label ("⏱ 25 min · long wait") |
| 5 | Make waiting visible and fair | Maister (Phase 1) | Position, live wait timer, estimated wait; a "moved ↑" badge and an activity-log entry on every reorder |
| 6 | Dashboard: few big numbers, simple charts | 3–5 metrics is the effective range (InterWorks); NN/g: position and length are read accurately, area and angle are not | 4 stat cards (waiting now, avg wait, p90 wait, served today), a line chart (queue length over the day), a bar chart (served per hour); no pie or donut charts |
| 7 | Empty screens tell you what to do next | NN/g: empty states build confidence, help users learn the system, and get them started on key tasks | Icon, "No one's waiting", and an "Add first token" button |

### 5.3 Smart extras (engineering judgment, not from papers)
- Keyboard shortcuts: `A` = add token, `S` = serve next
- Live updates: wait timers tick every second, and stats refresh on their own
- Dark mode; responsive layout for phones and tablets
- Visual style: soft neutral background, one accent color (deep indigo), Inter font, big bold token numbers

---

## 6. Next Steps (not started)

- **Optional:** a clickable mockup of the Queue screen and Dashboard, to review the look before coding.
- **Phase 2:** database schema, API contract, test cases for each of the 8 requirements, and the build pipeline (repo structure, CI, deployment).
- Then build, test, and deploy.

---

## 7. Sources

### Queue domain & analytics
- Waitwhile wait-time prediction (UChicago Data Science): https://datascience.uchicago.edu/research/waitwhile-wait-time-prediction-operational-insights/
- Queue Management Analytics KPIs (Wavetec): https://www.wavetec.com/?p=86787
- Queuing Models and Little's Law (Clemson): https://clemsonopenflowgroup.atlassian.net/wiki/x/QYBs
- Little's Law (ISSSP): https://isssp.org/finding-the-average-wait-time-littles-law
- Little's Law (Think Insights): https://thinkinsights.net/leadership/littles-law
- Introduction to Queueing Theory (RemNote): https://www.remnote.com/learn/math/probability/introduction-to-queueing-theory-study-deck
- Maister's eight propositions (Multichannel Merchant): https://multichannelmerchant.com/operations/contact-center/call-center-customers-the-waiting-is-the-hardest-part
- The Psychology of Waiting Lines, David Maister (1985): https://davidmaister.com/?p=747

### Ordering
- Fractional indexing & alternatives (DEV): https://dev.to/sonim1/fractional-indexing-implementing-drag-and-drop-ordering-and-avoiding-index-collisions-g3
- sqliteai/fractional-indexing: https://hn.jakechampion.name/reader/https://github.com/sqliteai/fractional-indexing

### Tech stack
- Auth.js is now part of Better Auth: https://better-auth.com/blog/authjs-joins-better-auth
- NextAuth.js → Better Auth migration (pipipi-dev): https://scour.ing/@minezone/p/https://dev.to/pipipi-dev/nextauthjs-to-better-auth-why-i-switched-auth-libraries-31h3
- Best of JS: NextAuth: https://bestofjs.org/projects/nextauthjs
- Prisma issue #17136 (row locking): https://github.com/prisma/prisma/issues/17136
- Drizzle SELECT FOR UPDATE discussion: https://answeroverflow.com/m/1158726168191705118
- Drizzle transactions docs (Mintlify): https://www.mintlify.com/drizzle-team/drizzle-orm/core/transactions
- CockroachDB, SELECT FOR UPDATE: https://docs.cockroachlabs.com/docs/v24.2/select-for-update.md
- PostgreSQL usage, SO Survey 2025 (Pulse): https://pulse.support/blog/postgresql-everyone-uses-postgres-but-why
- MongoDB vs PostgreSQL 2026 (Swyftstack): https://swyftstack.com/blog/mongodb-vs-postgresql
- State of JS 2025, meta-frameworks: https://2025.stateofjs.com/he-HE/libraries/meta-frameworks
- State of JS 2025 key takeaways (Strapi): https://strapi.io/blog/state-of-javascript-2025-key-takeaways
- Render, Deploy for Free: https://docs.render.com/free
- Render free filesystem: https://render.com/free
- Render community, spin-down delay: https://community.render.com/t/post-deployment-performance/22007
- Neon Free plan limits (official): https://neon.com/faqs/free-plan-limits-and-quotas
- Neon pricing (srvrlss.io): https://www.srvrlss.io/provider/neon/

### UI/UX
- NN/g, Dashboards: Preattentive Processing: https://www.nngroup.com/articles/dashboards-preattentive/
- InterWorks, dashboard design principles: https://interworks.com/?p=66855
- Fitts's Law (Computer Atlas): https://computer-atlas.mrb-bayat.workers.dev/t/fitts-law
- Fitts's Law module: https://deeibepi.manus.space/modules/6
- Response Times, Nielsen's 3 limits (jmduke): https://www.jmduke.com/posts/response-times.md
- Innovaccer, Response time: https://design.innovaccer.com/foundations/response-time
- Designing destructive action modals (UX Psychology): https://uxpsychology.substack.com/p/how-to-design-better-destructive
- Confirmation dialogs vs undo (DEV): https://dev.to/137foundry/how-to-choose-between-confirmation-dialogs-undo-windows-and-soft-delete-patterns-1opj
- Texas Tech, Color accessibility: https://www.ttu.edu/accessibility/digital-accessibility/accessibility-topics/color.php
- Color accessibility (Design Hubs): https://designhubs.pages.dev/color/c08-color-accessibility
- NN/g, Empty states in application design: https://www.nngroup.com/videos/empty-states-in-application-design-guidelines/
