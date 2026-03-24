"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FeedbackModalProps {
  children: React.ReactNode;
}

export function FeedbackModal({ children }: FeedbackModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("mejora");
  const [description, setDescription] = useState("");
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      // POST to N8N Webhook 
      const webhookUrl = "https://n8n.wembla.com/webhook/tashubbeta-error"; 
      
      const payload = {
        type,
        description,
        timestamp: new Intl.DateTimeFormat('es-HN', { 
           weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
           hour: '2-digit', minute: '2-digit', hour12: true 
        }).format(new Date()),
        url: window.location.href,
        userAgent: navigator.userAgent
      };

      // Since N8N/Make webhooks usually accept no-cors or simple POSTs
      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      // Show success
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        setDescription("");
      }, 3000);
    } catch (err: any) {
      console.error("Webhook error:", err);
      setErrorMsg("Ocurrió un error al enviar. El webhook podría requerir configuración.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reportar Fallas o Mejoras</DialogTitle>
          <DialogDescription>
            Ayúdanos a mejorar TAS Hub. Tu reporte será enviado directamente al equipo de desarrollo actual.
          </DialogDescription>
        </DialogHeader>
        
        {success ? (
          <div className="py-6 flex flex-col items-center justify-center text-green-600 gap-2">
            <span className="material-symbols-outlined text-5xl">check_circle</span>
            <p className="font-bold">¡Reporte enviado exitosamente!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Reporte</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="falla">Reportar Falla (Bug)</SelectItem>
                  <SelectItem value="mejora">Sugerir Mejora</SelectItem>
                  <SelectItem value="duda">Duda / Comentario</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción</label>
              <Textarea 
                placeholder="Describe la falla o mejora con el mayor detalle posible..."
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-red-500 font-medium">{errorMsg}</p>
            )}

            <DialogFooter className="sm:justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || !description.trim()}>
                {loading ? "Enviando..." : "Enviar Reporte"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
