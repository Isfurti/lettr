# Database migrations

Migrations live in `lib/migrations.ts`, in order. Each runs once; applied ones are recorded in `schema_migrations` (id + checksum). They are applied automatically on the first request after a deploy (`applySchema` in `lib/db.ts`), one server at a time, with a 10 s lock timeout and a 60 s statement timeout.

## Adding one
1. Add `{ id: "0002_short_name", sql: "..." }` at the end of `MIGRATIONS`.
2. Add a test for anything that is not trivial.
3. Never edit or reorder a migration that has been deployed. `tests/schema-setup.test.ts` fails if the baseline changes; at runtime an edited migration is logged as an error but does not stop the site.

## Safe changes (expand, deploy, contract later)
Old code can still be running (Vercel keeps old instances, rollbacks are instant), so a migration must work with the previous version of the code:
- Add a column or table: fine. Make new columns nullable or give them a default.
- Rename or drop a column: do it in two deploys. First add the new one and write to both, deploy; later, remove the old one in a new migration.
- Large backfills, `CREATE INDEX CONCURRENTLY`: not here (they run inside a request, in a transaction). Run them by hand.

## Previews share the production database
`DATABASE_URL` is set for both Production and Preview in Vercel, so a migration on a preview branch runs on production. Until there is a separate database for previews (task T7 in `tasks.md`), treat every branch with a migration as a production change.

## Legacy table
`schema_version` (from the old setup) is left in place. A rolled-back deployment still reads it, finds its own hash, and skips its setup. Drop it only after rollbacks to pre-migration code are no longer possible.
