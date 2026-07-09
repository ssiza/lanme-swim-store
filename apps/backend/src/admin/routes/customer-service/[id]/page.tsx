import {
  Badge,
  Button,
  Container,
  Heading,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { sdk } from "../../../lib/sdk"

type SupportTicketReply = {
  id: string
  message: string
  admin_user_id?: string | null
  created_at?: string
}

type SupportTicket = {
  id: string
  name: string
  email: string
  order_id?: string | null
  order_display_id?: string | null
  topic: string
  message: string
  status: "open" | "replied" | "closed"
  created_at?: string
  updated_at?: string
}

type TicketDetailResponse = {
  ticket: SupportTicket
  replies: SupportTicketReply[]
}

const TOPIC_LABELS: Record<string, string> = {
  order_issue: "Order issue",
  shipping: "Shipping",
  return_or_refund: "Return or refund",
  damaged_item: "Damaged item",
  wrong_item: "Wrong item received",
  product_question: "Product question",
  other: "Other",
}

const formatDate = (value?: string) => {
  if (!value) {
    return "—"
  }

  return new Date(value).toLocaleString()
}

const CustomerServiceDetailPage = () => {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [replyMessage, setReplyMessage] = useState("")

  const { data, isLoading, isError } = useQuery<TicketDetailResponse>({
    enabled: Boolean(id),
    queryFn: () => sdk.client.fetch(`/admin/customer-service/${id}`),
    queryKey: ["customer-service-ticket", id],
  })

  const replyMutation = useMutation({
    mutationFn: async (message: string) =>
      sdk.client.fetch(`/admin/customer-service/${id}/replies`, {
        method: "POST",
        body: { message },
      }),
    onSuccess: () => {
      setReplyMessage("")
      queryClient.invalidateQueries({ queryKey: ["customer-service-ticket", id] })
      queryClient.invalidateQueries({ queryKey: ["customer-service-tickets"] })
      toast.success("Reply sent")
    },
    onError: () => {
      toast.error("Failed to send reply")
    },
  })

  const closeMutation = useMutation({
    mutationFn: async () =>
      sdk.client.fetch(`/admin/customer-service/${id}`, {
        method: "PATCH",
        body: { status: "closed" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-service-ticket", id] })
      queryClient.invalidateQueries({ queryKey: ["customer-service-tickets"] })
      toast.success("Ticket closed")
    },
    onError: () => {
      toast.error("Failed to close ticket")
    },
  })

  const ticket = data?.ticket
  const replies = data?.replies ?? []
  const isClosed = ticket?.status === "closed"

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <div className="flex flex-col gap-1">
          <Link
            to="/customer-service"
            className="text-ui-fg-subtle text-sm hover:text-ui-fg-base"
          >
            ← Back to tickets
          </Link>
          <Heading level="h1">Support ticket</Heading>
        </div>

        {ticket && !isClosed && (
          <Button
            variant="secondary"
            isLoading={closeMutation.isPending}
            onClick={() => closeMutation.mutate()}
          >
            Close ticket
          </Button>
        )}
      </div>

      <div className="px-6 py-4">
        {isLoading && <Text>Loading ticket...</Text>}

        {isError && (
          <Text className="text-ui-fg-error">Failed to load this ticket.</Text>
        )}

        {!isLoading && !isError && !ticket && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Heading level="h2">Ticket not found</Heading>
            <Text className="text-ui-fg-subtle">
              This support request may have been removed.
            </Text>
          </div>
        )}

        {ticket && (
          <div className="flex flex-col gap-8">
            <section className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  color={
                    ticket.status === "open"
                      ? "orange"
                      : ticket.status === "replied"
                        ? "green"
                        : "grey"
                  }
                  size="2xsmall"
                >
                  {ticket.status}
                </Badge>
                <Text size="small" className="text-ui-fg-subtle">
                  Created {formatDate(ticket.created_at)}
                </Text>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Text size="small" weight="plus">
                    Customer
                  </Text>
                  <Text>{ticket.name}</Text>
                  <Text className="text-ui-fg-subtle">{ticket.email}</Text>
                </div>
                <div>
                  <Text size="small" weight="plus">
                    Topic
                  </Text>
                  <Text>{TOPIC_LABELS[ticket.topic] ?? ticket.topic}</Text>
                </div>
                <div>
                  <Text size="small" weight="plus">
                    Order number
                  </Text>
                  <Text>{ticket.order_display_id || "Not provided"}</Text>
                </div>
                <div>
                  <Text size="small" weight="plus">
                    Ticket ID
                  </Text>
                  <Text className="font-mono text-sm">{ticket.id}</Text>
                </div>
              </div>

              <div>
                <Text size="small" weight="plus">
                  Original message
                </Text>
                <Text className="mt-1 whitespace-pre-wrap rounded-lg bg-ui-bg-subtle p-4">
                  {ticket.message}
                </Text>
              </div>
            </section>

            <section className="flex flex-col gap-3">
              <Heading level="h2">Replies</Heading>

              {replies.length === 0 ? (
                <Text className="text-ui-fg-subtle">
                  No replies yet. Send the first response below.
                </Text>
              ) : (
                <div className="flex flex-col gap-3">
                  {replies.map((reply) => (
                    <div
                      key={reply.id}
                      className="rounded-lg border border-ui-border-base p-4"
                    >
                      <Text size="small" className="text-ui-fg-subtle">
                        {formatDate(reply.created_at)}
                      </Text>
                      <Text className="mt-2 whitespace-pre-wrap">
                        {reply.message}
                      </Text>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {!isClosed && (
              <section className="flex flex-col gap-3">
                <Heading level="h2">Send reply</Heading>
                <Textarea
                  value={replyMessage}
                  onChange={(event) => setReplyMessage(event.target.value)}
                  placeholder="Write your reply to the customer..."
                  rows={6}
                />
                <div>
                  <Button
                    isLoading={replyMutation.isPending}
                    disabled={!replyMessage.trim()}
                    onClick={() => replyMutation.mutate(replyMessage.trim())}
                  >
                    Send reply
                  </Button>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </Container>
  )
}

export default CustomerServiceDetailPage
