import dotenv from 'dotenv';
import path from 'path';

// Load env from web/.env
const envPath = path.resolve(process.cwd(), '.env');
console.log(`Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });

const NOCODB_URL = process.env.NOCODB_URL;
const NOCODB_API_TOKEN = process.env.NOCODB_API_TOKEN;
const NOCODB_PROJECT_ID = process.env.NOCODB_PROJECT_ID;

if (!NOCODB_URL || !NOCODB_API_TOKEN || !NOCODB_PROJECT_ID) {
  console.error('Missing NocoDB credentials in .env');
  process.exit(1);
}

const headers = {
  'xc-token': NOCODB_API_TOKEN,
  'Content-Type': 'application/json',
};

async function request(method: string, path: string, body?: any) {
  const url = `${NOCODB_URL}/api/v1/db/meta${path}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (!res.ok) {
    const text = await res.text();
    // Ignore if already exists (sometimes returns 400 or 409)
    if (text.includes('Duplicate') || text.includes('already exists')) {
        console.warn(`Warning: Resource might already exist at ${path}`);
        return null;
    }
    throw new Error(`API Error ${res.status}: ${text}`);
  }
  return res.json();
}

async function getTables() {
  const res = await request('GET', `/projects/${NOCODB_PROJECT_ID}/tables`);
  return res.list || []; // returns { list: [...] }
}

async function createTable(name: string, titleColumnName: string) {
  console.log(`Creating table: ${name}...`);
  return request('POST', `/projects/${NOCODB_PROJECT_ID}/tables`, {
    table_name: name,
    title: name,
    columns: [
      {
        column_name: titleColumnName,
        title: titleColumnName,
        dt: 'text',
        pv: true, // primary value (Title)
        rq: true, // required
      }
    ]
  });
}

async function createColumn(tableId: string, col: any) {
  try {
     await request('POST', `/tables/${tableId}/columns`, col);
     console.log(`  Added column: ${col.column_name}`);
  } catch (e: any) {
      console.warn(`  Skipping column ${col.column_name}: ${e.message}`);
  }
}

