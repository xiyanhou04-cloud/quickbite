# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server on http://localhost:5173 (also defined as `quickbite-dev` in `.claude/launch.json`)
- `npm run build` — `tsc -b` type-check, then `vite build`
- `npm run lint` — oxlint (`.oxlintrc.json`: react, typescript, oxc plugins; `rules-of-hooks` is an error)
- `npm run preview` — serve the production build

There is no test runner configured. `npm run build` is the main correctness check (strict TS with `noUnusedLocals`/`noUnusedParameters`).

## Backend and environment

This is a frontend-only React 19 + Vite SPA for a separate **Spring Boot / Spring Security** backend (not in this repo).

- In dev, Vite proxies `/api/*` → `API_PROXY_TARGET` (default `http://localhost:8080`), stripping the `/api` prefix and rewriting cookie paths to `/`. The backend must be running for anything beyond static pages to work.
- `VITE_API_BASE_URL` (default `/api`) and `VITE_LOGOUT_PATH` (default `/logout`) configure the client.
- Auth is a server session cookie plus Spring's `XSRF-TOKEN` cookie; `src/lib/api.ts` echoes it as `X-XSRF-TOKEN` on non-GET requests. Login is form-urlencoded (`username`/`password`); signup and cart are JSON with snake_case fields (`menu_id`, `first_name`, …) matching `src/lib/types.ts`.
- There is no `/me` endpoint. Whether the user is signed in is determined by probing `GET /cart` (401 ⇒ signed out). The displayed username is just whatever was typed at login, kept in `sessionStorage`.

## Architecture

Path alias `@/` → `src/`. Provider order (`src/main.tsx`): `QueryClientProvider` → `BrowserRouter` → `ErrorBoundary` → `SessionProvider` → `App` + sonner `Toaster`. Routes live in `src/App.tsx`; everything except Discover is lazy-loaded, and `/cart`, `/checkout`, `/order-confirmation` are wrapped in `ProtectedRoute` (redirects to `/login?redirect=…`).

### API layer — `src/lib/api.ts`
A single `request()` wrapper turns every failure into an `ApiError(message, status)` with a user-facing message (pages display `error.message` directly via `errorMessage()`). It contains deliberate workarounds for Spring Security quirks — keep them when editing:
- A failed auth can come back as a **200 redirect to an HTML `/login` page**; this is detected via `response.redirected` and treated as 401. A `?logout` redirect is the *success* case for logout.
- Duplicate-email signup surfaces as 401 (Spring forwards to a protected `/error`), mapped to "account already exists".
- Non-JSON responses where JSON is expected become 502 errors.

### Server state — `src/lib/queries.ts`
TanStack Query hooks plus the canonical `queryKeys` (`restaurants`, `menus(id)`, `cart`, `session`). Restaurants/menus are public; cart is private. `clearPrivateSession()` wipes cart + session; `expireSession()` does so on a 401 unless an auth transition is active.

### Session — `src/lib/session.tsx`
The most intricate module. `SessionProvider` holds the session as the `['session']` query (`{ username, sessionId }`) and exposes `useSession()` with `signIn`/`signOut`. Key concepts:
- **`sessionId` is a client-generated "session generation" UUID**, not a server token. It changes on every sign-in and is used to discard results of async work that started under a different account.
- **Attempt counter + `setSessionTransition()`**: sign-in/out bump `authentication.current.attempt`; stale continuations abort. While a transition is active, cart mutations are refused and 401s don't trigger `expireSession`.
- **Cross-tab sync**: a `BroadcastChannel` plus a `localStorage` revision marker (reconciled on focus/visibilitychange) clears private state when another tab signs in or out.
- Sign-out only completes after a follow-up `GET /cart` returns 401, verifying the cookie is really gone.

**Convention for any code that awaits a private (cart/checkout) operation**: capture `session.sessionId` before the await and compare it to `client.getQueryData(queryKeys.session)?.sessionId` afterward; drop toasts/navigation if it changed. See `addItem` in `src/pages/restaurant.tsx` and checkout in `src/pages/cart.tsx`. Mutations in `queries.ts` apply the same check in `onSuccess`/`onError` via `onMutate` context. The order confirmation page only renders a receipt passed in `location.state` whose `sessionId` matches the current one.

### Client-only state
- `src/lib/favorites.ts` — saved restaurants in `localStorage` via `useSyncExternalStore` (the `/saved` route is `DiscoverPage savedOnly`).
- `src/lib/presentation.ts` — UI-only derivations the backend doesn't provide: cuisine category inferred by regex over restaurant + menu names, fallback descriptions/images, Unsplash URL helper, `money()` and `errorMessage()`.
- All `localStorage`/`sessionStorage` access is wrapped in try/catch and treated as optional; preserve that.

### Styling
Tailwind v4 via `@tailwindcss/vite` with theme tokens in `src/index.css` (`@theme inline` mapping CSS variables). Most page/component styling uses **named semantic classes defined in `src/index.css`** (e.g. `page-content`, `restaurant-card`, `receipt`), with Tailwind utilities for small tweaks. `src/components/ui/` holds shadcn-style primitives (Radix via the `radix-ui` package, `class-variance-authority`, `cn()` from `src/lib/utils.ts`).
