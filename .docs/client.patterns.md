# Frontend application patterns (personal standard)

This document describes **conventions I prefer** for client-side React / TanStack applications. It is not tied to one product name: treat it as a checklist you can drop into any new repository. **Examples** below point at real files in this repo so you (or another agent) can open them for full context.

Stack assumptions are flexible: Vite, TanStack Router, TanStack Query, TanStack Store, and Zod match this reference repo. **TanStack Start** (full-stack meta-framework on top of Router) adds server functions, SSR/streaming, and different execution guarantees—see [TanStack Query vs TanStack Start](#tanstack-query-vs-tanstack-start-data-loading). Folder roles stay the same if you swap pieces.

---

## High-level layout


| Area                          | Role                                                                 |
| ----------------------------- | -------------------------------------------------------------------- |
| `config.ts` (repo root)       | Environment-driven config (`VITE_`* or framework equivalent)         |
| `src/main.tsx` (or app entry) | Bootstrap: router, providers, `QueryClient`                          |
| `src/providers.tsx`           | Cross-cutting providers (React Query, OAuth, theme, etc.)            |
| `src/routes/`**               | File-based routes (TanStack Router); **screens/pages** live here     |
| `src/components/`**           | UI and feature components                                            |
| `src/lib/`**                  | Shared logic: HTTP client, services, types, state, validators, hooks |
| Global styles                 | e.g. `src/styles.css`                                                |


Path alias: `@/`* → `./src/*` (mirror in `tsconfig` and Vite).

### Folder structure example

**Idea:** `**routes`** are thin **pages** (screen composition, route params, local UI state). `**components/<area>/<feature>/`** holds **everything UI for that feature** (tables, modals, panels). `**lib`** holds **shared logic** used by those components (and sometimes by routes): API, services, types, state, validators, hooks.

```
src/
├── routes/                         # pages (TanStack Router file routes)
│   ├── __root.tsx
│   ├── index.tsx
│   └── $org/                       # example: segment + nested screens
│       ├── route.tsx               # layout (shell, outlet)
│       ├── index.tsx               # page → imports @/components/org/dashboard/*
│       ├── agents.tsx              # page → imports @/components/org/agents/*
│       └── tickets/
│           ├── index.tsx
│           └── $ticketId.tsx
├── components/
│   ├── ui/                         # shared design-system primitives (shadcn-style)
│   ├── org/
│   │   ├── agents/                 # feature: agents UI only
│   │   │   ├── agents-table.tsx
│   │   │   └── create-agent-modal.tsx
│   │   ├── dashboard/              # feature: dashboard widgets
│   │   │   ├── section-cards.tsx
│   │   │   └── clipped-area-chart.tsx
│   │   └── layout/                 # feature: app chrome (sidebar, header)
│   └── support/                    # another product area, same pattern
│       ├── chat-page.tsx
│       └── chat-list.tsx
├── lib/
│   ├── api.ts
│   ├── chatClient.ts               # optional: other clients
│   ├── services/                   # *.service.ts — backend calls + queryOptions
│   ├── types/                      # one file per entity / concern
│   ├── state/                      # *.state.ts — client stores + actions
│   ├── validators/                 # *.validator.ts — Zod
│   ├── hooks/                      # use-*.ts — data hooks, subscriptions
│   └── utils.ts
├── main.tsx
├── providers.tsx
└── styles.css
```

**Data flow in one line:** `lib/services` (and `lib/hooks`) talk to the backend; **feature components** call hooks or `useQuery` with options from services; **route pages** assemble those components and pass route-derived props when needed.

---

## Routes vs components

- **Routes** export the route definition and a **screen-level** component: layout wiring, screen-local state, composition of feature components.
- **Components** own tables, modals, sidebars, charts, etc. They import from `@/lib/...` and shared UI primitives (`@/components/ui/...`).

**Reference — route exports file route + screen component:**

```9:11:src/routes/$org/agents.tsx
export const Route = createFileRoute("/$org/agents")({
  component: RouteComponent,
});
```

**Under `components/`:** group by area and feature (e.g. `org/agents/`, `support/`, `ui/`).

---

## `src/lib` — application core


| Subfolder                   | Purpose                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------ |
| `api.ts`                    | Single HTTP helper used by browser-facing services (see below for server-only paths) |
| `services/*.service.ts`     | Calls to your backend (or to internal API routes) + optional React Query helpers     |
| `types/*.ts`                | One file per entity or concern                                                       |
| `state/*.state.ts`          | Client stores (e.g. TanStack Store) + small action objects                           |
| `validators/*.validator.ts` | **Zod** schemas aligned with forms and API payloads                                  |
| `hooks/`                    | **All** app hooks (`use-*.ts` / `use-*.tsx`) — data hooks, subscriptions, etc.       |
| `utils.ts`, `utils/`*       | Shared helpers (storage, formatting, etc.)                                           |


---

## Data fetching from the backend (browser)

### 1. Config and base URL

Keep the API origin in config (env-driven). Services use **path-only** endpoints (e.g. `/api/...`) so environments can change without touching call sites.

### 2. Transport: full `apiRequest` example

One module owns `fetch` to the backend: URL join, cookies, JSON vs `FormData`, and error shaping. **Example — complete reference implementation** (`src/lib/api.ts` in this project):

```ts
import { config } from "../../config";

export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  try {
    const url = `${config.serverUrl}${endpoint}`;
    console.log("API Request URL:", url);
    console.log("Config server URL:", config.serverUrl);

    const isFormData =
      typeof options.body !== "undefined" && options.body instanceof FormData;
    const response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(
        Array.isArray(data) ? data[0] || response.statusText : data || response.statusText
      ) as Error & { errors?: string[] };

      if (Array.isArray(data)) {
        error.errors = data;
      }

      throw error;
    }
    return data;
  } catch (error) {
    throw error instanceof Error ? error : new Error("API request failed");
  }
};
```

In new projects, drop or gate `console.log` for production. Adjust the `config` import path to match where you keep env config.

### 3. Services: thin wrappers over `apiRequest`

- Import types from `@/lib/types/...` (or define request/response types beside the service when very local).
- Prefer **one style per codebase**: either **named async functions** or a single `**entityService` object** with methods.

**Reference — named functions:**

```13:19:src/lib/services/auth.service.ts
export const emailSignUp = async (
  payload: EmailSignUpRequest
): Promise<User> => {
  return apiRequest<User>("/api/auth/email-sign-up", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};
```

**Reference — service object:**

```46:59:src/lib/services/conversations.service.ts
export const conversationsService = {
  async getConversations(
    organizationId: string,
    request: GetConversationsRequest = {}
  ): Promise<GetConversationsResponse> {
    const params = new URLSearchParams();
    if (request.page) params.append("page", request.page.toString());
    if (request.pageSize) params.append("pageSize", request.pageSize.toString());

    const queryString = params.toString();
    const url = `/api/organizations/${organizationId}/conversations${queryString ? `?${queryString}` : ""}`;
    
    return apiRequest<GetConversationsResponse>(url);
  },
```

**React Query:** colocate `queryOptions` / query keys with the fetcher when it helps, or wrap calls in `lib/hooks` (e.g. `useConversations` calling the service).

### 4. UI layer

Use `useQuery` / `useMutation` with stable `queryKey`s, `queryFn` calling the service, and `enabled` when ids are missing. Keep **server state** in Query; **session-like client state** in Store (below).

---

## TanStack Query vs TanStack Start (data loading)

**TanStack Query** is a **client-focused async state library**: it caches the result of a `queryFn`, deduplicates requests, refetches in the background, and powers mutations. It works whether `queryFn` runs in the browser (direct `fetch` to your API), in a worker, or behind a thin wrapper—Query itself is not a “meta framework.”

**TanStack Start** is a **full-stack React framework** on TanStack Router: SSR, streaming, **server functions** (`createServerFn`), and tooling where **the same route module participates in server and client execution**. Official Start docs therefore describe data patterns that **do not appear the same way** in Query-only guides—especially **where secrets may run** and **how loaders relate to the server**.

The following summarizes **TanStack Start documentation** (not guesswork). Use it when choosing patterns in a Start app; use the earlier “browser `apiRequest` + services” section for a classic SPA that talks to a separate backend from the client.

### 1. Loader returns data → `Route.useLoaderData()`

Start’s tutorials and migration guides show a **router `loader` that returns serializable data**, and a component that reads it with `**Route.useLoaderData()`**—no Query required for that path.

- Example pattern: loader calls a **server function** (or `fetch`) and returns the result; the page renders from loader data and passes props into presentational components.
- Docs: [TanStack Start — reading/writing (tutorial)](https://tanstack.com/start/latest/docs/framework/react/tutorial/reading-writing-file), [migrate from Next.js — loaders](https://tanstack.com/start/latest/docs/framework/react/migrate-from-next-js).

**When it fits:** straightforward page data, you are fine with Router owning the loaded payload, and you do not need Query’s cache semantics for that slice.

### 2. Loader prefetches into Query → `ensureQueryData` + `useQuery` / `useSuspenseQuery`

Start’s **comparison** documentation explicitly recommends **TanStack Query integration**: define `queryOptions`, call `**context.queryClient.ensureQueryData(...)` in the `loader`**, then use `**useQuery` (or `useSuspenseQuery`)** in the component with the **same options** so the UI **subscribes** to the cache (updates, stale refetch, etc.).

- Same integration pattern is documented for **TanStack Router + Query** in general: [Router — Query integration](https://tanstack.com/router/latest/docs/framework/react/integrations/query).
- Docs: [TanStack Start — comparison (Query example)](https://tanstack.com/start/latest/docs/framework/react/comparison).

**When it fits:** you want **one source of truth in the Query cache**, shared keys with child routes, or **post-navigation refetch** behavior Query provides.

### 3. Start execution model: loaders are not automatically “server-only”

Start’s **[execution model](https://tanstack.com/start/latest/docs/framework/react/guide/execution-model)** states that **route loaders can run on both server and client**. Putting `**process.env` secrets** or privileged tokens **directly in a loader** is unsafe if that code can execute in the browser.

**Recommended in Start docs:** use `**createServerFn()`** (RPC: handler runs on server; client calls go over the wire) for privileged work, and call that from an **isomorphic** loader or from the client as needed. Use `**createServerOnlyFn()`** for helpers that **must never** be invoked from the client (calling from client **throws**).

This is the main **practical difference** from “Query in a Vite SPA”: in Start, **where the code runs** is a first-class concern; Query docs alone do not spell out this loader + RPC split.

### 4. Selective SSR

Start supports per-route **SSR modes** (full render vs data-only vs no SSR), which changes **when** loaders run and what gets streamed. See [selective SSR](https://tanstack.com/start/latest/docs/framework/react/guide/selective-ssr).

### Quick comparison table


| Concern                    | TanStack Query (library)                 | TanStack Start (framework)                                                   |
| -------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------- |
| Primary job                | Cache + lifecycle for async server state | Full-stack routing, SSR, server functions, execution boundaries              |
| Typical `queryFn` in a SPA | Browser → your API                       | Can still be that, or **server-side** via server functions / loader          |
| Secrets / DB               | Not Query’s topic; keep off client       | **Server functions** or server-only modules; **not** naive loader env access |
| Loader + `useLoaderData`   | Router feature, works without Start      | **First-class** Start docs pattern for simple data                           |
| Loader + `ensureQueryData` | Router + Query integration               | **Documented** in Start as the Query-first integration                       |


### Reference repo note

This Heydesk.Client reference is **Router + Query + client `fetch`** to a separate API. Patterns such as `**createServerFn**` and **Start SSR** apply when you move to **TanStack Start**, not to this tree as-is.

---

## Client state (TanStack Store)

**Reference pattern** — store singleton + persistence helper + `*Actions`:

```33:47:src/lib/state/auth.state.ts
export const authState = new Store<AuthState>(getInitialState());

// Helper to persist state to localStorage
const persistState = (state: AuthState) => {
  // Only persist user and organization data, not loading states
  const stateToPersist = {
    user: state.user,
    organization: state.organization,
    isAuthenticated: state.isAuthenticated,
    isLoading: false, // Don't persist loading state
  };
  storage.set(STORAGE_KEYS.AUTH_STATE, stateToPersist);
};
```

---

## Types and validation

- Prefer `**type**` for object shapes; use `**enum**` when the set is fixed and shared with the API.
- **One types file** per entity or concern; use `import type` across modules.
- **Validators:** `lib/validators/<entity>.validator.ts` with **Zod** (e.g. `createAgentSchema`).

**Reference — domain `type`:**

```6:14:src/lib/types/agent.ts
export type Agent = {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  systemPrompt: string;
  type: AgentType;
  createdAt: string; // ISO string
};
```

Framework code may still use `**interface**` where the library expects it (e.g. router context registration).

---

## Hooks

All custom hooks live under `**src/lib/hooks/**`. Name files `use-feature.ts` or `use-feature.tsx`. Hooks call services, subscribe to stores, or wrap React Query.

**Reference:**

```1:14:src/lib/hooks/use-conversations.ts
import { useQuery } from "@tanstack/react-query";
import { conversationsService, type GetConversationsRequest } from "../services/conversations.service";

export function useConversations(
  organizationId: string | undefined,
  request: GetConversationsRequest = {}
) {
  return useQuery({
    queryKey: ["conversations", organizationId, request.page, request.pageSize],
    queryFn: () => conversationsService.getConversations(organizationId!, request),
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
```

---

## Router and providers

Share one `**QueryClient**` between the router context and `QueryClientProvider` (create it once at bootstrap, pass into both). **Reference:** `src/main.tsx`, `src/providers.tsx`, `src/routes/__root.tsx`.

---

## Vertical slice example (agents)

1. **Types:** `src/lib/types/agent.ts`
2. **Validator (Zod):** `src/lib/validators/agent.validator.ts`
3. **Service:** `src/lib/services/agents.service.ts`
4. **Route:** `src/routes/$org/agents.tsx`
5. **Components:** `src/components/org/agents/`*

---

## Meta-framework server code (TanStack Start, server functions, SSR)

For **official Start guidance** on loaders, `useLoaderData`, `ensureQueryData`, `createServerFn`, and execution boundaries, read **[TanStack Query vs TanStack Start (data loading)](#tanstack-query-vs-tanstack-start-data-loading)** first. This section is about **where to put files** in your repo.

When the **framework** runs code on the server (server functions, loaders that execute on server, secrets, cookie signing, proxying to a separate API), you are in a different boundary than “browser `fetch` + `apiRequest`.”

**How I think about it**

- `**lib/`** = shared **domain** material: types, Zod validators, shared DTOs, and optionally small pure utilities used everywhere.
- **Server-only entrypoints** = things that must never ship to the client bundle: secrets, service-role tokens, internal base URLs.

**Do you need a `server/` folder?**

- **Yes, a dedicated tree helps** when you have more than a few server functions: e.g. `src/server/` or `src/lib/server/` containing modules only imported from server functions / server loaders. That makes reviews and mental load obvious: “this file does not run in the browser.”
- **Colocation is also fine** if the framework pushes it: e.g. `*.server.ts` next to a route, or server functions defined beside the route file, as long as the build excludes them from the client (follow TanStack Start / Vite conventions for server boundaries).

**Practical split**


| Concern                                                   | Where                                                                                                                                        |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Zod + TypeScript types                                    | `lib/validators`, `lib/types` (shared)                                                                                                       |
| Browser `fetch` with cookies                              | `lib/api.ts` + `lib/services/*.service.ts` (when you still call the API from the client)                                                     |
| Server function that proxies to the real API with secrets | `src/server/` or `route.server.ts` / `*.server.ts` — **not** the same module as client `apiRequest` unless you deliberately share only types |
| Client calling your own server functions                  | Thin hooks or small callers in `lib/hooks` or next to the route; server function does the privileged `fetch`                                 |


So: **you do not have to rename `lib` or duplicate everything.** Keep `**lib/`** as the shared contract layer (types, Zod, maybe shared error types). Add `**server/`** (or `lib/server/`) when server-only logic grows, so `lib/services` does not become a mix of “runs in browser” and “runs on Node” without clear file-level separation.

If you go **all-in on server functions** for data (no direct browser → backend), client `lib/services` can shrink to “call serverFn” wrappers, while the real HTTP + secrets stay under `server/`.

---

## Naming files

- **Lib modules:** dotted role suffixes — `*.service.ts`, `*.state.ts`, `*.validator.ts` (works fine with Vite/TS; easy to scan).
- **Components and routes:** kebab-case filenames, PascalCase exported components.
- **Hooks:** `use-kebab-case.ts` under `lib/hooks/`.

---

## Greenfield checklist

- Pick **one** service export style (named functions vs `entityService` object).
- Prefer `**type`** in domain code; allow `**interface`** for framework augmentation.
- Put **all** hooks under `lib/hooks/`.
- When using **server functions**, isolate **server-only** code in `server/` or `*.server.ts`, reuse **types + Zod** from `lib/`.

