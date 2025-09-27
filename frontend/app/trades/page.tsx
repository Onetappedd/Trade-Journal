import { getUserOrRedirect } from "@/lib/auth/getUserOrThrow"
import TradesClient from "./trades-client"

export default async function TradesPage() {
  // Server-side authentication check
  const user = await getUserOrRedirect('/trades')
  
  return <TradesClient />
}