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

// Helper to get formatted ID
const generateStudyId = async (prefix: string) => {
    try {
        // Count studies with this prefix
        // NocoDB 'list' with 'where' clause using 'like'
        // where: (study_identifier,like,PREFIX-%)
        const result = await nocodb.list(NOCODB_TABLES.technical_studies, {
             where: `(study_identifier,like,${prefix}-%)`,
             limit: 1 // We just need total count info if available, or fetch all to count? 
                      // NocoDB list usually returns 'pageInfo' with 'totalRows' if enabled, 
                      // but simplest is to just count. 
                      // Ideally we find the MAX number.
             // If we can't easily do MAX, we might rely on count + 1 which is risky but acceptable for v1
        }) as any;
        
        let count = 0;
        // If result.pageInfo.totalRows exists use it.
        if (result.pageInfo && result.pageInfo.totalRows) {
            count = result.pageInfo.totalRows;
        } else if (result.list) {
            // This only counts the page limit if not careful.
            // Better strategy for "next number":
            // Just use a random hash or Date if "correlative" strictness isn't auditing.
            // But user asked for correlative.
            // Let's try to get all or assume count.
             const all = await nocodb.list(NOCODB_TABLES.technical_studies, {
                 where: `(study_identifier,like,${prefix}-%)`,
                 limit: 1000,
                 fields: 'study_identifier'
             }) as any;
             const list = all.list || all || [];
             count = list.length;
        }

        const nextNum = count + 1;
        return `${prefix}-TASHN-${nextNum.toString().padStart(5, '0')}`;
    } catch (e) {
        console.error("Error generating ID", e);
        return `${prefix}-TASHN-${Date.now().toString().slice(-5)}`; // Fallback
    }
};

