/**
 * 🔥 TEST DE CONEXIÓN FIREBASE - ZONA 1561
 * Script completo con configuración específica
 * @version: 2.0.0
 * @project: zona1561-4de30
 */

// 🎯 Variables globales
let firebaseReady = false;
let testCollectionName = 'firebase_test_zona1561';
let connectionAttempts = 0;
const maxRetries = 3;

// 🚀 Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    log('🚀 Iniciando aplicación de prueba Firebase...', 'info');
    updateConnectionStatus('connecting', 'Conectando...', 'Inicializando Firebase Zona 1561...');
    
    // Verificar si Firebase está disponible
    checkFirebaseAvailability();
});

// 🔍 Verificar disponibilidad de Firebase
function checkFirebaseAvailability() {
    const checkInterval = setInterval(() => {
        connectionAttempts++;
        
        if (window.firebaseApp && window.firebaseDB) {
            clearInterval(checkInterval);
            firebaseReady = true;
            log('🔥 Firebase detectado y disponible', 'success');
            testFirebaseConnection();
        } else if (connectionAttempts >= maxRetries) {
            clearInterval(checkInterval);
            updateConnectionStatus('error', '❌ Firebase No Disponible', 'No se pudo inicializar Firebase después de varios intentos');
            log(`❌ Firebase no disponible después de ${maxRetries} intentos`, 'error');
        } else {
            log(`⏳ Esperando Firebase... (intento ${connectionAttempts}/${maxRetries})`, 'warning');
        }
    }, 1000);
}

// 🧪 Probar conexión a Firebase
async function testFirebaseConnection() {
    try {
        log('🧪 Probando conexión con base de datos...', 'info');
        
        // Test de escritura mínima
        const testDoc = {
            test: 'conexion_inicial',
            timestamp: new Date().toISOString(),
            proyecto: 'zona1561-test'
        };
        
        const testCollection = window.firebaseCollection(window.firebaseDB, testCollectionName);
        await window.firebaseAddDoc(testCollection, testDoc);
        
        // Test de lectura
        const querySnapshot = await window.firebaseGetDocs(testCollection);
        
        updateConnectionStatus('connected', '✅ Conectado Exitosamente', `Firebase funcionando. ${querySnapshot.size} documentos en la colección de prueba`);
        log(`✅ Conexión exitosa a zona1561-4de30. Documentos encontrados: ${querySnapshot.size}`, 'success');
        log(`📊 Proyecto ID: zona1561-4de30`, 'info');
        log(`🔗 Auth Domain: zona1561-4de30.firebaseapp.com`, 'info');
        
        // Cargar datos existentes
        setTimeout(readTest, 1000);
        
    } catch (error) {
        updateConnectionStatus('error', '❌ Error de Conexión', `Error: ${error.message}`);
        log(`❌ Error de conexión: ${error.message}`, 'error');
        
        // Intentar diagnóstico
        diagnoseConnectionError(error);
    }
}

// 🔧 Diagnosticar errores de conexión
function diagnoseConnectionError(error) {
    log('🔧 Ejecutando diagnóstico de conexión...', 'info');
    
    if (error.code === 'permission-denied') {
        log('🔒 Error de permisos: Revisar reglas de Firestore', 'warning');
        log('💡 Sugerencia: Verificar que las reglas permitan lectura/escritura', 'info');
    } else if (error.code === 'unavailable') {
        log('🌐 Error de red: Verificar conexión a internet', 'warning');
    } else if (error.message.includes('quota')) {
        log('📊 Error de cuota: Límite de Firebase alcanzado', 'warning');
    } else {
        log(`🔍 Error desconocido: ${error.code || 'No code'} - ${error.message}`, 'error');
    }
    
    // Estado de variables globales de Firebase
    log(`🔗 Firebase App: ${!!window.firebaseApp}`, 'info');
    log(`🗄️ Firebase DB: ${!!window.firebaseDB}`, 'info');
    log(`📚 Firebase Collection: ${!!window.firebaseCollection}`, 'info');
}

// 📝 Escribir datos de prueba
async function writeTest() {
    if (!firebaseReady) {
        log('⚠️ Firebase no está listo. Espera un momento...', 'warning');
        return;
    }

    const testData = document.getElementById('testData').value.trim();
    if (!testData) {
        log('⚠️ Por favor escribe algo para probar', 'warning');
        alert('Escribe un mensaje para probar la escritura en Firebase');
        return;
    }

    const writeButton = document.querySelector('button[onclick="writeTest()"]');
    showLoading(writeButton);

    try {
        log(`📝 Escribiendo en Firebase: "${testData}"...`, 'info');
        
        const docData = {
            mensaje: testData,
            timestamp: new Date().toISOString(),
            tipo: 'mensaje_usuario',
            proyecto: 'zona1561-test',
            ip: await getUserIP() || 'desconocida',
            navegador: navigator.userAgent.split(' ')[0] || 'desconocido'
        };
        
        const testCollection = window.firebaseCollection(window.firebaseDB, testCollectionName);
        const docRef = await window.firebaseAddDoc(testCollection, docData);
        
        log(`✅ Documento creado exitosamente`, 'success');
        log(`🆔 ID del documento: ${docRef.id}`, 'info');
        log(`📊 Datos guardados: ${JSON.stringify(docData, null, 2)}`, 'info');
        
        document.getElementById('testData').value = '';
        document.getElementById('testData').placeholder = 'Mensaje guardado correctamente!';
        
        // Leer automáticamente después de escribir
        setTimeout(() => {
            readTest();
            document.getElementById('testData').placeholder = 'Escribe algo para probar...';
        }, 500);
        
    } catch (error) {
        log(`❌ Error escribiendo datos: ${error.message}`, 'error');
        log(`🔍 Código de error: ${error.code || 'Sin código'}`, 'error');
        alert(`Error al guardar: ${error.message}`);
    } finally {
        hideLoading(writeButton);
    }
}

