'use client';

import { useState, use, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { AudioRecorder } from '@/components/audio-recorder';
import { transcribeAudio, extractDataFromText } from '@/actions/voice-actions';
import { Loader2, CheckCircle, Save, Plus, Trash2, Mic, FileText, Image as ImageIcon, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { saveStudyDetails, uploadStudyImage } from '@/actions/study-actions';
import { useRouter } from 'next/navigation';
import { StudyItemsTable } from '@/components/study-items-table';
import { STUDY_STATUS_MAP } from '@/lib/constants';

interface Note {
  id: string;
  transcription: string;
  timestamp: number;
}

interface ExtractedItem {
  item: string;
  quantity: number;
  unit?: string;
  category?: 'equipment' | 'supply';
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

export default function StudyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Data
  const [materials, setMaterials] = useState<ExtractedItem[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [comments, setComments] = useState<string[]>([]);
  
  const [status, setStatus] = useState('draft');
  const [clientName, setClientName] = useState('Cliente General');
  
  // New Fields (Phase 2)
  const [location, setLocation] = useState('');
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactInfo, setContactInfo] = useState(''); // Keep for compatibility or syncing
  const [studyType, setStudyType] = useState('Cableado Estructurado'); 
  const [siteObservations, setSiteObservations] = useState('');
  
  // Fetch Data
  useEffect(() => {
     async function loadData() {
         try {
             // Dynamically import to avoid server/client issues if needed, or just import at top
             const { getStudy } = await import('@/actions/study-actions');
             const res = await getStudy(id);
             if (res.success && res.data) {
                 const s = res.data;
                 setMaterials(s.items || []); // Map items if needed
                 setActions(s.actions || []);
                 // setNotes(s.notes || []); // Notes handling might need mapping
                 setLocation(s.location || '');
                 const cInfo = s.contact_info || '';
                 setContactInfo(cInfo);
                 const parts = cInfo.split(" - ");
                 if (parts.length > 1) {
                     setContactName(parts[0]);
                     setContactPhone(parts[1]);
                 } else {
                     setContactName(cInfo);
                 }
                 setStudyType(s.study_type || 'Cableado Estructurado');
                 setSiteObservations(s.site_observations || '');
                 setStatus(s.status || 'draft');
                 setClientName(s.client_name || 'Cliente General'); // If available in DB
             }
         } catch (e) {
             console.error("Error loading study:", e);
         }
     }
     loadData();
  }, [id]);

    // Actions Handlers
    const addAction = () => setActions([...actions, ""]);
    const updateAction = (idx: number, val: string) => {
        const newActions = [...actions];
        newActions[idx] = val;
        setActions(newActions);
    };
    const removeAction = (idx: number) => setActions(actions.filter((_, i) => i !== idx));
  
  // Images
  const [images, setImages] = useState<SiteImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
                    // Start accumulating the attachment object or just the URL?
                    // study_photos 'photo' column expects Attachment JSON
                    // We'll pass the whole object to saveStudyDetails
                    uploadedImages.push({
                        tag: img.tag,
                        attachment_data: res.data // Array of attachments
                    });
                }
            } else {
                 // Existing URL (if any logic needed)
            }
        }

        setStatusMessage('Guardando datos...');

        const combinedContact = contactName || contactPhone ? `${contactName} - ${contactPhone}` : contactInfo;

        const studyData = {
            materials,
            actions,
            comments,
            images: uploadedImages,
            notes, // Pass voice notes
            // New Fields
            location,
            contactInfo: combinedContact,
            studyType,
            siteObservations
        };

        const res = await saveStudyDetails(id, studyData);
        
        if (res.success) {
            alert('Estudio guardado exitosamente!');
            // router.push('/engineer/dashboard'); // Redirect or stay
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

  const handleDownloadPDF = async () => {
    const pdfData = {
        id: id,
        client: 'Cliente Demo',
        engineer: 'Ingeniero Demo',
        date: new Date().toLocaleDateString(),
        materials,
        actions,
        comments,
        // images: images.map(img => ({ tag: img.tag, url: img.url })) // PDF needs update to handle images
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
        a.download = `Estudio-${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error(error);
        alert('Error descargando PDF');
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
      <div className="flex justify-between items-center mb-6">
        <div>
            <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">Estudio Técnico #{id}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                    ${status === 'draft' ? 'bg-gray-200 text-gray-700' : ''}
                    ${status === 'in_progress' ? 'bg-blue-100 text-blue-700' : ''}
                    ${status === 'review' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                    ${status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                `}>
                    {STUDY_STATUS_MAP[status] || status || 'Borrador'}
                </span>
            </div>
            <p className="text-gray-500">{clientName}</p>
        </div>
        <div className="flex gap-2">
             {status === 'draft' && (
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={async () => {
                    if(!confirm('¿Iniciar levantamiento en sitio? Esto marcará la hora de inicio.')) return;
                    setIsProcessing(true);
                    try {
                        const { startStudy } = await import('@/actions/study-actions');
                        const res = await startStudy(id);
                        if(res.success) { setStatus('in_progress'); alert('Iniciado correctamente.'); }
                    } catch(e) { alert('Error al iniciar'); }
                    setIsProcessing(false);
                }}>
                    <CheckCircle className="w-4 h-4 mr-2" /> Iniciar
                </Button>
             )}
             
             <Button size="sm" variant="ghost" className="text-blue-600" onClick={loadDemoData}>Demo</Button>
             
             <Button size="sm" variant="outline" onClick={() => {
                const headers = ['Item', 'Descripción', 'Cantidad', 'Unidad', 'Categoría', 'Precio'];
                const rows = (materials || []).map((m: any) => [
                    `"${(m.item || '').replace(/"/g, '""')}"`,
                    `"${(m.description || '').replace(/"/g, '""')}"`,
                    m.quantity,
                    m.unit,
                    m.category,
                    m.price
                ]);
                const csvContent = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `estudio_${id}_materiales.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
             }}>
                <FileText className="w-4 h-4 mr-2" /> Excel/CSV
             </Button>

             <Button size="sm" variant="outline" onClick={handleDownloadPDF}><FileText className="w-4 h-4 mr-2" /> PDF</Button>
             
             {(status === 'in_progress' || status === 'draft') && (
                 <Button size="sm" onClick={handleSaveStudy}>
                    <Save className="w-4 h-4 mr-2" /> Guardar y Enviar
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
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-gray-500">Ubicación / Sitio</label>
                        <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ej: San Pedro Sula, Planta 2" />
                    </div>
                    <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-gray-500">Contacto en Sitio</label>
                            <Input value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} placeholder="Nombre y Teléfono" />
                    </div>
                    <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-gray-500">Categoría</label>
                            <Select value={studyType} onValueChange={setStudyType}>
                            <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Cableado Estructurado">Cableado Estructurado</SelectItem>
                                <SelectItem value="CCTV">CCTV</SelectItem>
                                <SelectItem value="Control de Acceso">Control de Acceso</SelectItem>
                                <SelectItem value="Detección de Incendio">Detección de Incendio</SelectItem>
                                <SelectItem value="Alarma de Intrusión">Alarma de Intrusión</SelectItem>
                                <SelectItem value="Fibra Óptica">Fibra Óptica</SelectItem>
                                <SelectItem value="Enlace Inalámbrico">Enlace Inalámbrico</SelectItem>
                                <SelectItem value="Redes / Networking">Redes / Networking</SelectItem>
                                <SelectItem value="Energía / UPS">Energía / UPS</SelectItem>
                                <SelectItem value="Audio / Video">Audio / Video</SelectItem>
                                <SelectItem value="Automatización">Automatización</SelectItem>
                                <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                                <SelectItem value="Levantamiento General">Levantamiento General</SelectItem>
                                <SelectItem value="Otro">Otro</SelectItem>
                            </SelectContent>
                            </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-gray-500">Observaciones</label>
                        <Textarea 
                            value={siteObservations} 
                            onChange={(e) => setSiteObservations(e.target.value)} 
                            placeholder="Notas generales..." 
                            className="h-24 resize-none"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-blue-100 shadow-sm h-full">
                <CardHeader className="pb-2"> <CardTitle className="text-lg flex items-center"><Mic className="w-5 h-5 mr-2 text-red-500"/> Notas de Voz</CardTitle> </CardHeader>
                <CardContent className="flex flex-col items-center pt-4 gap-4">
                    <AudioRecorder onRecordingComplete={handleRecordingComplete} />
                    
                    <div className="w-full space-y-2 max-h-[300px] overflow-y-auto">
                        {notes.map((note) => (
                        <div key={note.id} className="bg-white border rounded p-3 text-sm flex gap-2 group">
                            <p className="flex-1 text-gray-700">"{note.transcription}"</p>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-300 group-hover:text-red-500" onClick={() => handleDeleteNote(note.id)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
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
                <TabsTrigger value="images" className="flex-1"> <ImageIcon className="w-4 h-4 mr-2"/> Fotografías ({images.length})</TabsTrigger>
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
                    />
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader className="flex flex-row items-center justify-between py-3">
                    <CardTitle className="text-sm font-medium">Acciones / Tareas</CardTitle>
                    <Button variant="ghost" size="sm" onClick={addAction}><Plus className="w-3 h-3"/></Button>
                </CardHeader>
                <CardContent className="p-0">
                    <ul className="divide-y relative">
                         {actions.map((action, i) => (
                             <li key={i} className="flex gap-2 p-2 items-center group">
                                <Input 
                                    value={action} 
                                    onChange={(e) => updateAction(i, e.target.value)}
                                    className="h-7 text-sm border-transparent focus:border-blue-200 bg-transparent"
                                    placeholder="Nueva tarea..."
                                />
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                                    onClick={() => removeAction(i)}
                                >
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                             </li>
                         ))}
                         {actions.length === 0 && <div className="p-4 text-xs text-gray-400 text-center italic">Sin tareas definidas.</div>}
                    </ul>
                </CardContent>
            </Card>
        </TabsContent>

        {/* IMAGES TAB */}
        <TabsContent value="images" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((img, i) => (
                    <div key={img.id} className="relative group">
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2 border">
                            <img src={img.url} alt={img.tag} className="w-full h-full object-cover" />
                        </div>
                        <Input 
                            value={img.tag} 
                            onChange={(e) => {
                                const newImgs = [...images];
                                newImgs[i].tag = e.target.value;
                                setImages(newImgs);
                            }}
                            className="h-8 text-xs text-center font-bold bg-white" 
                        />
                        <Button 
                            variant="destructive" 
                            size="icon" 
                            className="absolute top-1 right-1 h-6 w-6 bg-white/80 hover:bg-white text-red-500 hover:text-red-700 shadow-sm rounded-full"
                            onClick={() => setImages(images.filter(im => im.id !== img.id))}
                        >
                            <Trash2 className="w-3 h-3" />
                        </Button>
                    </div>

                ))}
            </div>
            
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
        </TabsContent>
            </Tabs>
        </div>
      </div>
    </div>
  );
}