export async function createTechnicalStudy(data: any) {
  try {
    console.log('---------------- createTechnicalStudy ----------------');
    console.log('RECEIVED DATA:', JSON.stringify(data, null, 2));
    if (!data.clientName) console.error('MISSING clientName in payload!');
    
    // ... rest of logic

    // 1. Fetch Engineer & Location for ID Logic
    let engineerLocation = 'SPS'; // Default
    let engineerInternalId = null;
    let engineerNameFull = data.engineerName;

    if (data.engineerId) {
        try {
            // We need to fetch from Odoo again to get the location if not passed
            // Or use checking user-actions if they are synced?
            // Let's use getEmployees from odoo-actions directly here to be sure
            const { getEmployees } = await import('@/actions/odoo-actions');
            const emps = await getEmployees(data.engineerName); // Search by name to find details? Or ID?
            // data.engineerId from form is the ID.
            
            // Actually, getEmployees returns a list. We can filter.
            // However, efficient way:
            // However, efficient way:
            const { odoo } = await import('@/lib/odoo');
            const empData = await odoo.searchRead('hr.employee', [['id', '=', Number(data.engineerId)]], ['work_location_id', 'name', 'work_email']);
            
            if (empData && empData.length > 0) {
                 const loc = empData[0].work_location_id ? empData[0].work_location_id[1] : '';
                 if (loc && loc.toLowerCase().includes('tegucigalpa')) {
                     engineerLocation = 'TGA';
                 }
                 engineerNameFull = empData[0].name; // Ensure we have the Odoo Name

                // Also link to NocoDB User by Name (as requested)
                try {
                     const nameQuery = data.engineerName || engineerNameFull;
                     if (nameQuery) {
                         const userRes = await nocodb.list(NOCODB_TABLES.users, {
                             limit: 100 // Fetch all small set of users for local case-insensitive matching
                         }) as any;
                     
                         const userList = userRes.list || userRes || [];
                         const normalizeText = (str: string) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : '';
                         const qName = normalizeText(nameQuery);
                         const matchedUser = userList.find((u: any) => {
                             const uName = normalizeText(u.Name);
                             return uName === qName || uName.includes(qName) || qName.includes(uName);
                         });

                         if (matchedUser) {
                             engineerInternalId = matchedUser.Id;
                             engineerNameFull = matchedUser.Name || engineerNameFull; // Use Name not name
                             console.log(`Found NocoDB User for Engineer by Name: ${engineerInternalId} (${engineerNameFull})`);
                         } else {
                             console.log(`No NocoDB User found for name: ${nameQuery}`);
                         }
                     }
                } catch (err) {
                     console.error("Error linking NocoDB User:", err);
                }
            }
        } catch (e) {
            console.error("Error looking up engineer location:", e);
        }
    }
    
    // 2. Generate ID
    const prefix = engineerLocation === 'TGA' ? 'ETTGA' : 'ETSPS';
    const studyIdentifier = await generateStudyId(prefix);
    
    // Combine Title + Description for Observations
    const combinedObs = `Título: ${data.title || 'Sin Título'}\n\n${data.description || ''}`;

    const newStudy = await nocodb.create(NOCODB_TABLES.technical_studies, {
      client_id: Number(data.clientId),
      "Client Name": data.clientName || `Client #${data.clientId}`, 
      engineer_name: engineerNameFull, 
      study_identifier: studyIdentifier,
      "Site Observations": combinedObs,
      "Status": 'draft', 
      "Date": new Date().toISOString(),
      // Phase 4 New Fields
      visit_date: data.visitDate ? new Date(data.visitDate).toISOString() : null,
      visit_type: data.visitType || 'Visita Técnica',
      categories: data.categories && data.categories.length ? data.categories : ['Cableado Estructurado'],
      // File attachments - handled if passed as array of attachment objects 
      // (which they should be if uploaded client-side or separate step)
      director_files: data.directorFiles || null,
      // Link User if found
      ...(engineerInternalId ? { users: engineerInternalId } : {})
    }) as any;

    const studyId = newStudy.Id;

    // Link Engineer if found (Skipping for now as we rely on text name mostly)

    const { sendNotification, getStartStudyBlocks } = await import('@/lib/slack');
    
    // Use engineerId (Odoo ID) as slack ID? No. 
    // We haven't implemented Odoo->Slack mapping fully yet.
    // Assuming data.engineerId might be used for notification if it was a Slack ID.
    // But create form sends Odoo ID.
    // We'll skip notification or log warning if format doesn't match.
    if (String(data.engineerId).startsWith('U')) {
         const blocks = getStartStudyBlocks(studyId, data.clientName, data.engineerId);
         await sendNotification(data.engineerId, `New Study Assigned: ${studyIdentifier}`, blocks as any);
    }
    
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
            "Status": 'review', // Internal status code
            "Location": data.location,
            "Contact Info": data.contactInfo,
            categories: data.categories && data.categories.length ? data.categories.join(',') : null, // MultiSelect format
            "Site Observations": data.siteObservations,
            engineer_plans: data.engineerPlans, // Array of attachments
            director_files: data.directorFiles,
            estimated_hours: data.estimated_hours ? parseFloat(data.estimated_hours) : null,
            estimated_technicians: data.estimated_technicians ? parseInt(data.estimated_technicians) : null,
            estimated_engineers: data.estimated_engineers ? parseInt(data.estimated_engineers) : null,
            schedule_type: data.schedule_type
        });
        
        // 1.5 Clear Existing Materials, Actions, Comments to avoid duplication
        try {
            // Delete old materials
            const oldMats = await nocodb.list(NOCODB_TABLES.study_materials, { where: `(technical_studies_id,eq,${id})` }) as any;
            if (oldMats.list && oldMats.list.length > 0) {
                await nocodb.delete(NOCODB_TABLES.study_materials, oldMats.list.map((m: any) => m.Id).join(','));
            }
            // Delete old actions
            const oldActs = await nocodb.list(NOCODB_TABLES.study_actions, { where: `(technical_studies_id,eq,${id})` }) as any;
            if (oldActs.list && oldActs.list.length > 0) {
                await nocodb.delete(NOCODB_TABLES.study_actions, oldActs.list.map((m: any) => m.Id).join(','));
            }
            // Do not delete old comments (Activity Logs) as they are the historical audit trail
        } catch (e) {
            console.error("Warning: Failed to clear old records before save", e);
        }

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

                await nocodb.create(NOCODB_TABLES.study_materials, {
                    item: item.item,
                    "Quantity": String(item.quantity),
                    "Unit": item.unit,
                    "Category": item.category,
                    "Description": item.description,
                    technical_studies_id: id // Direct Link
                });
            }
        }
        
        // 3. Save Actions
        if (data.actions && data.actions.length > 0) {
            for (const a of data.actions) {
                await nocodb.create(NOCODB_TABLES.study_actions, {
                    action: a,
                    technical_studies_id: id
                });
            }
        }

        // 4. Save Comments (Removed to prevent filling Activity log with transcribe data)
        // If the user wants to keep extracted AI comments separated from Activity logs, 
        // they should have a unique table. But it was requested not to include them in PDF or Activity.
        
        // 5. Images (Photos)
        if (data.images && data.images.length > 0) {
            for (const img of data.images) {
                await nocodb.create(NOCODB_TABLES.study_photos, {
                    tag: img.tag,
                    Photo: typeof img.attachment_data === 'string' ? img.attachment_data : JSON.stringify(img.attachment_data),
                    technical_studies_id: id
                });
            }
        }

        // 6. Voice Notes
        if (data.notes && data.notes.length > 0) {
            for (const note of data.notes) {
                await nocodb.create(NOCODB_TABLES.voice_notes, {
                    "Transcription": note.transcription,
                    "Audio URL": note.audioUrl || null,
                    CreatedAt: new Date(note.timestamp).toISOString(),
                    technical_studies_id: id
                });
            }
        }
        
        // Handle Submission Timestamp
        // The studyData passed to saveStudyDetails doesn't have `status`, we hardcode 'review' at the top
        // So we just always log for now since saveStudyDetails implies submission in this context
        await nocodb.update(NOCODB_TABLES.technical_studies, id, { 
            submitted_at: new Date().toISOString()
        });
        // Log Activity
        await addStudyActivity(id, `[SYSTEM] Estado cambiado a: En Revisión`, 'log');

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
            "Status": 'in_progress' // Optional: if we want to track "Working now"
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
            "Status": 'approved',
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

        // Fetch Related Data
        const [mRes, aRes, cRes, pRes, vRes] = await Promise.all([
             nocodb.list(NOCODB_TABLES.study_materials, { where: `(technical_studies_id,eq,${id})`, limit: 200 }) as any,
             nocodb.list(NOCODB_TABLES.study_actions, { where: `(technical_studies_id,eq,${id})`, limit: 100 }) as any,
             nocodb.list(NOCODB_TABLES.study_comments, { where: `(technical_studies_id,eq,${id})`, limit: 100 }) as any,
             nocodb.list(NOCODB_TABLES.study_photos, { where: `(technical_studies_id,eq,${id})`, limit: 100 }) as any,
             nocodb.list(NOCODB_TABLES.voice_notes, { where: `(technical_studies_id,eq,${id})`, limit: 100 }) as any,
        ]);
        
        const materialsList = mRes.list || mRes || [];
        const actionsList = aRes.list || aRes || [];
        const commentsList = cRes.list || cRes || [];
        const photosList = pRes.list || pRes || [];
        const voiceNotesList = vRes.list || vRes || [];

        const extractedMaterials = materialsList.map((m: any) => ({
            item: m.item,
            quantity: Number(m.Quantity || m.quantity || 1),
            unit: m.Unit || m.unit || '',
            category: m.Category || m.category || 'equipment',
            description: m.Description || m.description || ''
        }));
        
        // Helper for NocoDB Attachments (Bypass S3 Access Denials via Proxy)
        const resolveAttachmentUrl = (attachmentField: any) => {
            if (!attachmentField) return null;
            try {
                const arr = typeof attachmentField === 'string' ? JSON.parse(attachmentField) : attachmentField;
                if (Array.isArray(arr) && arr.length > 0) {
                    const file = arr[0];
                    if (file.path) return `/api/file-proxy?path=${encodeURIComponent(file.path)}`;
                    if (file.signedUrl) return file.signedUrl;
                    if (file.url) {
                         if (file.url.startsWith('http')) return file.url;
                         return `/api/file-proxy?path=${encodeURIComponent(file.url)}`;
                    }
                }
            } catch (e) {
                // Return string if not JSON
                if (typeof attachmentField === 'string' && attachmentField.startsWith('http')) return attachmentField;
            }
            return null;
        };

        const extractedActions = actionsList.map((a: any) => a.action || a.Action);
        const extractedComments = commentsList.map((c: any) => c.full_comment || c['Full Comment'] || c.FullComment);
        
        const extractedPhotos = photosList.map((p: any) => ({
             tag: p.tag || p.Tag || '',
             // Ensure this is ALWAYS a string, never fallback to the raw array
             attachment_data: resolveAttachmentUrl(p.photo || p.Photo) || ''
        }));
        
        const extractedVoiceNotes = voiceNotesList.map((v: any) => ({
             id: v.Id,
             transcription: v.transcription || v.Transcription || '',
             audioUrl: resolveAttachmentUrl(v['Audio URL'] || v.AudioURL || v['Audio File'] || v.audio_url || v.Audio_URL) || '',
             timestamp: v.CreatedAt ? new Date(v.CreatedAt).getTime() : Date.now()
        }));

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
                status: study.Status || study.status || 'draft',
                location: study.Location || study.location || '',
                contact_info: study['Contact Info'] || study.ContactInfo || study.contact_info || '',
                // Handle NocoDB API returning keys with spaces (View vs Table behavior)
                site_observations: study['Site Observations'] || study.SiteObservations || study.site_observations || '',
                engineer_name: study.engineer_name || study.EngineerName || study['Engineer Name'] || '',
                client_name: study['Client Name'] || study.ClientName || study.client_name || '',
                
                // Use related tables instead of JSON columns
                items: extractedMaterials, 
                actions: extractedActions,
                comments: extractedComments,
                images: extractedPhotos,
                notes: extractedVoiceNotes,
                
                // Phase 4 New Fields
                visit_date: study.visit_date || study['Visit Date'] || null,
                visit_type: study.visit_type || study['Visit Type'] || 'Visita Técnica',
                director_files: safeParse(study.director_files || study['Director Files']).map((f: any) => ({ ...f, url: f.path ? `/api/file-proxy?path=${encodeURIComponent(f.path)}` : resolveAttachmentUrl(f) || f.url })),
                engineer_plans: safeParse(study.engineer_plans || study['Engineer Plans']).map((p: any) => ({ ...p, url: p.path ? `/api/file-proxy?path=${encodeURIComponent(p.path)}` : resolveAttachmentUrl(p) || p.url })),
                categories: safeParse(study.categories || study.Categories || study['Categories']),
                
                // Labor
                estimated_hours: study.estimated_hours || study.EstimatedHours || study['Estimated Hours'] || '',
                estimated_engineers: study.estimated_engineers || study.EstimatedEngineers || study['Estimated Engineers'] || '',
                estimated_technicians: study.estimated_technicians || study.EstimatedTechnicians || study['Estimated Technicians'] || '',
                schedule_type: study.schedule_type || study.ScheduleType || study['Schedule Type'] || 'Ordinario',
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
                clientName: s.client_name || s.ClientName || s['Client Name'] || 'Desconocido',
                status: s.status || s.Status || 'draft',
                date: s.date || s.Date || s.CreatedAt, // Fallback
                location: s.location || s.Location || '',
                type: s.study_type || s.StudyType || s['Study Type'] || '',
                // KPI Timestamps
                createdAt: s.CreatedAt,
                startedAt: s.started_at,
                submittedAt: s.submitted_at,
                approvedAt: s.approved_at,
                engineerId: s.engineer_name || s.engineer_id || s.EngineerName || s['Engineer Name'] // Prefer name, fall back to ID
            })) 
        };
    } catch (error: any) {
        console.error("Error fetching all studies:", error);
        return { success: false, error: error.message };
    }
}

