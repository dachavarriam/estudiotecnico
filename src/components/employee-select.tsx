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
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { getEmployees } from "@/actions/odoo-actions"

interface Employee {
  id: number
  name: string
  job_title?: string
}

interface EmployeeSelectProps {
  value?: string // ID as string for consistency with form
  onSelect: (employeeId: string, employeeName?: string) => void
}

export function EmployeeSelect({ value, onSelect }: EmployeeSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [employees, setEmployees] = React.useState<Employee[]>([])
  const [query, setQuery] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true)
      const res = await getEmployees(query)
      if (res.success && res.data) {
        setEmployees(res.data)
      }
      setLoading(false)
    }

    const timer = setTimeout(() => {
      fetchEmployees()
    }, 500)

    return () => clearTimeout(timer)
  }, [query])

  const selectedEmployee = employees.find((emp) => String(emp.id) === value)

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
            ? (employees.find((emp) => String(emp.id) === value)?.name || 
               // Fallback if not in current list but selected (rare if list is dynamic)
               (selectedEmployee ? selectedEmployee.name : "Selecciona ingeniero..."))
            : "Selecciona ingeniero..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Buscar ingeniero..." onValueChange={setQuery} />
          <CommandList>
            {loading && <div className="p-2 text-sm text-muted-foreground">Cargando...</div>}
            {!loading && employees.length === 0 && <CommandEmpty>No encontrado.</CommandEmpty>}
            <CommandGroup>
              {employees.map((emp) => (
                <CommandItem
                  key={emp.id}
                  value={String(emp.id)}
                  onSelect={(currentValue) => {
                    onSelect(String(emp.id), emp.name)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === String(emp.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{emp.name}</span>
                    <span className="text-xs text-muted-foreground">{emp.job_title}</span>
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
