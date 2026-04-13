import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  AudioPlayerButton,
  AudioPlayerProvider,
  AudioPlayerScrubBar,
  AudioPlayerTime,
  useAudioPlayer,
} from "@/components/ui/audio-player"
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ui/conversation"
import { MessageAvatar } from "@/components/ui/message"
import { callLogsService } from "@/lib/services/call-logs.service"
import type { CallLogDetail } from "@/lib/types/call-logs"
import { cn } from "@/lib/utils"

function formatDuration(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "—"
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = Math.floor(totalSeconds % 60)
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }
  return `${m}:${s.toString().padStart(2, "0")}`
}

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}

function statusBadgeConfig(call: CallLogDetail) {
  if (call.status === "Failed" || call.isSuccessful === false) {
    return {
      label: "Failed",
      className:
        "border-destructive/25 bg-destructive/10 text-destructive dark:border-destructive/30 dark:bg-destructive/15",
    }
  }
  if (call.isSuccessful === true || call.status === "Done") {
    return {
      label: "Successful",
      className:
        "border-chart-1/30 bg-chart-1/20 text-chart-4 dark:border-chart-1/25 dark:bg-chart-1/12 dark:text-chart-1",
    }
  }
  if (call.status === "InProgress" || call.status === "Initiated") {
    return {
      label: call.status === "Initiated" ? "Initiated" : "In progress",
      className: "border-border bg-muted text-muted-foreground",
    }
  }
  if (call.status === "Processing") {
    return {
      label: "Processing",
      className: "border-border bg-muted text-muted-foreground",
    }
  }
  return {
    label: "Unknown",
    className: "border-border bg-muted text-muted-foreground",
  }
}

function AudioInitializer({ src, id }: { src: string; id: string }) {
  const player = useAudioPlayer()
  useEffect(() => {
    void player.setActiveItem({ id, src })
  }, [player, id, src])
  return null
}

function AudioFallbackDuration({ fallbackSeconds }: { fallbackSeconds: number }) {
  const player = useAudioPlayer()
  const { duration } = player
  const display =
    duration !== undefined && Number.isFinite(duration) && !Number.isNaN(duration)
      ? formatDuration(duration)
      : formatDuration(fallbackSeconds)
  return (
    <span className="text-sm tabular-nums text-muted-foreground">{display}</span>
  )
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-border/50 py-3.5 last:border-b-0">
      <span className="shrink-0 text-sm font-medium text-foreground">{label}</span>
      <div className="min-w-0 text-right text-sm">{children}</div>
    </div>
  )
}

function OverviewTab({
  call,
  isLoading,
}: {
  call: CallLogDetail | undefined
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="space-y-4 py-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Separator className="my-2" />
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex justify-between py-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    )
  }

  if (!call) return null

  const { label, className } = statusBadgeConfig(call)

  return (
    <div className="space-y-6 py-1">
      {call.transcriptSummary?.trim() ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Summary</p>
          <p className="text-sm leading-relaxed text-foreground/90">
            {call.transcriptSummary}
          </p>
        </div>
      ) : null}

      <div className="mt-2 space-y-0">
        <MetaRow label="Call status">
          <Badge variant="outline" className={cn("font-medium", className)}>
            {label}
          </Badge>
        </MetaRow>

        {call.terminationReason ? (
          <MetaRow label="How the call ended">
            <span className="text-muted-foreground">{call.terminationReason}</span>
          </MetaRow>
        ) : null}

        <MetaRow label="Duration">
          <span className="text-muted-foreground">
            {formatDuration(call.durationSeconds)}
          </span>
        </MetaRow>

        <MetaRow label="Agent">
          <span className="font-medium text-foreground">
            {call.agentDisplayName || "—"}
          </span>
        </MetaRow>

        {call.direction ? (
          <MetaRow label="Direction">
            <span className="text-muted-foreground">{call.direction}</span>
          </MetaRow>
        ) : null}

        {call.mainLanguage ? (
          <MetaRow label="Language">
            <span className="text-muted-foreground">{call.mainLanguage}</span>
          </MetaRow>
        ) : null}

        <MetaRow label="Date">
          <span className="text-muted-foreground">{formatDate(call.startTimeUtc)}</span>
        </MetaRow>

        <MetaRow label="Conversation ID">
          <span className="inline-block max-w-full break-all font-mono text-xs text-muted-foreground">
            {call.conversationId}
          </span>
        </MetaRow>
      </div>
    </div>
  )
}

function isAssistantTranscriptRole(role: string) {
  const r = role.trim().toLowerCase()
  return (
    r === "agent" ||
    r === "assistant" ||
    r === "ai" ||
    r === "bot"
  )
}

