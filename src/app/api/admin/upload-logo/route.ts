import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';

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

    // Validar tipo
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido. Usá PNG, JPG, SVG o WEBP.' }, { status: 400 });
    }

    // Validar tamaño (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo no puede superar 2MB' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const buffer = Buffer.from(await file.arrayBuffer());

    let url: string;

    // Intentar guardar en filesystem (servidor propio)
    try {
      const filename = `logo.${ext}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, filename), buffer);
      url = `/uploads/${filename}?t=${Date.now()}`;
    } catch {
      // Filesystem read-only (Vercel) → guardar en DB y servir via API
      const dataUrl = `data:${file.type};base64,${buffer.toString('base64')}`;
      const key = 'logo_image_file';
      await prisma.siteSetting.upsert({
        where: { key: `file_${key}` },
        update: { value: dataUrl },
        create: { key: `file_${key}`, value: dataUrl },
      });
      url = `/api/file/${key}`;
    }

    // Guardar URL en settings
    await prisma.siteSetting.upsert({
      where: { key: 'logo_image_url' },
      update: { value: url },
      create: { key: 'logo_image_url', value: url },
    });

    return NextResponse.json({ url, success: true });
  } catch (err) {
    console.error('Error subiendo logo:', err);
    return NextResponse.json({ error: 'Error interno al subir el archivo' }, { status: 500 });
  }
}
