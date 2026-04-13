import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { CallHistoryDetailSheet } from "@/components/call-history/call-history-detail-sheet"
import { callLogsService } from "@/lib/services/call-logs.service"

export const Route = createFileRoute("/call-history/$conversationId")({
  loader: ({ context, params }) => {
    void context.queryClient.prefetchQuery(
      callLogsService.detailQueryOptions(params.conversationId)
    )
    void context.queryClient.prefetchQuery(
      callLogsService.audioMetadataQueryOptions(params.conversationId)
    )
  },
  component: CallConversationPage,
})

function CallConversationPage() {
  const { conversationId } = Route.useParams()
  const navigate = useNavigate()

  return (
    <CallHistoryDetailSheet
      conversationId={conversationId}
      open
      onClose={() => {
        void navigate({ to: "/call-history" })
      }}
    />
  )
}
