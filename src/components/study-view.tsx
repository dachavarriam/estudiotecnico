'use client';

import { useState, use, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { AudioRecorder } from '@/components/audio-recorder';
import { transcribeAudio, extractDataFromText } from '@/actions/voice-actions';
import { Loader2, CheckCircle, Save, Plus, Trash2, Mic, FileText, Image as ImageIcon, Upload, ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { saveStudyDetails, uploadStudyImage, getStudyActivity, addStudyActivity, createStudyVersion, getStudyVersions, followStudy, unfollowStudy, checkIsFollowing } from '@/actions/study-actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Bell, History, Check, ChevronsUpDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useRouter } from 'next/navigation';
import { StudyItemsTable } from '@/components/study-items-table';
import { STUDY_STATUS_MAP } from '@/lib/constants';

interface Note {
  id: string;
  transcription: string;
  timestamp: number;
  file?: Blob;
  isNew?: boolean;
  audioUrl?: string;
}

interface ExtractedItem {
  item: string;
  quantity: number;
  unit?: string;
  category?: 'equipment' | 'supply' | 'labor';
  relatedImageTag?: string;
  description?: string;
  // New pricing fields
  price?: number;
  total?: number;
  source?: 'odoo' | 'local' | 'manual';
  odoo_product_id?: number | string;
}

interface SiteImage {
    id: string;
    url: string;
    tag: string; // e.g., "Entrada Principal"
    file: File | null;
}

// ... imports

export function StudyView({ id, initialData, userRole, prevId, nextId, currentUser, isCollaborator = false }: { id: string, initialData: any, userRole: string, prevId?: string, nextId?: string, currentUser?: any, isCollaborator?: boolean }) {
  // const { id } = use(params); // No longer needed
  
  // isEditMode and readOnly logic moved below status declaration


  const [notes, setNotes] = useState<Note[]>(initialData.notes || []); // Need to map this correctly if structure differs
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Versions & Followers (Phase 5)
  const [versions, setVersions] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLinkId, setFollowLinkId] = useState<string | number | null>(null);
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');
  
  useEffect(() => {
      // Load Meta (Follow status, Versions)
      const loadMeta = async () => {
          if (currentUser?.id) {
             const fRes = await checkIsFollowing(id, currentUser.id);
             setFollowLinkId(fRes.linkId);
             setIsFollowing(!!fRes.isFollowing);
          }
          
          const vRes = await getStudyVersions(id);
          if (vRes.success) setVersions(vRes.data);
      };
      loadMeta();
  }, [id, currentUser?.id]);

  const handleFollowToggle = async () => {
      setIsProcessing(true);
      if (isFollowing && followLinkId) {
          await unfollowStudy(followLinkId);
          setIsFollowing(false);
          setFollowLinkId(null);
      } else if (currentUser?.id) {
          await followStudy(id, currentUser.id);
          setIsFollowing(true);
          // Re-fetch to get ID? Or just assume true and next load gets ID. 
          // Ideally fetch ID.
          const fRes = await checkIsFollowing(id, currentUser.id);
          setFollowLinkId(fRes.linkId);
      }
      setIsProcessing(false);
  };

  const handleCreateVersion = async () => {
      if (!newVersionName.trim()) return;
      setIsProcessing(true);
      setStatusMessage('Guardando versión...');
      
      // Snapshot of current visual state (or initialData + current state changes)
      // Best to save the *current state being edited*
      const snapshot = {
           materials, labor, actions, comments, images: images.map(i => i.tag), // Minimal ref
           instructions, fieldNotes, visitDate, visitType, status: initialData.status
      };
      
      const res = await createStudyVersion(id, newVersionName, snapshot, currentUser?.name);
      if (res.success) {
          setVersionDialogOpen(false);
          setNewVersionName('');
          // Refresh list
          const vRes = await getStudyVersions(id);
          if (vRes.success) setVersions(vRes.data);
          alert('Versión guardada correctamente.');
      } else {
          alert('Error al guardar versión: ' + res.error);
      }
      setIsProcessing(false);
  };
  
  // Data
  const [materials, setMaterials] = useState<ExtractedItem[]>(initialData.items?.filter((i: any) => i.category !== 'labor') || []);
  const [labor, setLabor] = useState<ExtractedItem[]>(initialData.items?.filter((i: any) => i.category === 'labor') || []);
  
  const [actions, setActions] = useState<string[]>(initialData.actions || []);
  const [comments, setComments] = useState<string[]>(initialData.comments || []);
  
  const initialStatus = initialData.status || initialData.Status || 'draft';
  const [status, setStatus] = useState(initialStatus);
  
  // Permissions Logic
  const normalizedRole = String(userRole || '').toLowerCase();
  const isAdmin = ['director', 'admin', 'superadmin', 'manager'].includes(normalizedRole);
  // Only explicitly assigned engineers OR active followers can edit, AND only when the study is in progress
  const canEditState = isCollaborator && initialStatus === 'in_progress';
  const [isEditMode, setIsEditMode] = useState<boolean>(canEditState);
  const effectiveReadOnly = !isEditMode;
  
  useEffect(() => {
     setIsEditMode(isCollaborator && status === 'in_progress');
  }, [status, isCollaborator]);
  const [clientName, setClientName] = useState(initialData.client_name || initialData.ClientName || 'Cliente General');
  
  // New Fields (Phase 2)
  const [location, setLocation] = useState(initialData.location || '');
  
  // Contact Info Parsing
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactInfo, setContactInfo] = useState(initialData.contact_info || '');
  
  useEffect(() => {
     if (initialData.contact_info) {
         const parts = initialData.contact_info.split(" - ");
         if (parts.length > 1) {
             setContactName(parts[0]);
             setContactPhone(parts[1]);
         } else {
             setContactName(initialData.contact_info);
         }
     }
  }, [initialData]);

  // New Fields (Phase 4)
  const [visitDate, setVisitDate] = useState(initialData.visit_date || '');
  const [visitType, setVisitType] = useState(initialData.visit_type || 'Visita Técnica');
  const [directorFiles, setDirectorFiles] = useState(initialData.director_files || []);
  const [engineerPlans, setEngineerPlans] = useState<any[]>(initialData.engineer_plans || []);
  const [estimatedHours, setEstimatedHours] = useState(initialData.estimated_hours || '');
  const [estimatedTechnicians, setEstimatedTechnicians] = useState(initialData.estimated_technicians || '');
  const [estimatedEngineers, setEstimatedEngineers] = useState(initialData.estimated_engineers || '');
  const [scheduleType, setScheduleType] = useState(initialData.schedule_type || 'Ordinario');

  // Multi-select categories
  const [openCategoryDropdown, setOpenCategoryDropdown] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
      initialData.categories 
          ? (Array.isArray(initialData.categories) ? initialData.categories : initialData.categories.split(','))
          : []
  );

  const toggleCategory = (cat: string) => {
      setSelectedCategories(prev => 
          prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
      );
  };
  
  const CATEGORY_OPTIONS = ['Cableado Estructurado', 'CCTV', 'Control de Acceso', 'Detección de Incendio', 'Alarma de Intrusión', 'Fibra Óptica', 'Enlace Inalámbrico', 'Redes / Networking', 'Energía / UPS', 'Audio / Video', 'Automatización', 'Mantenimiento', 'Levantamiento General', 'Otro'];

  // Separation of Instructions and Field Notes
  const [instructions, setInstructions] = useState('');
  const [fieldNotes, setFieldNotes] = useState('');

  useEffect(() => {
      const fullText = initialData.site_observations || initialData.SiteObservations || initialData['Site Observations'] || '';
      
      if (fullText.includes('Título:')) {
          const parts = fullText.split('\n\n--- Notas de Campo ---\n');
          setInstructions(parts[0]);
          setFieldNotes(parts[1] || '');
      } else {
          // No standard header found, assuming all is field notes OR legacy instruction
          setInstructions('');
          setFieldNotes(fullText);
      }
  }, [initialData]);
  
  const plansInputRef = useRef<HTMLInputElement>(null);

  const handlePlanUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const newPlans = Array.from(e.target.files).map(file => ({
              id: Date.now().toString() + Math.random(),
              url: URL.createObjectURL(file), // For preview
              title: file.name,
              file: file, // Marker for upload
              mimetype: file.type
          }));
          setEngineerPlans(prev => [...prev, ...newPlans]);
      }
  };

  // ----- AUTOSAVE & RECOVERY SYSTEM (Phase 2.7) -----
  const [hasDraft, setHasDraft] = useState(false);

  // 1. Initial Load Check
  useEffect(() => {
      // We only offer recovery if they are actively working (in_progress)
      if (initialStatus === 'in_progress') {
          const draft = localStorage.getItem(`tas_study_draft_${id}`);
          if (draft) setHasDraft(true);
      }
  }, [id, initialStatus]);

  // 2. Continuous Autosave
  useEffect(() => {
      if (status !== 'in_progress') return; // Only cache active sessions
      if (hasDraft) return; // Prevent overwriting the draft before user decides to restore or discard
      
      const timer = setTimeout(() => {
          const draftData = {
              materials,
              // Strip blobs from notes to fit local storage limits
              notes: notes.map(n => ({ ...n, file: undefined })), 
              actions,
              comments,
              clientName,
              location,
              contactInfo,
              fieldNotes,
              instructions,
              selectedCategories,
              visitDate,
              visitType,
              estimatedHours,
              estimatedEngineers,
              estimatedTechnicians,
              scheduleType,
              timestamp: Date.now()
          };
          localStorage.setItem(`tas_study_draft_${id}`, JSON.stringify(draftData));
      }, 2000); // 2-second debounce
      return () => clearTimeout(timer);
  }, [materials, notes, actions, comments, clientName, location, contactInfo, fieldNotes, instructions, selectedCategories, visitDate, visitType, estimatedHours, estimatedEngineers, estimatedTechnicians, scheduleType, status, id, hasDraft]);

  const directorFileInputRef = useRef<HTMLInputElement>(null);

  const handleDirectorFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const newFiles = Array.from(e.target.files).map(file => ({
              id: Date.now().toString() + Math.random(),
              url: URL.createObjectURL(file), // For preview
              title: file.name,
              file: file, // Marker for upload
              mimetype: file.type
          }));
          setDirectorFiles((prev: any[]) => [...prev, ...newFiles]);
      }
  };
  
  // Fetch Data - REMOVED useEffect fetch, using initialData


    // Actions Handlers
    const addAction = () => setActions([...actions, ""]);
    const updateAction = (idx: number, val: string) => {
        const newActions = [...actions];
        newActions[idx] = val;
        setActions(newActions);
    };
    const removeAction = (idx: number) => setActions(actions.filter((_, i) => i !== idx));
  
  // Images
  const [images, setImages] = useState<SiteImage[]>(
      (initialData.images || []).map((img: any, i: number) => ({
          id: `past-image-${i}`,
          tag: img.tag,
          url: img.attachment_data, // Mapped to Proxy URL in getStudy
          file: null
      }))
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Activity / Chatter
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  
  useEffect(() => {
      // Load initial activity
      const loadActivity = async () => {
          const res = await getStudyActivity(id);
          if (res.success && res.data) {
              setActivityLog(res.data);
          }
      };
      loadActivity();
  }, [id]);

  const handleSendComment = async () => {
      if (!newComment.trim()) return;
      setIsProcessing(true);
      try {
          // Optimistic update
          const tempId = Date.now();
          const userName = currentUser?.name || 'Usuario';
          
          // Format message as it will be saved if we want consistent local display
          // But for local state, we can keep structured
          const tempMsg = { 
              Id: tempId, 
              full_comment: `[USER:${userName}] ${newComment}`, 
              CreatedAt: new Date().toISOString(),
              user_name: userName 
          };
          
          setActivityLog(prev => [...prev, tempMsg]);
          const commentToSend = newComment; // Keep ref before clearing
          setNewComment('');
          
          const res = await addStudyActivity(id, commentToSend, 'comment', userName);
          if (!res.success) {
              // Revert if failed (complex, just alert for now)
              alert('Falló el envío del comentario');
          } else {
              // Reload to get server timestamp/ID
               const refresh = await getStudyActivity(id);
               if(refresh.success) setActivityLog(refresh.data);
          }
      } catch (e) { console.error(e); }
      setIsProcessing(false);
  };
  
  const handleRecordingComplete = async (blob: Blob) => {
    setIsProcessing(true);
    setStatusMessage('Transcribiendo audio...');
    
    const formData = new FormData();
    formData.append('file', blob, 'voice-note.webm');
    
    const res = await transcribeAudio(formData);
    
    if (res.success && res.text) {
      const newNote: Note = {
        id: Date.now().toString(),
        transcription: res.text,
        timestamp: Date.now(),
        file: blob,
        isNew: true
      };
      
      setNotes((prev) => [...prev, newNote]);
      
      setStatusMessage('Analizando contenido...');
      const analysis = await extractDataFromText(res.text);
      
      if (analysis.success) {
        if (analysis.data.materials) {
            setMaterials(prev => {
                const newMaterials = [...prev];
                analysis.data.materials.forEach((m: any) => {
                    newMaterials.push({ ...m, category: m.category || 'supply' });
                });
                return newMaterials;
            });
        }
        if (analysis.data.actions) setActions(prev => [...prev, ...analysis.data.actions]);
        if (analysis.data.comments) setComments(prev => [...prev, ...analysis.data.comments]);
        
      } else {
        alert('Error analizando texto: ' + analysis.error);
      }
    } else {
      alert('Error transcribiendo: ' + res.error);
    }
    
    setIsProcessing(false);
  };

  const handleDeleteNote = (noteId: string) => {
    if (confirm('¿Borrar esta nota? (La información extraída se mantendrá)')) {
        setNotes(notes.filter(n => n.id !== noteId));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const newImage: SiteImage = {
              id: Date.now().toString(),
              url: URL.createObjectURL(file), // Preview URL
              tag: `Sitio ${images.length + 1}`,
              file: file
          };
          setImages([...images, newImage]);
      }
  };



// ... (inside component)

  const router = useRouter();

  const handleSaveStudy = async () => {
    setIsProcessing(true);
    setStatusMessage('Guardando estudio...');
    
    try {
        // 1. Upload Images if any
        const uploadedImages = [];
        for (const img of images) {
            if (img.file) {
                setStatusMessage(`Subiendo foto: ${img.tag}...`);
                const formData = new FormData();
                formData.append('file', img.file);
                const res = await uploadStudyImage(formData);
                if (res.success && res.data && res.data[0]) {
                    uploadedImages.push({
                        tag: img.tag,
                        attachment_data: res.data // Array of attachments
                    });
                }
            }
        }
        
        // 1.2 Upload Voice Notes Audio if any
        const newVoiceNotes = [];
        for (const note of notes) {
             if (note.isNew) {
                 if (note.file) {
                     setStatusMessage('Subiendo audio...');
                     const formData = new FormData();
                     formData.append('file', note.file, 'audio.webm');
                     const res = await uploadStudyImage(formData);
                     if (res.success && res.data && res.data[0]) {
                         // Fallback JSON URL or string mapping depending on structure
                         note.audioUrl = JSON.stringify(res.data);
                     }
                 }
                 newVoiceNotes.push(note);
             }
        }
        
        // 1.5 Upload Engineer Plans
        const finalPlans = [];
        // We need to keep existing plans (that don't have 'file') and add new ones (that have 'file')
        // But 'saveStudyDetails' updates the 'engineer_plans' column which is an Attachment field.
        // NocoDB Attachment update: we must provide the FULL list of attachments.
        
        for (const plan of engineerPlans) {
            if (plan.file) {
                 setStatusMessage(`Subiendo plano: ${plan.title}...`);
                 const formData = new FormData();
                 formData.append('file', plan.file);
                 const res = await uploadStudyImage(formData);
                 if (res.success && res.data && res.data[0]) {
                     finalPlans.push(res.data[0]); // NocoDB returns array of attachment objects
                 }
            } else {
                // Existing plan (already an attachment object)
                finalPlans.push(plan);
            }
        }

        // 1.6 Upload Director Files
        const finalDirectorFiles = [];
        for (const fileObj of directorFiles) {
            if (fileObj.file) {
                 setStatusMessage(`Subiendo archivo de director: ${fileObj.title}...`);
                 const formData = new FormData();
                 formData.append('file', fileObj.file);
                 const res = await uploadStudyImage(formData);
                 if (res.success && res.data && res.data[0]) {
                     finalDirectorFiles.push(res.data[0]); 
                 }
            } else {
                finalDirectorFiles.push(fileObj);
            }
        }

        setStatusMessage('Guardando datos...');

        const combinedContact = contactName || contactPhone ? `${contactName} - ${contactPhone}` : contactInfo;
        
        const studyData = {
            materials: materials,
            actions,
            comments,
            images: uploadedImages,
            notes: newVoiceNotes, // ONLY SEND NEW NOTES
            // New Fields
            location,
            contactInfo: combinedContact,
            categories: selectedCategories,
            siteObservations: instructions 
                ? `${instructions}\n\n--- Notas de Campo ---\n${fieldNotes}`
                : fieldNotes,
            engineerPlans: finalPlans,
            directorFiles: finalDirectorFiles,
            estimated_hours: estimatedHours,
            estimated_technicians: estimatedTechnicians,
            estimated_engineers: estimatedEngineers,
            schedule_type: scheduleType
        };

        const res = await saveStudyDetails(id, studyData);
        
        // Add Detailed Log
        try {
            const { addStudyActivity } = await import('@/actions/study-actions');
            const details = [];
            if (materials.length) details.push(`${materials.length} items`);
            if (actions.length) details.push(`${actions.length} tareas`);
            if (uploadedImages.length) details.push(`${uploadedImages.length} fotos nuevas`);
            const detailsStr = details.length ? ` (${details.join(', ')})` : '';
            await addStudyActivity(id, `Editó y guardó la información general del estudio${detailsStr}.`, 'comment', currentUser?.name);
        } catch (e) {
            console.error("No se pudo agregar el log de actividad", e);
        }
        
        if (res.success) {
            setStatus('review'); // Optimistic UI update
            
            // Critical Backend Fix: Clear the physical file blobs from UI 
            // so they don't get appended and uploaded twice if the user saves again!
            setImages(prev => prev.map(img => ({ ...img, file: null })));
            setNotes(prev => prev.map(note => ({ ...note, file: undefined, isNew: false })));
            setEngineerPlans((prev: any[]) => prev.map((plan: any) => ({ ...plan, file: undefined })));
            setDirectorFiles((prev: any[]) => prev.map((f: any) => ({ ...f, file: undefined })));
            
            // Discard draft immediately since NocoDB is now the master record
            localStorage.removeItem(`tas_study_draft_${id}`);
            
            alert('Estudio guardado exitosamente.');
            // router.push('/estudios/engineer'); // Optional redirect
        } else {
            alert('Error guardando: ' + res.error);
        }

    } catch (e) {
        console.error(e);
        alert('Error inesperado al guardar');
    } finally {
        setIsProcessing(false);
    }
  };

  const handleDownloadCSV = () => {
      const headers = ['Item', 'Descripción', 'Cantidad', 'Unidad', 'Categoría', 'Precio'];
      const rows = (materials || []).map((m: any) => [
          `"${(m.item || '').replace(/"/g, '""')}"`,
          `"${(m.description || '').replace(/"/g, '""')}"`,
          m.quantity,
          m.unit,
          m.category,
          m.price
      ]);
      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `estudio_${id}_materiales.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleDownloadPDF = async () => {
    setIsProcessing(true);
    setStatusMessage('Generando PDF...');

    const combinedContact = contactName || contactPhone ? `${contactName} - ${contactPhone}` : contactInfo;

    const pdfData = {
        id: initialData.study_identifier || id,
        client: initialData.client_name || 'Sin Cliente',
        engineer: initialData.action_user || currentUser?.name || 'Ingeniero',
        date: visitDate || new Date().toLocaleDateString(),
        materials,
        actions,
        comments: [], // Do not send audio-extracted comments to PDF as requested
        notes: notes.filter((n: any) => n.transcription).map((n: any) => n.transcription),
        location,
        contact_info: combinedContact,
        categories: selectedCategories,
        site_observations: fieldNotes,
        estimated_hours: String(estimatedHours),
        estimated_engineers: String(estimatedEngineers),
        estimated_technicians: String(estimatedTechnicians),
        schedule_type: scheduleType,
        visit_date: visitDate,
        visit_type: visitType,
        images: images.filter(img => img.url).map(img => ({
            tag: img.tag,
            url: img.url.startsWith('http') ? img.url : `${window.location.origin}${img.url}`
        })),
        engineer_plans: engineerPlans.map((p: any) => ({
            title: p.title,
            url: p.url?.startsWith('http') ? p.url : `${window.location.origin}${p.url}`
        })),
        director_files: directorFiles.map((p: any) => ({
            title: p.title,
            url: p.url?.startsWith('http') ? p.url : `${window.location.origin}${p.url}`
        }))
    };

    try {
        const response = await fetch('/api/pdf/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pdfData)
        });

        if (!response.ok) throw new Error('Error generating PDF');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Estudio-${initialData.study_identifier || id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('PDF error:', error);
        alert('Error al generar PDF');
    } finally {
        setIsProcessing(false);
    }
  };
  
    const loadDemoData = () => {
      setMaterials([
          { item: 'Cámara Bullet 4MP', quantity: 4, unit: 'und', category: 'equipment', description: 'Modelo X-100' },
          { item: 'Cable UTP Cat6', quantity: 150, unit: 'm', category: 'supply', description: 'Exterior' },
          { item: 'Jacks RJ45', quantity: 8, unit: 'und', category: 'supply', description: 'Categoría 6' }
      ]);
      setActions(['Instalar cámaras en perímetro', 'Configurar DVR']);
      setImages([
          { id: '1', url: 'https://placehold.co/600x400?text=Entrada', tag: 'Entrada Principal', file: null },
          { id: '2', url: 'https://placehold.co/600x400?text=Rack', tag: 'Cuarto de Datos', file: null }
      ]);
      alert('Datos demo cargados.');
  };


  return (

    <div className="w-full px-6 py-4 pb-20 bg-slate-50 min-h-screen">
      
      {/* Recovery Banner */}
      {hasDraft && (
          <div className="mb-6 bg-orange-100 border border-orange-300 text-orange-800 px-4 py-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm">
             <div className="mb-2 sm:mb-0">
               <p className="font-bold text-sm">Hay cambios sin guardar</p>
               <p className="text-xs">Se detectaron avances previos que no se subieron al servidor. ¿Deseas recuperarlos?</p>
             </div>
             <div className="flex gap-2">
               <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white" onClick={() => {
                   const draft = localStorage.getItem(`tas_study_draft_${id}`);
                   if(draft) {
                       try {
                           const data = JSON.parse(draft);
                           if(data.materials) setMaterials(data.materials);
                           if(data.notes) setNotes(data.notes);
                           if(data.actions) setActions(data.actions);
                           if(data.comments) setComments(data.comments);
                           if(data.clientName) setClientName(data.clientName);
                           if(data.location) setLocation(data.location);
                           if(data.contactInfo) setContactInfo(data.contactInfo);
                           if(data.fieldNotes) setFieldNotes(data.fieldNotes);
                           if(data.instructions) setInstructions(data.instructions);
                           if(data.selectedCategories) setSelectedCategories(data.selectedCategories);
                           if(data.visitDate) setVisitDate(data.visitDate);
                           if(data.visitType) setVisitType(data.visitType);
                           if(data.estimatedHours) setEstimatedHours(data.estimatedHours);
                           if(data.estimatedEngineers) setEstimatedEngineers(data.estimatedEngineers);
                           if(data.estimatedTechnicians) setEstimatedTechnicians(data.estimatedTechnicians);
                           if(data.scheduleType) setScheduleType(data.scheduleType);
                           setHasDraft(false);
                       } catch(e) { console.error("Error restoring draft:", e); }
                   }
               }}>Recuperar Textos</Button>
               <Button size="sm" variant="outline" className="border-orange-300 text-orange-800 hover:bg-orange-200 bg-white/50" onClick={() => {
                   if(confirm('¿Eliminar copia local? Los datos perdidos no se podrán recuperar.')) {
                       localStorage.removeItem(`tas_study_draft_${id}`);
                       setHasDraft(false);
                   }
               }}>Descartar</Button>
             </div>
          </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
            <div className="flex items-center gap-3">
                <div className="flex bg-white rounded-md border shadow-sm mr-2">
                    <Link href="/estudios">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 border-r rounded-none hover:bg-gray-50" title="Volver al Dashboard ET">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>

                </div>
                <div>
                    <h1 className="text-xl font-bold leading-none">{initialData.study_identifier || `Estudio #${id}`}</h1>
                    <span className="text-xs text-gray-400 font-mono">ID: {id}</span>
                </div>
            </div>
            <p className="text-gray-800 ml-[104px] mt-1"><span className="font-bold">Cliente:</span> {clientName}</p>
        </div>
        <div className="flex gap-2 items-center">
             
             <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                     <Button variant="outline" size="sm" className="hidden md:flex ml-2">
                         <Download className="w-4 h-4 mr-2" /> Exportar
                     </Button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent align="end" className="w-48">
                     <DropdownMenuLabel>Opciones de Exportación</DropdownMenuLabel>
                     <DropdownMenuSeparator />
                     <DropdownMenuItem onClick={handleDownloadPDF} disabled={isProcessing}>
                         PDF
                     </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => window.print()}>
                         Imprimir
                     </DropdownMenuItem>
                     <DropdownMenuItem onClick={handleDownloadCSV}>
                         CSV
                     </DropdownMenuItem>
                 </DropdownMenuContent>
             </DropdownMenu>

             {/* Versions & Follow Actions */}
             <div className="flex gap-1 ml-2 border-l pl-3">
                 <Button 
                    variant="ghost" 
                    size="sm" 
                    className={isFollowing ? "text-blue-600 bg-blue-50" : "text-gray-400"}
                    onClick={handleFollowToggle}
                    title={isFollowing ? "Dejar de seguir" : "Seguir estudio"}
                 >
                     <Bell className={`w-4 h-4 ${isFollowing ? "fill-current" : ""}`} />
                 </Button>
                 
                 <Dialog open={versionDialogOpen} onOpenChange={setVersionDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-600" title="Guardar Versión / Historial">
                            <History className="w-4 h-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Versiones del Estudio</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <Input 
                                    placeholder="Nombre de nueva versión (ej. 'Revisión Cliente')" 
                                    value={newVersionName}
                                    onChange={(e) => setNewVersionName(e.target.value)}
                                />
                                <Button onClick={handleCreateVersion} disabled={isProcessing}>
                                    <Check className="w-4 h-4 mr-2"/> Guardar
                                </Button>
                            </div>
                            
                            <div className="max-h-[300px] overflow-y-auto border rounded p-2 bg-gray-50">
                                <h4 className="text-sm font-bold text-gray-700 mb-2">Historial</h4>
                                {versions.length === 0 && <p className="text-xs text-gray-400">No hay versiones guardadas.</p>}
                                {versions.map((v: any, i) => (
                                    <div key={i} className="flex justify-between items-center p-2 border-b last:border-0 bg-white hover:bg-slate-50 text-sm">
                                        <div>
                                            <div className="font-bold">{v.version_name}</div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(v.CreatedAt).toLocaleString()} - {v.created_by}
                                            </div>
                                        </div>
                                        {/* Restore logic could go here later */}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </DialogContent>
                 </Dialog>
             </div>

             <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mr-2
                ${status === 'draft' ? 'bg-gray-200 text-gray-700' : ''}
                ${status === 'in_progress' ? 'bg-blue-100 text-blue-700' : ''}
                ${status === 'review' ? 'bg-yellow-100 text-yellow-800' : ''}
                ${status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                ${status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
            `}>
                {STUDY_STATUS_MAP[status] || status || 'Borrador'}
            </span>

             {isAdmin && !isEditMode && status !== 'approved' && (
                 <Button size="sm" variant="secondary" onClick={() => setIsEditMode(true)}>
                     Editar Estudio
                 </Button>
             )}

             {isAdmin && isEditMode && (
                 <Button size="sm" onClick={handleSaveStudy} disabled={isProcessing}>
                     <Save className="w-4 h-4 mr-2" /> Guardar Cambios Previos
                 </Button>
             )}
             
             {isAdmin && status === 'review' && (
                 <>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" disabled={isProcessing} onClick={async () => {
                        if(!confirm('¿Aprobar este estudio técnico?')) return;
                        setIsProcessing(true);
                        try {
                            const { approveStudy } = await import('@/actions/study-actions');
                            const res = await approveStudy(id);
                            if (res.success) {
                                setStatus('approved');
                                setIsEditMode(false);
                            } else {
                                alert('Error al aprobar: ' + res.error);
                            }
                        } catch { alert('Error al aprobar'); }
                        setIsProcessing(false);
                    }}>
                        <CheckCircle className="w-4 h-4 mr-2" /> Aprobar
                    </Button>
                    <Button size="sm" variant="destructive" disabled={isProcessing} onClick={async () => {
                        if(!confirm('¿Devolver este estudio al ingeniero?')) return;
                        setIsProcessing(true);
                        try {
                            const { rejectStudy } = await import('@/actions/study-actions');
                            const res = await rejectStudy(id);
                            if (res.success) {
                                setStatus('in_progress');
                            } else {
                                alert('Error al devolver: ' + res.error);
                            }
                        } catch { alert('Error al devolver'); }
                        setIsProcessing(false);
                    }}>
                        Devolver
                    </Button>
                 </>
             )}

             {isCollaborator && status === 'draft' && (
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={async () => {
                    if(!confirm('¿Iniciar levantamiento en sitio? Esto marcará la hora de inicio y habilitará el envío.')) return;
                    setIsProcessing(true);
                    try {
                        const { startStudy } = await import('@/actions/study-actions');
                        const res = await startStudy(id);
                        if(res.success) { 
                            setStatus('in_progress'); 
                            alert('Iniciado correctamente. Ahora puedes editar y enviar el estudio.'); 
                        } else {
                            alert('Error al iniciar: ' + res.error);
                        }
                    } catch(e) { alert('Error al iniciar'); }
                    setIsProcessing(false);
                }}>
                    <CheckCircle className="w-4 h-4 mr-2" /> Iniciar Estudio Tecnico
                </Button>
             )}
             
             {/* Removed redundant Export / Demo buttons */}
             
             {/* Navigation */}
             <div className="flex bg-white rounded-md border shadow-sm ml-2">
                 {prevId ? (
                    <Link href={`/estudios/engineer/study/${prevId}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 border-r rounded-none hover:bg-gray-50" title="Estudio Anterior">
                            <span className="text-xs font-bold">←</span>
                        </Button>
                    </Link>
                 ) : (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-300 border-r rounded-none" disabled>
                        <span className="text-xs font-bold">←</span>
                    </Button>
                 )}
                 {nextId ? (
                    <Link href={`/estudios/engineer/study/${nextId}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 rounded-none hover:bg-gray-50" title="Siguiente Estudio">
                            <span className="text-xs font-bold">→</span>
                        </Button>
                    </Link>
                 ) : (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-300 rounded-none" disabled>
                        <span className="text-xs font-bold">→</span>
                    </Button>
                 )}
             </div>

             {!effectiveReadOnly && status === 'in_progress' && (
                 <Button size="sm" onClick={handleSaveStudy}>
                    <Save className="w-4 h-4 mr-2" /> Guardar y Enviar a Revisión
                 </Button>
             )}
        </div>
      </div>
      
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-50 text-white backdrop-blur-sm">
          <Loader2 className="w-12 h-12 animate-spin mb-4" />
          <p className="font-medium animate-pulse">{statusMessage}</p>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {/* Top Row: General Info & Recorder Side-by-Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="h-full">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center"><FileText className="w-5 h-5 mr-2 text-blue-600"/> General</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {instructions && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-900 mb-4">
                            <h4 className="font-bold flex items-center mb-1"><FileText className="w-4 h-4 mr-2"/> Instrucciones / Asignación</h4>
                            <div className="whitespace-pre-line pl-6 mb-2">
                                {instructions}
                            </div>
                            
                            {/* Director Meta Data */}
                            <div className="mt-3 pt-3 border-t border-blue-200 grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <span className="font-bold text-blue-800 block">Tipo:</span>
                                    {visitType}
                                </div>
                                <div>
                                    <span className="font-bold text-blue-800 block">Fecha Programada:</span>
                                    {visitDate ? new Date(visitDate).toLocaleString() : 'No definida'}
                                </div>
                            </div>
                            
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-gray-500">Ubicación / Sitio</label>
                        <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ej: San Pedro Sula, Planta 2" disabled={effectiveReadOnly} />
                    </div>
                    <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-gray-500">Contacto en Sitio</label>
                            <Input value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} placeholder="Nombre y Teléfono" disabled={effectiveReadOnly} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-gray-500">Categorías</label>
                        <Popover open={openCategoryDropdown} onOpenChange={setOpenCategoryDropdown}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openCategoryDropdown}
                                    className="w-full justify-between font-normal h-auto min-h-10 text-left"
                                    disabled={effectiveReadOnly}
                                >
                                    <div className="flex flex-wrap gap-1 items-center">
                                        {selectedCategories.length === 0 && <span className="text-gray-500">Seleccione categorías...</span>}
                                        {selectedCategories.map((cat) => (
                                            <Badge key={cat} variant="secondary" className="mr-1 mb-1">
                                                {cat}
                                                {!effectiveReadOnly && (
                                                <div
                                                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-red-100 hover:text-red-500 cursor-pointer"
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            toggleCategory(cat);
                                                        }
                                                    }}
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                    }}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        toggleCategory(cat);
                                                    }}
                                                >
                                                    <X className="h-3 w-3" />
                                                </div>
                                                )}
                                            </Badge>
                                        ))}
                                    </div>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Buscar categoría..." />
                                    <CommandList>
                                        <CommandEmpty>No se encontró la categoría.</CommandEmpty>
                                        <CommandGroup>
                                            {CATEGORY_OPTIONS.map((cat) => (
                                                <CommandItem
                                                    key={cat}
                                                    value={cat}
                                                    onSelect={() => {
                                                        toggleCategory(cat);
                                                    }}
                                                >
                                                    <Check
                                                        className={`mr-2 h-4 w-4 ${
                                                            selectedCategories.includes(cat) ? "opacity-100" : "opacity-0"
                                                        }`}
                                                    />
                                                    {cat}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-gray-500">Notas / Observaciones</label>
                        <Textarea 
                            value={fieldNotes} 
                            onChange={(e) => setFieldNotes(e.target.value)} 
                            placeholder="Notas generales..." 
                            className="h-24 resize-none"
                            disabled={effectiveReadOnly}
                        />
                         <p className="text-[10px] text-gray-400">Puede agregar notas adicionales aquí abajo.</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-blue-100 shadow-sm h-full">
                <CardHeader className="pb-2"> <CardTitle className="text-lg flex items-center"><Mic className="w-5 h-5 mr-2 text-red-500"/> Notas de Voz</CardTitle> </CardHeader>
                <CardContent className="flex flex-col items-center pt-4 gap-4">
                    {!effectiveReadOnly && <AudioRecorder onRecordingComplete={handleRecordingComplete} />}
                    
                    <div className="w-full space-y-2 max-h-[300px] overflow-y-auto">
                        {notes.map((note) => (
                        <div key={note.id} className="bg-white border rounded p-3 text-sm flex gap-2 group flex-col">
                            <div className="flex justify-between items-start gap-2">
                                <p className="flex-1 text-gray-700">"{note.transcription}"</p>
                                {!effectiveReadOnly && (
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-300 group-hover:text-red-500 shrink-0" onClick={() => handleDeleteNote(note.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                            {note.audioUrl && (
                                <audio controls src={note.audioUrl} className="h-8 mt-2 w-full" />
                            )}
                            {note.file && !note.audioUrl && (
                                <audio controls src={URL.createObjectURL(note.file)} className="h-8 mt-2 w-full" />
                            )}
                        </div>
                        ))}
                         {notes.length === 0 && <p className="text-xs text-gray-400 text-center">Sin notas. Graba para extraer items automáticamente.</p>}
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Bottom Row: Full Width Items & Photos */}
        <div className="w-full">
            <Tabs defaultValue="items" className="w-full">
                <TabsList className="mb-4">
                <TabsTrigger value="items" className="flex-1"> <FileText className="w-4 h-4 mr-2"/> Equipos y Suministros</TabsTrigger>
                <TabsTrigger value="plans" className="flex-1"> <FileText className="w-4 h-4 mr-2"/> Documentos</TabsTrigger>
                <TabsTrigger value="images" className="flex-1"> <ImageIcon className="w-4 h-4 mr-2"/> Fotografías ({images.length})</TabsTrigger>
                <TabsTrigger value="activity" className="flex-1"> <FileText className="w-4 h-4 mr-2"/> Actividad</TabsTrigger>
                </TabsList>
                
                {/* ITEMS TAB */}
                <TabsContent value="items" className="space-y-6">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0 pb-4">
                    <CardTitle className="text-lg">Equipos y Suministros</CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                    <StudyItemsTable 
                        items={materials} 
                        setItems={setMaterials} 
                        images={images.map(img => ({ id: img.id, tag: img.tag }))} 
                        readOnly={effectiveReadOnly}
                    />
                    
                    <div className="mt-8 bg-slate-50 border rounded-lg p-4">
                        <h3 className="text-md font-bold text-gray-700 mb-4 flex items-center">
                            <FileText className="w-4 h-4 mr-2" /> Estimación de Mano de Obra
                        </h3>
                        {/* Engineer Input Fields for Labor */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-gray-500">Cantidad Ingenieros</label>
                                <Input type="number" min="0" value={estimatedEngineers} onChange={e => setEstimatedEngineers(e.target.value)} disabled={effectiveReadOnly && status !== 'draft' && status !== 'in_progress'} className="bg-white"/>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-gray-500">Cantidad Técnicos</label>
                                <Input type="number" min="0" value={estimatedTechnicians} onChange={e => setEstimatedTechnicians(e.target.value)} disabled={effectiveReadOnly && status !== 'draft' && status !== 'in_progress'} className="bg-white"/>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-gray-500">Tiempo Estimado (Hrs/Días)</label>
                                <Input type="text" placeholder="Ej: 40 horas" value={estimatedHours} onChange={e => setEstimatedHours(e.target.value)} disabled={effectiveReadOnly && status !== 'draft' && status !== 'in_progress'} className="bg-white"/>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-gray-500">Horario de Trabajo</label>
                                <Select value={scheduleType} onValueChange={setScheduleType} disabled={effectiveReadOnly && status !== 'draft' && status !== 'in_progress'}>
                                    <SelectTrigger className="bg-white"><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Ordinario">Ordinario</SelectItem>
                                        <SelectItem value="Extraordinario">Extraordinario</SelectItem>
                                        <SelectItem value="Mixto">Mixto</SelectItem>
                                        <SelectItem value="Fin de Semana">Fin de Semana</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Director Labor Calculation Table */}
                        {isAdmin && (
                            <div>
                                <h4 className="text-sm font-bold text-gray-600 mb-2 uppercase border-b pb-1">Cálculo de Costo de Mano de Obra</h4>
                                <StudyItemsTable 
                                    items={labor} 
                                    setItems={setLabor} 
                                    images={[]} 
                                    readOnly={effectiveReadOnly}
                                    defaultCategory="labor"
                                />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader className="flex flex-row items-center justify-between py-3">
                    <CardTitle className="text-sm font-medium">Checklist / Tareas</CardTitle>
                    {!effectiveReadOnly && <Button variant="ghost" size="sm" onClick={addAction}><Plus className="w-3 h-3"/></Button>}
                </CardHeader>
                <CardContent className="p-0">
                    <ul className="divide-y relative">
                         {actions.map((action, i) => (
                             <li key={i} className="flex gap-2 p-2 items-center group">
                                <Input 
                                    value={action} 
                                    onChange={(e) => updateAction(i, e.target.value)}
                                    className="h-7 text-sm border-transparent focus:border-blue-200 bg-transparent disabled:opacity-100"
                                    placeholder="Nueva tarea..."
                                    disabled={effectiveReadOnly}
                                />
                                {!effectiveReadOnly && (
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                                        onClick={() => removeAction(i)}
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                )}
                             </li>
                         ))}
                         {actions.length === 0 && <div className="p-4 text-xs text-gray-400 text-center italic">Sin tareas definidas.</div>}
                    </ul>
                </CardContent>
            </Card>
        </TabsContent>

        {/* PLANS TAB */}
        <TabsContent value="plans" className="space-y-4">
             <div className="space-y-2">
                 {engineerPlans.map((plan, idx) => (
                     <div key={idx} className="flex items-center justify-between p-3 bg-white border rounded shadow-sm">
                         <div className="flex items-center">
                             <FileText className="w-5 h-5 text-blue-500 mr-3" />
                             <div>
                                 <a href={plan.url} target="_blank" className="font-medium text-sm text-blue-700 hover:underline">{plan.title}</a>
                                 <p className="text-xs text-gray-400">{plan.file ? 'Pendiente de subida' : 'Guardado'}</p>
                             </div>
                         </div>
                         {!effectiveReadOnly && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-500 hover:bg-red-50"
                                onClick={() => setEngineerPlans(prev => prev.filter((_, i) => i !== idx))}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                         )}
                     </div>
                 ))}
                 
         {engineerPlans.length === 0 && <p className="text-sm text-gray-400 italic">No hay planos adjuntos.</p>}
             </div>
             
             {userRole === 'engineer' && !effectiveReadOnly && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 bg-white mt-4" onClick={() => plansInputRef.current?.click()}>
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Subir Plano (Ingeniero)</p>
                    <input 
                        type="file" 
                        multiple
                        ref={plansInputRef} 
                        onChange={handlePlanUpload} 
                        className="hidden" 
                    />
                </div>
             )}

             <h4 className="font-bold text-gray-700 mt-6 pt-4 border-t">Archivos Administrativos (Director)</h4>
             <div className="space-y-2">
                 {directorFiles.map((fileObj: any, idx: number) => (
                     <div key={`dir-${idx}`} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded shadow-sm">
                         <div className="flex items-center">
                             <FileText className="w-5 h-5 text-blue-600 mr-3" />
                             <div>
                                 <a href={fileObj.url} target="_blank" className="font-medium text-sm text-blue-800 hover:underline">{fileObj.title}</a>
                                 <p className="text-xs text-blue-500">{fileObj.file ? 'Pendiente de subida' : 'Guardado'}</p>
                             </div>
                         </div>
                         {isAdmin && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-500 hover:bg-red-100"
                                onClick={() => setDirectorFiles((prev: any[]) => prev.filter((_: any, i: number) => i !== idx))}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                         )}
                     </div>
                 ))}
                 
                 {directorFiles.length === 0 && <p className="text-sm text-gray-400 italic">No hay archivos administrativos.</p>}
             </div>

             {isAdmin && (
                <div className="border-2 border-dashed border-blue-200 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 bg-white mt-4" onClick={() => directorFileInputRef.current?.click()}>
                    <Upload className="w-8 h-8 text-blue-400 mb-2" />
                    <p className="text-sm text-blue-600 font-medium">Subir Documento PDF / Referencia</p>
                    <input 
                        type="file" 
                        multiple
                        ref={directorFileInputRef} 
                        onChange={handleDirectorFileUpload} 
                        className="hidden" 
                    />
                </div>
             )}

        </TabsContent>

        {/* IMAGES TAB */}
        <TabsContent value="images" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((img, i) => (
                    <div key={img.id} className="relative group">
                        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden mb-2 border text-center">
                            {img.url ? (
                                <img src={img.url} alt={img.tag} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-[10px] text-red-400 p-2 font-mono">Enlace roto<br/>(Datos heredados)</span>
                            )}
                        </div>
                        <Input 
                            value={img.tag} 
                            onChange={(e) => {
                                const newImgs = [...images];
                                newImgs[i].tag = e.target.value;
                                setImages(newImgs);
                            }}
                            className="h-8 text-xs text-center font-bold bg-white disabled:opacity-100 disabled:border-none" 
                            disabled={effectiveReadOnly}
                        />
                        {!effectiveReadOnly && (
                            <Button 
                                variant="destructive" 
                                size="icon" 
                                className="absolute top-1 right-1 h-6 w-6 bg-white/80 hover:bg-white text-red-500 hover:text-red-700 shadow-sm rounded-full"
                                onClick={() => setImages(images.filter(im => im.id !== img.id))}
                            >
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        )}
                    </div>

                ))}
            </div>
            
            {!effectiveReadOnly && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 bg-white" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Subir Foto o Tomar</p>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        className="hidden" 
                        accept="image/*" 
                        capture="environment"
                    />
                </div>
            )}
        </TabsContent>
        {/* ACTIVITY TAB */}
        <TabsContent value="activity" className="space-y-4">
             <Card>
                 <CardHeader className="pb-2"><CardTitle className="text-lg">Historial y Comentarios</CardTitle></CardHeader>
                 <CardContent>
                     <div className="space-y-4 max-h-[400px] overflow-y-auto mb-4 p-2 border rounded bg-gray-50">
                         {activityLog.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Sin actividad registrada.</p>}
                         {activityLog.map((log: any, i) => {
                             // Robust key access
                             let displayMsg = log['Full Comment'] || log.full_comment || log.FullComment || log.comment || '';
                             let displayUser = log.user_name || 'Usuario';
                             let isSystem = false;
                             
                             if (displayMsg?.startsWith('[SYSTEM]')) {
                                 isSystem = true;
                                 displayUser = 'Sistema';
                                 displayMsg = displayMsg.replace('[SYSTEM] ', '');
                             } else if (displayMsg?.startsWith('[USER:')) {
                                 // Extract User
                                 const match = displayMsg.match(/^\[USER:(.*?)\] (.*)/);
                                 if (match) {
                                     displayUser = match[1];
                                     displayMsg = match[2];
                                 }
                             }
                             
                             return (
                             <div key={i} className={`flex gap-3 text-sm ${isSystem ? 'opacity-75' : ''}`}>
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0
                                     ${isSystem ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>
                                     {isSystem ? 'SYS' : displayUser[0].toUpperCase()}
                                 </div>
                                 <div className="flex-1">
                                      <div className="flex justify-between items-baseline">
                                          <span className="font-bold text-gray-800">{displayUser}</span>
                                          <span className="text-[10px] text-gray-400">{new Date(log.CreatedAt).toLocaleString()}</span>
                                      </div>
                                      <p className="text-gray-700 mt-1 whitespace-pre-wrap">
                                          {displayMsg}
                                      </p>
                                 </div>
                             </div>
                             );
                         })}
                     </div>
                     
                     <div className="flex gap-2 items-start">
                         <div className="flex-1">
                             <Textarea 
                                 value={newComment}
                                 onChange={(e) => setNewComment(e.target.value)}
                                 placeholder="Escribe un comentario..."
                                 className="min-h-[80px]"
                             />
                         </div>
                         <Button onClick={handleSendComment} className="h-[80px]">Enviar</Button>
                     </div>
                 </CardContent>
             </Card>
        </TabsContent>
            </Tabs>
        </div>
      </div>
    </div>
  );
}
