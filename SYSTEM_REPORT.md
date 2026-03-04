# ImpoTech - Plataforma de E-Commerce Profesional
## Informe Técnico Completo del Sistema

---

## 1. RESUMEN EJECUTIVO

**ImpoTech** es una plataforma de comercio electrónico de nivel enterprise construida con tecnologías modernas de última generación. Incluye tienda pública, panel administrativo completo, sincronización con proveedores mayoristas, integración con sistemas de pago y un sistema de gestión de contenidos (CMS) totalmente personalizable.

**Versión actual:** 1.0.0  
**Fecha:** Marzo 2026  
**Estado:** Producción  
**URL Producción:** https://web-grd.vercel.app

---

## 2. STACK TECNOLÓGICO

### Frontend
| Tecnología | Versión | Descripción |
|-----------|---------|-------------|
| **Next.js** | 16.1.6 | Framework React con App Router, SSR y SSG |
| **TypeScript** | 5.x | Tipado estático para mayor seguridad |
| **Tailwind CSS** | 3.x | Sistema de diseño utility-first |
| **Zustand** | 5.x | Gestión de estado global (carrito) |
| **Heroicons** | 2.x | Librería de iconos SVG |
| **React Hot Toast** | 2.x | Notificaciones UI |

### Backend / API
| Tecnología | Versión | Descripción |
|-----------|---------|-------------|
| **Next.js API Routes** | 16.1.6 | API REST integrada en el mismo proyecto |
| **Prisma ORM** | 5.22.0 | ORM type-safe para base de datos |
| **NextAuth.js** | 4.x | Autenticación segura con JWT |
| **bcryptjs** | - | Encriptación de contraseñas |
| **Slugify** | - | Generación de URLs amigables |

### Base de Datos
| Tecnología | Descripción |
|-----------|-------------|
| **PostgreSQL** | Motor de base de datos relacional (producción) |
| **Neon** | PostgreSQL serverless en la nube con branching |
| **SQLite** | Base de datos local para desarrollo |

### Infraestructura / Deployment
| Servicio | Descripción |
|---------|-------------|
| **Vercel** | Hosting con deploy automático desde Git |
| **Neon PostgreSQL** | Base de datos serverless en AWS us-east-1 |
| **GitHub** | Control de versiones y CI/CD |
| **GitHub Actions** | Pipelines de CI/CD automatizados |
| **Dependabot** | Actualizaciones automáticas de seguridad |

### Integraciones Externas
| Integración | Descripción |
|------------|-------------|
| **MercadoPago** | Pasarela de pago principal |
| **WooCommerce REST API** | Sincronización con tiendas WooCommerce |
| **SOAP Web Services** | Sincronización con proveedores mayoristas (CDR Medios / Sublime) |
| **Google Gemini AI** | Asistente IA para el panel admin |
| **WooCommerce Webhooks** | Sincronización en tiempo real de productos |

---

## 3. ARQUITECTURA DEL SISTEMA

```
┌─────────────────────────────────────────────────────┐
│                    CLIENTE                           │
│         Navegador Web / Dispositivo Móvil            │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────┐
│                    VERCEL CDN                        │
│              (Edge Network Global)                   │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│              NEXT.JS APPLICATION                     │
│  ┌─────────────────┐  ┌────────────────────────────┐│
│  │  App Router     │  │      API Routes            ││
│  │  (SSR / SSG)    │  │   /api/public/*            ││
│  │                 │  │   /api/admin/*             ││
│  │  - Tienda       │  │   /api/auth/*              ││
│  │  - Admin Panel  │  │   /api/webhooks/*          ││
│  │  - Auth         │  │   /api/search              ││
│  └─────────────────┘  └────────────────────────────┘│
└──────────────────────┬──────────────────────────────┘
                       │ Prisma ORM
┌──────────────────────▼──────────────────────────────┐
│           NEON POSTGRESQL (Serverless)               │
│              AWS us-east-1                           │
│         + Branch system (backups)                    │
└─────────────────────────────────────────────────────┘
```

---

## 4. MÓDULOS Y FUNCIONALIDADES

### 4.1 TIENDA PÚBLICA

#### Página Principal
- Hero dinámico con slides configurables desde admin
- Sección de productos destacados
- Banners promocionales personalizables
- Categorías con imágenes
- Marcas destacadas
- Footer con información de contacto configurable

#### Catálogo de Productos
- Listado con filtros por categoría, marca, precio, stock
- Paginación infinita
- Ordenamiento (precio, novedad, popularidad)
- Vista grilla / lista
- Breadcrumbs de navegación

#### Buscador Dinámico (tipo MercadoLibre)
- Búsqueda en tiempo real con debounce 300ms
- Resultados con foto, precio, stock, marca
- Navegación con teclado (flechas + Enter)
- Insensible a mayúsculas/minúsculas (PostgreSQL)
- Búsqueda en: nombre, SKU, descripción, tags

#### Página de Producto
- Galería de imágenes con zoom
- Precio con descuento
- Indicador de stock
- Selector de cantidad
- Botón agregar al carrito
- Especificaciones técnicas
- Productos relacionados

