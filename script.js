/**
 * 🏥 SISTEMA DE GESTIÓN DE FARMACIAS ZONA 1561
 * Versión mejorada — correcciones, accesibilidad y seguridad
 * @version 3.1.0
 */

'use strict';

// 🎯 Variables globales
let firebaseReady = false;
let farmacias = [];
let editingId = null;
const COLLECTION_NAME = 'farmacias_zona1561';

// Guardar referencia al último elemento enfocado antes de abrir modal (para restaurar foco)
let lastFocusedElement = null;

// ------------------------- Utilities -------------------------
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeRegex(string = '') {
  return String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sanitizePhone(phone = '') {
  return String(phone).replace(/\D+/g, '');
}

function isLocalId(id = '') {
  return typeof id === 'string' && id.startsWith('local_');
}

function showElement(el) {
  if (!el) return;
  el.classList.remove('hidden');
  el.setAttribute('aria-hidden', 'false');
}

function hideElement(el) {
  if (!el) return;
  el.classList.add('hidden');
  el.setAttribute('aria-hidden', 'true');
}

// Debounce utility
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ------------------------- Logging -------------------------
function log(message, type = 'info') {
  const logContainer = document.getElementById('logContainer');
  const timestamp = new Date().toLocaleTimeString('es-CO');
  const logEntry = document.createElement('div');
  logEntry.className = `log-entry ${type}`;
  const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
  logEntry.textContent = `[${timestamp}] ${icons[type] || ''} ${message}`;
  if (logContainer) {
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
  }
  // Siempre también en consola para debugging
  console.log(`[Farmacias] ${message}`);
}

function clearLog() {
  const logContainer = document.getElementById('logContainer');
  if (logContainer) {
    logContainer.innerHTML = '';
    log('🧹 Registro limpiado', 'info');
  }
}

// ------------------------- Connection status -------------------------
function updateConnectionStatus(status, title, message) {
  const statusCard = document.querySelector('.status-card');
  const statusIcon = document.getElementById('statusIcon');
  const statusTitle = document.getElementById('statusTitle');
  const statusMessage = document.getElementById('statusMessage');
  if (!statusCard || !statusIcon || !statusTitle || !statusMessage) return;

  // Reset classes
  statusCard.className = 'status-card';
  statusIcon.className = 'fas';

  if (status === 'connecting') {
    statusIcon.classList.add('fa-spinner', 'fa-spin');
  } else if (status === 'connected') {
    statusCard.classList.add('connected');
    statusIcon.classList.add('fa-check-circle', 'success');
  } else if (status === 'error') {
    statusCard.classList.add('error');
    statusIcon.classList.add('fa-exclamation-triangle', 'error');
  }

  statusTitle.textContent = title || '';
  statusMessage.textContent = message || '';
}

// ------------------------- Local storage -------------------------
function saveToLocalStorage() {
  try {
    localStorage.setItem('farmacias_zona1561_local', JSON.stringify(farmacias));
  } catch (error) {
    log('❌ Error guardando en localStorage', 'error');
  }
}

function loadLocalFarmacias() {
  const localData = localStorage.getItem('farmacias_zona1561_local');
  if (localData) {
    try {
      farmacias = JSON.parse(localData) || [];
      log(`📱 ${farmacias.length} farmacias cargadas desde localStorage`, 'info');
    } catch (error) {
      farmacias = [];
      log('❌ Error parseando datos locales', 'error');
    }
  } else {
    farmacias = [];
  }
  renderFarmacias();
  updateStats();
}

// ------------------------- Firebase integration -------------------------
async function loadFarmacias() {
  if (!firebaseReady) {
    log('⚠️ Firebase no está listo — usando datos locales si existen', 'warning');
    loadLocalFarmacias();
    return;
  }

  try {
    log('📊 Cargando farmacias desde Firebase...', 'info');
    const farmaciaCollection = window.firebaseCollection(window.firebaseDB, COLLECTION_NAME);
    const q = window.firebaseQuery(farmaciaCollection, window.firebaseOrderBy('nombre'));
    const snapshot = await window.firebaseGetDocs(q);
    farmacias = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data ? docSnap.data() : {};
      farmacias.push({ id: docSnap.id, ...data });
    });
    log(`✅ ${farmacias.length} farmacias cargadas`, 'success');
    renderFarmacias();
    updateStats();
    saveToLocalStorage();
  } catch (error) {
    log(`❌ Error cargando farmacias desde Firebase: ${error?.message || error}`, 'error');
    // Fallback local
    loadLocalFarmacias();
  }
}

