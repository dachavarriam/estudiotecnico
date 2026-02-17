'use server';

// Mock users for now. In production, fetch from NocoDB or Slack.
export async function getEngineers() {
  return [
    { id: 'U01ABCDEF', name: 'Ingeniero Juan Perez', email: 'juan@example.com' }, // Slack ID format
    { id: 'U02XYZ123', name: 'Ing. Maria Rodriguez', email: 'maria@example.com' },
  ];
}

import { nocodb } from '@/lib/nocodb';
import { NOCODB_TABLES, STUDY_STATUS_MAP } from '@/lib/constants';

export async function uploadStudyImage(formData: FormData) {
    try {
        const res = await nocodb.upload(formData);
        return { success: true, data: res };
    } catch (e: any) {
        console.error('Upload Error:', e);
        return { success: false, error: e.message };
    }
}

export async function createTechnicalStudy(data: any) {
  try {
    console.log('Creating Technical Study in NocoDB:', data);
    
    const newStudy = await nocodb.create(NOCODB_TABLES.technical_studies, {
      client_id: Number(data.clientId),
      client_name: data.clientName || `Client #${data.clientId}`, 
      study_identifier: data.title || `Study ${new Date().toISOString()}`,
      status: 'draft', // specific value expected by NocoDB enum? Or string?
      date: new Date().toISOString(),
    }) as any;

    const studyId = newStudy.Id;

    const { sendNotification, getStartStudyBlocks } = await import('@/lib/slack');
    
    const blocks = getStartStudyBlocks(studyId, data.clientName || `Client #${data.clientId}`, data.engineerId);
    await sendNotification(data.engineerId, `New Study Assigned: #${studyId}`, blocks as any);
    
    return { success: true, id: studyId };
  } catch (error) {
    console.error('Error creating study:', error);
    return { success: false, error: 'Failed to create study' };
  }
}

export async function saveStudyDetails(id: string, data: any) {
    console.log(`Saving details for study ${id}`, data);
    
    try {
        // 1. Update Study Status and General Info
        await nocodb.update(NOCODB_TABLES.technical_studies, id, { 
            status: 'review', // Internal status code
            location: data.location,
            contact_info: data.contactInfo,
            study_type: data.studyType,
            site_observations: data.siteObservations
        });
        
        // 2. Save Materials
        if (data.materials && data.materials.length > 0) {
            for (const item of data.materials) {
                if ((!item.odoo_product_id || item.source === 'local' || item.source === 'manual') && item.price) {
                     try {
                         const { createLocalSupply } = await import('@/actions/supply-actions');
                         createLocalSupply({
                             name: item.item,
                             price: item.price,
                             unit: item.unit || 'und',
                             category: item.category || 'supply'
                         }).catch(console.error);
                     } catch (e) { console.error('Failed to auto-create supply', e); }
                }

                const newM = await nocodb.create(NOCODB_TABLES.study_materials, {
                    item: item.item,
                    quantity: item.quantity,
                    unit: item.unit,
                    category: item.category,
                    description: item.description,
                }) as any;
                if (newM && newM.Id) {
                    await nocodb.link(NOCODB_TABLES.technical_studies, id, 'study_materials_list', newM.Id);
                }
            }
        }
        
        // 3. Save Actions
        if (data.actions && data.actions.length > 0) {
            for (const a of data.actions) {
                const newA = await nocodb.create(NOCODB_TABLES.study_actions, {
                    action: a,
                }) as any;
                if (newA && newA.Id) {
                    await nocodb.link(NOCODB_TABLES.technical_studies, id, 'study_actions_list', newA.Id);
                }
            }
        }

        // 4. Save Comments
        if (data.comments && data.comments.length > 0) {
            for (const c of data.comments) {
                const newC = await nocodb.create(NOCODB_TABLES.study_comments, {
                    full_comment: c,
                }) as any;
                if (newC && newC.Id) {
                    await nocodb.link(NOCODB_TABLES.technical_studies, id, 'study_comments_list', newC.Id);
                }
            }
        }
        
        // 5. Images (Photos)
        if (data.images && data.images.length > 0) {
            for (const img of data.images) {
                const newP = await nocodb.create(NOCODB_TABLES.study_photos, {
                    tag: img.tag,
                    photo: img.attachment_data, 
                }) as any;
                if (newP && newP.Id) {
                    await nocodb.link(NOCODB_TABLES.technical_studies, id, 'study_photos_list', newP.Id);
                }
            }
        }

        // 6. Voice Notes
        if (data.notes && data.notes.length > 0) {
            for (const note of data.notes) {
                const newVN = await nocodb.create(NOCODB_TABLES.voice_notes, {
                    transcription: note.transcription,
                    CreatedAt: new Date(note.timestamp).toISOString()
                }) as any;
                
                if (newVN && newVN.Id) {
                    await nocodb.link(NOCODB_TABLES.technical_studies, id, 'voice_notes_list', newVN.Id);
                }
            }
        }
        
        // Handle Submission Timestamp
        if (data.status === 'review') {
             await nocodb.update(NOCODB_TABLES.technical_studies, id, { 
                submitted_at: new Date().toISOString()
            });
        }

        return { success: true };

    } catch (e) {
        console.error('Error saving study details:', e);
        return { success: false, error: 'Failed to save details' };
    }
}

