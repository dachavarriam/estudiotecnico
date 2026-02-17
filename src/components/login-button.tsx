
import { signIn } from "@/auth"
import { Button } from "@/components/ui/button"
import { Slack } from "lucide-react"

export function LoginButton() {
  return (
    <form
      action={async () => {
        "use server"
        await signIn("slack", { redirectTo: "/dashboard" })
      }}
    >
      <Button className="w-full bg-[#4A154B] hover:bg-[#361137] text-white">
        <Slack className="mr-2 h-4 w-4" /> Iniciar Sesión con Slack
      </Button>
    </form>
  )
}