// 📖 Leer datos de Firebase
async function readTest() {
    if (!firebaseReady) {
        log('⚠️ Firebase no está listo para leer datos', 'warning');
        return;
    }

    const readButton = document.querySelector('button[onclick="readTest()"]');
    showLoading(readButton);

    try {
        log('📖 Leyendo datos de Firebase...', 'info');
        
        const testCollection = window.firebaseCollection(window.firebaseDB, testCollectionName);
        const querySnapshot = await window.firebaseGetDocs(testCollection);
        
        const dataDisplay = document.getElementById('dataDisplay');
        dataDisplay.innerHTML = '';
        
        if (querySnapshot.empty) {
            dataDisplay.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #666;">
                    <i class="fas fa-database" style="font-size: 2rem; margin-bottom: 10px; opacity: 0.5;"></i>
                    <p>No hay datos para mostrar</p>
                    <small>Escribe algo arriba y haz clic en "Escribir" para crear tu primer registro</small>
                </div>
            `;
            log('📖 No se encontraron datos en la colección', 'info');
        } else {
            let documentCount = 0;
            querySnapshot.forEach((doc) => {
                documentCount++;
                const data = doc.data();
                const dataItem = document.createElement('div');
                dataItem.className = 'data-item';
                
                // Formatear fecha
                const fecha = data.timestamp ? new Date(data.timestamp).toLocaleString('es-CO') : 'Sin fecha';
                
                dataItem.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                        <strong style="color: #1a73e8;">📄 Documento #${documentCount}</strong>
                        <span style="font-size: 0.8rem; color: #666;">${fecha}</span>
                    </div>
                    <div style="margin-bottom: 8px;">
                        <strong>🆔 ID:</strong> <code style="background: #f1f3f4; padding: 2px 4px; border-radius: 3px;">${doc.id}</code>
                    </div>
                    <div style="margin-bottom: 8px;">
                        <strong>💬 Mensaje:</strong> "${data.mensaje || 'Sin mensaje'}"
                    </div>
                    <div style="margin-bottom: 8px;">
                        <strong>🏷️ Tipo:</strong> ${data.tipo || 'Sin tipo'}
                    </div>
                    ${data.proyecto ? `<div style="margin-bottom: 8px;"><strong>📁 Proyecto:</strong> ${data.proyecto}</div>` : ''}
                    ${data.ip ? `<div style="font-size: 0.8rem; color: #666;"><strong>🌐 IP:</strong> ${data.ip}</div>` : ''}
                `;
                dataDisplay.appendChild(dataItem);
            });
            
            log(`✅ ${querySnapshot.size} documentos leídos correctamente`, 'success');
            log(`📊 Colección: ${testCollectionName}`, 'info');
        }
        
    } catch (error) {
        log(`❌ Error leyendo datos: ${error.message}`, 'error');
        dataDisplay.innerHTML = `
            <div style="color: #ea4335; padding: 15px; border: 1px solid #ea4335; border-radius: 4px; background: #fef7f7;">
                <strong>❌ Error al leer datos</strong><br>
                ${error.message}
            </div>
        `;
    } finally {
        hideLoading(readButton);
    }
}

// 🗑️ Eliminar todos los datos de prueba
async function deleteTest() {
    if (!firebaseReady) {
        log('⚠️ Firebase no está listo para eliminar datos', 'warning');
        return;
    }

    const confirmMessage = `¿Estás seguro de que quieres eliminar TODOS los datos de prueba?

Esta acción:
- Eliminará todos los documentos de la colección ${testCollectionName}
- No se puede deshacer
- Es solo para datos de prueba

¿Continuar?`;

    if (!confirm(confirmMessage)) {
        log('🚫 Eliminación cancelada por el usuario', 'info');
        return;
    }

    const deleteButton = document.querySelector('button[onclick="deleteTest()"]');
    showLoading(deleteButton);

    try {
        log('🗑️ Iniciando eliminación de datos de prueba...', 'info');
        
        const testCollection = window.firebaseCollection(window.firebaseDB, testCollectionName);
        const querySnapshot = await window.firebaseGetDocs(testCollection);
        
        if (querySnapshot.empty) {
            log('ℹ️ No hay datos para eliminar', 'info');
            return;
        }
        
        const deletePromises = [];
        const docIds = [];
        
        querySnapshot.forEach((document) => {
            docIds.push(document.id);
            deletePromises.push(
                window.firebaseDeleteDoc(
                    window.firebaseDoc(window.firebaseDB, testCollectionName, document.id)
                )
            );
        });
        
        log(`🔄 Eliminando ${deletePromises.length} documentos...`, 'info');
        await Promise.all(deletePromises);
        
        log(`✅ ${deletePromises.length} documentos eliminados exitosamente`, 'success');
        log(`🗑️ IDs eliminados: ${docIds.join(', ')}`, 'info');
        
        // Actualizar la visualización
        setTimeout(readTest, 500);
        
    } catch (error) {
        log(`❌ Error eliminando datos: ${error.message}`, 'error');
        alert(`Error al eliminar: ${error.message}`);
    } finally {
        hideLoading(deleteButton);
    }
}

