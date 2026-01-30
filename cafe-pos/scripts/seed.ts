import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';

// Firebase config (misma que en el proyecto)
const firebaseConfig = {
  apiKey: "AIzaSyDdwwpkUq6tQbsTTKXUQ_eHR-uYN2ytgKI",
  authDomain: "procafees-pos-socorro-6225a.firebaseapp.com",
  projectId: "procafees-pos-socorro-6225a",
  storageBucket: "procafees-pos-socorro-6225a.firebasestorage.app",
  messagingSenderId: "718064305026",
  appId: "1:718064305026:web:7758ebbcb545f40d86c59b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? process.env.TENANT_ID ?? '';

if (!TENANT_ID) {
  throw new Error('TENANT_ID no está configurado. Define NEXT_PUBLIC_TENANT_ID o TENANT_ID.');
}

// ==================== DATOS DEL MENÚ ====================

const categories = [
  { id: 'cat_bebidas_calientes', name: 'Bebidas Calientes', order: 1, color: '#D97706' },
  { id: 'cat_bebidas_frias', name: 'Bebidas Frías', order: 2, color: '#3B82F6' },
  { id: 'cat_otras_bebidas', name: 'Otras Bebidas / Envasadas', order: 3, color: '#6B7280' },
  { id: 'cat_gaseosas', name: 'Gaseosas', order: 4, color: '#DC2626' },
  { id: 'cat_cervezas', name: 'Cervezas', order: 5, color: '#F59E0B' },
  { id: 'cat_helados', name: 'Helados', order: 6, color: '#EC4899' },
  { id: 'cat_postres', name: 'Postres', order: 7, color: '#8B5CF6' },
  { id: 'cat_para_acompanar', name: 'Para Acompañar', order: 8, color: '#10B981' },
  { id: 'cat_licores', name: 'Licores / Cocteles', order: 9, color: '#7C3AED' },
];

// Modificadores
const modifierGroups = [
  {
    id: 'mod_adicionales_frappe',
    name: 'Adicionales Frappe',
    selectionType: 'multiple',
    isRequired: false,
    options: [
      { id: 'opt_amaretto', name: 'Amaretto', priceDelta: 2000 },
      { id: 'opt_vainilla', name: 'Vainilla', priceDelta: 2000 },
      { id: 'opt_caramelo', name: 'Caramelo', priceDelta: 2000 },
      { id: 'opt_chantilly', name: 'Chantilly', priceDelta: 2000 },
    ],
  },
  {
    id: 'mod_leche_chai',
    name: 'Tipo de Leche',
    selectionType: 'single',
    isRequired: false,
    options: [
      { id: 'opt_leche_normal', name: 'Leche normal', priceDelta: 0 },
      { id: 'opt_leche_almendras', name: 'Leche de almendras', priceDelta: 2000 },
    ],
  },
  {
    id: 'mod_soda_extras',
    name: 'Adicional',
    selectionType: 'single',
    isRequired: false,
    options: [
      { id: 'opt_sin_extra', name: 'Sin extra', priceDelta: 0 },
      { id: 'opt_limon', name: 'Limón', priceDelta: 1000 },
      { id: 'opt_hielo', name: 'Hielo extra', priceDelta: 1000 },
    ],
  },
  // Modificadores para Socorrana Berraca
  {
    id: 'mod_socorrana_base',
    name: 'Base (requerido)',
    selectionType: 'single',
    isRequired: true,
    options: [
      { id: 'opt_cuate', name: 'Cuate', priceDelta: 0 },
      { id: 'opt_santandereana', name: 'Santandereana', priceDelta: 0 },
    ],
  },
  {
    id: 'mod_socorrana_licor',
    name: 'Licor (requerido)',
    selectionType: 'single',
    isRequired: true,
    options: [
      { id: 'opt_ron', name: 'Ron', priceDelta: 0 },
      { id: 'opt_aguardiente', name: 'Aguardiente', priceDelta: 0 },
      { id: 'opt_whisky', name: 'Whisky', priceDelta: 0 },
    ],
  },
];

// Productos
const products = [
  // ========== BEBIDAS CALIENTES (envía a barra = SI) ==========
  { id: 'prod_espresso', name: 'Espresso', price: 2500, categoryId: 'cat_bebidas_calientes', sendsToBar: true, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_americano', name: 'Americano', price: 2500, categoryId: 'cat_bebidas_calientes', sendsToBar: true, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_capuccino', name: 'Capuccino', price: 6000, categoryId: 'cat_bebidas_calientes', sendsToBar: true, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_latte', name: 'Latte', price: 4000, categoryId: 'cat_bebidas_calientes', sendsToBar: true, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_mocaccino', name: 'Mocaccino', price: 8000, categoryId: 'cat_bebidas_calientes', sendsToBar: true, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_perico', name: 'Perico', price: 2500, categoryId: 'cat_bebidas_calientes', sendsToBar: true, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_carajillo_ron', name: 'Carajillo con ron', price: 6000, categoryId: 'cat_bebidas_calientes', sendsToBar: true, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_carajillo_aguardiente', name: 'Carajillo con aguardiente', price: 5000, categoryId: 'cat_bebidas_calientes', sendsToBar: true, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_carajillo_whisky', name: 'Carajillo con whisky', price: 10000, categoryId: 'cat_bebidas_calientes', sendsToBar: true, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_milo_caliente', name: 'Milo o chocolate caliente', price: 7000, categoryId: 'cat_bebidas_calientes', sendsToBar: true, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_aromatica_hierbas', name: 'Aromática de hierbas', price: 2500, categoryId: 'cat_bebidas_calientes', sendsToBar: true, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_aromatica_frutos_peq', name: 'Aromática frutos pequeña', price: 3000, categoryId: 'cat_bebidas_calientes', sendsToBar: true, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_aromatica_frutos_grande', name: 'Aromática frutos rojos o amarillos', price: 5000, categoryId: 'cat_bebidas_calientes', sendsToBar: true, hasModifiers: false, modifierGroupIds: [] },

  // ========== BEBIDAS FRÍAS (envía a barra = SI) ==========
  { id: 'prod_cafe_frio', name: 'Café frío', price: 7000, categoryId: 'cat_bebidas_frias', sendsToBar: true, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_milo_frio', name: 'Milo frío', price: 7000, categoryId: 'cat_bebidas_frias', sendsToBar: true, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_frappe_cafe', name: 'Frappe de café', price: 8000, categoryId: 'cat_bebidas_frias', sendsToBar: true, hasModifiers: true, modifierGroupIds: ['mod_adicionales_frappe'] },
  { id: 'prod_frappe_oreo', name: 'Frappe de Oreo', price: 8000, categoryId: 'cat_bebidas_frias', sendsToBar: true, hasModifiers: true, modifierGroupIds: ['mod_adicionales_frappe'] },
  { id: 'prod_granizado_cereza', name: 'Granizado Cereza', price: 8000, categoryId: 'cat_bebidas_frias', sendsToBar: true, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_granizado_mango', name: 'Granizado mango biche', price: 8000, categoryId: 'cat_bebidas_frias', sendsToBar: true, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_granizado_pina', name: 'Granizado piña colada', price: 8000, categoryId: 'cat_bebidas_frias', sendsToBar: true, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_limonada_coco', name: 'Limonada de coco', price: 8000, categoryId: 'cat_bebidas_frias', sendsToBar: true, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_limonada_hierbabuena', name: 'Limonada de hierbabuena', price: 8000, categoryId: 'cat_bebidas_frias', sendsToBar: true, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_jugos_naturales', name: 'Jugos naturales', price: 8000, categoryId: 'cat_bebidas_frias', sendsToBar: true, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_te_chai', name: 'Té chai', price: 10000, categoryId: 'cat_bebidas_frias', sendsToBar: true, hasModifiers: true, modifierGroupIds: ['mod_leche_chai'] },

  // ========== OTRAS BEBIDAS / ENVASADAS (envía a barra = NO) ==========
  { id: 'prod_agua_peq', name: 'Agua pequeña', price: 1500, categoryId: 'cat_otras_bebidas', sendsToBar: false, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_agua_peq_gas', name: 'Agua pequeña con gas', price: 2000, categoryId: 'cat_otras_bebidas', sendsToBar: false, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_agua_personal', name: 'Agua personal', price: 2500, categoryId: 'cat_otras_bebidas', sendsToBar: false, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_agua_personal_gas', name: 'Agua personal con gas', price: 3000, categoryId: 'cat_otras_bebidas', sendsToBar: false, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_h2o', name: 'H2O 250 ml', price: 2000, categoryId: 'cat_otras_bebidas', sendsToBar: false, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_soda_michelada', name: 'Soda michelada', price: 7000, categoryId: 'cat_otras_bebidas', sendsToBar: false, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_canada_dry', name: 'Canada Dry', price: 3500, categoryId: 'cat_otras_bebidas', sendsToBar: false, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_soda_britania', name: 'Soda Bretaña', price: 3500, categoryId: 'cat_otras_bebidas', sendsToBar: false, hasModifiers: true, modifierGroupIds: ['mod_soda_extras'] },
  { id: 'prod_soda_hatsu', name: 'Soda Hatsu', price: 4000, categoryId: 'cat_otras_bebidas', sendsToBar: false, hasModifiers: true, modifierGroupIds: ['mod_soda_extras'] },
  { id: 'prod_jugo_hit_caja', name: 'Jugo Hit caja', price: 2500, categoryId: 'cat_otras_bebidas', sendsToBar: false, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_jugo_hit_personal', name: 'Jugo Hit personal', price: 3500, categoryId: 'cat_otras_bebidas', sendsToBar: false, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_pony_malta', name: 'Pony Malta', price: 4000, categoryId: 'cat_otras_bebidas', sendsToBar: false, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_gatorade', name: 'Gatorade', price: 4500, categoryId: 'cat_otras_bebidas', sendsToBar: false, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_speed', name: 'Speed', price: 4000, categoryId: 'cat_otras_bebidas', sendsToBar: false, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_electrolit', name: 'Electrolit', price: 8000, categoryId: 'cat_otras_bebidas', sendsToBar: false, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_te_hatsu', name: 'Té Hatsu', price: 4500, categoryId: 'cat_otras_bebidas', sendsToBar: false, hasModifiers: false, modifierGroupIds: [] },

  // ========== GASEOSAS (envía a barra = NO) ==========
  { id: 'prod_coca_400', name: 'Coca cola 400 ml', price: 4000, categoryId: 'cat_gaseosas', sendsToBar: false, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_coca_zero_400', name: 'Coca zero 400 ml', price: 4000, categoryId: 'cat_gaseosas', sendsToBar: false, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_coca_15l', name: 'Coca cola 1.5 litro', price: 7500, categoryId: 'cat_gaseosas', sendsToBar: false, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_hipinto', name: 'Hipinto / Postobón 400 ml', price: 3500, categoryId: 'cat_gaseosas', sendsToBar: false, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_mr_tea', name: 'Mr. tea', price: 4000, categoryId: 'cat_gaseosas', sendsToBar: false, hasModifiers: false, modifierGroupIds: [] },

  // ========== CERVEZAS (envía a barra = NO) ==========
  { id: 'prod_cerveza_nacional', name: 'Póker / Coronita / Águila', price: 5000, categoryId: 'cat_cervezas', sendsToBar: false, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_cerveza_premium', name: 'Heineken / Club Colombia', price: 5500, categoryId: 'cat_cervezas', sendsToBar: false, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_stella', name: 'Stella', price: 7000, categoryId: 'cat_cervezas', sendsToBar: false, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_cordillera', name: 'Cordillera', price: 7000, categoryId: 'cat_cervezas', sendsToBar: false, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_cola_pola', name: 'Cola y Pola', price: 5000, categoryId: 'cat_cervezas', sendsToBar: false, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_cerveza_michelada', name: 'Cerveza Michelada', price: 8000, categoryId: 'cat_cervezas', sendsToBar: false, hasModifiers: false, modifierGroupIds: [] },

  // ========== HELADOS (envía a barra = NO) ==========
  { id: 'prod_paletas', name: 'Paletas', price: 5000, categoryId: 'cat_helados', sendsToBar: false, hasModifiers: false, modifierGroupIds: [] },

  // ========== POSTRES (envía a barra = configurable, por defecto NO) ==========
  { id: 'prod_postres', name: 'Postres (café / maracuyá / limón)', price: 8000, categoryId: 'cat_postres', sendsToBar: false, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_cuajada', name: 'Cuajada con melao', price: 6000, categoryId: 'cat_postres', sendsToBar: false, hasModifiers: false, modifierGroupIds: [] },

  // ========== PARA ACOMPAÑAR (envía a barra = configurable, por defecto NO) ==========
  { id: 'prod_empanadas', name: 'Empanadas', price: 4000, categoryId: 'cat_para_acompanar', sendsToBar: false, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_mantecada', name: 'Mantecada especial', price: 3000, categoryId: 'cat_para_acompanar', sendsToBar: false, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_torta_queso', name: 'Torta de queso', price: 3000, categoryId: 'cat_para_acompanar', sendsToBar: false, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_torta_mazorca', name: 'Torta de mazorca', price: 4000, categoryId: 'cat_para_acompanar', sendsToBar: false, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_panderitos', name: 'Panderitos', price: 1000, categoryId: 'cat_para_acompanar', sendsToBar: false, hasModifiers: false, modifierGroupIds: [] },

  // ========== LICORES / COCTELES (envía a barra = SI si es preparado) ==========
  { id: 'prod_los_cuates', name: 'Los cuates', price: 6000, categoryId: 'cat_licores', sendsToBar: true, hasModifiers: false, modifierGroupIds: [] },
  { id: 'prod_santandereana', name: 'Santandereana', price: 6000, categoryId: 'cat_licores', sendsToBar: true, hasModifiers: false, modifierGroupIds: [] },
  { 
    id: 'prod_socorrana_berraca', 
    name: 'Socorrana Berraca', 
    price: 12000, 
    categoryId: 'cat_licores', 
    sendsToBar: true, 
    hasModifiers: true, 
    modifierGroupIds: ['mod_socorrana_base', 'mod_socorrana_licor'] 
  },
];

// Mesas (14 mesas)
const tables = Array.from({ length: 14 }, (_, i) => ({
  id: `table_${i + 1}`,
  number: i + 1,
  name: `Mesa ${i + 1}`,
  status: 'available',
  currentOrderId: null,
  tenantId: TENANT_ID,
}));

// Usuarios iniciales
const users = [
  {
    id: 'user_admin',
    email: 'admin@procafees.com',
    displayName: 'Administrador',
    role: 'admin',
    isActive: true,
    tenantId: TENANT_ID,
  },
  {
    id: 'user_cashier',
    email: 'cashier@procafees.com',
    displayName: 'Cajero Principal',
    role: 'cashier',
    isActive: true,
    tenantId: TENANT_ID,
  },
  {
    id: 'user_waiter1',
    email: 'waiter1@procafees.com',
    displayName: 'Mesero 1',
    role: 'waiter',
    isActive: true,
    tenantId: TENANT_ID,
  },
  {
    id: 'user_waiter2',
    email: 'waiter2@procafees.com',
    displayName: 'Mesero 2',
    role: 'waiter',
    isActive: true,
    tenantId: TENANT_ID,
  },
  {
    id: 'user_waiter3',
    email: 'waiter3@procafees.com',
    displayName: 'Mesero 3',
    role: 'waiter',
    isActive: true,
    tenantId: TENANT_ID,
  },
];

// Configuración del tenant
const tenantConfig = {
  businessName: 'ProCafees Socorro',
  currency: 'COP',
  timezone: 'America/Bogota',
  features: {
    inventory: true,
    bar: true,
    delivery: true,
  },
};

// ==================== FUNCIÓN PRINCIPAL ====================

async function seed() {
  console.log('🌱 Iniciando seed de datos...\n');

  try {
    // 1. Crear configuración del tenant
    console.log('⚙️  Creando configuración del tenant...');
    await setDoc(
      doc(db, 'tenants', TENANT_ID, 'config', 'settings'),
      tenantConfig
    );
    console.log('✅ Configuración creada\n');

    // 2. Crear categorías
    console.log('📂 Creando categorías...');
    const categoriesBatch = writeBatch(db);
    for (const category of categories) {
      const ref = doc(db, 'tenants', TENANT_ID, 'categories', category.id);
      categoriesBatch.set(ref, { ...category, tenantId: TENANT_ID });
    }
    await categoriesBatch.commit();
    console.log(`✅ ${categories.length} categorías creadas\n`);

    // 3. Crear grupos de modificadores
    console.log('🔧 Creando grupos de modificadores...');
    const modifiersBatch = writeBatch(db);
    for (const group of modifierGroups) {
      const ref = doc(db, 'tenants', TENANT_ID, 'modifierGroups', group.id);
      modifiersBatch.set(ref, { ...group, tenantId: TENANT_ID });
    }
    await modifiersBatch.commit();
    console.log(`✅ ${modifierGroups.length} grupos de modificadores creados\n`);

    // 4. Crear productos
    console.log('☕ Creando productos...');
    const productsBatch = writeBatch(db);
    for (const product of products) {
      const ref = doc(db, 'tenants', TENANT_ID, 'products', product.id);
      productsBatch.set(ref, {
        ...product,
        isActive: true,
        inventoryItemId: null,
        createdAt: serverTimestamp(),
        tenantId: TENANT_ID,
      });
    }
    await productsBatch.commit();
    console.log(`✅ ${products.length} productos creados\n`);

    // 5. Crear mesas
    console.log('🪑 Creando mesas...');
    const tablesBatch = writeBatch(db);
    for (const table of tables) {
      const ref = doc(db, 'tenants', TENANT_ID, 'tables', table.id);
      tablesBatch.set(ref, table);
    }
    await tablesBatch.commit();
    console.log(`✅ ${tables.length} mesas creadas\n`);

    // 6. Crear usuarios
    console.log('👤 Creando usuarios...');
    const usersBatch = writeBatch(db);
    for (const user of users) {
      const ref = doc(db, 'tenants', TENANT_ID, 'users', user.id);
      usersBatch.set(ref, {
        ...user,
        createdAt: serverTimestamp(),
      });
    }
    await usersBatch.commit();
    console.log(`✅ ${users.length} usuarios creados\n`);

    console.log('🎉 Seed completado exitosamente!');
    console.log('\n📋 Resumen:');
    console.log(`   - 1 configuración de tenant`);
    console.log(`   - ${categories.length} categorías`);
    console.log(`   - ${modifierGroups.length} grupos de modificadores`);
    console.log(`   - ${products.length} productos`);
    console.log(`   - ${tables.length} mesas`);
    console.log(`   - ${users.length} usuarios`);
    console.log('\n⚠️  NOTA: Los usuarios necesitan ser creados en Firebase Auth');
    console.log('   con los siguientes emails y claims personalizados:');
    console.log('   - admin@procafees.com (role: admin)');
    console.log('   - cashier@procafees.com (role: cashier)');
    console.log('   - waiter1@procafees.com (role: waiter)');
    console.log('   - waiter2@procafees.com (role: waiter)');
    console.log('   - waiter3@procafees.com (role: waiter)');

  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
}

// Ejecutar seed
seed();
