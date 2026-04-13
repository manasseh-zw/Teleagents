import {
  type UseInViewOptions,
  useInView,
  useMotionValueEvent,
  useScroll,
} from "motion/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useScrollContainer } from "@/components/ui/scroll-container-context"
import { Spinner } from "@/components/ui/spinner"
import { createLogger } from "@/lib/utils/logger"
import { cn } from "@/lib/utils"

const DEBUG_AGENTS_INFINITE_SCROLL = import.meta.env.DEV
const logger = createLogger("agents-infinite")

interface InfiniteScrollTriggerProps {
  canLoadMore: boolean
  isLoading: boolean
  onLoadMore: () => Promise<unknown>
  rootMargin?: UseInViewOptions["margin"]
  className?: string
}

export function InfiniteScrollTrigger({
  canLoadMore,
  isLoading,
  onLoadMore,
  rootMargin = "200px",
  className,
}: InfiniteScrollTriggerProps) {
  const scrollContainer = useScrollContainer()
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const { scrollY } = useScroll(
    scrollContainer ? { container: scrollContainer.scrollContainerRef } : {}
  )
  const isInView = useInView(sentinelRef, {
    root: scrollContainer?.scrollContainerRef,
    margin: rootMargin,
    amount: "some",
  })
  const isLoadingRef = useRef(false)
  const hasUserScrolledRef = useRef(false)
  const didTriggerForCurrentViewRef = useRef(false)
  const [showManualLoad, setShowManualLoad] = useState(false)
  const stateRef = useRef({
    canLoadMore,
    isLoading,
    onLoadMore,
  })

  stateRef.current = {
    canLoadMore,
    isLoading,
    onLoadMore,
  }

  const tryLoadMore = useCallback(() => {
    const currentState = stateRef.current
    if (!currentState.canLoadMore || currentState.isLoading || isLoadingRef.current) {
      if (DEBUG_AGENTS_INFINITE_SCROLL) {
        logger.info("load:skipped", {
          canLoadMore: currentState.canLoadMore,
          isLoading: currentState.isLoading,
          isLoadingRef: isLoadingRef.current,
        })
      }
      return
    }

    isLoadingRef.current = true
    setShowManualLoad(false)
    if (DEBUG_AGENTS_INFINITE_SCROLL) {
      logger.info("load:start")
    }
    void currentState.onLoadMore().finally(() => {
      isLoadingRef.current = false
      if (DEBUG_AGENTS_INFINITE_SCROLL) {
        logger.info("load:settled")
      }
    })
  }, [])

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 0) {
      hasUserScrolledRef.current = true
    }

    if (DEBUG_AGENTS_INFINITE_SCROLL) {
      logger.info("scroll:change", {
        latest,
        hasUserScrolled: hasUserScrolledRef.current,
      })
    }
  })

  useEffect(() => {
    const currentState = stateRef.current

    if (!isInView) {
      didTriggerForCurrentViewRef.current = false
      setShowManualLoad(false)
      if (DEBUG_AGENTS_INFINITE_SCROLL) {
        logger.info("sentinel:out-of-view")
      }
      return
    }

    if (!currentState.canLoadMore) {
      setShowManualLoad(false)
      if (DEBUG_AGENTS_INFINITE_SCROLL) {
        logger.info("sentinel:no-more-pages")
      }
      return
    }

    if (!hasUserScrolledRef.current) {
      setShowManualLoad(true)
      if (DEBUG_AGENTS_INFINITE_SCROLL) {
        logger.info("sentinel:waiting-for-scroll")
      }
      return
    }

    setShowManualLoad(false)

    if (didTriggerForCurrentViewRef.current) {
      if (DEBUG_AGENTS_INFINITE_SCROLL) {
        logger.info("sentinel:already-triggered")
      }
      return
    }

    didTriggerForCurrentViewRef.current = true

    if (DEBUG_AGENTS_INFINITE_SCROLL) {
      logger.info("sentinel:entered-view")
    }

    tryLoadMore()
  }, [isInView, tryLoadMore])

  const setSentinelRef = useCallback((node: HTMLDivElement | null) => {
    sentinelRef.current = node
    didTriggerForCurrentViewRef.current = false

    if (!node) {
      setShowManualLoad(false)
    }
  }, [])

  return (
    <div
      ref={setSentinelRef}
      className={cn("flex min-h-10 items-center justify-center", className)}
    >
      {isLoading ? <Spinner className="size-4 text-muted-foreground" /> : null}
      {!isLoading && canLoadMore && showManualLoad ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            hasUserScrolledRef.current = true
            if (DEBUG_AGENTS_INFINITE_SCROLL) {
              logger.info("load:manual-click")
            }
            tryLoadMore()
          }}
        >
          Load more
        </Button>
      ) : null}
    </div>
  )
}