export async function getEngineerStudies(engineerId: string) {
    try {
        let whereClause = '';

        // 1. Resolve Slack ID to Internal ID
        const { getUserBySlackId } = await import('@/actions/user-actions');
        const uRes = await getUserBySlackId(engineerId);
        
        if (uRes.success && uRes.data) {
            const internalId = uRes.data.Id;
            const userName = uRes.data.Name || uRes.data.name;
            // Match either by internal ID OR by Engineer Name text since 
            // the system allows creating studies with engineers that aren't properly linked in users table yet
            whereClause = `(users_id,eq,${internalId})~or(engineer_name,like,%${userName}%)`; 
        } else {
            // Engineer not found as object, fallback to text query using the session ID (which might just be their name from older sessions)
            whereClause = `(engineer_name,like,%${engineerId}%)`;
        }

        const result = await nocodb.list(NOCODB_TABLES.technical_studies, {
             sort: '-CreatedAt', 
             where: whereClause
        }) as any;

        const list = result.list || result || [];
        
        return { 
            success: true, 
            data: list.map((s: any) => ({
                id: s.Id,
                clientCount: s.client_id, 
                clientName: s.client_name || s.ClientName || s['Client Name'] || 'Desconocido',
                status: s.status || s.Status || 'draft',
                date: s.date || s.Date || s.CreatedAt,
                location: s.location || s.Location || '',
                type: s.study_type || s.StudyType || s['Study Type'] || '',
                createdAt: s.CreatedAt,
                startedAt: s.started_at,
                submittedAt: s.submitted_at,
                approvedAt: s.approved_at,
                engineerId: s.engineer_name || s.engineer_id || s.EngineerName || s['Engineer Name']
            })) 
        };
    } catch (error: any) {
        console.error("Error fetching engineer studies:", error);
        return { success: false, error: error.message };
    }
}

