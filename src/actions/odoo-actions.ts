'use server';

import { odoo, odooProducts } from '@/lib/odoo';

export async function getClients(query: string = '') {
  try {
    const domain: any[] = [['customer_rank', '>', 0]]; // Standard Odoo filter for customers
    if (query) {
      domain.push(['name', 'ilike', query]);
    }
    
    // Fields to fetch
    const fields = ['id', 'name', 'street', 'city', 'phone', 'email'];
    
    const clients = await odoo.searchRead('res.partner', domain, fields, 20);
    return { success: true, data: clients };
  } catch (error: any) {
    console.error('Error fetching clients from Odoo:', error);
    // Return mock data if connection fails (for development without creds)
    if (process.env.NODE_ENV === 'development' && !process.env.ODOO_URL) {
      return {
        success: true,
        data: [
          { id: 1, name: 'Cliente Mock 1', street: 'Calle Falsa 123', city: 'Tegucigalpa' },
          { id: 2, name: 'Cliente Mock 2', street: 'Av. Siempre Viva 742', city: 'San Pedro Sula' },
        ]
      };
    }
    return { success: false, error: error.message };
  }
}

export async function searchProducts(query: string = '') {
  try {
    const domain: any[] = [['sale_ok', '=', true]];
    if (query) {
      domain.push(['name', 'ilike', query]);
    }
    
    // Fetch product.product to get specific variants if needed, or product.template
    // Usually product.product is better for specific items.
    const fields = ['id', 'name', 'default_code', 'list_price', 'uom_id', 'categ_id'];
    
    const products = await odooProducts.searchRead('product.product', domain, fields, 20);
    
    // Format for UI
    const formatted = products.map((p: any) => ({
        id: p.id,
        name: p.name, // Odoo [id, "Name"] or just "Name"? searchRead returns value.
        code: p.default_code || '',
        unit: p.uom_id ? p.uom_id[1] : 'und', // Odoo returns [id, "Name"] for relations
        category: p.categ_id ? p.categ_id[1] : '',
        price: p.list_price
    }));

    return { success: true, data: formatted };
  } catch (error: any) {
    console.error('Error fetching products from Odoo:', error);
    return { success: false, error: error.message };
  }
}

// Keeping getProducts for backward compatibility if used, but redirecting logic?
// No, the previous getProducts was using 'odoo' (Clients DB). 
// If that was wrong, we replace it. 
// Assuming getProducts was unused or testing. Replacing it.

// Utility to format names
function toTitleCase(str: string) {
  if (!str) return '';
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

export async function getEmployees(query: string = '') {
  try {
    // Filter by Engineering/Operations department if possible
    // Using a broad filter for now or just searching by name
    const domain: any[] = [];
    
    // Add department filter if known (e.g., 'department_id.name', 'ilike', 'Ingenier')
    // creating a flexible search
    if (query) {
        domain.push(['name', 'ilike', query]);
    }

    const fields = ['id', 'name', 'work_email', 'job_title', 'department_id'];
    
    // Fetch from Odoo
    const employees = await odoo.searchRead('hr.employee', domain, fields, 20);
    
    // Format names
    const formatted = employees.map((emp: any) => ({
        ...emp,
        name: toTitleCase(emp.name),
        original_name: emp.name
    }));
    
    return { success: true, data: formatted };
  } catch (error: any) {
    console.error('Error fetching employees from Odoo:', error);
    // Mock for dev
    if (process.env.NODE_ENV === 'development' && !process.env.ODOO_URL) {
       return {
         success: true,
         data: [
            { id: 101, name: 'Juan Perez', job_title: 'Ingeniero de Campo' },
            { id: 102, name: 'Maria Rodriguez', job_title: 'Jefe de Operaciones' }
         ]
       }
    }
    return { success: false, error: error.message };
  }
}