#### Carrito de Compras
- Persistencia con Zustand (localStorage)
- Agregar/remover/modificar cantidades
- Subtotal en tiempo real
- Aplicación de cupones de descuento
- Resumen del pedido

#### Checkout
- Formulario de datos de envío
- Selección de método de pago
- Integración MercadoPago (redirect)
- Confirmación de pedido

#### Mi Cuenta
- Login / Registro
- Historial de pedidos
- Estado de pedidos en tiempo real
- Datos personales
- Direcciones guardadas

---

### 4.2 PANEL ADMINISTRADOR

#### Dashboard
- Resumen de ventas del día/mes
- Gráficos de ingresos (Recharts)
- Pedidos recientes
- Productos con bajo stock
- Estadísticas generales

#### Gestión de Productos
- CRUD completo (crear/editar/eliminar)
- Upload de múltiples imágenes
- Editor de descripción rica
- Gestión de stock y precios
- Precios de costo, venta y comparación
- Tags y SEO
- Activar/desactivar productos
- Historial de precios (PriceBackup)

#### Gestión de Pedidos
- Lista completa con filtros por estado
- Detalle de pedido con timeline
- Cambio de estado (pendiente → procesando → enviado → entregado)
- Crear pedidos manuales
- Gestión de devoluciones
- Historial de pagos

#### Gestión de Clientes
- Lista de usuarios registrados
- Detalle de cliente con historial de compras
- Cambio de contraseña
- Roles (admin / cliente)

#### Cupones de Descuento
- CRUD completo de cupones
- Tipos: porcentaje o monto fijo
- Fecha de vencimiento
- Límite de usos
- Mínimo de compra

#### Informes y Estadísticas
- Ventas por período
- Productos más vendidos
- Clientes frecuentes
- Exportación de datos

#### Sincronización con Proveedor (SOAP)
- Configuración de credenciales (URL, email, token)
- Sincronización de catálogo completo
- Sincronización incremental por fecha
- Probar conexión con diagnóstico
- Log de sincronizaciones
- Detección automática de errores SOAP

#### Integración WooCommerce
- Sincronización desde tiendas WooCommerce
- Autenticación con Consumer Key/Secret
- Mapeo automático de campos
- Webhooks para sync en tiempo real
- Generador de webhook secret
- Panel de configuración de webhook URL

#### Gestión de Categorías
- Árbol de categorías con drag & drop
- Imágenes por categoría
- Activar/desactivar

#### Gestión de Marcas
- CRUD completo
- Logo por marca
- Filtrado en tienda

#### Gestión de Menú
- Constructor de menú visual
- Múltiples niveles
- Links internos y externos
- Orden personalizable

#### CMS - Páginas
- Editor de páginas estáticas
- Slug personalizable
- SEO meta tags

#### Apariencia / Personalización
- Logo (texto + imagen + colores)
- Colores primario y secundario
- Hero slides (imágenes, títulos, CTAs)
- Información del footer
- Datos de contacto
- Información bancaria

#### Configuración de Pagos
- MercadoPago (Access Token, modo test/producción)
- Múltiples métodos de pago
- Configuración de webhook de pagos

#### Super Admin
- Gestión de usuarios administradores
- Configuración global del sistema
- Variables de sistema

#### Asistente IA (Google Gemini)
- Chat integrado en el panel admin
- Responde preguntas sobre el negocio
- Usa la API de Google Gemini

---

### 4.3 API REST COMPLETA

**Endpoints públicos:**
- `GET /api/public/products` — catálogo con filtros
- `GET /api/public/products/[slug]` — detalle producto
- `GET /api/public/categories` — árbol de categorías
- `GET /api/public/brands` — marcas activas
- `GET /api/public/menu` — menú de navegación
- `GET /api/public/settings` — configuración pública
- `GET /api/search` — búsqueda de productos
- `POST /api/cart/validate` — validar carrito
- `POST /api/coupons/validate` — validar cupón

**Endpoints admin (autenticados):**
- `/api/admin/products` — CRUD productos
- `/api/admin/orders` — gestión pedidos
- `/api/admin/users` — gestión usuarios
- `/api/admin/categories` — gestión categorías
- `/api/admin/brands` — gestión marcas
- `/api/admin/coupons` — gestión cupones
- `/api/admin/reports` — informes
- `/api/admin/provider-sync` — sync SOAP proveedor
- `/api/admin/api-sources` — CRUD fuentes API
- `/api/admin/ai-chat` — asistente IA

**Webhooks:**
- `POST /api/webhooks/woocommerce/[sourceId]` — recibir updates WooCommerce
- `POST /api/webhooks/mercadopago` — notificaciones de pago

---

## 5. BASE DE DATOS

### Esquema (23 modelos)