// ------------------------- Renderización -------------------------
function createSafeHighlightedHtml(text = '') {
  // Escapa y luego resalta el término de búsqueda (si hay)
  const searchTerm = (document.getElementById('searchInput')?.value || '').trim();
  const safe = escapeHtml(text || '');
  if (!searchTerm) return safe;
  try {
    const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
    return safe.replace(regex, '<mark>$1</mark>');
  } catch {
    return safe;
  }
}

function createFarmaciaRow(farmacia) {
  const tr = document.createElement('tr');
  tr.className = 'farmacia-row';

  // Nombre
  const tdName = document.createElement('td');
  const nameWrap = document.createElement('div');
  nameWrap.className = 'farmacia-name';
  const icon = document.createElement('i');
  icon.className = 'fas fa-store';
  icon.setAttribute('aria-hidden', 'true');
  const strong = document.createElement('strong');
  // Insert highlighted-safe HTML (uses escapeHtml internally)
  strong.innerHTML = createSafeHighlightedHtml(farmacia.nombre || 'Sin nombre');
  nameWrap.appendChild(icon);
  nameWrap.appendChild(document.createTextNode(' '));
  nameWrap.appendChild(strong);
  tdName.appendChild(nameWrap);

  // Teléfono
  const tdPhone = document.createElement('td');
  const sanitizedPhone = sanitizePhone(farmacia.telefono || '');
  if (sanitizedPhone) {
    const phoneContainer = document.createElement('div');
    phoneContainer.className = 'telefono-container';

    const aTel = document.createElement('a');
    aTel.href = `tel:${sanitizedPhone}`;
    aTel.className = 'btn-phone';
    aTel.innerHTML = `<i class="fas fa-phone" aria-hidden="true"></i> ${escapeHtml(farmacia.telefono)}`;
    phoneContainer.appendChild(aTel);

    const aWa = document.createElement('a');
    aWa.href = `https://wa.me/57${sanitizedPhone}`;
    aWa.target = '_blank';
    aWa.rel = 'noopener noreferrer';
    aWa.className = 'btn-whatsapp';
    aWa.title = 'WhatsApp';
    aWa.innerHTML = `<i class="fab fa-whatsapp" aria-hidden="true"></i>`;
    phoneContainer.appendChild(aWa);

    tdPhone.appendChild(phoneContainer);
  } else {
    const span = document.createElement('span');
    span.className = 'no-phone';
    span.textContent = 'Sin teléfono';
    tdPhone.appendChild(span);
  }

  // Descripción
  const tdDesc = document.createElement('td');
  const descWrap = document.createElement('div');
  descWrap.className = 'descripcion-container';
  descWrap.innerHTML = createSafeHighlightedHtml(farmacia.descripcion || 'Sin descripción');
  tdDesc.appendChild(descWrap);

  // Acciones
  const tdActions = document.createElement('td');
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'action-buttons';

  const btnEdit = document.createElement('button');
  btnEdit.type = 'button';
  btnEdit.className = 'btn btn-edit';
  btnEdit.title = 'Editar';
  btnEdit.innerHTML = '<i class="fas fa-edit" aria-hidden="true"></i>';
  btnEdit.addEventListener('click', () => editFarmacia(farmacia.id));

  const btnDelete = document.createElement('button');
  btnDelete.type = 'button';
  btnDelete.className = 'btn btn-delete';
  btnDelete.title = 'Eliminar';
  btnDelete.innerHTML = '<i class="fas fa-trash" aria-hidden="true"></i>';
  btnDelete.addEventListener('click', () => deleteFarmacia(farmacia.id, farmacia.nombre || ''));

  actionsDiv.appendChild(btnEdit);
  actionsDiv.appendChild(btnDelete);
  tdActions.appendChild(actionsDiv);

  tr.appendChild(tdName);
  tr.appendChild(tdPhone);
  tr.appendChild(tdDesc);
  tr.appendChild(tdActions);

  return tr;
}

