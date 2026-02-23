import { NextRequest, NextResponse } from 'next/server';
import ReactPDF from '@react-pdf/renderer';
import { StudyReport } from '@/components/pdf/study-report';
import { z } from 'zod';

const schema = z.object({
  id: z.string(),
  client: z.string(),
  engineer: z.string(),
  date: z.string(),
  materials: z.array(z.object({
    item: z.string(),
    quantity: z.number(),
    unit: z.string().optional(),
    category: z.string().optional(),
    description: z.string().optional(),
  })),
  actions: z.array(z.string()),
  comments: z.array(z.string()),
  images: z.array(z.object({
    url: z.string(),
    tag: z.string()
  })).optional(),
  location: z.string().optional(),
  contact_info: z.string().optional(),
  categories: z.array(z.string()).optional(),
  site_observations: z.string().optional(),
  estimated_hours: z.string().optional(),
  estimated_engineers: z.string().optional(),
  estimated_technicians: z.string().optional(),
  schedule_type: z.string().optional(),
  visit_date: z.string().optional(),
  visit_type: z.string().optional(),
  engineer_plans: z.array(z.object({
    title: z.string(),
    url: z.string()
  })).optional(),
  director_files: z.array(z.object({
    title: z.string(),
    url: z.string()
  })).optional()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const stream = await ReactPDF.renderToStream(<StudyReport data={data} />);
    
    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Estudio-${data.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
