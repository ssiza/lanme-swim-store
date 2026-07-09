import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChatBubbleLeftRight } from "@medusajs/icons"
import {
  Badge,
  Container,
  Heading,
  Table,
  Text,
} from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { Link } from "react-router-dom"
import { sdk } from "../../lib/sdk"

type SupportTicket = {
  id: string
  name: string
  email: string
  order_display_id?: string | null
  topic: string
  status: "open" | "replied" | "closed"
  created_at?: string
}

type TicketsResponse = {
  tickets: SupportTicket[]
  count: number
  limit: number
  offset: number
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

const STATUS_COLOR: Record<SupportTicket["status"], "green" | "orange" | "grey"> =
  {
    open: "orange",
    replied: "green",
    closed: "grey",
  }

const formatDate = (value?: string) => {
  if (!value) {
    return "—"
  }

  return new Date(value).toLocaleString()
}

const CustomerServicePage = () => {
  const { data, isLoading, isError } = useQuery<TicketsResponse>({
    queryFn: () =>
      sdk.client.fetch(`/admin/customer-service`, {
        query: {
          limit: 50,
          offset: 0,
        },
      }),
    queryKey: ["customer-service-tickets"],
  })

  const tickets = useMemo(() => data?.tickets ?? [], [data?.tickets])

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">Customer Service</Heading>
      </div>

      <div className="px-6 py-4">
        {isLoading && <Text>Loading support tickets...</Text>}

        {isError && (
          <Text className="text-ui-fg-error">
            Failed to load support tickets.
          </Text>
        )}

        {!isLoading && !isError && tickets.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Heading level="h2">No support tickets yet</Heading>
            <Text className="text-ui-fg-subtle">
              Customer requests from the storefront will appear here.
            </Text>
          </div>
        )}

        {!isLoading && !isError && tickets.length > 0 && (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Topic</Table.HeaderCell>
                <Table.HeaderCell>Customer</Table.HeaderCell>
                <Table.HeaderCell>Order</Table.HeaderCell>
                <Table.HeaderCell>Created</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {tickets.map((ticket) => (
                <Table.Row
                  key={ticket.id}
                  className="cursor-pointer"
                  asChild
                >
                  <Link to={`/customer-service/${ticket.id}`}>
                    <Table.Cell>
                      <Badge color={STATUS_COLOR[ticket.status]} size="2xsmall">
                        {ticket.status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      {TOPIC_LABELS[ticket.topic] ?? ticket.topic}
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex flex-col">
                        <Text size="small" weight="plus">
                          {ticket.name}
                        </Text>
                        <Text size="small" className="text-ui-fg-subtle">
                          {ticket.email}
                        </Text>
                      </div>
                    </Table.Cell>
                    <Table.Cell>{ticket.order_display_id || "—"}</Table.Cell>
                    <Table.Cell>{formatDate(ticket.created_at)}</Table.Cell>
                  </Link>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Customer Service",
  icon: ChatBubbleLeftRight,
})

export default CustomerServicePage