function renderFarmacias(farmaciasList = farmacias) {
  const tableBody = document.getElementById('farmaciaTableBody');
  const emptyState = document.getElementById('emptyState');
  const tableContainer = document.querySelector('.table-container');

  if (!tableBody) return;

  tableBody.innerHTML = '';

  if (!Array.isArray(farmaciasList) || farmaciasList.length === 0) {
    if (tableContainer) hideElement(tableContainer);
    if (emptyState) showElement(emptyState);
    return;
  }

  if (tableContainer) showElement(tableContainer);
  if (emptyState) hideElement(emptyState);

  const fragment = document.createDocumentFragment();
  farmaciasList.forEach((f) => {
    fragment.appendChild(createFarmaciaRow(f));
  });
  tableBody.appendChild(fragment);

  // Animación
  animateTableRows();
}

// ------------------------- Estadísticas -------------------------
function updateStats() {
  const total = farmacias.length;
  const conTelefono = farmacias.filter(f => !!(f.telefono && sanitizePhone(f.telefono).length)).length;
  const ahora = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  const totalEl = document.getElementById('totalFarmacias');
  const conTelEl = document.getElementById('conTelefono');
  const ultimaEl = document.getElementById('ultimaActualizacion');

  if (totalEl) totalEl.textContent = String(total);
  if (conTelEl) conTelEl.textContent = String(conTelefono);
  if (ultimaEl) ultimaEl.textContent = ahora;
}

// ------------------------- Filtros / búsqueda -------------------------
function filterFarmacias() {
  const searchTerm = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
  const phoneFilter = (document.getElementById('filterTelefono')?.value || '').trim();

  const filtered = farmacias.filter(farmacia => {
    const nombre = (farmacia.nombre || '').toLowerCase();
    const telefono = (farmacia.telefono || '').toLowerCase();
    const descripcion = (farmacia.descripcion || '').toLowerCase();

    const matchSearch = !searchTerm ||
      nombre.includes(searchTerm) ||
      telefono.includes(searchTerm) ||
      descripcion.includes(searchTerm);

    const hasPhone = !!sanitizePhone(farmacia.telefono || '');

    let matchPhone = true;
    if (phoneFilter === 'con') matchPhone = hasPhone;
    if (phoneFilter === 'sin') matchPhone = !hasPhone;

    return matchSearch && matchPhone;
  });

  renderFarmacias(filtered);
  log(`🔍 Filtros aplicados: ${filtered.length}/${farmacias.length} farmacias`, 'info');
}

// ------------------------- Modal management (accessibility) -------------------------
const FOCUSABLE_SELECTORS = 'a[href], area[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';
let modalFocusables = [];
let modalFirstFocusable = null;
let modalLastFocusable = null;

function openModal() {
  const modal = document.getElementById('farmaciaModal');
  if (!modal) return;
  lastFocusedElement = document.activeElement;
  showElement(modal);
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open'); // you can use this CSS to prevent background scroll

  // Focus management
  modalFocusables = Array.from(modal.querySelectorAll(FOCUSABLE_SELECTORS));
  modalFirstFocusable = modalFocusables[0] || null;
  modalLastFocusable = modalFocusables[modalFocusables.length - 1] || null;
  if (modalFirstFocusable) modalFirstFocusable.focus();

  // Keydown listener for focus trap & Escape
  document.addEventListener('keydown', handleModalKeydown);
}

