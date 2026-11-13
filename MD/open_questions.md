# Open questions

## Needed from the user / client
- [ ] Neon: create a project, then a branch named `test`. Put the **pooled** connection strings in `.env.local` as `DATABASE_URL` (main) and `TEST_DATABASE_URL` (test branch). Also set `BETTER_AUTH_SECRET` (command in `.env.example`). (blocks: migrations, DB tests, running the app, E2E)
- [ ] Demo login: pick DEMO_EMAIL / DEMO_PASSWORD (or let Claude generate them into `.env.local`). (blocks: seed)
- [ ] GitHub repo name and whether to create it with `gh` (public). (blocks: "code in GitHub")
- [ ] Vercel: deploy from your account via `vercel` CLI or the dashboard? (blocks: live URL)
- [ ] Deadline for the submission? (affects cut order)

## Needed from us / the project
- [ ] Do estimates look sensible with the demo data? (check after seeding)
