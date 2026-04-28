# AI Chat

Chat multi-modelo con autenticacion, persistencia en PostgreSQL y soporte para DeepSeek, OpenAI y Anthropic.

## Requisitos

- Node.js 18+
- PostgreSQL 14+
- API keys de los proveedores a usar

## Instalacion

```bash
npm install
npx prisma generate
```

## Base de datos

Crear la base de datos y schema:

```bash
# Opcion 1: con el script SQL
psql "postgresql://..." -f db/init.sql

# Opcion 2: con prisma db push
npx prisma db push
```

## Variables de entorno

Configurar `.env`:

```env
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=aichat_dev"
JWT_SECRET=un-secreto-seguro

# Proveedores (solo los que uses)
DEEPSEEK_API_KEY=sk-...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

## Ejecutar

```bash
npm run dev        # http://localhost:3000
npm run build      # build produccion
npm run start      # iniciar produccion
```

## Estructura

```
├── prisma/
│   └── schema.prisma
├── db/
│   └── init.sql            # Script SQL manual
├── app/
│   ├── api/
│   │   ├── auth/           # Register, login, me
│   │   ├── chat/           # Endpoint de chat
│   │   ├── conversations/  # CRUD conversaciones
│   │   └── set-provider/   # Cambiar proveedor/modelo
│   ├── login/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── Chat.tsx
│   ├── Input.tsx
│   ├── LoginForm.tsx
│   ├── Message.tsx
│   ├── Modal.tsx
│   ├── ModelSelector.tsx
│   ├── ProviderSelector.tsx
│   └── Sidebar.tsx
├── context/
│   └── AuthContext.tsx
├── lib/
│   ├── auth.ts             # JWT + bcrypt
│   ├── config.ts           # Config proveedores/modelos
│   ├── prisma.ts           # Cliente Prisma
│   └── storage.ts          # API client conversaciones
└── types/
    └── index.ts
```

## Modelos disponibles

| Proveedor | Modelo | Imagenes | PDFs |
|-----------|--------|----------|------|
| DeepSeek | V4 Pro | No | Si |
| DeepSeek | V4 Flash | No | Si |
| OpenAI | GPT-4o | Si | Si |
| OpenAI | GPT-4o Mini | Si | Si |
| Anthropic | Claude 3.5 Sonnet | Si | Si |
| Anthropic | Claude 3.5 Haiku | Si | Si |

Los modelos se seleccionan desde la UI en el header.

## Autenticacion

- Registro con nombre, apellido, email, fecha de nacimiento
- Login por email + contrasena
- JWT con expiracion de 7 dias
- Validacion de contrasena: min 8 caracteres, mayuscula, minuscula, numero, especial

## Auditoria

Todas las tablas usan soft delete (`estado = 'I'`) y registran:
- `creado_por` / `fecha_creacion`
- `modificado_por` / `fecha_modificacion`

## Licencia

MIT
