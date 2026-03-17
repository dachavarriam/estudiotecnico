"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ClientSelect } from "@/components/client-select"
import { EmployeeSelect } from "@/components/employee-select"
import { createTechnicalStudy } from "@/actions/study-actions"
import { getEmployees } from "@/actions/odoo-actions"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
  visitType: z.string(),
  visitDate: z.string().optional(),
  categories: z.array(z.string()).optional(),
  directorFiles: z.any().optional(), // Holds FileList
})

export default function NewStudyForm() {
  const router = useRouter()
  // We keep the state for engineers array if needed for fallback, 
  // though primarily we rely on the Select component's search now.
  const [engineers, setEngineers] = useState<{ id: number; name: string }[]>([]) 
  const [selectedClientName, setSelectedClientName] = useState('');
  const [selectedEngineerName, setSelectedEngineerName] = useState('');
  
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [uploadStatus, setUploadStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      visitType: "Visita Técnica",
      clientId: 0, 
      engineerId: "",
      visitDate: "",
    },
  })

  // Initial load of some engineers (optional, good for default list)
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
    setSubmitStatus('loading');
    setErrorMessage('');
    
    // Fallback logic to find name if not captured by onSelect (unlikely with current UI but safe)
    // Fallback logic 
    const finalEngineerName = selectedEngineerName || engineers.find(e => e.id.toString() === values.engineerId)?.name || values.engineerId;
    const finalClientName = selectedClientName || `Client #${values.clientId}`;
    console.log("Submitting with Client Name:", finalClientName); // Debug log in client console

    // Handle File Uploads
    let uploadedAttachments = null;
    if (values.directorFiles && values.directorFiles.length > 0) {
        setUploadStatus('Subiendo archivos...');
        try {
            const formData = new FormData();
            // Append each file (FileList acts like array but use loop)
            for (let i = 0; i < values.directorFiles.length; i++) {
                formData.append('file', values.directorFiles[i]);
            }
            
            // We reuse uploadStudyImage or create a generic upload action. 
            // uploadStudyImage calls nocodb.upload which is generic enough.
            const { uploadStudyImage } = await import('@/actions/study-actions');
            const uploadRes = await uploadStudyImage(formData);
            
            if (uploadRes.success && uploadRes.data) {
                uploadedAttachments = uploadRes.data; // Array of attachment objects
            } else {
                console.error("Upload failed but proceeding without files:", uploadRes.error);
                setErrorMessage("Error subiendo archivos, pero intentando crear estudio...");
            }
        } catch (e) {
            console.error("File upload error:", e);
        }
    }

    setUploadStatus('');

    try {
        const result = await createTechnicalStudy({ 
            ...values, 
            directorFiles: uploadedAttachments, // Pass attachments array
            engineerName: finalEngineerName,
            clientName: finalClientName
        })
        if (result.success) {
            router.push("/dashboard?success=true"); 
        } else {
            setSubmitStatus('error');
            setErrorMessage(result.error || "Error desconocido al crear el estudio.");
        }
    } catch (e) {
        setSubmitStatus('error');
        setErrorMessage("Error de conexión o servidor.");
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <h1 className="text-2xl font-bold mb-6">Nuevo Estudio Técnico</h1>
      
      {submitStatus === 'error' && (
          <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título / Referencia</FormLabel>
                <FormControl>
                  <Input placeholder="Revisión de Cámaras Sucursal 1" {...field} disabled={submitStatus === 'loading'} />
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
                <ClientSelect 
                    value={field.value} 
                    onSelect={(id, name) => {
                        field.onChange(id);
                        if(name) setSelectedClientName(name);
                    }} 
                />
                <FormDescription>
                  Busca el cliente en Odoo.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="visitType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Estudio</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Visita Técnica">Visita Técnica</SelectItem>
                        <SelectItem value="Remoto/Plano">Remoto / Plano</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="visitDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Visita</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
          </div>

          <FormField
            control={form.control}
            name="engineerId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Ingeniero Asignado (Odoo)</FormLabel>
                <EmployeeSelect 
                    value={field.value} 
                    onSelect={(id, name) => {
                        field.onChange(id);
                        if(name) setSelectedEngineerName(name);
                    }} 
                 />
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
                    disabled={submitStatus === 'loading'}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="directorFiles"
            render={({ field: { value, onChange, ...fieldProps } }) => (
              <FormItem>
                <FormLabel>Archivos de Referencia (Opcional)</FormLabel>
                <FormControl>
                  <Input 
                    {...fieldProps}
                    type="file" 
                    multiple
                    disabled={submitStatus === 'loading'}
                    onChange={(event) => {
                      onChange(event.target.files);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Suba planos, PDFs o documentos de ayuda para el ingeniero.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button type="button" variant="outline" className="w-full sm:w-1/2 order-2 sm:order-1" onClick={() => router.push('/dashboard')} disabled={submitStatus === 'loading'}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitStatus === 'loading'} className="w-full sm:w-1/2 order-1 sm:order-2">
              {submitStatus === 'loading' ? (uploadStatus || 'Creando...') : 'Crear y Asignar'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
