'use server';

import fs from 'fs';
import path from 'path';
import os from 'os';
import { openai, MODELS } from '@/lib/openai';
import { z } from 'zod'; // We might use zod for structured output validation

// Schema for Extraction
const ExtractionSchema = z.object({
  materials: z.array(z.object({
    item: z.string(),
    quantity: z.number(),
    description: z.string().optional(),
    odoo_product_id: z.number().optional().nullable(),
  })),
  actions: z.array(z.string()),
  comments: z.array(z.string()),
});

export async function transcribeAudio(formData: FormData) {
  const file = formData.get('file') as File;
  
  if (!file) {
    return { success: false, error: 'No file uploaded' };
  }

  // Save file to tmp
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const tmpPath = path.join(os.tmpdir(), `upload-${Date.now()}.webm`);
  
  try {
    fs.writeFileSync(tmpPath, buffer);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tmpPath),
      model: MODELS.transcription,
      language: 'es', // Force Spanish
    });

    // Clean up
    fs.unlinkSync(tmpPath);

    return { success: true, text: transcription.text };
  } catch (error: any) {
    console.error('Transcription error:', error);
    return { success: false, error: error.message };
  }
}

export async function extractDataFromText(text: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: MODELS.extraction,
      messages: [
        {
          role: "system",
          content: `Eres un asistente experto en ingeniería y construcción. 
          Tu tarea es analizar la transcripción de una nota de voz de un ingeniero en campo y extraer información estructurada en JSON.
          
          Extrae:
          1. **Materiales**: Listado de materiales mencionados con cantidades. 
          2. **Acciones**: Tareas o instrucciones técnicas (ej: "Instalar cámara", "Mover rack").
          3. **Comentarios**: Observaciones generales o dudas.
          
          Responde SOLAMENTE con el JSON válido.`
        },
        {
          role: "user",
          content: text
        }
      ],
      functions: [
        {
          name: "extract_technical_data",
          description: "Extracts materials, actions and comments from text",
          parameters: {
            type: "object",
            properties: {
                materials: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      item: { type: "string", description: "Name of the material" },
                      quantity: { type: "number", description: "Quantity needed" },
                      unit: { type: "string", description: "Unit of measure (e.g., 'm', 'ft', 'und')." },
                      category: { type: "string", enum: ["equipment", "supply"], description: "Classify as 'equipment' (major hardware like cameras, racks) or 'supply' (consumables like cable, screws, pipes)." },
                      description: { type: "string", description: "Additional details" }
                    },
                    required: ["item", "quantity", "category"]
                  }
                },
              actions: {
                type: "array",
                items: { type: "string" }
              },
              comments: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["materials", "actions", "comments"]
          }
        }
      ],
      function_call: { name: "extract_technical_data" }
    });

    const functionArgs = completion.choices[0].message.function_call?.arguments;
    
    if (!functionArgs) {
      throw new Error('No function call in response');
    }

    const data = JSON.parse(functionArgs);
    return { success: true, data };

  } catch (error: any) {
    console.error('Extraction error:', error);
    return { success: false, error: error.message };
  }
}
