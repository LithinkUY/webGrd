/**
 * ShortcodeRenderer — Server Component
 *
 * Soporta los siguientes shortcodes en el contenido HTML:
 *
 *   [producto slug="mi-producto"]
 *   [producto slug="mi-producto" titulo="Producto destacado"]
 *
 *   [productos categoria="notebooks" limit="4"]
 *   [productos marca="logitech" limit="8"]
 *   [productos destacados="true" limit="4"]
 *
 * Los shortcodes se pueden escribir en el editor de páginas CMS.
 */

import prisma from '@/lib/prisma';
import ProductCard from '@/components/products/ProductCard';

interface Props {
  html: string;
}

// Parsear atributos de un shortcode: slug="valor" → { slug: 'valor' }
function parseAttrs(attrStr: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /(\w+)="([^"]*?)"/g;
  let m;
  while ((m = re.exec(attrStr)) !== null) {
    attrs[m[1]] = m[2];
  }
  return attrs;
}

// Dividir el HTML en segmentos: texto HTML o shortcode
type Segment =
  | { type: 'html'; content: string }
  | { type: 'producto'; slug: string }
  | { type: 'productos'; categorySlug?: string; brandSlug?: string; featured?: boolean; limit: number };

function parseSegments(html: string): Segment[] {
  const segments: Segment[] = [];
  // Regex que matchea [producto ...] y [productos ...]
  const re = /\[productos?\s([^\]]*)\]/gi;
  let last = 0;
  let m;

  while ((m = re.exec(html)) !== null) {
    // HTML anterior al shortcode
    if (m.index > last) {
      segments.push({ type: 'html', content: html.slice(last, m.index) });
    }

    const tag = m[0].toLowerCase().startsWith('[productos') ? 'productos' : 'producto';
    const attrs = parseAttrs(m[1]);

    if (tag === 'producto') {
      segments.push({ type: 'producto', slug: attrs.slug || '' });
    } else {
      segments.push({
        type: 'productos',
        categorySlug: attrs.categoria || attrs.category || undefined,
        brandSlug: attrs.marca || attrs.brand || undefined,
        featured: attrs.destacados === 'true' || attrs.featured === 'true',
        limit: parseInt(attrs.limit || '4', 10),
      });
    }

    last = m.index + m[0].length;
  }

  // HTML restante
  if (last < html.length) {
    segments.push({ type: 'html', content: html.slice(last) });
  }

  return segments;
}

// Tipo mínimo de producto para ProductCard
type ProductForCard = {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  images: string;
  sku: string;
  stock: number;
  isNew: boolean;
  featured: boolean;
  description: string | null;
  category: { name: string } | null;
  brand: { name: string } | null;
};

const productSelect = {
  id: true,
  name: true,
  slug: true,
  price: true,
  comparePrice: true,
  images: true,
  sku: true,
  stock: true,
  isNew: true,
  featured: true,
  description: true,
  category: { select: { name: true } },
  brand: { select: { name: true } },
};

export default async function ShortcodeRenderer({ html }: Props) {
  const segments = parseSegments(html);

  // Recolectar slugs únicos para [producto slug="xxx"]
  const productSlugs = segments
    .filter((s): s is Extract<Segment, { type: 'producto' }> => s.type === 'producto')
    .map(s => s.slug)
    .filter(Boolean);

  // Pre-fetch todos los productos de [producto slug]
  const singleProducts: Record<string, ProductForCard> = {};
  if (productSlugs.length > 0) {
    const found = await prisma.product.findMany({
      where: { slug: { in: productSlugs }, active: true },
      select: productSelect,
    });
    for (const p of found) singleProducts[p.slug] = p;
  }

  // Renderizar segmentos
  const parts: React.ReactNode[] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];

    if (seg.type === 'html') {
      parts.push(
        <div
          key={i}
          className="
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
          dangerouslySetInnerHTML={{ __html: seg.content }}
        />
      );
    } else if (seg.type === 'producto') {
      const p = singleProducts[seg.slug];
      if (p) {
        parts.push(
          <div key={i} className="my-4 max-w-xs">
            <ProductCard product={p} />
          </div>
        );
      } else {
        parts.push(
          <div key={i} className="my-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            ⚠️ Producto no encontrado: <code>{seg.slug}</code>
          </div>
        );
      }
    } else if (seg.type === 'productos') {
      // Fetch dinámico de lista
      const where: Record<string, unknown> = { active: true };
      if (seg.categorySlug) {
        where.category = { slug: seg.categorySlug };
      }
      if (seg.brandSlug) {
        where.brand = { slug: seg.brandSlug };
      }
      if (seg.featured) {
        where.featured = true;
      }

      const list = await prisma.product.findMany({
        where,
        select: productSelect,
        take: seg.limit,
        orderBy: { createdAt: 'desc' },
      });

      if (list.length > 0) {
        parts.push(
          <div key={i} className="my-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {list.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        );
      } else {
        parts.push(
          <div key={i} className="my-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
            No hay productos para mostrar
          </div>
        );
      }
    }
  }

  return <>{parts}</>;
}
