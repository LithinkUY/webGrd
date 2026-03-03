import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'admin';
}

// PUT /api/admin/users/[id]/password
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id } = await params;

  try {
    const { password } = await req.json();
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id },
      data: { password: hash },
    });

    return NextResponse.json({ success: true, message: 'Contraseña actualizada' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al actualizar contraseña';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