export async function getStudyActivity(studyId: string) {
    try {
        const result = await nocodb.list(NOCODB_TABLES.study_comments, {
            where: `(technical_studies_id,eq,${studyId})`,
            sort: 'CreatedAt' 
        }) as any;
        
        return { success: true, data: result.list || result || [] };
    } catch (error: any) {
        console.error("Error fetching activity:", error);
        return { success: false, error: error.message };
    }
}

export async function addStudyActivity(studyId: string, message: string, type: 'comment' | 'log' = 'comment', user?: string) {
    try {
        let finalMsg = message;
        if (type === 'log') {
            finalMsg = `[SYSTEM] ${message}`;
        } else if (user) {
            finalMsg = `[USER:${user}] ${message}`;
        }
        
        await nocodb.create(NOCODB_TABLES.study_comments, {
            technical_studies_id: studyId,
            "Full Comment": finalMsg,
        });
        return { success: true };
    } catch (error: any) {
        console.error("Error adding activity:", error);
        return { success: false, error: error.message };
    }
}

// --- VERSIONING ---
export async function createStudyVersion(studyId: string, versionName: string, snapshot: any, userId?: string) {
    try {
        await nocodb.create(NOCODB_TABLES.study_versions, {
            technical_studies: studyId, // Confirmed usage: Link column name is technical_studies
            version_name: versionName,
            snapshot_data: JSON.stringify(snapshot),
            created_by: userId || 'System'
        });
        
        await addStudyActivity(studyId, `Versión guardada: ${versionName}`, 'log');
        return { success: true };
    } catch (error: any) {
        console.error("Error creating version:", error);
        return { success: false, error: error.message };
    }
}