async function main() {
  console.log('Starting NocoDB Schema Validation/Creation...');
  
  const existingTables = await getTables();
  const tables: Record<string, string> = {}; // Name -> ID

  // 1. Create Tables
  const schema = [
    { name: 'users', title: 'email' },
    { name: 'technical_studies', title: 'study_identifier' }, // We'll link to Client later
    { name: 'study_materials', title: 'item' },
    { name: 'study_photos', title: 'tag' },
    { name: 'study_actions', title: 'action' },
    { name: 'study_comments', title: 'comment_summary' },
    { name: 'study_comments', title: 'comment_summary' },
    { name: 'voice_notes', title: 'note_id' },
    { name: 'supplies', title: 'name' } // New Local Supplies DB
  ];

  for (const t of schema) {
    const existing = existingTables.find((et: any) => et.table_name === t.name);
    if (existing) {
      console.log(`Table ${t.name} already exists (ID: ${existing.id})`);
      tables[t.name] = existing.id;
    } else {
      const newTable = await createTable(t.name, t.title);
      if (newTable) {
          console.log(`Table ${t.name} created (ID: ${newTable.id})`);
          tables[t.name] = newTable.id;
      }
    }
  }

  // 2. Create Simple Columns
  
  // Users
  if (tables['users']) {
    await createColumn(tables['users'], { column_name: 'name', title: 'Name', dt: 'text' });
    await createColumn(tables['users'], { column_name: 'role', title: 'Role', dt: 'text' }); // Could be SingleSelect
    await createColumn(tables['users'], { column_name: 'slack_id', title: 'Slack ID', dt: 'text' });
  }

  // Technical Studies
  if (tables['technical_studies']) {
    await createColumn(tables['technical_studies'], { column_name: 'client_id', title: 'Client ID', dt: 'int' });
    await createColumn(tables['technical_studies'], { column_name: 'client_name', title: 'Client Name', dt: 'text' });
    await createColumn(tables['technical_studies'], { column_name: 'status', title: 'Status', dt: 'text' }); // Could be SingleSelect
    await createColumn(tables['technical_studies'], { column_name: 'date', title: 'Date', dt: 'date' });
    await createColumn(tables['technical_studies'], { column_name: 'pdf_url', title: 'PDF URL', dt: 'text' });
    
    // New Fields (Phase 2)
    await createColumn(tables['technical_studies'], { column_name: 'location', title: 'Location', dt: 'text' });
    await createColumn(tables['technical_studies'], { column_name: 'contact_info', title: 'Contact Info', dt: 'text' });
    await createColumn(tables['technical_studies'], { column_name: 'study_type', title: 'Study Type', dt: 'text' }); // Could be dropdown in Noco, keeping simple text for now
    await createColumn(tables['technical_studies'], { column_name: 'site_observations', title: 'Site Observations', dt: 'longtext' });
  }
  
  // Study Materials
  if (tables['study_materials']) {
    await createColumn(tables['study_materials'], { column_name: 'quantity', title: 'Quantity', dt: 'int' });
    await createColumn(tables['study_materials'], { column_name: 'unit', title: 'Unit', dt: 'text' });
    await createColumn(tables['study_materials'], { column_name: 'category', title: 'Category', dt: 'text' });
    await createColumn(tables['study_materials'], { column_name: 'description', title: 'Description', dt: 'longtext' });
  }
  
  // Study Photos
  if (tables['study_photos']) {
      await createColumn(tables['study_photos'], { column_name: 'photo', title: 'Photo', dt: 'attachment' });
      await createColumn(tables['study_photos'], { column_name: 'photo_url', title: 'Photo URL', dt: 'text' });
  }
  
  // Voice Notes
  if (tables['voice_notes']) {
      await createColumn(tables['voice_notes'], { column_name: 'transcription', title: 'Transcription', dt: 'longtext' });
      await createColumn(tables['voice_notes'], { column_name: 'audio_file', title: 'Audio File', dt: 'attachment' });
      await createColumn(tables['voice_notes'], { column_name: 'audio_url', title: 'Audio URL', dt: 'text' });
  }
  
  // Study Actions (Title is action, no extra needed maybe?)
  
  // Study Comments (Title is summary)
  if (tables['study_comments']) {
      await createColumn(tables['study_comments'], { column_name: 'full_comment', title: 'Full Comment', dt: 'longtext' });
  }

  // Supplies (Local DB)
  if (tables['supplies']) {
      await createColumn(tables['supplies'], { column_name: 'price', title: 'Price', dt: 'decimal' }); // or currency
      await createColumn(tables['supplies'], { column_name: 'unit', title: 'Unit', dt: 'text' });
      await createColumn(tables['supplies'], { column_name: 'category', title: 'Category', dt: 'text' });
  }

  // 3. Create Links (Relationships)
  // These are harder via API as schema varies by version. 
  // Standard V1: POST /api/v1/db/meta/tables/{tableId}/columns with uidt: 'LinkToAnotherRecord'
  
  const createLink = async (sourceTable: string, targetTable: string, type: 'hm' | 'bt') => {
      // hm: HasMany, bt: BelongsTo
      // NocoDB naming for Link: 'LinkToAnotherRecord'
      if (!tables[sourceTable] || !tables[targetTable]) return;
      
      console.log(`Linking ${sourceTable} -> ${targetTable}...`);
      
      const colName = type === 'bt' ? `${targetTable}_id` : `${targetTable}_list`; // Simplified naming
      
      try {
        await request('POST', `/tables/${tables[sourceTable]}/columns`, {
            column_name: colName,
            title: colName,
            uidt: 'LinkToAnotherRecord',
            dt: 'data',
            parentId: tables[sourceTable], 
            childId: tables[targetTable],
            type: type,
            rd: {
                childTableId: tables[targetTable],
                type: type 
            }
        });
        console.log(`  Linked ${sourceTable} to ${targetTable} (${type})`);
      } catch (e: any) {
          console.warn(`Link creation skipped: ${e.message}`);
      }
  };

  // Technical Studies links
  // await createLink('technical_studies', 'users', 'bt'); // Failed 500
  // Invert: Users has many Studies (link created on Users table)
  await createLink('users', 'technical_studies', 'hm');
  
  // Children of Study
  await createLink('technical_studies', 'study_materials', 'hm');
  await createLink('technical_studies', 'study_photos', 'hm');
  await createLink('technical_studies', 'study_actions', 'hm');
  await createLink('technical_studies', 'study_comments', 'hm');
  await createLink('technical_studies', 'voice_notes', 'hm'); // Study has many voice notes

  console.log('Done!');
}

main().catch(console.error);