function closeModal() {
  const modal = document.getElementById('farmaciaModal');
  if (!modal) return;
  hideElement(modal);
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  editingId = null;

  // Remove keydown listener
  document.removeEventListener('keydown', handleModalKeydown);

  if (lastFocusedElement && lastFocusedElement.focus) {
    lastFocusedElement.focus();
  }

  log('Modal cerrado', 'info');
}

function handleModalKeydown(e) {
  const modal = document.getElementById('farmaciaModal');
  if (!modal) return;

  if (e.key === 'Escape' || e.key === 'Esc') {
    closeModal();
    return;
  }

  // Focus trap
  if (e.key === 'Tab') {
    if (modalFocusables.length === 0) {
      e.preventDefault();
      return;
    }
    if (e.shiftKey) {
      if (document.activeElement === modalFirstFocusable) {
        e.preventDefault();
        modalLastFocusable.focus();
      }
    } else {
      if (document.activeElement === modalLastFocusable) {
        e.preventDefault();
        modalFirstFocusable.focus();
      }
    }
  }
}

// ------------------------- Form handling -------------------------
async function handleFormSubmit(e) {
  e.preventDefault();
  const nombreEl = document.getElementById('farmaciaNombre');
  const telefonoEl = document.getElementById('farmaciaTelefono');
  const descEl = document.getElementById('farmaciaDescripcion');

  const nombre = (nombreEl?.value || '').trim();
  const telefono = (telefonoEl?.value || '').trim();
  const descripcion = (descEl?.value || '').trim();

  if (!nombre) {
    // Mejor mostrar un error accesible en lugar de alert
    const errorEl = document.getElementById('errorNombre');
    if (errorEl) {
      errorEl.textContent = 'El nombre de la farmacia es obligatorio';
      nombreEl.focus();
    } else {
      alert('El nombre de la farmacia es obligatorio');
    }
    return;
  } else {
    const errorEl = document.getElementById('errorNombre');
    if (errorEl) errorEl.textContent = '';
  }

  const farmaciaData = {
    nombre,
    telefono,
    descripcion,
    fechaActualizacion: new Date().toISOString()
  };

  try {
    if (editingId) {
      await updateFarmacia(editingId, farmaciaData);
      log(`✏️ Farmacia actualizada: ${nombre}`, 'success');
    } else {
      farmaciaData.fechaCreacion = new Date().toISOString();
      await addFarmacia(farmaciaData);
      log(`➕ Farmacia agregada: ${nombre}`, 'success');
    }
    closeModal();
  } catch (error) {
    log(`❌ Error guardando farmacia: ${error?.message || error}`, 'error');
    alert(`Error: ${error?.message || error}`);
  }
}

// ------------------------- CRUD local + Firebase -------------------------
async function addFarmacia(farmaciaData) {
  if (firebaseReady) {
    try {
      const collectionRef = window.firebaseCollection(window.firebaseDB, COLLECTION_NAME);
      const docRef = await window.firebaseAddDoc(collectionRef, farmaciaData);
      farmaciaData.id = docRef.id;
      farmacias.push(farmaciaData);
      saveToLocalStorage();
      renderFarmacias();
      updateStats();
      return;
    } catch (error) {
      log(`📱 Error guardando en Firebase, fallback local: ${error?.message || error}`, 'warning');
      // fallback to local
    }
  }
  // Local-only
  farmaciaData.id = 'local_' + Date.now();
  farmacias.push(farmaciaData);
  saveToLocalStorage();
  renderFarmacias();
  updateStats();
}

async function updateFarmacia(id, farmaciaData) {
  const index = farmacias.findIndex(f => f.id === id);
  if (index === -1) {
    log(`❌ Farmacia con ID ${id} no encontrada (update)`, 'error');
    return;
  }

  if (firebaseReady && !isLocalId(id)) {
    try {
      const docRef = window.firebaseDoc(window.firebaseDB, COLLECTION_NAME, id);
      await window.firebaseUpdateDoc(docRef, farmaciaData);
      log('✅ Farmacia actualizada en Firebase', 'success');
    } catch (error) {
      log(`📱 Error actualizando en Firebase: ${error?.message || error}`, 'warning');
    }
  }

  farmacias[index] = { ...farmacias[index], ...farmaciaData };
  saveToLocalStorage();
  renderFarmacias();
  updateStats();
}