export async function getStudyVersions(studyId: string) {
    try {
        const res = await nocodb.list(NOCODB_TABLES.study_versions, {
            where: `(technical_studies,eq,${studyId})`, // Query by Link Column ID
            sort: '-CreatedAt'
        }) as any;
        return { success: true, data: res.list || res || [] }; // Robust pagination
    } catch (error: any) {
        // console.error("Error fetching versions:", error); 
        return { success: false, error: error.message };
    }
}

export async function checkIsFollowing(studyId: string | number, userId: string | number) {
    try {
        // Only if follower table configured
        if (NOCODB_TABLES.study_followers.includes("PLACEHOLDER")) return { success: false };

        const res = await nocodb.list(NOCODB_TABLES.study_followers, {
            where: `(technical_studies,eq,${studyId})~and(users,eq,${userId})`, // Use Link Column Names
            limit: 1
        }) as any;
        const list = res.list || res || [];
        return { success: true, isFollowing: list.length > 0, linkId: list.length > 0 ? list[0].Id : null };
    } catch (error: any) {
        return { success: false, isFollowing: false };
    }
}

export async function followStudy(studyId: string | number, userId: string | number) {
    try {
        if (NOCODB_TABLES.study_followers.includes("PLACEHOLDER")) return { success: false, error: 'Table not configured' };
        
        const check = await checkIsFollowing(studyId, userId);
        if (check.isFollowing) return { success: true }; // Idempotent

        await nocodb.create(NOCODB_TABLES.study_followers, {
            technical_studies: Number(studyId), // Link to Study as Number
            users: Number(userId)               // Link to User as Number
        });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function unfollowStudy(linkId: string | number) {
    try {
        if (NOCODB_TABLES.study_followers.includes("PLACEHOLDER")) return { success: false };
        await nocodb.delete(NOCODB_TABLES.study_followers, linkId);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
