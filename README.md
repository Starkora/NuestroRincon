# Nuestro Rincón

Una aplicación web para parejas que desean compartir y preservar sus momentos especiales juntos.

## Stack Tecnológico (100% Gratuito)

- **Next.js 15** - Framework React con App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Estilos modernos
- **Supabase** - Autenticación y Base de Datos (Gratis hasta 50k usuarios)
- **Cloudinary** - Almacenamiento de imágenes (25GB gratis)
- **Vercel** - Hosting y deployment (Gratis ilimitado)

## Características

### Implementadas
- Landing page responsive
- Contador de días juntos
- Diseño moderno con gradientes

### Por Implementar
- Timeline de relación interactivo
- Bucket List de pareja
- Álbum de fotos privado
- Sistema de mensajes de amor
- Juegos y actividades para parejas
- Diario compartido
- Calendario de eventos importantes

## Instalación y Configuración

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar Supabase (Gratis)

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta gratis
3. Crea un nuevo proyecto
4. Ve a Settings > API
5. Copia el `URL` y `anon public key`
6. Actualiza `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key_aqui
```

### 3. Configurar Cloudinary (Opcional - Para imágenes)

1. Ve a [https://cloudinary.com](https://cloudinary.com)
2. Crea cuenta gratis (25GB storage)
3. Obtén tu Cloud Name desde el dashboard
4. Actualiza `.env.local`:
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=tu_cloud_name
```

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deploy en Vercel (Gratis)

1. Sube tu código a GitHub
2. Ve a [https://vercel.com](https://vercel.com)
3. Importa tu repositorio
4. Agrega las variables de entorno
5. ¡Deploy!

## Estructura del Proyecto

```
nuestrorincon/
├── app/
│   ├── layout.tsx          # Layout principal
│   ├── page.tsx            # Landing page
│   └── globals.css         # Estilos globales
├── lib/
│   └── supabase.ts         # Cliente de Supabase
├── .env.local              # Variables de entorno
└── README.md
```

## Personalización

Puedes personalizar:
- Colores en `tailwind.config.ts`
- Fecha de inicio en `app/page.tsx` (línea 7)
- Textos y características

## Próximos Pasos

1. Implementar autenticación con Supabase
2. Crear base de datos para timeline y bucket list
3. Agregar upload de fotos con Cloudinary
4. Implementar features principales

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!


## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
