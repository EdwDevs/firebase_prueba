# ProCafees POS - Resumen del Proyecto

## 📁 Estructura del Proyecto

```
cafe-pos/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   └── login/page.tsx        # Pantalla de login
│   ├── (pos)/
│   │   ├── layout.tsx            # Layout del POS
│   │   ├── tables/page.tsx       # Vista de 14 mesas
│   │   ├── table/[id]/page.tsx   # Orden de mesa específica
│   │   ├── takeout/page.tsx      # Para llevar
│   │   └── delivery/page.tsx     # Domicilio
│   ├── bar/page.tsx              # Pantalla de barra
│   ├── cash/page.tsx             # Módulo de caja
│   ├── reports/daily/page.tsx    # Reportes de ventas
│   ├── admin/                    # Panel de administración
│   │   ├── layout.tsx
│   │   ├── products/page.tsx     # Gestión de productos
│   │   ├── tables/page.tsx       # Configuración de mesas
│   │   ├── users/page.tsx        # Gestión de usuarios
│   │   └── inventory/page.tsx    # Control de inventario
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Redirección inicial
│   └── globals.css               # Estilos globales
├── components/
│   ├── ui/                       # Componentes UI (Button, Card, Input, Badge)
│   ├── shared/                   # Navbar, ProtectedRoute
│   ├── pos/                      # Componentes del POS
│   ├── bar/                      # Componentes de barra
│   └── cash/                     # Componentes de caja
├── hooks/                        # Custom hooks de Firestore
│   ├── useAuth.ts
│   ├── useOrders.ts
│   ├── useBar.ts
│   ├── useTables.ts
│   ├── useProducts.ts
│   └── useCash.ts
├── lib/                          # Utilidades
│   ├── firebase.ts               # Config Firebase
│   ├── utils.ts                  # Helpers (formatPrice, etc)
│   ├── constants.ts              # Constantes del sistema
│   └── reports.ts                # Exportación CSV
├── store/                        # Zustand stores
│   ├── authStore.ts
│   ├── posStore.ts
│   └── uiStore.ts
├── types/                        # TypeScript types
│   └── index.ts
├── scripts/
│   └── seed.ts                   # Datos iniciales
├── public/
│   └── manifest.json             # PWA manifest
├── firestore.rules               # Reglas de seguridad
├── firestore.indexes.json        # Índices de Firestore
├── firebase.json                 # Config Firebase CLI
├── next.config.js                # Config Next.js
├── tailwind.config.ts            # Config Tailwind
├── package.json                  # Dependencias
└── README.md                     # Documentación
```

## 🚀 Funcionalidades Implementadas

### ✅ POS (Punto de Venta)
- **Mesas**: Grid de 14 mesas con estados (libre/ocupada)
- **Para llevar**: Formulario con nombre y teléfono obligatorios
- **Domicilio**: Formulario con nombre, teléfono, dirección y referencia
- **Productos**: Grid por categorías con búsqueda
- **Modificadores**: Soporte para selección simple y múltiple
- **Carrito**: Agregar, eliminar, modificar cantidades
- **Cobro**: Métodos Efectivo, Nequi, QR

### ✅ Barra
- Vista en tiempo real de comandas
- Dos columnas: PREPARANDO y LISTO
- Sonido de notificación al entrar pedido
- Información completa: tipo, identificador, modificadores, notas
- Solo bebidas preparadas (filtrado por `sendsToBar`)

### ✅ Caja
- Apertura de turno con efectivo inicial
- Cierre de turno con arqueo
- Resumen de ventas por método de pago
- Cálculo de diferencia (esperado vs contado)
- Historial de turnos

### ✅ Reportes
- Filtro por rango de fechas
- Totales por método de pago
- Número de órdenes
- Ticket promedio
- Exportación a CSV

### ✅ Admin
- **Productos**: CRUD, activar/desactivar, modificadores
- **Mesas**: Configurar nombres personalizados
- **Usuarios**: CRUD con roles (admin, cashier, waiter)
- **Inventario**: Items, movimientos, alertas de stock bajo

## 📊 Menú Cargado (Seed)

