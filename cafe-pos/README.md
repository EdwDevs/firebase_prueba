# ProCafees POS - Sistema de Punto de Venta

Sistema POS completo para cafetería, desarrollado con Next.js, TypeScript, Tailwind CSS y Firebase.

## 🚀 Características

- ✅ **Ventas por mesas**: 14 mesas configurables
- ✅ **Para llevar**: Con nombre y teléfono del cliente
- ✅ **Domicilio**: Con dirección y referencia
- ✅ **Pantalla de barra**: Solo bebidas preparadas (PREPARANDO → LISTO)
- ✅ **Métodos de pago**: Efectivo, Nequi, QR
- ✅ **Caja**: Apertura/cierre de turno con arqueo
- ✅ **Reportes**: Ventas diarias con exportación CSV
- ✅ **Inventario**: Control operativo de insumos
- ✅ **Multi-tenant**: Arquitectura escalable
- ✅ **PWA**: Listo para instalación en tablets/PC

## 📋 Requisitos Previos

- Node.js 18+
- Cuenta de Firebase
- Firebase CLI instalado globalmente:
  ```bash
  npm install -g firebase-tools
  ```

## 🛠️ Instalación Local

1. **Clonar el repositorio**:
   ```bash
   git clone <repo-url>
   cd cafe-pos
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**:
   Crear archivo `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDdwwpkUq6tQbsTTKXUQ_eHR-uYN2ytgKI
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=procafees-pos-socorro-6225a.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=procafees-pos-socorro-6225a
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=procafees-pos-socorro-6225a.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=718064305026
   NEXT_PUBLIC_FIREBASE_APP_ID=1:718064305026:web:7758ebbcb545f40d86c59b
   ```

4. **Ejecutar en modo desarrollo**:
   ```bash
   npm run dev
   ```

   Abrir [http://localhost:3000](http://localhost:3000)

## 🌱 Seed de Datos

Para cargar los datos iniciales (14 mesas, menú completo, usuarios):

```bash
# Compilar el script de seed
npx tsx scripts/seed.ts
```

Esto creará:
- 9 categorías de productos
- 5 grupos de modificadores
- 68 productos con precios en COP
- 14 mesas
- 5 usuarios de prueba

## 🔐 Configuración de Firebase Auth

Después de ejecutar el seed, debes crear los usuarios en Firebase Authentication:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona el proyecto `procafees-pos-socorro-6225a`
3. Ve a **Authentication** > **Users** > **Add user**
4. Crea los siguientes usuarios:

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@procafees.com | admin123 | admin |
| cashier@procafees.com | cashier123 | cashier |
| waiter1@procafees.com | waiter123 | waiter |
| waiter2@procafees.com | waiter123 | waiter |
| waiter3@procafees.com | waiter123 | waiter |

5. Para cada usuario, establece los **Custom Claims** usando el Admin SDK o Firebase Functions:
   ```javascript
   {
     tenantId: "cafe_principal_001",
     role: "admin" | "cashier" | "waiter"
   }
   ```

### Establecer Custom Claims (via Firebase Console Functions)

Si tienes Cloud Functions habilitado, usa esta función:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.setCustomClaims = functions.https.onCall(async (data, context) => {
  const { uid, tenantId, role } = data;
  
  await admin.auth().setCustomUserClaims(uid, {
    tenantId,
    role
  });
  
  return { success: true };
});
```

### Configurar credenciales del Admin SDK para asignar claims desde la app

El endpoint `/api/admin/provision-claims` usa el Admin SDK. Para que pueda asignar claims en producción:

1. En Firebase Console: **Project Settings → Service Accounts → Generate new private key** y descarga el JSON.
2. Extrae del JSON:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (reemplaza los saltos de línea por `\\n`)
3. Configura esas variables en el entorno donde corre Next.js (Vercel/Firebase Hosting/Server).
4. Redeploy y prueba nuevamente el login para que el endpoint pueda asignar los claims.

## 📦 Despliegue

### Opción 1: Vercel (Recomendado)

