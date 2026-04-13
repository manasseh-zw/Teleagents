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
  AudioPlayerProgress,
  AudioPlayerProvider,
  AudioPlayerTime,
  useAudioPlayer,
} from "@/components/ui/audio-player"
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ui/conversation"
import { Message, MessageAvatar, MessageContent } from "@/components/ui/message"
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
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm">{children}</span>
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
    <div className="space-y-5 py-2">
      {call.transcriptSummary?.trim() ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Summary
          </p>
          <p className="text-sm leading-relaxed">{call.transcriptSummary}</p>
        </div>
      ) : null}

      <Separator />

      <div className="divide-y divide-border">
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

        <MetaRow label="Duration">{formatDuration(call.durationSeconds)}</MetaRow>

        <MetaRow label="Agent">
          <span className="font-medium">{call.agentDisplayName || "—"}</span>
        </MetaRow>

        {call.direction ? (
          <MetaRow label="Direction">{call.direction}</MetaRow>
        ) : null}

        {call.mainLanguage ? (
          <MetaRow label="Language">{call.mainLanguage}</MetaRow>
        ) : null}

        <MetaRow label="Date">{formatDate(call.startTimeUtc)}</MetaRow>

        <MetaRow label="Conversation ID">
          <span className="font-mono text-xs text-muted-foreground">
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
      <div className="flex flex-col gap-1 p-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-2 py-2",
              i % 2 === 0 ? "flex-row" : "flex-row-reverse justify-end"
            )}
          >
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <Skeleton
              className={cn("h-12 rounded-xl", i % 2 === 0 ? "w-2/3" : "w-3/5")}
            />
          </div>
        ))}
      </div>
    )
  }

  const turns = call?.transcript ?? []

  return (
    <Conversation className="h-full">
      <ConversationContent className="flex flex-col gap-0 px-4 py-2">
        {turns.length === 0 ? (
          <ConversationEmptyState
            title="No transcript"
            description="This conversation has no transcript available."
          />
        ) : (
          turns.map((turn, index) => {
            const from = isAssistantTranscriptRole(turn.role)
              ? "assistant"
              : "user"

            return (
              <Message key={index} from={from} className="py-2">
                <MessageAvatar
                  name={from === "assistant" ? agentLabel : "You"}
                />
                <MessageContent
                  variant={from === "assistant" ? "contained" : "flat"}
                >
                  <p className="leading-relaxed">{turn.message}</p>
                  {turn.timeInCallSeconds !== null &&
                  turn.timeInCallSeconds !== undefined ? (
                    <p className="mt-0.5 text-[11px] tabular-nums opacity-60">
                      {formatDuration(turn.timeInCallSeconds)}
                    </p>
                  ) : null}
                </MessageContent>
              </Message>
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
        <div className="shrink-0 border-b px-6 py-5 pr-14">
          <h2 className="text-base font-semibold leading-tight">
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
          <div className="shrink-0 border-b px-6 py-4">
            <AudioPlayerProvider>
              <AudioInitializer src={audioSrc} id={conversationId} />
              <div className="flex items-center gap-3">
                <AudioPlayerButton
                  size="icon"
                  variant="outline"
                  className="size-8 shrink-0 rounded-full"
                />
                <AudioPlayerProgress className="flex-1" />
                <div className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
                  <AudioPlayerTime />
                  <span>/</span>
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
          <div className="shrink-0 border-b">
            <TabsList
              variant="line"
              className="h-auto w-full rounded-none px-4 py-0"
            >
              <TabsTrigger value="overview" className="px-3 py-3 text-sm">
                Overview
              </TabsTrigger>
              <TabsTrigger value="transcription" className="px-3 py-3 text-sm">
                Transcription
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="overview"
            className="min-h-0 flex-1 overflow-y-auto px-6 py-4"
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
