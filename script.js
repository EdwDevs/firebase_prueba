/**
 * 🏥 SISTEMA DE GESTIÓN DE FARMACIAS ZONA 1561
 * Basado en Firebase que YA FUNCIONA
 * @version: 3.0.0
 */

// 🎯 Variables globales
let firebaseReady = false;
let farmacias = [];
let editingId = null;
const COLLECTION_NAME = 'farmacias_zona1561';

// 🚀 Inicialización
document.addEventListener('DOMContentLoaded', () => {
    log('🚀 Iniciando Sistema de Farmacias...', 'info');
    updateConnectionStatus('connecting', 'Conectando...', 'Inicializando sistema...');
  
    setupEventListeners();
  
    // Escuchar Firebase
    window.addEventListener('firebaseReady', handleFirebaseReady);
    window.addEventListener('firebaseError', handleFirebaseError);
  
    // Timeout de seguridad
    setTimeout(checkConnectionTimeout, 10000);
});

// ✅ Firebase listo
function handleFirebaseReady() {
    firebaseReady = true;
    log('✅ Firebase conectado - Sistema listo', 'success');
    updateConnectionStatus('connected', '✅ Sistema Operativo', 'Conectado a Firebase zona1561-4de30');
  
    // Cargar farmacias existentes
    loadFarmacias();
}

// ❌ Error Firebase
function handleFirebaseError(event) {
    const error = event.detail;
    log(`❌ Error Firebase: ${error.message}`, 'error');
    updateConnectionStatus('error', '❌ Error Conexión', error.message);
}

// ⏰ Timeout de conexión
function checkConnectionTimeout() {
    if (!firebaseReady) {
        log('⏰ Timeout - Trabajando en modo offline', 'warning');
        updateConnectionStatus('error', '⏰ Modo Offline', 'Usando datos locales');
        loadLocalFarmacias();
    }
}

