import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    
    if (!path) return new NextResponse('Missing path', { status: 400 });

    const nocoUrl = process.env.NOCODB_URL;
    const nocoToken = process.env.NOCODB_API_TOKEN;

    if (!nocoUrl || !nocoToken) return new NextResponse('Server config error', { status: 500 });

    try {
        const response = await fetch(`${nocoUrl}/api/v2/storage/download?path=${encodeURIComponent(path)}`, {
            headers: {
                'xc-token': nocoToken
            }
        });

        if (!response.ok) {
            // Also try fetching the raw URL if it's already an absolute http link and NocoDB proxy fails
            if (path.startsWith('http')) {
                const rawRes = await fetch(path);
                if (rawRes.ok) {
                    const buf = await rawRes.arrayBuffer();
                    const hdrs = new Headers();
                    hdrs.set('Content-Type', rawRes.headers.get('Content-Type') || 'application/octet-stream');
                    return new NextResponse(buf, { headers: hdrs });
                }
            }
            throw new Error(`Failed to fetch from NocoDB: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const headers = new Headers();
        headers.set('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');
        
        // Caching for performance
        headers.set('Cache-Control', 'public, max-age=86400');
        
        return new NextResponse(arrayBuffer, { headers });
    } catch (e: any) {
        return new NextResponse(e.message, { status: 500 });
    }
}
