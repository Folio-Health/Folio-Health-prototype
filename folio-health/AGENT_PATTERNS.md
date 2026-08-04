# Folio Health — build patterns for new pages/modules

Read this fully before writing any code. It exists so multiple agents building
different modules in parallel produce consistent, working code without
stepping on each other's files.

## Stack facts (Next.js 16 — NOT Next 15, training data is stale here)

- App Router, Turbopack, React 19.2, TypeScript strict, Tailwind v4.
- `params` and `searchParams` in `page.tsx` are **Promises**. Dynamic route pages must be:
  ```tsx
  export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <SomeClientComponent id={id} />
  }
  ```
  Keep `page.tsx` a thin async server component; put actual UI in a
  `"use client"` component under `src/features/<feature>/components/`.
- `next.config.ts` has `typedRoutes` **off** right now (too many routes don't
  exist yet across parallel work). Do not add `as Route` casts you don't need,
  but also don't rely on typed-route autocomplete.
- `next/image` remote images are `unoptimized: true` (Unsplash fetch was timing
  out through the sandboxed dev server's image optimizer). Just use `next/image`
  normally with `src` from the `unsplash()` helper — no extra config needed,
  and don't try to "fix" this back to optimized.
- Do not run `npm install` for new packages. Everything needed (recharts,
  react-hook-form, zod, @tanstack/react-table, @tanstack/react-query, zustand,
  date-fns, framer-motion, react-dropzone, react-pdf, react-photo-view, tiptap,
  cmdk, sonner, next-themes, react-big-calendar) is already installed.

## File ownership — do not edit these (shared, owned by the foundation build)

`src/app/layout.tsx`, `src/app/(app)/layout.tsx`, `src/app/(auth)/layout.tsx`,
`src/app/globals.css`, `next.config.ts`, `src/components/ui/**` (shadcn
primitives), `src/components/navigation/**`, `src/components/layouts/**`,
`src/config/nav.ts`, `src/providers/**`, `src/stores/ui-store.ts`,
`src/lib/mock/{staff,patients,appointments,vitals,notifications,seed,index}.ts`,
`src/types/core.ts`, `src/lib/images.ts`, `src/components/common/logo.tsx`.

If the nav is missing an entry you need, that's fine — link to the route
directly with `<Link>`; do not edit `nav.ts` (it will be reconciled centrally).

Only create **new** files under `src/app/(app)/<your-routes>/**`,
`src/app/(auth)/<your-routes>/**` (only if you own auth pages),
`src/features/<your-features>/**`, and add new mock data files under
`src/lib/mock/<your-feature>.ts` or colocated in
`src/features/<feature>/lib/mock-data.ts` (either is fine — colocated is
preferred for module-specific data that nothing else needs).

## Component library — reuse, don't rebuild

- `PageHeader` (`@/components/common/page-header`): every page's header. Props:
  `title`, `description?`, `breadcrumbs?: {label, href?}[]`, `actions?: ReactNode`.
- `StatCard` (`@/components/cards/stat-card`): KPI tiles. Props: `label`, `value`,
  `icon?` (lucide), `delta?: {value, isGoodWhenUp?, comparedTo?}`,
  `tone?: "primary"|"emerald"|"amber"|"red"|"violet"`, `sparklineData?: number[]`.
- `StatusBadge` (`@/components/common/status-badge`): pass any status string
  (`"Active"`, `"Pending"`, `"Completed"`, `"Low Stock"`, `"Paid"`, etc.) — it has
  a big built-in vocabulary map and falls back to slate/gray for anything
  unrecognized. Optional `tone` override.
- `DataTable` (`@/components/tables/data-table`): TanStack-table wrapper with
  built-in sorting, pagination, loading skeleton, empty state. Props: `columns`,
  `data`, `isLoading?`, `toolbar?` (render filters/search above the table),
  `onRowClick?`, `emptyTitle?`, `emptyDescription?`. Build columns with
  `DataTableColumnHeader` (`@/components/tables/data-table-column-header`) for
  sortable headers.
- `EmptyState` / `ErrorState` (`@/components/common/empty-state`).
- `TableSkeleton`, `StatCardGridSkeleton`, `ChartCardSkeleton`, `ListSkeleton`
  (`@/components/common/loading-skeletons`).
- `PersonAvatar` (`@/components/common/person-avatar`): props `name`, `seed?`,
  `size?: "sm"|"default"|"lg"`. Generates a deterministic DiceBear initials avatar.
- Charts (`@/components/charts/*`): `TrendChart` (line/area, multi-series),
  `BarChart`, `DonutChart`, `Sparkline`. All theme-aware via CSS vars
  (`var(--chart-1)` … `var(--chart-8)`), already colorblind-validated — use
  them in that fixed order for categorical series, don't invent new hexes.
  Status-only encodings (not series) may use `var(--status-good|warning|serious|critical)`.
- `ConfirmDialog` (`@/components/common/confirm-dialog`) for destructive
  confirmations (discharge, cancel, delete).
- `Logo` / `LogoMark` (`@/components/common/logo`) if a page needs the brand mark
  (e.g. a print layout).

## Images

`@/lib/images.ts` exports `unsplash(id, {w,h,q,fit})` and `MEDICAL_IMAGES`
(categorized, hand-verified photo ids — `buildings`, `wards`, `surgery`,
`consultation`, `radiology`, `laboratory`, `pharmacy`, `supplies`, `care`,
`office`, `flatlay`, `staffPortraits`). **Only use ids from `MEDICAL_IMAGES`** —
don't invent new Unsplash photo ids, they haven't been content-verified and may
404 or show something unrelated/wrong. If you want a photo for a module with no
obviously-matching category, pick the closest one (e.g. `consultation` for a
general clinical hero) rather than guessing a new id. Use `avatarUrl(seed)` from
the same file for any generated (non-DiceBear-via-PersonAvatar) avatar need.

## Mock data conventions

Look at `src/lib/mock/patients.ts` and `src/lib/mock/appointments.ts` for the
pattern: `seedFaker(offsetNumber)` (pick an unused offset, e.g. continue from 6
upward) once at module top, then build a module-level `const` array with
`@faker-js/faker`, exported plus a couple of lookup helpers
(`getXById`, `getXsForY`). This makes the dataset stable for the life of the
dev server (not regenerated per request/render). Reuse `PATIENTS`, `STAFF`,
`DOCTORS`, `NURSES`, `APPOINTMENTS` from `@/lib/mock/{patients,staff,appointments}`
to cross-reference (e.g. a lab order needs a real `patientId` and `doctorId`
from those arrays) rather than inventing disconnected names.

## Known gotchas (base-ui, not Radix — this shadcn preset uses `@base-ui/react`)

- `Select`'s `onValueChange` signature is `(value: string | null, eventDetails) => void`,
  **not** a plain setter. Always wrap:
  `<Select value={x} onValueChange={(v) => setX(v ?? fallback)}>`. Passing a
  bare `useState` setter directly is a TypeScript error.
- Polymorphism uses a `render` prop, not `asChild`:
  `<Button render={<Link href="/x" />}>Label</Button>`,
  `<DropdownMenuItem render={<Link href="/x" />}>`,
  `<TooltipTrigger render={someElement} />` (no children in that case — the
  props merge onto the element you pass).
- `DialogFooter`/`AlertDialogFooter` come with built-in border/background/margin
  styling meant for the default dialog padding; override with `className` if you
  need a flush custom layout (see `new-appointment-dialog.tsx` for an example).
- Form fields: prefer bare `<Input {...field} />` directly inside shadcn's
  `<FormControl>` (from `@/components/ui/form`) — that's the pattern
  `FormControl` is built for (it clones id/aria props onto its single child).
  Avoid nesting a full `<InputGroup>` inside `<FormControl>` for actual
  react-hook-form fields (label-click-to-focus won't bind correctly); reserve
  `InputGroup` for standalone, non-form search/filter inputs.
- `cn()` from `@/lib/utils` for conditional classNames everywhere (clsx + tailwind-merge).

## Every page needs (per the product brief)

Professional header via `PageHeader` with breadcrumbs → search/filters where
applicable (toolbar row above `DataTable`, or a filter row for
non-table pages) → `DataTable` with sorting for list pages → empty state
(built into `DataTable`, or `EmptyState` standalone) → responsive layout
(mobile-first Tailwind breakpoints, this app is desktop-first but must not
break on tablet — avoid fixed widths that overflow, use `grid`/`flex` with
`sm:`/`lg:`/`xl:` breakpoints) → pagination (built into `DataTable`) → action
buttons → status badges (`StatusBadge`) → 8px-grid spacing (Tailwind's default
scale already is 4px-based, so stick to the standard `gap-*`/`p-*`/`space-y-*`
scale, don't use arbitrary pixel values) → context menus where the reference
mockup shows a row actions `⋯` button (`DropdownMenu`, see
`patients-columns.tsx` for the pattern).

For pages that are naturally a "hub" with many related sub-views (e.g. Billing
has Invoices/Payments/Receipts/Claims/Outstanding/Refunds/Summary), prefer
**one route per sub-view** under the module's folder
(`/billing`, `/billing/payments`, `/billing/receipts`, ...) with a shared
`<Tabs>` row at the top of each (matching the pattern in
`appointments-view.tsx` and the `patient-profile.tsx` tabs) so the sub-views
feel like one cohesive module, OR tabs within a single page if the sub-views
are lightweight. Use your judgment per module; consistency within a module
matters more than a single global rule.

## Verifying your work

You will not be able to run a full `npm run build` in isolation reliably if
other agents are editing the tree concurrently — that's expected. Instead:
read back every file you write and sanity-check imports resolve to real
exports (check the actual export names in the files you import from, don't
assume). Keep TypeScript strict-mode clean (no implicit `any`, no unused
imports/vars — this repo's ESLint will flag both).
