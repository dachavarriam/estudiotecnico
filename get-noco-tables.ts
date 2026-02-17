
import * as dotenv from 'dotenv';
dotenv.config();

// Manual fetch because importing our lib might fail if it relies on classes/etc not perfect for script
async function listTables() {
    const baseUrl = process.env.NOCODB_URL;
    const apiToken = process.env.NOCODB_API_TOKEN;
    const projectId = process.env.NOCODB_PROJECT_ID;

    console.log(`URL: ${baseUrl}, Project: ${projectId}`);

    try {
        // Endpoint to list tables in a project
        const url = `${baseUrl}/api/v1/db/meta/projects/${projectId}/tables`;
        
        const res = await fetch(url, {
            headers: {
                'xc-token': apiToken || ''
            }
        });

        if (!res.ok) {
            console.error(`Error: ${res.status} ${res.statusText}`);
            console.error(await res.text());
            return;
        }

        const data = await res.json();
        console.log("--- TABLES FOUND ---");
        if (data.list) {
            data.list.forEach((t: any) => {
                console.log(`Name: ${t.title} | ID: ${t.id} | Type: ${t.type}`);
            });
        } else {
            console.log("No 'list' in response", data);
        }

    } catch (e) {
        console.error(e);
    }
}

listTables();
