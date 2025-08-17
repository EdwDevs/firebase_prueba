/**
 * 🏥 SISTEMA DE GESTIÓN DE FARMACIAS ZONA 1561
 * Refactorizado – versión 3.1.0
 * @author  Equipo de desarrollo
 * @date    2025‑08‑17
 */

(() => {
    // ---------- Constantes y selectores ----------
    const COLLECTION_NAME = 'farmacias_zona1561';
    const SELECTORS = {
        searchInput: '#searchInput',
        filterTelefono: '#filterTelefono',
        farmaciaForm: '#farmaciaForm',
        modal: '#farmaciaModal',
        modalTitle: '#modalTitle',
        logContainer: '#logContainer',
        statusCard: '.status-card',
        statusIcon: '#statusIcon',
        statusTitle: '#statusTitle',
        statusMessage: '#statusMessage',
        tableBody: '#farmaciaTableBody',
        emptyState: '#emptyState',
        totalFarmacias: '#totalFarmacias',
        conTelefono: '#conTelefono',
        ultimaActualizacion: '#ultimaActualizacion'
    };

    // ---------- Estado interno ----------
    let firebaseReady = false;
    let editingId = null;
    let farmacias = [];

    // ---------- Referencias al DOM (caché) ----------
    const elements = {};
    for (const [key, selector] of Object.entries(SELECTORS)) {
        elements[key] = document.querySelector(selector);
    }

    // ---------- Utilidades ----------
    const log = (msg, type = 'info') => {
        const container = elements.logContainer;
        if (!container) return;
        const ts = new Date().toLocaleTimeString('es-CO');
        const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.innerHTML = `<span class="timestamp">[${ts}]</span> ${icons[type]} ${msg}`;
        container.appendChild(entry);
        container.scrollTop = container.scrollHeight;
        console.log(`[Farmacias] ${msg}`);
    };

    const handleError = (context, error) => {
        log(`❌ ${context}: ${error.message}`, 'error');
        // fallback a localStorage cuando sea posible
        if (context.includes('Firebase')) loadLocalFarmacias();
    };

    const debounce = (fn, delay) => {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    };

    // ---------- Servicios ----------
    const firebaseService = {
        async getAll() {
            const col = window.firebaseCollection(window.firebaseDB, COLLECTION_NAME);
            const q = window.firebaseQuery(col, window.firebaseOrderBy('nombre'));
            const snap = await window.firebaseGetDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        },
        async add(data) {
            const col = window.firebaseCollection(window.firebaseDB, COLLECTION_NAME);
            const ref = await window.firebaseAddDoc(col, data);
            return { ...data, id: ref.id };
        },
        async update(id, data) {
            const doc = window.firebaseDoc(window.firebaseDB, COLLECTION_NAME, id);
            await window.firebaseUpdateDoc(doc, data);
        },
        async delete(id) {
            const doc = window.firebaseDoc(window.firebaseDB, COLLECTION_NAME, id);
            await window.firebaseDeleteDoc(doc);
        }
    };

    const localService = {
        key: 'farmacias_zona1561_local',
        load() {
            const raw = localStorage.getItem(this.key);
            return raw ? JSON.parse(raw) : [];
        },
        save(data) {
            localStorage.setItem(this.key, JSON.stringify(data));
        },
        clear() {
            localStorage.removeItem(this.key);
        }
    };

    const uiService = {
        render(list) {
            const tbody = elements.tableBody;
            const empty = elements.emptyState;
            if (!tbody) return;

            tbody.innerHTML = '';
            if (list.length === 0) {
                elements.tableBody.closest('.table-container').style.display = 'none';
                empty.style.display = 'block';
                return;
            }

            elements.tableBody.closest('.table-container').style.display = 'block';
            empty.style.display = 'none';

            const fragment = document.createDocumentFragment();
            list.forEach((farmacia, idx) => {
                const row = document.createElement('tr');
                row.className = 'farmacia-row';
                row.innerHTML = uiService.rowTemplate(farmacia);
                fragment.appendChild(row);
            });
            tbody.appendChild(fragment);
            uiService.animateRows();
        },
        rowTemplate(f) {
            const phoneBlock = f.telefono
                ? `<div class="telefono-container">
                       <a href="tel:${f.telefono}" class="btn-phone" aria-label="Llamar a ${f.telefono}">
                           <i class="fas fa-phone"></i> ${f.telefono}
                       </a>
                       <a href="https://wa.me/57${f.telefono}" target="_blank" class="btn-whatsapp" aria-label="WhatsApp ${f.telefono}">
                           <i class="fab fa-whatsapp"></i>
                       </a>
                   </div>`
                : '<span class="no-phone">Sin teléfono</span>';

            return `
                <td>
                    <div class="farmacia-name"><i class="fas fa-store"></i> <strong>${uiService.highlight(f.nombre)}</strong></div>
                </td>
                <td>${phoneBlock}</td>
                <td><div class="descripcion-container">${uiService.highlight(f.descripcion || 'Sin descripción')}</div></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-edit" title="Editar" aria-label="Editar ${f.nombre}"
                                onclick="farmaciaApp.editFarmacia('${f.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-delete" title="Eliminar" aria-label="Eliminar ${f.nombre}"
                                onclick="farmaciaApp.deleteFarmacia('${f.id}', '${f.nombre.replace(/'/g, "\\'")}')"><i class="fas fa-trash"></i></button>
                    </div>
                </td>`;
        },
        highlight(text) {
            const term = elements.searchInput.value.trim();
            if (!term) return text;
            const esc = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const re = new RegExp(`(${esc})`, 'gi');
            return text.replace(re, '<mark>$1</mark>');
        },
        animateRows() {
            const rows = document.querySelectorAll('.farmacia-row');
            rows.forEach((row, i) => {
                row.style.opacity = '0';
                row.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    row.classList.add('fade-in');
                }, i * 50);
            });
        },
        updateStats() {
            const total = farmacias.length;
            const withPhone = farmacias.filter(f => f.telefono).length;
            const now = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
            elements.totalFarmacias.textContent = total;
            elements.conTelefono.textContent = withPhone;
            elements.ultimaActualizacion.textContent = now;
        },
        status(state, title, msg) {
            const card = elements.statusCard;
            const icon = elements.statusIcon;
            const tTitle = elements.statusTitle;
            const tMsg = elements.statusMessage;
            if (!card) return;

            card.className = 'status-card';
            icon.className = state === 'connected' ? 'fas fa-check-circle success' :
                             state === 'error' ? 'fas fa-exclamation-triangle error' :
                             'fas fa-spinner fa-spin';

            if (state === 'connected') card.classList.add('connected');
            if (state === 'error') card.classList.add('error');

            tTitle.textContent = title;
            tMsg.textContent = msg;
        }
    };

    // ---------- Carga inicial ----------
    const init = () => {
        log('🚀 Iniciando Sistema de Farmacias...', 'info');
        uiService.status('connecting', 'Conectando...', 'Inicializando sistema...');
        setupListeners();

        window.addEventListener('firebaseReady', async () => {
            firebaseReady = true;
            log('✅ Firebase conectado - Sistema listo', 'success');
            uiService.status('connected', '✅ Sistema Operativo', 'Conectado a Firebase zona1561-4de30');
            await loadFromFirebase();
        });

        window.addEventListener('firebaseError', e => handleError('Firebase', e.detail));

        setTimeout(() => {
            if (!firebaseReady) {
                log('⏰ Timeout - Trabajando en modo offline', 'warning');
                uiService.status('error', '⏰ Modo Offline', 'Usando datos locales');
                loadFromLocal();
            }
        }, 10000);
    };

    // ---------- Event listeners ----------
    const setupListeners = () => {
        if (elements.searchInput) {
            elements.searchInput.addEventListener('input', debounce(filterAndRender, 300));
        }
        if (elements.filterTelefono) {
            elements.filterTelefono.addEventListener('change', filterAndRender);
        }
        if (elements.farmaciaForm) {
            elements.farmaciaForm.addEventListener('submit', handleSubmit);
        }
        if (elements.modal) {
            elements.modal.addEventListener('click', e => {
                if (e.target === elements.modal) closeModal();
            });
        }
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') closeModal();
        });
    };

    // ---------- Carga de datos ----------
    const loadFromFirebase = async () => {
        try {
            const data = await firebaseService.getAll();
            farmacias = data;
            log(`✅ ${farmacias.length} farmacias cargadas desde Firebase`, 'success');
        } catch (err) {
            handleError('Cargando farmacias desde Firebase', err);
        } finally {
            uiService.render(farmacias);
            uiService.updateStats();
        }
    };

    const loadFromLocal = () => {
        farmacias = localService.load();
        log(`📱 ${farmacias.length} farmacias cargadas desde localStorage`, 'info');
        uiService.render(farmacias);
        uiService.updateStats();
    };

    // ---------- Filtrado ----------
    const filterAndRender = () => {
        const term = elements.searchInput.value.toLowerCase().trim();
        const phoneFilter = elements.filterTelefono.value;
        const filtered = farmacias.filter(f => {
            const matchesSearch = !term ||
                f.nombre?.toLowerCase().includes(term) ||
                f.telefono?.toLowerCase().includes(term) ||
                f.descripcion?.toLowerCase().includes(term);
            const matchesPhone = !phoneFilter ||
                (phoneFilter === 'con' && f.telefono) ||
                (phoneFilter === 'sin' && !f.telefono);
            return matchesSearch && matchesPhone;
        });
        uiService.render(filtered);
        log(`🔍 Filtros aplicados: ${filtered.length}/${farmacias.length} farmacias`, 'info');
    };

    // ---------- Modal ----------
    const openModal = (mode, data = {}) => {
        elements.modalTitle.textContent = mode === 'edit' ? 'Editar Farmacia' : 'Agregar Nueva Farmacia';
        elements.farmaciaForm.reset();
        document.getElementById('farmaciaNombre').value = data.nombre || '';
        document.getElementById('farmaciaTelefono').value = data.telefono || '';
        document.getElementById('farmaciaDescripcion').value = data.descripcion || '';
        editingId = mode === 'edit' ? data.id : null;
        elements.modal.style.display = 'block';
        document.getElementById('farmaciaNombre').focus();
        log(`${mode === 'edit' ? '✏️' : '➕'} Modal ${mode === 'edit' ? 'de edición' : 'de alta'} abierto`, 'info');
    };

    window.showAddModal = () => openModal('add');

    // ---------- CRUD ----------
    const handleSubmit = async e => {
        e.preventDefault();
        const nombre = document.getElementById('farmaciaNombre').value.trim();
        const telefono = document.getElementById('farmaciaTelefono').value.trim();
        const descripcion = document.getElementById('farmaciaDescripcion').value.trim();

        if (!nombre) {
            alert('El nombre de la farmacia es obligatorio');
            return;
        }

        const payload = {
            nombre,
            telefono,
            descripcion,
            fechaActualizacion: new Date().toISOString()
        };

        try {
            if (editingId) {
                await updateFarmacia(editingId, payload);
            } else {
                payload.fechaCreacion = new Date().toISOString();
                await addFarmacia(payload);
            }
            closeModal();
        } catch (err) {
            handleError('Guardando farmacia', err);
            alert(`Error: ${err.message}`);
        }
    };

    const addFarmacia = async data => {
        if (firebaseReady) {
            try {
                const saved = await firebaseService.add(data);
                farmacias.push(saved);
                log(`✅ Farmacia "${saved.nombre}" agregada a Firebase`, 'success');
            } catch (err) {
                data.id = `local_${Date.now()}`;
                farmacias.push(data);
                log(`📱 Farmacia guardada localmente (error Firebase): ${err.message}`, 'warning');
            }
        } else {
            data.id = `local_${Date.now()}`;
            farmacias.push(data);
            log('📱 Farmacia guardada localmente (sin Firebase)', 'warning');
        }
        localService.save(farmacias);
        uiService.render(farmacias);
        uiService.updateStats();
    };

    const updateFarmacia = async (id, data) => {
        const idx = farmacias.findIndex(f => f.id === id);
        if (idx === -1) return;

        if (firebaseReady && !id.startsWith('local_')) {
            try {
                await firebaseService.update(id, data);
                log('✅ Farmacia actualizada en Firebase', 'success');
            } catch (err) {
                log(`📱 Error Firebase, actualizando localmente: ${err.message}`, 'warning');
            }
        }

        farmacias[idx] = { ...farmacias[idx], ...data };
        localService.save(farmacias);
        uiService.render(farmacias);
        uiService.updateStats();
    };

    window.editFarmacia = id => {
        const f = farmacias.find(x => x.id === id);
        if (!f) {
            log(`❌ Farmacia con ID ${id} no encontrada`, 'error');
            return;
        }
        openModal('edit', f);
    };

    const deleteFarmacia = async (id, nombre) => {
        if (!confirm(`¿Estás seguro de que deseas eliminar "${nombre}"?\nEsta acción no se puede deshacer.`)) return;

        const idx = farmacias.findIndex(f => f.id === id);
        if (idx === -1) return;

        if (firebaseReady && !id.startsWith('local_')) {
            try {
                await firebaseService.delete(id);
                log('✅ Farmacia eliminada de Firebase', 'success');
            } catch (err) {
                log(`📱 Error Firebase, eliminando localmente: ${err.message}`, 'warning');
            }
        }

        farmacias.splice(idx, 1);
        localService.save(farmacias);
        uiService.render(farmacias);
        uiService.updateStats();
        log(`🗑️ Farmacia "${nombre}" eliminada`, 'info');
    };

    window.deleteFarmacia = deleteFarmacia;

    // ---------- Exportar a Excel ----------
    window.exportData = () => {
        try {
            const rows = farmacias.map((f, i) => ({
                'N°': i + 1,
                'NOMBRE': f.nombre,
                'TELEFONO': f.telefono || '',
                'DESCRIPCION': f.descripcion || '',
                'FECHA_CREACION': f.fechaCreacion ? new Date(f.fechaCreacion).toLocaleString('es-CO') : '',
                'ULTIMA_ACTUALIZACION': f.fechaActualizacion ? new Date(f.fechaActualizacion).toLocaleString('es-CO') : ''
            }));
            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Farmacias_Zona1561');
            const fecha = new Date().toISOString().slice(0, 10);
            XLSX.writeFile(wb, `Farmacias_Zona1561_${fecha}.xlsx`);
            log(`📊 Excel exportado: ${farmacias.length} farmacias`, 'success');
        } catch (err) {
            handleError('Exportando a Excel', err);
            alert('Error al exportar datos');
        }
    };

    // ---------- Utilidades UI ----------
    const closeModal = () => {
        elements.modal.style.display = 'none';
        editingId = null;
        log('❌ Modal cerrado', 'info');
    };
    window.closeModal = closeModal;

    // ---------- Limpieza de log ----------
    window.clearLog = () => {
        elements.logContainer.innerHTML = '';
        log('🧹 Registro limpiado', 'info');
    };

    // ---------- Debug ----------
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
                localService.clear();
                uiService.render(farmacias);
                uiService.updateStats();
                log('🧹 Todas las farmacias eliminadas', 'warning');
            }
        }
    };

    // ---------- Arranque ----------
    init();
    log('📱 Sistema de Farmacias cargado correctamente', 'success');
})();
