import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

async function isAdmin() {
    const session = await getServerSession(authOptions);
    return session?.user?.role === 'admin' || session?.user?.role === 'store_admin';
}

export async function POST(req: NextRequest) {
    if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const productId = formData.get('productId') as string | null;

        if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 });

        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Tipo no permitido. Usá PNG, JPG, WEBP o GIF.' }, { status: 400 });
        }
        if (file.size > 8 * 1024 * 1024) {
            return NextResponse.json({ error: 'El archivo no puede superar 8MB' }, { status: 400 });
        }

        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const prefix = productId ? `prod-${productId.slice(-6)}` : 'prod';
        const filename = `${prefix}-${Date.now()}.${ext}`;
        const uploadDir = path.join(process.cwd(), 'public', 'products');

        if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });

        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(path.join(uploadDir, filename), buffer);

        return NextResponse.json({ url: `/products/${filename}`, success: true });
    } catch (err) {
        console.error('Error subiendo imagen de producto:', err);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
