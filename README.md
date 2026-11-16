# Focal

A task tracker that only lets you keep **three priorities** at a time. Everything else waits in Next, Later or the inbox.

> Proof of concept, frontend only. Data is saved in your browser (localStorage). Supabase comes next.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui (Radix) · Supabase (planned)

## Screens

| Route     | What it does |
|-----------|--------------|
| `/today`  | The three, shown as large numbered cards. Tick them off, or swap one in from **Next up**. When the three is full, swapping one in sends your last unfinished priority back to Next. |
| `/triage` | Sort captured tasks into the three, Next, Later or Drop. "The three" is disabled while it's full. |
| `/focus`  | Full-screen focus on one task: countdown timer, step checklist, and a parking lot that sends stray thoughts to Triage. `Esc` exits. |

Press **C** anywhere (outside Focus mode) to capture a task. **Reset demo data** in the sidebar restores the sample tasks.

## Run it

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Quality checks

| Command                 | What it runs |
|-------------------------|--------------|
| `npm run lint`          | ESLint with the Next.js core-web-vitals + TypeScript rules |
| `npm run typecheck`     | `tsc --noEmit` |
| `npm test`              | Vitest + Testing Library (jsdom) |
| `npm run test:watch`    | Vitest in watch mode |
| `npm run test:coverage` | Tests with a coverage report in `coverage/` |
| `npm run build`         | Production build |
| `npm run check`         | All of the above, in that order |

**Pre-commit hook:** `npm install` sets up [Husky](https://typicode.github.io/husky/), and every `git commit` runs lint → typecheck → tests → build (`.husky/pre-commit`). The commit is blocked if any step fails. To skip it in an emergency, use `git commit --no-verify`.

**CI:** `.github/workflows/ci.yml` runs the same checks on every push to `main` and on pull requests.

### What the tests cover

- `tests/lib/`: the rules in the reducer (the three-task limit, swapping, triage moves, steps, new day), formatting, seed integrity, and localStorage persistence.
- `tests/components/`: priority cards, the app shell (navigation, `C` to capture, reset), and Focus mode (countdown, pause and extend, steps, parking lot, Esc).
- `tests/app/`: the Today and Triage screens, end to end against a real store.

## Project structure

```
app/
  (app)/layout.tsx        shell with sidebar + capture dialog
  (app)/today/page.tsx
  (app)/triage/page.tsx
  focus/page.tsx          full-screen, outside the shell
components/
  ui/                     shadcn/ui primitives (button, card, checkbox, dialog, input, progress)
  three-card.tsx, focus-view.tsx, app-sidebar.tsx, capture-dialog.tsx, ...
lib/
  types.ts                domain types (match the Supabase tables)
  reducer.ts              every rule, as a pure function
  persistence.ts          load/save (localStorage now, Supabase later)
  focal-store.ts          external store read via useSyncExternalStore
  store.tsx               React provider + useFocal() hook
  seed.ts                 demo data
  config.ts               MAX_THREE, focus budget, storage key
tests/                    Vitest suites (lib, components, app) + helpers
supabase/
  schema.sql              planned tables, RLS, max-three trigger, swap RPC
```

Add more shadcn components with `npx shadcn@latest add <component>`. `components.json` is already set up.

## Hooking up Supabase (next step)

1. Create a project at supabase.com and run `supabase/schema.sql` in the SQL editor.
2. Copy `.env.example` to `.env.local` and fill in the URL and anon key.
3. `npm install @supabase/supabase-js @supabase/ssr`
4. Add auth (magic link is the simplest), then replace `loadState` / `saveState` in `lib/persistence.ts` and the dispatch in `lib/focal-store.ts` with Supabase queries. Use `swap_into_three` for swaps. The database enforces the three-task limit again with a trigger, so the rule holds even if a client misbehaves.
