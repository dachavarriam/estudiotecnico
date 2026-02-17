"use server";

import { nocodb } from "@/lib/nocodb";
import { odooProducts, odoo } from "@/lib/odoo"; // Or just use the one we need
// actually odoo-actions has searchProducts which uses odooProducts (the 2nd DB)
import { searchProducts as searchOdooProducts } from '@/actions/odoo-actions';
import { NOCODB_TABLES } from '@/lib/constants';

export interface SupplyItem {
    id: string | number; // Odoo ID (number) or NocoDB ID (string/number)
    name: string;
    unit: string;
    price: number;
    source: "odoo" | "local";
}

export async function searchSupplies(query: string): Promise<{ success: boolean; data?: SupplyItem[]; error?: string }> {
    try {
        console.log(`[searchSupplies] Searching for: "${query}"`);
        const results: SupplyItem[] = [];

        // 1. Search Local NocoDB 'supplies'
        try {
            // NocoDB 'where' syntax: (Column,operator,Value)
            // Check query length to avoid empty searches if needed, or allow listing all?
            // User wants "sacar la lista", maybe if query is empty we list top 10?
            const whereClause = query ? `(name,like,%${query}%)` : undefined;
            
            // Use Table ID instead of Name
            const localList = await nocodb.list(NOCODB_TABLES.supplies, {
                where: whereClause,
                limit: 20,
                sort: '-CreatedAt' // System field is CreatedAt
            }) as any; 
            
            console.log(`[searchSupplies] Local response found ${localList?.list?.length || 0} items`);

            const rows = localList.list || localList; 

            if (Array.isArray(rows)) {
                rows.forEach((item: any) => {
                    results.push({
                        id: item.Id || item.id, 
                        name: item.name,
                        unit: item.Unit || item.unit || "und",
                        price: Number(String(item.Price || item.price).replace(/^[^\d]+/, '').replace(/,/g, '')) || 0,
                        source: "local"
                    });
                    // console.log(`[Debug] Parsed ${item.name}: RawPrice='${item.Price}' -> ${Number(String(item.Price).replace(/[^0-9.]/g, ''))}`);
                });
            }
        } catch (localError) {
             console.error("[searchSupplies] Local search error:", localError);
             // Verify if table exists?
        }

        // 2. Search Odoo Products (Second DB)
        // User said: "no debe buscar precio". Just code and name.
        if (query.length > 2) {
            try {
                const odooRes = await searchOdooProducts(query);
                if (odooRes.success && odooRes.data) {
                    odooRes.data.forEach((p: any) => {
                        results.push({
                            id: p.id,
                            name: `[${p.code}] ${p.name}`, // Combine code in name for display?
                            unit: p.unit || "und",
                            price: 0, // Explicitly 0 as requested "no tiene precio"
                            source: "odoo"
                        });
                    });
                }
            } catch (odooError) {
                console.error("[searchSupplies] Odoo search error:", odooError);
            }
        }

        console.log(`[searchSupplies] Total results: ${results.length}`);
        return { success: true, data: results };
    } catch (error: any) {
        console.error("Error searching supplies:", error);
        return { success: false, error: error.message };
    }
}

export async function createLocalSupply(data: { name: string, price: number, unit: string, category: string }) {
    try {
        // Check if exists first? 
        const existing = await nocodb.list(NOCODB_TABLES.supplies, {
            where: `(name,eq,${data.name})`
        }) as any;

        if (existing.list && existing.list.length > 0) {
            console.log(`Supply ${data.name} already exists locally.`);
            return { success: true, id: existing.list[0].id };
        }

        const newSupply = await nocodb.create(NOCODB_TABLES.supplies, {
            name: data.name,
            Price: data.price,
            Unit: data.unit,
            Category: data.category
        });
        return { success: true, data: newSupply };
    } catch (error) {
        console.error("Error creating local supply:", error);
        return { success: false, error: 'Failed to create' };
    }
}
