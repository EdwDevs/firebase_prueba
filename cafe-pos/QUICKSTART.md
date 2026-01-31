# 🚀 Guía Rápida de Inicio

## 1. Instalar Dependencias

```bash
cd cafe-pos
npm install
```

## 2. Configurar Variables de Entorno

```bash
cp .env.example .env.local
```

Las credenciales de Firebase ya están configuradas en el proyecto.

## 3. Ejecutar Seed de Datos

```bash
npx tsx scripts/seed.ts
```

Esto creará:
- 14 mesas
- 68 productos con precios COP
- 5 usuarios de prueba

## 4. Configurar Firebase Auth

Ve a [Firebase Console](https://console.firebase.google.com/project/procafees-pos-socorro-6225a/authentication/users)

Crea estos usuarios:

| Email | Contraseña |
|-------|-----------|
| admin@procafees.com | admin123 |
| cashier@procafees.com | cashier123 |
| waiter1@procafees.com | waiter123 |
| waiter2@procafees.com | waiter123 |
| waiter3@procafees.com | waiter123 |

### Configurar Custom Claims

Usa Firebase Admin SDK o una Cloud Function para establecer:

```javascript
// Para admin@procafees.com
{
  tenantId: "cafe_principal_001",
  role: "admin"
}

// Para cashier@procafees.com
{
  tenantId: "cafe_principal_001",
  role: "cashier"
}

// Para waiterX@procafees.com
{
  tenantId: "cafe_principal_001",
  role: "waiter"
}
```

### Configurar credenciales del Admin SDK en producción

El endpoint `/api/admin/provision-claims` necesita las credenciales del Admin SDK para asignar claims:

1. En Firebase Console: **Project Settings → Service Accounts → Generate new private key** y descarga el JSON.
2. Extrae del JSON:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (reemplaza los saltos de línea por `\\n`)
3. Configura esas variables en el entorno donde corre Next.js (Vercel/Firebase Hosting/Server).
4. Redeploy y prueba nuevamente el login para que el endpoint pueda asignar los claims.

## 5. Desplegar Firestore Rules

```bash
firebase login
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

## 6. Iniciar en Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 7. Desplegar a Producción

### Opción A: Vercel (Recomendado)

```bash
npm install -g vercel
vercel --prod
```

### Opción B: Firebase Hosting

```bash
npm run build
firebase deploy
```

## 🧪 Probar el Sistema

1. **Login** como mesero: `waiter1@procafees.com` / `waiter123`
2. **Abrir mesa**: Click en Mesa 1
3. **Agregar productos**: Seleccionar productos del grid
4. **Enviar orden**: Click en "Enviar"
5. **Ver en barra**: Abrir `/bar` en otra pestaña
6. **Marcar listo**: En barra, click "Marcar Listo"
7. **Cobrar**: Login como cajero, ir a Caja, cobrar orden
8. **Cerrar caja**: Al final del día, cerrar turno con arqueo

## 📱 Instalar PWA

### En Tablet/PC (Chrome):
1. Abre la URL de la app
2. Click en el ícono ➕ en la barra de direcciones
3. "Instalar ProCafees POS"

### En Android:
1. Abre en Chrome
2. Menú (⋮) > "Agregar a pantalla de inicio"

---

**¡Listo! El sistema está funcionando.** 🎉