async function deleteFarmacia(id, nombre = '') {
  const confirmed = confirm(`¿Estás seguro de que deseas eliminar "${nombre}"?\n\nEsta acción no se puede deshacer.`);
  if (!confirmed) return;

  const index = farmacias.findIndex(f => f.id === id);
  if (index === -1) {
    log(`❌ Farmacia con ID ${id} no encontrada (delete)`, 'error');
    return;
  }

  if (firebaseReady && !isLocalId(id)) {
    try {
      const docRef = window.firebaseDoc(window.firebaseDB, COLLECTION_NAME, id);
      await window.firebaseDeleteDoc(docRef);
      log('✅ Farmacia eliminada de Firebase', 'success');
    } catch (error) {
      log(`📱 Error eliminando en Firebase: ${error?.message || error}`, 'warning');
      // proceed to remove locally anyway
    }
  }

  farmacias.splice(index, 1);
  saveToLocalStorage();
  renderFarmacias();
  updateStats();
  log(`🗑️ Farmacia "${nombre}" eliminada`, 'info');
}

// ------------------------- Edit / Show modal helpers -------------------------
function showAddModal() {
  editingId = null;
  const form = document.getElementById('farmaciaForm');
  if (form) form.reset();
  document.getElementById('modalTitle').textContent = 'Agregar Nueva Farmacia';
  openModal();
  log('➕ Modal de agregar farmacia abierto', 'info');
}

function editFarmacia(id) {
  const farmacia = farmacias.find(f => f.id === id);
  if (!farmacia) {
    log(`❌ Farmacia con ID ${id} no encontrada (edit)`, 'error');
    return;
  }
  editingId = id;
  document.getElementById('modalTitle').textContent = 'Editar Farmacia';
  document.getElementById('farmaciaNombre').value = farmacia.nombre || '';
  document.getElementById('farmaciaTelefono').value = farmacia.telefono || '';
  document.getElementById('farmaciaDescripcion').value = farmacia.descripcion || '';
  openModal();
  log(`✏️ Editando farmacia: ${farmacia.nombre}`, 'info');
}

