# Lucky Vacations 🌊

Plataforma de rifas para estancias vacacionales premium.

---

## Setup en tu Mac — paso a paso

### 1. Descargar y abrir el proyecto

```bash
# Abre Terminal y navega a tu carpeta de proyectos
cd ~/Desktop

# Entra al proyecto
cd luckyvacations
```

### 2. Instalar dependencias

```bash
npm install
```

Esto descarga todos los paquetes necesarios. Tarda 1-2 minutos.

### 3. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Luego abre `.env.local` con cualquier editor de texto y llena:
- `NEXT_PUBLIC_SUPABASE_URL` → lo encuentras en supabase.com → tu proyecto → Settings → API
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → mismo lugar
- Las claves de Stripe → dashboard.stripe.com → Developers → API Keys

### 4. Correr en local

```bash
npm run dev
```

Abre tu navegador en: **http://localhost:3000**

¡Tu plataforma está corriendo! 🎉

---

## Publicar en Vercel

### 1. Subir a GitHub

```bash
git init
git add .
git commit -m "Initial Lucky Vacations"
```

Crea un repo en github.com → New repository → "luckyvacations"

```bash
git remote add origin https://github.com/TU_USUARIO/luckyvacations.git
git push -u origin main
```

### 2. Conectar con Vercel

1. Ve a vercel.com
2. "Add New Project" → importa tu repo de GitHub
3. En "Environment Variables" agrega las mismas variables de tu `.env.local`
4. Click "Deploy"

En 2 minutos tienes tu URL pública.

### 3. Conectar tu dominio

1. En Vercel → tu proyecto → Settings → Domains
2. Agrega tu dominio (ej. luckyvacations.com)
3. Vercel te da 2 registros DNS
4. Ve a Namecheap → tu dominio → Advanced DNS → agrega esos registros
5. En 24 hrs tu sitio vive en tu dominio

---

## Configurar la base de datos

1. Ve a supabase.com → tu proyecto → SQL Editor
2. Abre el archivo `supabase-schema.sql` de este proyecto
3. Copia todo el contenido y pégalo en el editor
4. Click "Run"

Las tablas están listas: users, properties, raffles, tickets, transactions.

---

## Páginas disponibles

| URL | Página |
|-----|--------|
| `/` | Landing page |
| `/raffles` | Todas las rifas |
| `/raffle/beach-house-san-carlos` | Rifa San Carlos |
| `/raffle/modern-home-tucson` | Rifa Tucson |
| `/checkout` | Checkout |
| `/draw` | Sorteo en vivo |
| `/dashboard` | Dashboard usuario |
| `/host` | Panel anfitrión |

---

## Preguntas frecuentes

**¿Cómo agrego una nueva propiedad?**
Edita el archivo `lib/data.js` y agrega un objeto al array `RAFFLES`. Cuando tengas Supabase conectado, esto vendrá de la base de datos automáticamente.

**¿Cómo activo los pagos reales con Stripe?**
En el archivo `pages/checkout.jsx`, busca el comentario `// In production: call Stripe API here` y reemplaza con la integración de Stripe Checkout. Te ayudo con esto cuando estés listo.

**¿El sitio funciona sin las variables de entorno?**
Sí, usa datos de prueba del archivo `lib/data.js`. Para pagos reales necesitas Stripe configurado.
