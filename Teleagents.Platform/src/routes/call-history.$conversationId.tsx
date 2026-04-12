import { createFileRoute } from "@tanstack/react-router"
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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 pt-4 pb-2 md:px-8 md:pt-8">
      <h1 className="text-2xl font-light tracking-tight text-foreground">
        Conversation
      </h1>
      <p className="text-sm text-muted-foreground">{conversationId}</p>
    </div>
  )
}
