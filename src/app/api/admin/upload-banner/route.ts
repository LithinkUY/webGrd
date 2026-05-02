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

    if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 });

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido. Usá PNG, JPG, WEBP o GIF.' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo no puede superar 5MB' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `banner-${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'banners');

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);

    const url = `/banners/${filename}`;
    return NextResponse.json({ url, success: true });
  } catch (err) {
    console.error('Error subiendo banner:', err);
    return NextResponse.json({ error: 'Error interno al subir el archivo' }, { status: 500 });
  }
}
