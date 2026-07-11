import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Plus, Trash } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useState } from "react"
import {
  FOOTER_ABOUT_MAX_LENGTH,
  FOOTER_ABOUT_METADATA_KEY,
  FOOTER_ADDRESS_METADATA_KEY,
  FOOTER_LINKS_METADATA_KEY,
  clampFooterAbout,
  getFooterSettings,
  serializeFooterLinks,
  type FooterLink,
} from "../../lib/footer-settings"

type StoreFooterWidgetProps = {
  data: HttpTypes.AdminStore
}

const emptyLink = (): FooterLink => ({ label: "", href: "" })

const StoreFooterWidget = ({ data }: StoreFooterWidgetProps) => {
  const initial = getFooterSettings(
    data.metadata as Record<string, unknown> | null | undefined
  )

  const [about, setAbout] = useState(initial.about ?? "")
  const [address, setAddress] = useState(initial.address ?? "")
  const [links, setLinks] = useState<FooterLink[]>(
    initial.links.length > 0 ? initial.links : [emptyLink()]
  )
  const [isSaving, setIsSaving] = useState(false)

  const updateLink = (index: number, field: keyof FooterLink, value: string) => {
    setLinks((current) =>
      current.map((link, i) => (i === index ? { ...link, [field]: value } : link))
    )
  }

  const addLink = () => {
    setLinks((current) => [...current, emptyLink()])
  }

  const removeLink = (index: number) => {
    setLinks((current) => {
      const next = current.filter((_, i) => i !== index)
      return next.length > 0 ? next : [emptyLink()]
    })
  }

  const handleSave = async () => {
    if (about.trim().length > FOOTER_ABOUT_MAX_LENGTH) {
      toast.error(`About must be ${FOOTER_ABOUT_MAX_LENGTH} characters or fewer`)
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch(`/admin/stores/${data.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          metadata: {
            [FOOTER_ABOUT_METADATA_KEY]: clampFooterAbout(about),
            [FOOTER_ADDRESS_METADATA_KEY]: address.trim(),
            [FOOTER_LINKS_METADATA_KEY]: serializeFooterLinks(links),
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update footer settings")
      }

      toast.success("Footer settings saved")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save footer settings"
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Storefront Footer</Heading>
          <Text className="text-ui-fg-subtle text-small-regular mt-1">
            About text, address, and extra links shown in the storefront footer.
          </Text>
        </div>
        <Button size="small" onClick={handleSave} isLoading={isSaving}>
          Save
        </Button>
      </div>

      <div className="flex flex-col gap-4 px-6 py-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="footer-about">About</Label>
            <Text className="text-ui-fg-muted text-small-regular">
              {about.length}/{FOOTER_ABOUT_MAX_LENGTH}
            </Text>
          </div>
          <Textarea
            id="footer-about"
            rows={4}
            maxLength={FOOTER_ABOUT_MAX_LENGTH}
            value={about}
            onChange={(event) =>
              setAbout(event.target.value.slice(0, FOOTER_ABOUT_MAX_LENGTH))
            }
            placeholder="A short blurb about your brand for the footer."
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="footer-address">Address</Label>
          <Textarea
            id="footer-address"
            rows={3}
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder={"123 Ocean Ave\nMiami, FL 33139\nUnited States"}
          />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label>More links</Label>
            <Button
              type="button"
              size="small"
              variant="secondary"
              onClick={addLink}
              disabled={links.length >= 8}
            >
              <Plus />
              Add link
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            {links.map((link, index) => (
              <div key={index} className="flex flex-col gap-2 sm:flex-row">
                <Input
                  placeholder="Label (e.g. About)"
                  value={link.label}
                  onChange={(event) =>
                    updateLink(index, "label", event.target.value)
                  }
                />
                <Input
                  placeholder="URL or path (e.g. /customer-service)"
                  value={link.href}
                  onChange={(event) =>
                    updateLink(index, "href", event.target.value)
                  }
                />
                <Button
                  type="button"
                  size="small"
                  variant="secondary"
                  onClick={() => removeLink(index)}
                >
                  <Trash />
                </Button>
              </div>
            ))}
          </div>

          <Text className="text-ui-fg-subtle text-small-regular">
            Use site paths like <code>/customer-service</code> or full URLs like{" "}
            <code>https://instagram.com/…</code>.
          </Text>
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "store.details.after",
})

export default StoreFooterWidget
