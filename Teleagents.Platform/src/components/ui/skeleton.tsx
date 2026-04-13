import { useCallback, useRef } from "react"
import { cn } from "@/lib/utils"

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

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
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

function SkeletonText({ className, ...props }: React.ComponentProps<"span">) {
  const ref = useSkeletonShimmer()

  return (
    <span
      ref={ref}
      data-slot="skeleton-text"
      className={cn(
        className,
        "skeleton-shimmer rounded-sm [box-decoration-break:clone] text-transparent [-webkit-box-decoration-break:clone]"
      )}
      {...props}
    />
  )
}

export { Skeleton, SkeletonText }
