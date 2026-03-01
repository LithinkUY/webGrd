import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Metadata } from 'next'
import ShortcodeRenderer from '@/components/cms/ShortcodeRenderer'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = await prisma.page.findUnique({ where: { slug } })

  if (!page || !page.published) return { title: 'Página no encontrada' }

  return {
    title: page.metaTitle || page.title,
    description: page.metaDesc || undefined,
  }
}

export default async function PagePublica({ params }: Props) {
  const { slug } = await params

  const page = await prisma.page.findUnique({ where: { slug } })

  if (!page || !page.published) notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero de la página */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-bold text-gray-900">{page.title}</h1>
          <p className="text-sm text-gray-400 mt-2">
            Última actualización:{' '}
            {new Date(page.updatedAt).toLocaleDateString('es-UY', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <ShortcodeRenderer html={page.content ?? ''} />
        </div>
      </div>
    </div>
  )
}
