
import * as dotenv from 'dotenv';
dotenv.config();
import { nocodb } from "./src/lib/nocodb";

async function test() {
    try {
        console.log("Testing NocoDB Connection...");
        
        // 1. List Tables (to verify name)
        // Usually /api/v1/db/meta/projects/{projectId}/tables
        // But our client is generic. Let's try to just list 'supplies'
        
        console.log("Querying 'supplies' table...");
        const result = await nocodb.list("supplies", { limit: 5 });
        console.log("Result:", JSON.stringify(result, null, 2));
        
        console.log("Querying 'supplies' with search...");
        const searchRes = await nocodb.list("supplies", { where: '(name,like,%%)', limit: 5 });
        console.log("Search Result:", JSON.stringify(searchRes, null, 2));

    } catch (error) {
        console.error("Error:", error);
    }
}

test();
