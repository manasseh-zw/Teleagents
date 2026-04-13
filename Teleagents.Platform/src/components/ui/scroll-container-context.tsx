import { createContext, useContext } from "react"

interface ScrollContainerContextValue {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
}

const ScrollContainerContext = createContext<ScrollContainerContextValue | null>(
  null
)

export function ScrollContainerProvider({
  children,
  scrollContainerRef,
}: {
  children: React.ReactNode
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <ScrollContainerContext.Provider value={{ scrollContainerRef }}>
      {children}
    </ScrollContainerContext.Provider>
  )
}

export function useScrollContainer() {
  return useContext(ScrollContainerContext)
}