export async function startStudy(id: string) {
    try {
        await nocodb.update(NOCODB_TABLES.technical_studies, id, {
            started_at: new Date().toISOString(),
            status: 'in_progress' // Optional: if we want to track "Working now"
        });
        return { success: true };
    } catch (error: any) {
        console.error("Error starting study:", error);
        return { success: false, error: error.message };
    }
}

export async function approveStudy(id: string) {
    try {
        await nocodb.update(NOCODB_TABLES.technical_studies, id, {
            status: 'approved',
            approved_at: new Date().toISOString()
        });
        return { success: true };
    } catch (error: any) {
        console.error("Error approving study:", error);
        return { success: false, error: error.message };
    }
}

export async function getStudy(id: string) {
    try {
        const result = await nocodb.list(NOCODB_TABLES.technical_studies, {
            where: `(Id,eq,${id})`
        }) as any;
        
        const study = (result.list ? result.list[0] : result[0]) || null;

        if (!study) return { success: false, error: 'Study not found' };

        // Parse JSON fields if they are strings (depends on DB schema)
        // For NocoDB they might be JSON objects already if configured as JSON column, or strings.
        // Safely try to parse.
        const safeParse = (val: any) => {
            if (typeof val === 'string') {
                try { return JSON.parse(val); } catch { return []; }
            }
            return val || [];
        };

        return { 
            success: true, 
            data: {
                ...study,
                items: safeParse(study.items), 
                actions: safeParse(study.actions),
                // client_name might be in study or need fetch? study has client_name column.
            }
        };
    } catch (error: any) {
        console.error("Error fetching study:", error);
        return { success: false, error: error.message };
    }
}

export async function getAllStudies() {
    try {
        const result = await nocodb.list(NOCODB_TABLES.technical_studies, {
            sort: '-CreatedAt', // Newest first
            limit: 100 // Reasonable limit for now
        }) as any;

        const list = result.list || result || [];
        
        return { 
            success: true, 
            data: list.map((s: any) => ({
                id: s.Id,
                clientCount: s.client_id, 
                clientName: s.client_name,
                status: s.status,
                date: s.date || s.CreatedAt, // Fallback
                location: s.location,
                type: s.study_type,
                // KPI Timestamps
                createdAt: s.CreatedAt,
                startedAt: s.started_at,
                submittedAt: s.submitted_at,
                approvedAt: s.approved_at,
                engineerId: s.engineer_id // If we have it
            })) 
        };
    } catch (error: any) {
        console.error("Error fetching all studies:", error);
        return { success: false, error: error.message };
    }
}
