
const https = require('https');
require('dotenv').config({ path: '.env' });

const BASE_URL = process.env.NOCODB_URL;
const API_TOKEN = process.env.NOCODB_API_TOKEN;
// Get project ID dynamically or use env? Usually easier to list projects first.
// But we have NOCODB_PROJECT_ID in env? Let's check.
const PROJECT_ID = process.env.NOCODB_PROJECT_ID; 

async function getTables() {
    const res = await fetch(`${BASE_URL}/api/v1/db/meta/projects/${PROJECT_ID}/tables`, {
        headers: { 'xc-token': API_TOKEN }
    });
    const data = await res.json();
    return data.list;
}

async function createColumn(tableId, columnData) {
    console.log(`Creating column ${columnData.title} in table ${tableId}...`);
    const res = await fetch(`${BASE_URL}/api/v1/db/meta/tables/${tableId}/columns`, {
        method: 'POST',
        headers: { 
            'xc-token': API_TOKEN,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(columnData)
    });
    if (!res.ok) {
        const txt = await res.text();
        console.error(`Failed to create ${columnData.title}:`, txt);
    } else {
        console.log(`Success: ${columnData.title}`);
    }
}

async function main() {
    if (!PROJECT_ID) {
        console.error("NOCODB_PROJECT_ID missing in .env");
        return;
    }

    console.log("Fetching tables...");
    const tables = await getTables();
    
    const studiesTable = tables.find(t => t.title === 'technical_studies');
    const materialsTable = tables.find(t => t.title === 'study_materials');

    if (!studiesTable) {
        console.error("technical_studies table not found!");
        return;
    }

    // 1. Add Columns to technical_studies
    // visit_type (SingleSelect)
    await createColumn(studiesTable.id, {
        title: 'visit_type',
        column_name: 'visit_type',
        uidt: 'SingleSelect',
        colOptions: {
            options: [
                { title: 'Visita Técnica', color: '#ecc94b' },
                { title: 'Remoto/Plano', color: '#4299e1' }
            ]
        }
    });

    // visit_date (DateTime)
    await createColumn(studiesTable.id, {
        title: 'visit_date',
        column_name: 'visit_date',
        uidt: 'DateTime'
    });

    // estimated_hours (Decimal)
    await createColumn(studiesTable.id, {
        title: 'estimated_hours',
        column_name: 'estimated_hours',
        uidt: 'Decimal',
        meta: {
            precision: 10,
            scale: 2
        }
    });
    
    // estimated_technicians (Number)
    await createColumn(studiesTable.id, {
        title: 'estimated_technicians',
        column_name: 'estimated_technicians',
        uidt: 'Number'
    });

    // schedule_type (SingleSelect)
    await createColumn(studiesTable.id, {
        title: 'schedule_type',
        column_name: 'schedule_type',
        uidt: 'SingleSelect',
        colOptions: {
            options: [
                { title: 'Ordinario', color: '#48bb78' },
                { title: 'Extraordinario', color: '#ed8936' },
                { title: 'Fin de Semana', color: '#f56565' }
            ]
        }
    });

    // director_files (Attachment)
    await createColumn(studiesTable.id, {
        title: 'director_files',
        column_name: 'director_files',
        uidt: 'Attachment'
    });

    // engineer_plans (Attachment)
    await createColumn(studiesTable.id, {
        title: 'engineer_plans',
        column_name: 'engineer_plans',
        uidt: 'Attachment'
    });

    // categories (MultiSelect) - Or simple Text/JSON if problematic. Trying MultiSelect.
    // NocoDB MultiSelect requires options defined upfront usually, or allows dynamic?
    // Let's use JSON for flexibility if we want dynamic tags, or MultiSelect with preset categories.
    // User asked "mas de una categoria".
    // Let's create MultiSelect with standard categories for now.
    await createColumn(studiesTable.id, {
        title: 'categories',
        column_name: 'categories',
        uidt: 'MultiSelect',
        colOptions: {
            options: [
                { title: 'CCTV', color: '#4299e1' },
                { title: 'Control de Acceso', color: '#48bb78' },
                { title: 'Cableado Estructurado', color: '#ed8936' },
                { title: 'Detección de Incendio', color: '#f56565' },
                { title: 'Alarma de Intrusión', color: '#9f7aea' },
                { title: 'Networking', color: '#38b2ac' }
            ]
        }
    });


    // 2. Add Section to study_materials
    if (materialsTable) {
        await createColumn(materialsTable.id, {
            title: 'section',
            column_name: 'section',
            uidt: 'SingleLineText', // Simple text for grouping
            dt: 'varchar(255)'
        });
    } else {
        console.error("study_materials table not found!");
    }

    console.log("Schema updates complete.");
}

main();
