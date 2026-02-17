"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ClientSelect } from "@/components/client-select"
import { EmployeeSelect } from "@/components/employee-select"
import { createTechnicalStudy } from "@/actions/study-actions"
import { getEmployees } from "@/actions/odoo-actions"

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  clientId: z.number({
    message: "Please select a client.",
  }).min(1, "Please select a client."),
  engineerId: z.string({
    message: "Please select an engineer.",
  }).min(1, "Please select an engineer."),
  description: z.string().optional(),
})

export default function NewStudyForm() {
  const router = useRouter()
  const [engineers, setEngineers] = useState<{ id: number; name: string }[]>([]) // Changed ID to number for Odoo

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  })

  useEffect(() => {
    async function loadEngineers() {
      const res = await getEmployees()
      if (res.success && res.data) {
        setEngineers(res.data)
      }
    }
    loadEngineers()
  }, [])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Submit data to server action
    const result = await createTechnicalStudy(values)
    if (result.success) {
      alert("Technical Study created! ID: " + result.id)
      // router.push("/director")
    } else {
      alert("Error creating study")
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <h1 className="text-2xl font-bold mb-6">Nuevo Estudio Técnico</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título / Referencia</FormLabel>
                <FormControl>
                  <Input placeholder="Revisión de Cámaras Sucursal 1" {...field} />
                </FormControl>
                <FormDescription>
                  Un nombre corto para identificar el trabajo.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Cliente (Odoo)</FormLabel>
                <ClientSelect value={field.value} onSelect={field.onChange} />
                <FormDescription>
                  Busca el cliente en Odoo.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="engineerId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Ingeniero Asignado (Odoo)</FormLabel>
                <EmployeeSelect value={field.value} onSelect={field.onChange} />
                <FormDescription>
                  Busca el ingeniero en Odoo.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción Inicial / Notas</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Detalles iniciales..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit">Crear y Asignar</Button>
        </form>
      </Form>
    </div>
  )
}
