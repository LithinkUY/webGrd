import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const page = await prisma.page.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      content: true,
      metaTitle: true,
      metaDesc: true,
      published: true,
    },
  })

  if (!page || !page.published) {
    return NextResponse.json({ error: 'Página no encontrada' }, { status: 404 })
  }

  return NextResponse.json(page)
}
