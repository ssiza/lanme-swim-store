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
import { useState, type Dispatch, type SetStateAction } from "react"
import {
  FOOTER_ABOUT_LINKS_METADATA_KEY,
  FOOTER_ABOUT_MAX_LENGTH,
  FOOTER_ABOUT_METADATA_KEY,
  FOOTER_ADDRESS_METADATA_KEY,
  FOOTER_LINKS_METADATA_KEY,
  FOOTER_SUPPORT_LINKS_METADATA_KEY,
  clampFooterAbout,
  getFooterSettings,
  mergeStoreMetadata,
  serializeFooterLinks,
  type FooterLink,
} from "../../lib/footer-settings"

type StoreFooterWidgetProps = {
  data: HttpTypes.AdminStore
}

const emptyLink = (): FooterLink => ({ label: "", href: "" })

const LinkEditor = ({
  title,
  hint,
  links,
  onChange,
  onAdd,
  onRemove,
}: {
  title: string
  hint: string
  links: FooterLink[]
  onChange: (index: number, field: keyof FooterLink, value: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
}) => (
  <div className="flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <div>
        <Label>{title}</Label>
        <Text className="text-ui-fg-subtle text-small-regular">{hint}</Text>
      </div>
      <Button
        type="button"
        size="small"
        variant="secondary"
        onClick={onAdd}
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
            placeholder="Label"
            value={link.label}
            onChange={(event) => onChange(index, "label", event.target.value)}
          />
          <Input
            placeholder="URL or path (e.g. /customer-service)"
            value={link.href}
            onChange={(event) => onChange(index, "href", event.target.value)}
          />
          <Button
            type="button"
            size="small"
            variant="secondary"
            onClick={() => onRemove(index)}
          >
            <Trash />
          </Button>
        </div>
      ))}
    </div>
  </div>
)

const StoreFooterWidget = ({ data }: StoreFooterWidgetProps) => {
  const initial = getFooterSettings(
    data.metadata as Record<string, unknown> | null | undefined
  )

  const [about, setAbout] = useState(initial.about ?? "")
  const [address, setAddress] = useState(initial.address ?? "")
  const [links, setLinks] = useState<FooterLink[]>(
    initial.links.length > 0 ? initial.links : [emptyLink()]
  )
  const [supportLinks, setSupportLinks] = useState<FooterLink[]>(
    initial.support_links.length > 0 ? initial.support_links : [emptyLink()]
  )
  const [aboutLinks, setAboutLinks] = useState<FooterLink[]>(
    initial.about_links.length > 0 ? initial.about_links : [emptyLink()]
  )
  const [isSaving, setIsSaving] = useState(false)

  const makeLinkUpdaters = (
    setter: Dispatch<SetStateAction<FooterLink[]>>
  ) => ({
    update: (index: number, field: keyof FooterLink, value: string) => {
      setter((current) =>
        current.map((link, i) =>
          i === index ? { ...link, [field]: value } : link
        )
      )
    },
    add: () => setter((current) => [...current, emptyLink()]),
    remove: (index: number) => {
      setter((current) => {
        const next = current.filter((_, i) => i !== index)
        return next.length > 0 ? next : [emptyLink()]
      })
    },
  })

  const more = makeLinkUpdaters(setLinks)
  const support = makeLinkUpdaters(setSupportLinks)
  const aboutCol = makeLinkUpdaters(setAboutLinks)

  const handleSave = async () => {
    if (about.trim().length > FOOTER_ABOUT_MAX_LENGTH) {
      toast.error(`About must be ${FOOTER_ABOUT_MAX_LENGTH} characters or fewer`)
      return
    }

    setIsSaving(true)

    try {
      const metadata = mergeStoreMetadata(
        data.metadata as Record<string, unknown> | null | undefined,
        {
          [FOOTER_ABOUT_METADATA_KEY]: clampFooterAbout(about),
          [FOOTER_ADDRESS_METADATA_KEY]: address.trim(),
          [FOOTER_LINKS_METADATA_KEY]: serializeFooterLinks(links),
          [FOOTER_SUPPORT_LINKS_METADATA_KEY]:
            serializeFooterLinks(supportLinks),
          [FOOTER_ABOUT_LINKS_METADATA_KEY]: serializeFooterLinks(aboutLinks),
        }
      )

      const response = await fetch(`/admin/stores/${data.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ metadata }),
      })

      if (!response.ok) {
        throw new Error("Failed to update footer settings")
      }

      toast.success("Footer settings saved — storefront will refresh shortly")
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
            About text, address, and link columns on the storefront footer.
            These values replace any hardcoded defaults once saved.
          </Text>
        </div>
        <Button size="small" onClick={handleSave} isLoading={isSaving}>
          Save
        </Button>
      </div>

      <div className="flex flex-col gap-6 px-6 py-4">
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

        <LinkEditor
          title="Support links"
          hint="Shown in the Support column."
          links={supportLinks}
          onChange={support.update}
          onAdd={support.add}
          onRemove={support.remove}
        />

        <LinkEditor
          title="About links"
          hint="Shown in the About column."
          links={aboutLinks}
          onChange={aboutCol.update}
          onAdd={aboutCol.add}
          onRemove={aboutCol.remove}
        />

        <LinkEditor
          title="More links"
          hint="Optional extra column (Instagram, press, etc.)."
          links={links}
          onChange={more.update}
          onAdd={more.add}
          onRemove={more.remove}
        />

        <Text className="text-ui-fg-subtle text-small-regular">
          Use site paths like <code>/customer-service</code> or full URLs like{" "}
          <code>https://instagram.com/…</code>.
        </Text>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "store.details.after",
})

export default StoreFooterWidget
