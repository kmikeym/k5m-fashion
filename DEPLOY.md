# Deployment — Staging & Production

Two Cloudflare Pages projects, same repo, different branches. Fully isolated data.

| | Production | Staging |
|---|---|---|
| Pages project | `k5m-fashion` | `k5m-fashion-staging` |
| Git branch | `master` | `staging` |
| Domain | `fullyfashioned.fit` | `fashion.quarterly.systems` |
| D1 database | `k5m-fashion-db` (`a61d4250-…`) | `k5m-fashion-staging-db` (`7452fae8-…`) |
| Clerk | production instance/keys | dev instance/keys |

## Workflow

- **Test:** push to `staging` → auto-builds the `k5m-fashion-staging` project → live at `fashion.quarterly.systems`.
- **Ship:** merge `staging` → `master` → auto-builds `k5m-fashion` → live at `fullyfashioned.fit`.

### Merge gotcha (important)
`wrangler.toml` diverges by branch on **one line** — the D1 `database_id` (+ `database_name`). When merging `staging` → `master`, resolve the conflict by **keeping master's production database_id** (`a61d4250-…`). Never let the staging DB id reach `master`, or production would write to the staging database.

## One-time dashboard setup (manual — token can't write zone DNS or bind domains)

1. **Create the staging Pages project**
   - Cloudflare → Workers & Pages → Create → Pages → connect to the `kmikeym/k5m-fashion` repo.
   - Name it `k5m-fashion-staging`. Set the **production branch to `staging`**.
2. **Move the domains**
   - On `k5m-fashion` (prod): add custom domain `fullyfashioned.fit`. Remove `fashion.quarterly.systems`.
   - On `k5m-fashion-staging`: add custom domain `fashion.quarterly.systems`.
3. **DNS for fullyfashioned.fit** (registered at Hover)
   - Point it at Cloudflare per the Pages custom-domain instructions (CNAME or nameserver delegation). Cert issues automatically once DNS resolves.
4. **Bind D1 in each project** (belt-and-suspenders alongside `wrangler.toml`)
   - `k5m-fashion` → Settings → Functions/Bindings → D1 → bind `DB` to `k5m-fashion-db`.
   - `k5m-fashion-staging` → bind `DB` to `k5m-fashion-staging-db`.
5. **Clerk keys** (env vars, per project)
   - `k5m-fashion`: production `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY`.
   - `k5m-fashion-staging`: Clerk **dev** keys, so test sign-ins never create production users.

## Staging DB state (seeded 2026-05-27)
`k5m-fashion-staging-db` has the full schema (migrations 001–004) + seed data: **21 outfits, 15 items, 0 votes**. Clean slate for test voting.

## Local dev gotcha
If `wrangler` fails with `@esbuild/darwin-arm64 could not be found` or a `Host version … does not match binary version` error, the node_modules optional binary is missing/mismatched. Fix by installing the binary that matches wrangler's nested esbuild:
```bash
npm install @esbuild/darwin-arm64@0.27.3 --no-save
```
(Or a clean `npm install` without `--omit=optional`.)