// 🎯 Configurar event listeners
function setupEventListeners() {
    // Búsqueda en tiempo real
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterFarmacias, 300));
    }
  
    // Filtros
    const filterTelefono = document.getElementById('filterTelefono');
    if (filterTelefono) {
        filterTelefono.addEventListener('change', filterFarmacias);
    }
  
    // Formulario
    const form = document.getElementById('farmaciaForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
  
    // Modal - cerrar al hacer clic fuera
    const modal = document.getElementById('farmaciaModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }
  
    // Teclas globales
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

// 📊 Cargar farmacias desde Firebase
async function loadFarmacias() {
    if (!firebaseReady) {
        log('⚠️ Firebase no está listo', 'warning');
        return;
    }

    try {
        log('📊 Cargando farmacias desde Firebase...', 'info');
      
        const farmaciaCollection = window.firebaseCollection(window.firebaseDB, COLLECTION_NAME);
        const q = window.firebaseQuery(farmaciaCollection, window.firebaseOrderBy('nombre'));
        const snapshot = await window.firebaseGetDocs(q);
      
        farmacias = [];
        snapshot.forEach((doc) => {
            farmacias.push({
                id: doc.id,
                ...doc.data()
            });
        });
      
        log(`✅ ${farmacias.length} farmacias cargadas`, 'success');
        renderFarmacias();
        updateStats();
      
    } catch (error) {
        log(`❌ Error cargando farmacias: ${error.message}`, 'error');
        loadLocalFarmacias();
    }
}

// 💾 Cargar farmacias locales (fallback)
function loadLocalFarmacias() {
    const localData = localStorage.getItem('farmacias_zona1561_local');
    if (localData) {
        try {
            farmacias = JSON.parse(localData);
            log(`📱 ${farmacias.length} farmacias cargadas desde localStorage`, 'info');
        } catch (error) {
            farmacias = [];
        }
    } else {
        farmacias = [];
    }
  
    renderFarmacias();
    updateStats();
}

// 💾 Guardar en localStorage
function saveToLocalStorage() {
    try {
        localStorage.setItem('farmacias_zona1561_local', JSON.stringify(farmacias));
    } catch (error) {
        log('❌ Error guardando en localStorage', 'error');
    }
}

// 🎨 Renderizar tabla de farmacias
function renderFarmacias(farmaciasList = farmacias) {
    const tableBody = document.getElementById('farmaciaTableBody');
    const emptyState = document.getElementById('emptyState');
  
    if (!tableBody) return;
  
    tableBody.innerHTML = '';
  
    if (farmaciasList.length === 0) {
        document.querySelector('.table-container').style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
  
    document.querySelector('.table-container').style.display = 'block';
    emptyState.style.display = 'none';
  
    farmaciasList.forEach((farmacia, index) => {
        const row = createFarmaciaRow(farmacia, index);
        tableBody.appendChild(row);
    });
  
    // Animación de entrada
    animateTableRows();
}

// 🏗️ Crear fila de farmacia
function createFarmaciaRow(farmacia, index) {
    const row = document.createElement('tr');
    row.className = 'farmacia-row';
  
    const telefonoDisplay = farmacia.telefono ? 
        `<div class="telefono-container">
            <a href="tel:${farmacia.telefono}" class="btn-phone">
                <i class="fas fa-phone"></i> ${farmacia.telefono}
            </a>
            <a href="https://wa.me/57${farmacia.telefono}" target="_blank" class="btn-whatsapp" title="WhatsApp">
                <i class="fab fa-whatsapp"></i>
            </a>
        </div>` : 
        '<span class="no-phone">Sin teléfono</span>';
  
    row.innerHTML = `
        <td>
            <div class="farmacia-name">
                <i class="fas fa-store"></i>
                <strong>${highlightSearch(farmacia.nombre)}</strong>
            </div>
        </td>
        <td>
            ${telefonoDisplay}
        </td>
        <td>
            <div class="descripcion-container">
                ${highlightSearch(farmacia.descripcion || 'Sin descripción')}
            </div>
        </td>
        <td>
            <div class="action-buttons">
                <button onclick="editFarmacia('${farmacia.id}')" class="btn btn-edit" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteFarmacia('${farmacia.id}', '${farmacia.nombre.replace(/'/g, "\\'")}')" class="btn btn-delete" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
  
    return row;
}

// 🔍 Resaltar términos de búsqueda
function highlightSearch(text) {
    const searchTerm = document.getElementById('searchInput').value.trim();
    if (!searchTerm || !text) return text || '';
  
    const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// 🛡️ Escapar regex
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 🔍 Filtrar farmacias
function filterFarmacias() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const phoneFilter = document.getElementById('filterTelefono').value;
  
    let filtered = farmacias.filter(farmacia => {
        // Filtro de búsqueda
        const matchSearch = !searchTerm || 
            farmacia.nombre.toLowerCase().includes(searchTerm) ||
            (farmacia.telefono && farmacia.telefono.toLowerCase().includes(searchTerm)) ||
            (farmacia.descripcion && farmacia.descripcion.toLowerCase().includes(searchTerm));
      
        // Filtro de teléfono
        const matchPhone = !phoneFilter ||
            (phoneFilter === 'con' && farmacia.telefono) ||
            (phoneFilter === 'sin' && !farmacia.telefono);
      
        return matchSearch && matchPhone;
    });
  
    renderFarmacias(filtered);
    log(`🔍 Filtros aplicados: ${filtered.length}/${farmacias.length} farmacias`, 'info');
}

// ➕ Mostrar modal para agregar
function showAddModal() {
    document.getElementById('modalTitle').textContent = 'Agregar Nueva Farmacia';
    document.getElementById('farmaciaForm').reset();
    editingId = null;
    document.getElementById('farmaciaModal').style.display = 'block';
    document.getElementById('farmaciaNombre').focus();
    log('➕ Modal de agregar farmacia abierto', 'info');
}

// ✏️ Editar farmacia
function editFarmacia(id) {
    const farmacia = farmacias.find(f => f.id === id);
    if (!farmacia) {
        log(`❌ Farmacia con ID ${id} no encontrada`, 'error');
        return;
    }
  
    document.getElementById('modalTitle').textContent = 'Editar Farmacia';
    document.getElementById('farmaciaNombre').value = farmacia.nombre || '';
    document.getElementById('farmaciaTelefono').value = farmacia.telefono || '';
    document.getElementById('farmaciaDescripcion').value = farmacia.descripcion || '';
  
    editingId = id;
    document.getElementById('farmaciaModal').style.display = 'block';
    document.getElementById('farmaciaNombre').focus();
  
    log(`✏️ Editando farmacia: ${farmacia.nombre}`, 'info');
}

// ❌ Cerrar modal
function closeModal() {
    document.getElementById('farmaciaModal').style.display = 'none';
    editingId = null;
    log('❌ Modal cerrado', 'info');
}

// 📝 Manejar envío del formulario
async function handleFormSubmit(e) {
    e.preventDefault();
  
    const nombre = document.getElementById('farmaciaNombre').value.trim();
    const telefono = document.getElementById('farmaciaTelefono').value.trim();
    const descripcion = document.getElementById('farmaciaDescripcion').value.trim();
  
    if (!nombre) {
        alert('El nombre de la farmacia es obligatorio');
        return;
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
        } else {
            farmaciaData.fechaCreacion = new Date().toISOString();
            await addFarmacia(farmaciaData);
        }
      
        closeModal();
      
    } catch (error) {
        log(`❌ Error guardando farmacia: ${error.message}`, 'error');
        alert(`Error: ${error.message}`);
    }
}

// ➕ Agregar farmacia
async function addFarmacia(farmaciaData) {
    if (firebaseReady) {
        try {
            const collection = window.firebaseCollection(window.firebaseDB, COLLECTION_NAME);
            const docRef = await window.firebaseAddDoc(collection, farmaciaData);
          
            farmaciaData.id = docRef.id;
            farmacias.push(farmaciaData);
          
            log(`✅ Farmacia "${farmaciaData.nombre}" agregada a Firebase`, 'success');
          
        } catch (error) {
            // Fallback local
            farmaciaData.id = 'local_' + Date.now();
            farmacias.push(farmaciaData);
            log(`📱 Farmacia guardada localmente: ${error.message}`, 'warning');
        }
    } else {
        // Solo local
        farmaciaData.id = 'local_' + Date.now();
        farmacias.push(farmaciaData);
        log(`📱 Farmacia guardada localmente (sin Firebase)`, 'warning');
    }
  
    saveToLocalStorage();
    renderFarmacias();
    updateStats();
}

// ✏️ Actualizar farmacia
async function updateFarmacia(id, farmaciaData) {
    const index = farmacias.findIndex(f => f.id === id);
    if (index === -1) return;
  
    if (firebaseReady && !id.startsWith('local_')) {
        try {
            const docRef = window.firebaseDoc(window.firebaseDB, COLLECTION_NAME, id);
            await window.firebaseUpdateDoc(docRef, farmaciaData);
          
            log(`✅ Farmacia actualizada en Firebase`, 'success');
          
        } catch (error) {
            log(`📱 Error Firebase, actualizando localmente: ${error.message}`, 'warning');
        }
    }
  
    farmacias[index] = { ...farmacias[index], ...farmaciaData };
    saveToLocalStorage();
    renderFarmacias();
    updateStats();
}

// 🗑️ Eliminar farmacia
async function deleteFarmacia(id, nombre) {
    if (!confirm(`¿Estás seguro de que deseas eliminar "${nombre}"?\n\nEsta acción no se puede deshacer.`)) {
        return;
    }
  
    const index = farmacias.findIndex(f => f.id === id);
    if (index === -1) return;
  
    if (firebaseReady && !id.startsWith('local_')) {
        try {
            const docRef = window.firebaseDoc(window.firebaseDB, COLLECTION_NAME, id);
            await window.firebaseDeleteDoc(docRef);
          
            log(`✅ Farmacia eliminada de Firebase`, 'success');
          
        } catch (error) {
            log(`📱 Error Firebase, eliminando localmente: ${error.message}`, 'warning');
        }
    }
  
    farmacias.splice(index, 1);
    saveToLocalStorage();
    renderFarmacias();
    updateStats();
  
    log(`🗑️ Farmacia "${nombre}" eliminada`, 'info');
}

// 📊 Actualizar estadísticas
function updateStats() {
    const total = farmacias.length;
    const conTelefono = farmacias.filter(f => f.telefono).length;
    const ahora = new Date().toLocaleTimeString('es-CO', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
  
    document.getElementById('totalFarmacias').textContent = total;
    document.getElementById('conTelefono').textContent = conTelefono;
    document.getElementById('ultimaActualizacion').textContent = ahora;
}

// 📤 Exportar datos a Excel
function exportData() {
    try {
        const dataToExport = farmacias.map((farmacia, index) => ({
            'N°': index + 1,
            'NOMBRE': farmacia.nombre,
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
        log(`❌ Error exportando: ${error.message}`, 'error');
        alert('Error al exportar datos');
    }
}

// ✨ Animación de filas
function animateTableRows() {
    const rows = document.querySelectorAll('.farmacia-row');
    rows.forEach((row, index) => {
        row.style.opacity = '0';
        row.style.transform = 'translateY(20px)';
      
        setTimeout(() => {
            row.style.transition = 'all 0.3s ease';
            row.style.opacity = '1';
            row.style.transform = 'translateY(0)';
        }, index * 50);
    });
}

// 📊 Actualizar estado de conexión
function updateConnectionStatus(status, title, message) {
    const statusCard = document.querySelector('.status-card');
    const statusIcon = document.getElementById('statusIcon');
    const statusTitle = document.getElementById('statusTitle');
    const statusMessage = document.getElementById('statusMessage');
  
    if (!statusCard) return;
  
    statusCard.className = 'status-card';
  
    switch (status) {
        case 'connecting':
            statusIcon.className = 'fas fa-spinner fa-spin';
            break;
        case 'connected':
            statusCard.classList.add('connected');
            statusIcon.className = 'fas fa-check-circle success';
            break;
        case 'error':
            statusCard.classList.add('error');
            statusIcon.className = 'fas fa-exclamation-triangle error';
            break;
    }
  
    statusTitle.textContent = title;
    statusMessage.textContent = message;
}

// 📝 Sistema de logging
function log(message, type = 'info') {
    const logContainer = document.getElementById('logContainer');
    if (!logContainer) return;
  
    const timestamp = new Date().toLocaleTimeString('es-CO');
  
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
  
    const icons = {
        'info': 'ℹ️',
        'success': '✅',
        'warning': '⚠️',
        'error': '❌'
    };
  
    logEntry.innerHTML = `<span class="timestamp">[${timestamp}]</span> ${icons[type]} ${message}`;
  
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
  
    // Console log
    console.log(`[Farmacias] ${message}`);
}

// 🧹 Limpiar log
function clearLog() {
    const logContainer = document.getElementById('logContainer');
    if (logContainer) {
        logContainer.innerHTML = '';
        log('🧹 Registro limpiado', 'info');
    }
}

// ⏱️ Debounce utility
function debounce(func, wait) {
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

// 🎯 Funciones globales
window.showAddModal = showAddModal;
window.editFarmacia = editFarmacia;
window.deleteFarmacia = deleteFarmacia;
window.closeModal = closeModal;
window.loadFarmacias = loadFarmacias;
window.exportData = exportData;
window.clearLog = clearLog;

// 🔧 Debug utilities
window.farmaciaDebug = {
    status: () => ({
        firebaseReady,
        totalFarmacias: farmacias.length,
        editingId,
        lastUpdate: new Date().toISOString()
    }),
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

// 🚀 Inicialización final
log('📱 Sistema de Farmacias cargado correctamente', 'success');
