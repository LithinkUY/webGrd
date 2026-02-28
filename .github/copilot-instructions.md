# ImpoTech - Tienda de Tecnología

## Stack
- **Framework**: Next.js 16 (App Router, TypeScript)
- **Styling**: Tailwind CSS
- **Database**: SQLite (dev) / PostgreSQL (prod) via Prisma ORM
- **Auth**: NextAuth.js with credentials provider
- **State**: Zustand (cart)
- **Icons**: Heroicons

## Structure
- `src/app/` - App Router pages and API routes
- `src/components/` - Reusable components
- `src/lib/` - Utilities, Prisma client, auth config
- `src/store/` - Zustand stores
- `prisma/` - Database schema and migrations

## Commands
- `npm run dev` - Development server (port 3000)
- `npx prisma db push` - Push schema to database
- `npx prisma db seed` - Seed initial data
- `npm run build` - Production build