| Modelo | Descripción |
|--------|-------------|
| **User** | Usuarios (admin + clientes) con roles |
| **Address** | Direcciones de envío por usuario |
| **Category** | Árbol de categorías de productos |
| **MenuItem** | Ítems del menú de navegación |
| **Brand** | Marcas de productos |
| **ProductType** | Tipos/familias de productos |
| **Product** | Catálogo de productos |
| **ProductImage** | Galería de imágenes por producto |
| **Order** | Pedidos de clientes |
| **OrderItem** | Ítems de cada pedido |
| **Payment** | Pagos y transacciones |
| **Return** | Devoluciones |
| **CartItem** | Items guardados en carrito |
| **Review** | Reseñas de productos |
| **StockMovement** | Historial de movimientos de stock |
| **ApiSource** | Configuración de APIs externas |
| **SyncLog** | Log de sincronizaciones |
| **SiteSetting** | Configuración general del sitio |
| **PaymentConfig** | Configuración de métodos de pago |
| **Page** | Páginas CMS estáticas |
| **PriceBackup** | Historial de cambios de precios |
| **Coupon** | Cupones de descuento |

### Backup y Seguridad
- **Branching automático** con Neon (copias instantáneas)
- Backups nombrados antes de cada migración importante
- Historial de precios preservado (PriceBackup)

---

## 6. SEGURIDAD

| Medida | Implementación |
|--------|---------------|
| **Autenticación** | NextAuth.js con JWT + bcrypt |
| **Autorización** | Middleware de roles en cada API route |
| **HTTPS** | Forzado en producción (Vercel) |
| **Webhook HMAC** | Verificación SHA-256 en webhooks WooCommerce |
| **Variables de entorno** | Secrets en Vercel, nunca en código |
| **SQL Injection** | Imposible gracias a Prisma ORM |
| **XSS** | Sanitización automática de React |
| **Dependabot** | Actualizaciones automáticas de seguridad |
| **npm audit** | Revisión semanal de vulnerabilidades |

---

## 7. AUTOMATIZACIÓN Y CI/CD

### Pipeline de Deploy
```
Developer Push → GitHub → GitHub Actions (CI) → Vercel Deploy
                              ↓
                    ✅ Build OK → Deploy automático
                    ❌ Build Fail → Notificación + bloqueo
```

### GitHub Actions Configurados
1. **CI Build Check** — en cada push/PR:
   - TypeScript type check
   - ESLint
   - Build de producción
   - Bloquea deploy si falla

2. **Weekly Health Check** — cada lunes 8AM:
   - Verifica que la web responde (HTTP 200)
   - Verifica que la API funciona
   - Audit de vulnerabilidades npm
   - Crea Issue automático si hay problemas

3. **Dependabot** — cada lunes:
   - PRs automáticos para actualizar npm
   - PRs para actualizar GitHub Actions
   - Agrupa actualizaciones relacionadas

---

## 8. RENDIMIENTO

| Métrica | Valor |
|---------|-------|
| **Páginas generadas** | 65 rutas estáticas/dinámicas |
| **Tiempo de build** | ~27 segundos |
| **Time to First Byte** | <200ms (Vercel Edge) |
| **Buscador** | Debounce 300ms, resultados <500ms |
| **DB Queries** | Optimizadas con Prisma selects |
| **Imágenes** | Lazy loading automático |

---

## 9. ESCALABILIDAD

El sistema está diseñado para crecer:

- **Multi-tienda:** La arquitectura permite agregar múltiples tiendas con una sola base de código
- **Multi-proveedor:** Soporta N fuentes de datos (SOAP + WooCommerce + APIs genéricas)
- **Serverless:** Vercel escala automáticamente a demanda
- **DB Serverless:** Neon escala sin configuración manual
- **API-first:** Todo está disponible vía API para integraciones futuras

---

## 10. PARA VENDER EL SISTEMA

### Entregables
- ✅ Código fuente completo (repositorio Git)
- ✅ Base de datos lista con datos de ejemplo
- ✅ Documentación técnica (este documento)
- ✅ Guía de deployment en Vercel + Neon
- ✅ Panel admin con usuario inicial configurado
- ✅ Integración con MercadoPago lista para activar
- ✅ Integración SOAP con proveedor lista
- ✅ Integración WooCommerce lista

### Requisitos para instalar
| Requisito | Costo |
|-----------|-------|
| Cuenta GitHub | Gratis |
| Cuenta Vercel (Hobby) | Gratis |
| Cuenta Neon (Free tier) | Gratis |
| Dominio propio | ~$10-15/año |
| Cuenta MercadoPago | Gratis (comisión por venta) |

### Opciones de Licencia sugeridas
| Modalidad | Descripción |
|-----------|-------------|
| **Licencia única** | Pago único por el código fuente |
| **SaaS mensual** | Vos hosteás, cliente paga mensualidad |
| **Setup + mantenimiento** | Instalación + soporte mensual |

---

## 11. CREDENCIALES DE ACCESO (DEMO)

| Dato | Valor |
|------|-------|
| URL Admin | https://web-grd.vercel.app/admin |
| Email | admin@tiendatech.uy |
| Contraseña | admin123 |

> ⚠️ Cambiar credenciales antes de entregar a cliente

---

*Documento generado automáticamente — ImpoTech v1.0 — Marzo 2026*
