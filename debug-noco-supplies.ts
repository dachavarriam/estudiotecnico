
import * as dotenv from 'dotenv';
dotenv.config();

// We need to use the actual table ID we found earlier
const SUPPLIES_TABLE_ID = "mlbjb58ncfdytw8"; 

async function debugSupplies() {
    const baseUrl = process.env.NOCODB_URL;
    const apiToken = process.env.NOCODB_API_TOKEN;
    const projectId = process.env.NOCODB_PROJECT_ID;

    console.log(`Fetching from: ${baseUrl}/api/v1/db/data/noco/${projectId}/${SUPPLIES_TABLE_ID}`);

    try {
        const url = `${baseUrl}/api/v1/db/data/noco/${projectId}/${SUPPLIES_TABLE_ID}?limit=5`;
        
        const res = await fetch(url, {
            headers: {
                'xc-token': apiToken || '',
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            console.error(`Error: ${res.status} ${res.statusText}`);
            console.error(await res.text());
            return;
        }

        const data = await res.json();
        console.log("--- RAW RESPONSE SAMPLE (First Item) ---");
        if (data.list && data.list.length > 0) {
            const item = data.list[0];
            console.log(JSON.stringify(item, null, 2));

            console.log("\n--- PARSING TEST (Revised) ---");
            const rawPrice = item.Price || item.price;
            // 1. Remove leading non-digits (L., $, spaces)
            // 2. Remove commas (assuming they are thousands separators in this locale)
            const cleanPriceStr = String(rawPrice).replace(/^[^\d]+/, '').replace(/,/g, '');
            const finalPrice = Number(cleanPriceStr);
            
            console.log(`Raw Price: '${rawPrice}'`);
            console.log(`Cleaned String: '${cleanPriceStr}'`);
            console.log(`Final Number: ${finalPrice}`);
            console.log(`Is NaN?: ${isNaN(finalPrice)}`);
        } else {
            console.log("No items found or different structure:", data);
        }

    } catch (e) {
        console.error(e);
    }
}

debugSupplies();
