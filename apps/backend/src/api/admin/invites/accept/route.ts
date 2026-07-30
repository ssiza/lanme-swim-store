import { acceptInviteWorkflow } from "@medusajs/core-flows"
import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { HttpTypes, InviteWorkflow } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"

/**
 * Override of Medusa's accept-invite route.
 *
 * The core handler maps every failure to `{ message: "Unauthorized" }`, which
 * makes invite account creation look broken without a usable reason. This
 * route surfaces the underlying error (expired token, email conflict, etc.).
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminGetInviteAcceptParams>,
  res: MedusaResponse<HttpTypes.AdminAcceptInviteResponse | { message: string }>
) => {
  if (req.auth_context?.actor_id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "You are already signed in. Sign out, then open the invite link again to create your account."
    )
  }

  if (!req.auth_context?.auth_identity_id) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Missing registration session. Submit the invite form again to create your password, then retry."
    )
  }

  const inviteToken = (req.filterableFields?.token ||
    (req.query?.token as string | undefined)) as string | undefined

  if (!inviteToken) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Invite token is missing from the URL. Open the invite link from your email and try again."
    )
  }

  const input = {
    invite_token: inviteToken,
    auth_identity_id: req.auth_context.auth_identity_id,
    user: req.validatedBody,
  } as InviteWorkflow.AcceptInviteWorkflowInputDTO

  try {
    const { result: users } = await acceptInviteWorkflow(req.scope).run({
      input,
    })

    res.status(200).json({ user: users[0] })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to accept invite."

    // Expired / invalid tokens and email conflicts are the usual failures.
    if (/token|invite|expired|invalid/i.test(message)) {
      throw new MedusaError(
        MedusaError.Types.UNAUTHORIZED,
        "This invite link is invalid or has expired. Ask an admin to resend the invite, then use the newest email."
      )
    }

    if (/exist|unique|duplicate/i.test(message)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "An admin account with this email already exists. Sign in instead, or ask an admin to remove the existing user and resend the invite."
      )
    }

    throw new MedusaError(MedusaError.Types.INVALID_DATA, message)
  }
}

export const AUTHENTICATE = false
