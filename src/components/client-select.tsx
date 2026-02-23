"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList, // Import CommandList to fix hydration/structure errors
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { getClients } from "@/actions/odoo-actions"

interface Client {
  id: number
  name: string
  street?: string
  city?: string
}

interface ClientSelectProps {
  value?: number
  onSelect: (clientId: number, clientName?: string) => void
}

export function ClientSelect({ value, onSelect }: ClientSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [clients, setClients] = React.useState<Client[]>([])
  const [query, setQuery] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  // Fetch clients on query change (debounce ideally, but useEffect for now)
  React.useEffect(() => {
    const fetchClients = async () => {
      setLoading(true)
      const res = await getClients(query)
      if (res.success && res.data) {
        setClients(res.data)
      }
      setLoading(false)
    }

    const timer = setTimeout(() => {
      fetchClients()
    }, 500)

    return () => clearTimeout(timer)
  }, [query])

  const selectedClient = clients.find((client) => client.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? clients.find((client) => client.id === value)?.name || "Select client..."
            : "Select client..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command shouldFilter={false}> 
          {/* We handle filtering via API search */}
          <CommandInput placeholder="Search client..." onValueChange={setQuery} />
          <CommandList> 
            {loading && <div className="p-2 text-sm text-muted-foreground">Loading...</div>}
            {!loading && clients.length === 0 && <CommandEmpty>No client found.</CommandEmpty>}
            <CommandGroup>
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={String(client.id)}
                  onSelect={(currentValue) => {
                    onSelect(client.id, client.name)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === client.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{client.name}</span>
                    <span className="text-xs text-muted-foreground">{client.street}, {client.city}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
