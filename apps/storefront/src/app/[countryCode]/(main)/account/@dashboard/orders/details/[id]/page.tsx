import { redirect } from "next/navigation"

type Props = {
  params: Promise<{ countryCode: string; id: string }>
}

export default async function LoginOrderDetailRedirect(props: Props) {
  const params = await props.params

  redirect(`/${params.countryCode}/orders/${params.id}`)
}