// 🌐 Obtener IP del usuario (opcional)
async function getUserIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return null;
    }
}

// 📊 Actualizar estado de conexión
function updateConnectionStatus(status, title, message) {
    const statusCard = document.querySelector('.status-card');
    const statusIcon = document.getElementById('statusIcon');
    const statusTitle = document.getElementById('statusTitle');
    const statusMessage = document.getElementById('statusMessage');
    
    // Limpiar clases anteriores
    statusCard.className = 'status-card';
    statusIcon.className = '';
    
    switch (status) {
        case 'connecting':
            statusIcon.className = 'fas fa-spinner fa-spin';
            statusCard.classList.add('pulse');
            break;
        case 'connected':
            statusCard.classList.add('connected');
            statusCard.classList.remove('pulse');
            statusIcon.className = 'fas fa-check-circle success';
            break;
        case 'error':
            statusCard.classList.add('error');
            statusCard.classList.remove('pulse');
            statusIcon.className = 'fas fa-exclamation-triangle error';
            break;
    }
    
    statusTitle.textContent = title;
    statusMessage.textContent = message;
}

// 📝 Sistema de logging mejorado
function log(message, type = 'info') {
    const logContainer = document.getElementById('logContainer');
    const timestamp = new Date().toLocaleTimeString('es-CO');
    
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    
    // Iconos para cada tipo de log
    const icons = {
        'info': 'ℹ️',
        'success': '✅',
        'warning': '⚠️',
        'error': '❌'
    };
    
    logEntry.innerHTML = `<span style="color: #666;">[${timestamp}]</span> ${icons[type]} ${message}`;
    
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
    
    // También loggear en consola con colores
    const consoleColors = {
        'info': 'color: #2196F3',
        'success': 'color: #4CAF50',
        'warning': 'color: #FF9800',
        'error': 'color: #F44336'
    };
    
    console.log(`%c[Firebase Test Zona1561] ${message}`, consoleColors[type]);
}

// 🧹 Limpiar log
function clearLog() {
    const logContainer = document.getElementById('logContainer');
    logContainer.innerHTML = '';
    log('🧹 Log de actividades limpiado', 'info');
}

// 🎯 Funciones globales para los botones
window.writeTest = writeTest;
window.readTest = readTest;
window.deleteTest = deleteTest;
window.clearLog = clearLog;

// 🔧 Funciones de utilidad para loading
function showLoading(element) {
    if (element) {
        element.classList.add('loading');
        element.disabled = true;
        const originalText = element.innerHTML;
        element.setAttribute('data-original-text', originalText);
        element.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    }
}

function hideLoading(element) {
    if (element) {
        element.classList.remove('loading');
        element.disabled = false;
        const originalText = element.getAttribute('data-original-text');
        if (originalText) {
            element.innerHTML = originalText;
        }
    }
}

// 📱 Detectar errores no manejados
window.addEventListener('error', (event) => {
    log(`❌ Error JavaScript no manejado: ${event.error.message}`, 'error');
    console.error('Error details:', event.error);
});

// 🔄 Detectar cambios de visibilidad
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && firebaseReady) {
        log('👁️ Página visible, verificando estado de conexión...', 'info');
        setTimeout(testFirebaseConnection, 1000);
    }
});

// 🎯 Funciones de debug para la consola
window.firebaseDebug = {
    getStatus: () => {
        return {
            firebaseReady,
            connectionAttempts,
            hasApp: !!window.firebaseApp,
            hasDB: !!window.firebaseDB,
            collection: testCollectionName,
            project: 'zona1561-4de30'
        };
    },
    forceReconnect: () => {
        log('🔄 Forzando reconexión...', 'info');
        firebaseReady = false;
        connectionAttempts = 0;
        checkFirebaseAvailability();
    },
    testWrite: (message = 'Test desde consola') => {
        document.getElementById('testData').value = message;
        writeTest();
    }
};

// 🚀 Log inicial
log('📱 Script de prueba Firebase cargado correctamente', 'success');
log('🏢 Proyecto: zona1561-4de30', 'info');
log('💡 Tip: Usa firebaseDebug.getStatus() en la consola para debug', 'info');