1. **Instalar Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Desplegar**:
   ```bash
   vercel --prod
   ```

3. **Configurar variables de entorno en Vercel**:
   - Ve al dashboard de Vercel
   - Selecciona tu proyecto
   - Ve a **Settings** > **Environment Variables**
   - Agrega todas las variables de Firebase

### Opción 2: Firebase Hosting

1. **Login en Firebase**:
   ```bash
   firebase login
   ```

2. **Inicializar proyecto**:
   ```bash
   firebase init
   ```
   - Selecciona **Hosting**
   - Selecciona el proyecto existente
   - Directorio público: `dist`
   - Configurar como SPA: **Sí**

3. **Build del proyecto**:
   ```bash
   npm run build
   ```

4. **Desplegar**:
   ```bash
   firebase deploy
   ```

### Desplegar Firestore Rules

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

## 📱 Configuración PWA

El sistema está configurado como PWA. Para instalar:

### En Chrome/Edge (PC):
1. Abre la aplicación en el navegador
2. Haz clic en el ícono de instalación (➕) en la barra de direcciones
3. Selecciona "Instalar"

### En Chrome (Android/Tablet):
1. Abre la aplicación en Chrome
2. Toca el menú (⋮) > "Agregar a pantalla de inicio"
3. Confirma la instalación

### En Safari (iOS):
1. Abre la aplicación en Safari
2. Toca compartir (⬆️) > "Agregar a pantalla de inicio"

## 🔧 Configuración del Proyecto Firebase

### 1. Crear Proyecto

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Clic en **Agregar proyecto**
3. Nombre: `procafees-pos-socorro-6225a`
4. Desactiva Google Analytics (opcional)

### 2. Habilitar Servicios

- **Authentication**: Habilitar Email/Password
- **Firestore Database**: Crear base de datos en modo producción
- **Hosting** (opcional si usas Vercel)

### 3. Configurar Firestore Rules

Las reglas de seguridad están en `firestore.rules`. Despliega con:

```bash
firebase deploy --only firestore:rules
```

### 4. Crear Índices

Los índices están en `firestore.indexes.json`. Despliega con:

```bash
firebase deploy --only firestore:indexes
```

O créalos manualmente en Firebase Console > Firestore Database > Indexes.

## 📊 Estructura de Datos

```
tenants/{tenantId}/
├── config/settings
├── users/{userId}
├── tables/{tableId}
├── categories/{categoryId}
├── products/{productId}
├── modifierGroups/{groupId}
├── orders/{orderId}
│   └── orderItems/{itemId}
├── barTickets/{ticketId}
├── cashSessions/{sessionId}
├── inventoryItems/{itemId}
└── inventoryMovements/{movementId}
```

## 🧪 Testing

### Usuarios de Prueba

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Admin | admin@procafees.com | admin123 |
| Cajero | cashier@procafees.com | cashier123 |
| Mesero | waiter1@procafees.com | waiter123 |

### Flujo de Prueba

1. **Abrir mesa**: Login como mesero > POS > Mesa 1
2. **Agregar productos**: Seleccionar productos > Agregar modificadores
3. **Enviar a barra**: Los productos con "sendsToBar=true" aparecen en /bar
4. **Preparar en barra**: Login en /bar > Marcar como listo
5. **Cobrar**: Login como cajero > Caja > Cobrar orden
6. **Cerrar caja**: Caja > Cerrar turno > Arqueo

## 🐛 Solución de Problemas

### Error: "Missing or insufficient permissions"
- Verifica que los Custom Claims estén configurados correctamente
- Revisa las Firestore Rules en Firebase Console

### Error: "Firebase App already exists"
- Asegúrate de que `firebase.ts` verifica `getApps().length`

### No aparecen los datos del seed
- Verifica que el `TENANT_ID` coincida en todos los archivos
- Revisa la consola del navegador por errores

## 📄 Licencia

Proyecto privado para ProCafees Socorro.

## 🤝 Soporte

Para soporte técnico, contactar al desarrollador.
