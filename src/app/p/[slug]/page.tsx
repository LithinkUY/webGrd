import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Metadata } from 'next'

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
        <div
          className="
            bg-white rounded-xl border border-gray-200 p-8
            prose prose-slate max-w-none
            [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-6 [&_h2]:mb-3
            [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-800 [&_h3]:mt-4 [&_h3]:mb-2
            [&_p]:text-gray-700 [&_p]:leading-relaxed [&_p]:mb-3
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:text-gray-700
            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_ol]:text-gray-700
            [&_li]:mb-1
            [&_strong]:font-semibold [&_strong]:text-gray-900
            [&_a]:text-blue-600 [&_a]:hover:underline
            [&_hr]:border-gray-200 [&_hr]:my-6
            [&_blockquote]:border-l-4 [&_blockquote]:border-blue-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600
            [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm
            [&_th]:bg-gray-50 [&_th]:border [&_th]:border-gray-200 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-medium
            [&_td]:border [&_td]:border-gray-200 [&_td]:px-3 [&_td]:py-2
          "
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </div>
    </div>
  )
}
