# Finanzas Hogar · CRM personal (COP)

CRM web avanzado, fluido e intuitivo para llevar las finanzas de un hogar en
Colombia. Diseñado para un solo usuario, sin autenticación, con registro
histórico en **Firebase Firestore** (con fallback automático a `localStorage`).

## ✨ Características

- **Dashboard** con ingresos/gastos del mes, balance, próximos pagos y
  movimientos recientes.
- **Movimientos** con tipo (ingreso / gasto), categoría, método de pago
  (efectivo, débito, transferencia, tarjeta de crédito, crédito/préstamo),
  descripción, fecha y **cuotas** si es a tarjeta de crédito.
- **Categorías** CRUD completas (crear, editar, eliminar) con **más de 30
  categorías** predeterminadas pensadas para hogares colombianos (arriendo,
  servicios, mercado, transporte, salud, educación, ahorro, etc.).
- **Tarjetas de crédito** con cupo, día de corte, día de pago y cronograma
  automático de cuotas futuras. Muestra la deuda pendiente y el % de cupo usado.
- **Créditos / préstamos** (hipoteca, libre inversión, consumo) con total,
  cuota mensual, tasa, fecha de inicio, día de pago y cronograma.
- **Estadísticas** con gráficos de evolución mensual, distribución por
  categoría y balance acumulado (opcionalmente incluye cuotas futuras
  proyectadas).
- **Moneda local**: pesos colombianos (COP) formateados con `Intl`.
- **Responsive** y **PWA-ready** (funciona en móvil y desktop).

## 🧱 Stack

- **React 19 + Vite + TypeScript**
- **TailwindCSS** + componentes estilo shadcn (Radix UI)
- **Firebase 10** (Firestore)
- **Recharts** para gráficas
- **React Router v6**
- **Lucide Icons**

## 🚀 Desarrollo local

```bash
cd finanzas-hogar
npm install
cp .env.example .env.local   # rellena con tus credenciales de Firebase
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173).

> **Sin credenciales Firebase?** La app funciona igualmente en **modo local**
> (persistencia en `localStorage` del navegador) — ideal para probar.

### Variables de entorno

Crea un archivo `.env.local` con los datos de tu proyecto de Firebase:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## 🔥 Despliegue a Firebase Hosting

1. **Instalar Firebase CLI** (una sola vez):
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Configurar el alias** (si aún no existe):
   ```bash
   cd finanzas-hogar
   firebase use --add   # selecciona tu Firebase Project
   ```

3. **Desplegar reglas de Firestore + sitio**:
   ```bash
   npm run build
   firebase deploy --only firestore:rules,hosting
   ```

La app quedará disponible en `https://<tu-proyecto>.web.app`.

## 🗂️ Estructura

```
finanzas-hogar/
├── firebase.json              # Config hosting + firestore
├── firestore.rules            # Reglas públicas del CRM personal
├── src/
│   ├── components/            # Layout, MoneyInput, CategoryIcon, UI primitives
│   ├── data/defaults.ts       # Categorías predeterminadas colombianas
│   ├── hooks/useStore.ts      # Hooks reactivos por colección
│   ├── lib/
│   │   ├── calculations.ts    # Estadísticas y cronogramas de cuotas
│   │   ├── firebase.ts        # Inicialización del SDK
│   │   ├── store.ts           # Almacenamiento (Firestore + localStorage)
│   │   └── utils.ts           # Formatos COP, fechas, helpers
│   ├── pages/                 # Dashboard, Movimientos, Categorías, ...
│   └── types/                 # Tipos de dominio
```

## 🧮 Cómo funcionan las cuotas

- Al registrar un gasto con **tarjeta de crédito** y `N` cuotas, la aplicación
  genera automáticamente el cronograma de cuotas a partir del **día de corte**
  y el **día de pago** de la tarjeta.
- Si la fecha de compra es posterior al corte de ese mes, la primera cuota se
  traslada al siguiente ciclo (como hacen los bancos colombianos).
- Las cuotas marcadas como pagadas se cuentan en `installmentsPaid` de la
  transacción; las pendientes aparecen en el dashboard y en la pantalla de
  la tarjeta.

## ⚖️ Reglas de Firestore

La app está pensada para **un solo usuario público** — no hay autenticación.
Las reglas `firestore.rules` permiten lectura/escritura abierta sobre las
colecciones `categories`, `transactions`, `cards` y `credits`. Si quieres
proteger tus datos, considera agregar una contraseña/PIN en el cliente o
activar Firebase Auth (anonymous) y restringir por `request.auth != null`.

## 📝 Licencia

Uso personal.