function TranscriptionTab({
  call,
  isLoading,
}: {
  call: CallLogDetail | undefined
  isLoading: boolean
}) {
  const agentLabel = call?.agentDisplayName?.trim() || "Agent"

  if (isLoading) {
    return (
      <div className="flex flex-col gap-1 px-5 py-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className={cn(
              "py-2",
              i % 2 === 0 ? "flex w-full flex-col items-start gap-2" : "flex justify-end"
            )}
          >
            {i % 2 === 0 ? (
              <>
                <div className="flex items-center gap-2">
                  <Skeleton className="size-7 shrink-0 rounded-full" />
                  <Skeleton className="h-3 w-28 rounded-full" />
                </div>
                <Skeleton className="h-14 w-[72%] max-w-md rounded-2xl" />
              </>
            ) : (
              <Skeleton className="h-14 w-[68%] max-w-sm rounded-2xl" />
            )}
          </div>
        ))}
      </div>
    )
  }

  const turns = call?.transcript ?? []

  return (
    <Conversation className="h-full">
      <ConversationContent className="flex flex-col gap-0 px-5 py-3">
        {turns.length === 0 ? (
          <ConversationEmptyState
            title="No transcript"
            description="This conversation has no transcript available."
          />
        ) : (
          turns.map((turn, index) => {
            const isAgent = isAssistantTranscriptRole(turn.role)

            if (isAgent) {
              return (
                <div
                  key={index}
                  className="flex w-full min-w-0 flex-col items-start gap-0 pt-1 pb-3"
                >
                  <div className="relative z-10 mb-1 flex max-w-[min(80%,28rem)] items-center gap-2 -translate-x-1">
                    <MessageAvatar
                      name={agentLabel}
                      className="size-7 shrink-0 ring-1"
                    />
                    <span className="truncate text-xs font-medium text-foreground">
                      {agentLabel}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "max-w-[min(80%,28rem)] rounded-2xl bg-muted/35 px-5 py-3.5 text-sm text-foreground ring-1 ring-border/70"
                    )}
                  >
                    <p className="leading-relaxed">{turn.message}</p>
                    {turn.timeInCallSeconds != null ? (
                      <p className="mt-2 text-[11px] tabular-nums text-muted-foreground">
                        {formatDuration(turn.timeInCallSeconds)}
                      </p>
                    ) : null}
                  </div>
                </div>
              )
            }

            return (
              <div
                key={index}
                className="flex w-full min-w-0 justify-end pt-1 pb-3"
              >
                <div
                  className={cn(
                    "max-w-[min(80%,28rem)] rounded-2xl bg-muted/75 px-5 py-3.5 text-sm text-foreground"
                  )}
                >
                  <p className="leading-relaxed">{turn.message}</p>
                  {turn.timeInCallSeconds != null ? (
                    <p className="mt-2 text-right text-[11px] tabular-nums text-muted-foreground">
                      {formatDuration(turn.timeInCallSeconds)}
                    </p>
                  ) : null}
                </div>
              </div>
            )
          })
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  )
}

interface CallHistoryDetailSheetProps {
  conversationId: string
  open: boolean
  onClose: () => void
}

export function CallHistoryDetailSheet({
  conversationId,
  open,
  onClose,
}: CallHistoryDetailSheetProps) {
  const detailQuery = useQuery(callLogsService.detailQueryOptions(conversationId))
  const call = detailQuery.data
  const audioSrc = `/api/audio/${conversationId}`

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0"
        showCloseButton
      >
        <SheetTitle className="sr-only">
          {call
            ? `Conversation with ${call.agentDisplayName}`
            : "Conversation details"}
        </SheetTitle>
        <SheetDescription className="sr-only">
          Call details for conversation {conversationId}
        </SheetDescription>

        {/* Header */}
        <div className="shrink-0 border-b border-border/60 px-6 py-6 pr-14">
          <h2 className="text-base font-semibold leading-tight tracking-tight">
            {call ? (
              <>
                Conversation with{" "}
                <span className="text-foreground">{call.agentDisplayName}</span>
              </>
            ) : (
              <Skeleton className="inline-block h-5 w-48" />
            )}
          </h2>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {conversationId}
          </p>
        </div>

        {/* Audio Player */}
        {call?.hasAudio ? (
          <div className="shrink-0 border-b border-border/60 px-6 py-5">
            <AudioPlayerProvider>
              <AudioInitializer src={audioSrc} id={conversationId} />
              <div className="flex items-center gap-4">
                <AudioPlayerButton
                  size="icon"
                  variant="ghost"
                  className="size-9 shrink-0 rounded-full text-foreground hover:bg-muted/80"
                />
                <AudioPlayerScrubBar
                  className="min-w-0 flex-1"
                  fallbackDurationSeconds={call.durationSeconds}
                  trackClassName="mx-1"
                />
                <div className="flex shrink-0 items-center gap-1.5 tabular-nums text-xs text-muted-foreground">
                  <AudioPlayerTime className="text-xs" />
                  <span className="opacity-70">/</span>
                  <AudioFallbackDuration fallbackSeconds={call.durationSeconds} />
                </div>
              </div>
            </AudioPlayerProvider>
          </div>
        ) : null}

        {/* Tabs */}
        <Tabs
          defaultValue="overview"
          className="flex min-h-0 flex-1 flex-col gap-0"
        >
          <div className="shrink-0 border-b border-border/60 px-6 pt-6">
            <TabsList
              variant="line"
              className="h-auto w-fit min-w-0 justify-start gap-8 rounded-none bg-transparent p-0"
            >
              <TabsTrigger
                value="overview"
                className="flex-none grow-0 basis-auto px-0 py-2.5 text-xs font-medium text-muted-foreground data-active:text-foreground"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="transcription"
                className="flex-none grow-0 basis-auto px-0 py-2.5 text-xs font-medium text-muted-foreground data-active:text-foreground"
              >
                Transcription
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="overview"
            className="min-h-0 flex-1 overflow-y-auto px-6 py-6"
          >
            <OverviewTab call={call} isLoading={detailQuery.isLoading} />
          </TabsContent>

          <TabsContent
            value="transcription"
            className="min-h-0 flex-1 overflow-hidden p-0"
          >
            <TranscriptionTab call={call} isLoading={detailQuery.isLoading} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
