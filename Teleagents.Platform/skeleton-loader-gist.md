# Reusable Skeleton Loader Pattern

This is the pattern we used for the agents and call-history pages:

- Render page chrome immediately.
- Let only the data region show skeletons.
- Use real text layouts for skeleton lines with `box-decoration-break: clone`.
- Synchronize the shimmer with the Web Animations API.

## 1. Theme Tokens + CSS Utility

Add this to your global stylesheet.

```css
:root {
  --skeleton-base: oklch(0.93 0.007 106.5);
  --skeleton-highlight: oklch(0.975 0.003 106.5);
}

.dark {
  --skeleton-base: oklch(0.31 0.01 108);
  --skeleton-highlight: oklch(0.37 0.012 108);
}

.skeleton-shimmer {
  background-image: linear-gradient(
    90deg,
    var(--skeleton-base) 33%,
    var(--skeleton-highlight) 50%,
    var(--skeleton-base) 66%
  );
  background-repeat: no-repeat;
  background-size: 300% 100%;
}
```

## 2. Reusable React Component

Create `skeleton.tsx`.

```tsx
import { useCallback, useRef } from "react"

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function useSkeletonShimmer(enabled = true) {
  const animationRef = useRef<Animation | null>(null)

  return useCallback(
    (element: HTMLElement | null) => {
      animationRef.current?.cancel()
      animationRef.current = null

      if (
        !enabled ||
        !element ||
        typeof window === "undefined" ||
        typeof element.animate !== "function" ||
        (typeof window.matchMedia === "function" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      ) {
        return
      }

      const animation = element.animate(
        [{ backgroundPosition: "100% 0%" }, { backgroundPosition: "0% 0%" }],
        {
          duration: 2000,
          easing: "ease-in-out",
          iterations: Number.POSITIVE_INFINITY,
        }
      )

      animation.startTime = 0
      animationRef.current = animation
    },
    [enabled]
  )
}

export function Skeleton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const ref = useSkeletonShimmer()

  return (
    <div
      ref={ref}
      data-slot="skeleton"
      className={cn("skeleton-shimmer rounded-xl", className)}
      {...props}
    />
  )
}

export function SkeletonText({
  className,
  ...props
}: React.ComponentProps<"span">) {
  const ref = useSkeletonShimmer()

  return (
    <span
      ref={ref}
      data-slot="skeleton-text"
      className={cn(
        "skeleton-shimmer rounded-sm text-transparent [box-decoration-break:clone] [-webkit-box-decoration-break:clone]",
        className
      )}
      {...props}
    />
  )
}
```

## 3. Table Skeleton Example

Use realistic mock text so the skeleton matches the final layout better.

```tsx
import { Skeleton, SkeletonText } from "./skeleton"

const loadingRows = [
  {
    agent: "Customer Support Assistant",
    duration: "8:34",
    summary: "Caller asked about a missed payment and requested a callback.",
    date: "Apr 12, 2026, 9:24 AM",
    statusWidth: "w-24",
  },
  {
    agent: "Collections Follow-Up Agent",
    duration: "12:09",
    summary: "Conversation covered verification steps and repayment options.",
    date: "Apr 11, 2026, 2:18 PM",
    statusWidth: "w-20",
  },
]

function LoadingRow({ index }: { index: number }) {
  const row = loadingRows[index % loadingRows.length]

  return (
    <tr aria-hidden>
      <td className="py-3">
        <SkeletonText className="block max-w-56 truncate text-sm">
          {row.agent}
        </SkeletonText>
      </td>
      <td className="py-3">
        <SkeletonText className="text-sm tabular-nums">
          {row.duration}
        </SkeletonText>
      </td>
      <td className="py-3">
        <SkeletonText className="block max-w-[28rem] truncate text-sm">
          {row.summary}
        </SkeletonText>
      </td>
      <td className="py-3 text-right">
        <span className="inline-flex justify-end">
          <Skeleton className={`h-6 rounded-full ${row.statusWidth}`} />
        </span>
      </td>
      <td className="py-3 text-right">
        <span className="inline-flex justify-end">
          <SkeletonText className="text-sm tabular-nums">
            {row.date}
          </SkeletonText>
        </span>
      </td>
    </tr>
  )
}

export function ResultsTable({
  isLoading,
  rows,
}: {
  isLoading: boolean
  rows: Array<{ id: string; agent: string; duration: string }>
}) {
  return (
    <table className="w-full">
      <thead>
        <tr>
          <th>Agent</th>
          <th>Duration</th>
          <th>Summary</th>
          <th>Status</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        {isLoading
          ? Array.from({ length: 6 }, (_, index) => (
              <LoadingRow key={index} index={index} />
            ))
          : rows.map((row) => (
              <tr key={row.id}>
                <td>{row.agent}</td>
                <td>{row.duration}</td>
                <td>...</td>
                <td>...</td>
                <td>...</td>
              </tr>
            ))}
      </tbody>
    </table>
  )
}
```

## 4. Important Routing Rule

Do not block the whole route waiting for table data if you want the page shell to appear instantly.

Bad:

```tsx
export const Route = createFileRoute("/items")({
  loader: ({ context }) =>
    context.queryClient.ensureInfiniteQueryData(itemsService.listQueryOptions()),
  component: ItemsPage,
})
```

Better for this pattern:

```tsx
export const Route = createFileRoute("/items")({
  component: ItemsPage,
})
```

Then fetch inside the page/component:

```tsx
const query = useInfiniteQuery(itemsService.listInfiniteQueryOptions())

<ResultsTable
  rows={query.data?.pages.flatMap((page) => page.items) ?? []}
  isLoading={query.isLoading}
/>
```

## 5. Rule of Thumb

- Use route loaders for data that must exist before the page can render.
- Use local query loading + skeletons for tables, cards, lists, and detail panels.
- Keep search bars, titles, filters, tabs, and layout outside the blocking data boundary.