### Categorías (9)
1. Bebidas Calientes (13 productos)
2. Bebidas Frías (11 productos)
3. Otras Bebidas / Envasadas (16 productos)
4. Gaseosas (5 productos)
5. Cervezas (6 productos)
6. Helados (1 producto)
7. Postres (2 productos)
8. Para Acompañar (5 productos)
9. Licores / Cocteles (3 productos)

### Total: 68 productos con precios en COP

### Modificadores Configurados
- **Adicionales Frappe**: Amaretto, Vainilla, Caramelo, Chantilly (+$2.000)
- **Té Chai**: Leche normal o de almendras (+$2.000)
- **Sodas**: Limón o hielo extra (+$1.000)
- **Socorrana Berraca**: Base (Cuate/Santandereana) + Licor (Ron/Aguardiente/Whisky)

## 🔐 Seguridad

### Roles y Permisos
| Rol | Permisos |
|-----|----------|
| **Admin** | Todo el sistema |
| **Cajero** | Cobrar, abrir/cerrar caja, ver reportes |
| **Mesero** | Crear órdenes, ver barra |

### Firestore Rules
- Aislamiento por tenant
- Validación de roles en cada operación
- Solo cajeros/admin pueden cerrar caja
- Solo admin puede gestionar usuarios y productos

## 🛠️ Tecnologías

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Estado**: Zustand (persistencia local)
- **Backend**: Firebase (Auth + Firestore)
- **Realtime**: Firestore onSnapshot
- **PWA**: Manifest + Service Worker (Next.js)

## 📱 PWA

El sistema está configurado como Progressive Web App:
- Instalable en tablets y PC
- Iconos configurados
- Tema amber (#D97706)
- Orientación portrait

## 🌱 Seed de Datos

El script `scripts/seed.ts` carga:
- ✅ 14 mesas (Mesa 1 a Mesa 14)
- ✅ 9 categorías
- ✅ 5 grupos de modificadores
- ✅ 68 productos con precios COP
- ✅ 5 usuarios de prueba

## 🚀 Despliegue

### Paso 1: Instalar dependencias
```bash
cd cafe-pos
npm install
```

### Paso 2: Configurar variables de entorno
```bash
cp .env.example .env.local
# Editar con tus credenciales de Firebase
```

### Paso 3: Ejecutar seed
```bash
npx tsx scripts/seed.ts
```

### Paso 4: Configurar Firebase Auth
1. Crear usuarios en Firebase Console > Authentication
2. Establecer Custom Claims (tenantId y role)

### Paso 5: Desplegar

**Opción A - Vercel (Recomendado)**:
```bash
vercel --prod
```

**Opción B - Firebase Hosting**:
```bash
npm run build
firebase deploy
```

## 🔧 Variables de Entorno

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDdwwpkUq6tQbsTTKXUQ_eHR-uYN2ytgKI
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=procafees-pos-socorro-6225a.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=procafees-pos-socorro-6225a
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=procafees-pos-socorro-6225a.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=718064305026
NEXT_PUBLIC_FIREBASE_APP_ID=1:718064305026:web:7758ebbcb545f40d86c59b
NEXT_PUBLIC_TENANT_ID=cafe_principal_001
```

## 📋 Checklist de Go-Live

- [ ] Firebase proyecto creado
- [ ] Firestore Database habilitada
- [ ] Authentication habilitado (Email/Password)
- [ ] Firestore Rules desplegadas
- [ ] Firestore Indexes creados
- [ ] Seed ejecutado
- [ ] Usuarios creados en Auth
- [ ] Custom Claims configurados
- [ ] Aplicación desplegada
- [ ] PWA instalada en tablets
- [ ] Prueba de flujo completo

## 🐛 Notas Importantes

1. **Custom Claims**: Los usuarios necesitan claims `tenantId` y `role` para funcionar
2. **Índices**: Firestore creará índices automáticamente en la primera consulta
3. **Offline**: Firestore tiene persistencia offline habilitada por defecto
4. **Sonido**: La barra tiene sonido de notificación (requiere interacción del usuario primero)

## 📞 Soporte

Para soporte técnico o preguntas sobre el sistema, contactar al desarrollador.
