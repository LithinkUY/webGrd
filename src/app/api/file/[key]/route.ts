import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ key: string }> }
) {
    const { key } = await params;
    try {
        const record = await prisma.siteSetting.findUnique({ where: { key: `file_${key}` } });
        if (!record?.value) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // value is "data:image/jpeg;base64,/9j/..."
        const [meta, b64] = record.value.split(',');
        const mimeType = meta.replace('data:', '').replace(';base64', '');
        const buffer = Buffer.from(b64, 'base64');

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': mimeType,
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Content-Length': String(buffer.length),
            },
        });
    } catch {
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}
