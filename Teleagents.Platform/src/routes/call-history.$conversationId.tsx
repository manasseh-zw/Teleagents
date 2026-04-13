import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { CallHistoryDetailSheet } from "@/components/call-history/call-history-detail-sheet"
import { callLogsService } from "@/lib/services/call-logs.service"

export const Route = createFileRoute("/call-history/$conversationId")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      callLogsService.detailQueryOptions(params.conversationId)
    ),
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
