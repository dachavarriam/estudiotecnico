import dotenv from 'dotenv';
import path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const NOCODB_URL = process.env.NOCODB_URL;
const NOCODB_API_TOKEN = process.env.NOCODB_API_TOKEN;
const NOCODB_PROJECT_ID = process.env.NOCODB_PROJECT_ID;

const headers = {
  'xc-token': NOCODB_API_TOKEN || '',
  'Content-Type': 'application/json',
} as Record<string, string>;

async function request(method: string, path: string) {
  const url = `${NOCODB_URL}/api/v1/db/meta${path}`;
  const res = await fetch(url, { method, headers });
  return res.json();
}

async function main() {
    // 1. Get Table ID for 'study_materials'
    const tablesRes = await request('GET', `/projects/${NOCODB_PROJECT_ID}/tables`);
    const materialsTable = tablesRes.list.find((t: any) => t.table_name === 'study_materials');
    
    if (materialsTable) {
        console.log(`Found study_materials table (${materialsTable.id}). Columns:`);
        const columnsRes = await request('GET', `/projects/${NOCODB_PROJECT_ID}/tables/${materialsTable.id}`);
        console.log('Columns Response:', JSON.stringify(columnsRes, null, 2));
        const cols = columnsRes.list || columnsRes; 
        if (Array.isArray(cols)) {
            cols.forEach((c: any) => {
                console.log(`- ${c.column_name} (Title: ${c.title}, Type: ${c.dt}, UIDT: ${c.uidt})`);
            });
        }
    } else {
        console.error('study_materials table not found');
    }
}

main();