// ------------------------- Export to Excel -------------------------
function exportData() {
  try {
    const dataToExport = farmacias.map((farmacia, index) => ({
      'N°': index + 1,
      'NOMBRE': farmacia.nombre || '',
      'TELEFONO': farmacia.telefono || '',
      'DESCRIPCION': farmacia.descripcion || '',
      'FECHA_CREACION': farmacia.fechaCreacion ? new Date(farmacia.fechaCreacion).toLocaleString('es-CO') : '',
      'ULTIMA_ACTUALIZACION': farmacia.fechaActualizacion ? new Date(farmacia.fechaActualizacion).toLocaleString('es-CO') : ''
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Farmacias_Zona1561');
    const fecha = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Farmacias_Zona1561_${fecha}.xlsx`);
    log(`📊 Excel exportado: ${farmacias.length} farmacias`, 'success');
  } catch (error) {
    log(`❌ Error exportando: ${error?.message || error}`, 'error');
    alert('Error al exportar datos');
  }
}

// ------------------------- Table animation -------------------------
function animateTableRows() {
  const rows = document.querySelectorAll('.farmacia-row');
  rows.forEach((row, index) => {
    row.style.opacity = '0';
    row.style.transform = 'translateY(10px)';
    setTimeout(() => {
      row.style.transition = 'all 300ms ease';
      row.style.opacity = '1';
      row.style.transform = 'translateY(0)';
    }, index * 40);
  });
}

// ------------------------- Event listeners setup -------------------------
function setupEventListeners() {
  // Búsqueda en tiempo real
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.addEventListener('input', debounce(filterFarmacias, 250));

  // Filtros
  const filterTelefono = document.getElementById('filterTelefono');
  if (filterTelefono) filterTelefono.addEventListener('change', filterFarmacias);

  // Formulario
  const form = document.getElementById('farmaciaForm');
  if (form) form.addEventListener('submit', handleFormSubmit);

  // Modal controls
  const modalOverlay = document.getElementById('modalOverlay');
  if (modalOverlay) modalOverlay.addEventListener('click', closeModal);

  const modalClose = document.getElementById('modalClose');
  if (modalClose) modalClose.addEventListener('click', closeModal);

  const btnAdd = document.getElementById('btnAdd');
  if (btnAdd) btnAdd.addEventListener('click', showAddModal);

  const btnAddFirst = document.getElementById('btnAddFirst');
  if (btnAddFirst) btnAddFirst.addEventListener('click', showAddModal);

  const btnExport = document.getElementById('btnExport');
  if (btnExport) btnExport.addEventListener('click', exportData);

  const btnRefresh = document.getElementById('btnRefresh');
  if (btnRefresh) btnRefresh.addEventListener('click', loadFarmacias);

  const clearLogBtn = document.getElementById('clearLogBtn');
  if (clearLogBtn) clearLogBtn.addEventListener('click', clearLog);

  // Accessibility: close modal with Escape handled inside modal keydown handler when modal open
}

// ------------------------- Firebase readiness handlers -------------------------
function handleFirebaseReady() {
  firebaseReady = true;
  log('✅ Firebase conectado - Sistema listo', 'success');
  updateConnectionStatus('connected', '✅ Sistema Operativo', 'Conectado a Firebase zona1561-4de30');
  loadFarmacias();
}

function handleFirebaseError(event) {
  const error = event?.detail || event;
  log(`❌ Error Firebase: ${error?.message || error}`, 'error');
  updateConnectionStatus('error', '❌ Error Conexión', error?.message || 'Error de Firebase');
}

// ------------------------- Timeout fallback -------------------------
function checkConnectionTimeout() {
  if (!firebaseReady) {
    log('⏰ Timeout - Trabajando en modo offline', 'warning');
    updateConnectionStatus('error', '⏰ Modo Offline', 'Usando datos locales');
    loadLocalFarmacias();
  }
}

// ------------------------- Debug utilities -------------------------
window.farmaciaDebug = {
  status: () => ({ firebaseReady, totalFarmacias: farmacias.length, editingId, lastUpdate: new Date().toISOString() }),
  getFarmacias: () => farmacias,
  clearAll: () => {
    if (confirm('¿Eliminar TODAS las farmacias? Esta acción no se puede deshacer.')) {
      farmacias = [];
      localStorage.removeItem('farmacias_zona1561_local');
      renderFarmacias();
      updateStats();
      log('🧹 Todas las farmacias eliminadas', 'warning');
    }
  }
};

// Expose a minimal API to global scope for inline console testing if needed
window.showAddModal = showAddModal;
window.editFarmacia = editFarmacia;
window.deleteFarmacia = deleteFarmacia;
window.closeModal = closeModal;
window.loadFarmacias = loadFarmacias;
window.exportData = exportData;
window.clearLog = clearLog;

// ------------------------- Inicialización -------------------------
document.addEventListener('DOMContentLoaded', () => {
  log('🚀 Iniciando Sistema de Farmacias...', 'info');
  updateConnectionStatus('connecting', 'Conectando...', 'Inicializando sistema...');
  setupEventListeners();

  // Listen Firebase readiness events (emitidos por firebase-init.js)
  window.addEventListener('firebaseReady', handleFirebaseReady);
  window.addEventListener('firebaseError', handleFirebaseError);

  // Security timeout fallback
  setTimeout(checkConnectionTimeout, 10000);

  log('📱 Sistema de Farmacias cargado correctamente', 'success');
});
