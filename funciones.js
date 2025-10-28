// ===== VARIABLES GLOBALES =====
let indicadores = [];
let vistaActual = 'cards';
let programaSeleccionado = null;

// ===== ELEMENTOS DOM =====
const urlSheet = document.getElementById('urlSheet');
const btnCargar = document.getElementById('btnCargar');
const searchInput = document.getElementById('searchInput');
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const themeToggle = document.getElementById('themeToggle');
const loadingOverlay = document.getElementById('loadingOverlay');
const toastContainer = document.getElementById('toastContainer');
const shortcutsModal = document.getElementById('shortcutsModal');
const shortcutsClose = document.getElementById('shortcutsClose');

// ===== CARGAR DATOS =====
async function cargarDatos() {
    const url = urlSheet.value.trim();
    if (!url) {
        showToast('Advertencia', 'Por favor pega la URL de Google Sheets', 'warning');
        return;
    }

    const sheetID = url.includes('/d/') ? url.split('/d/')[1].split('/')[0] : null;
    if (!sheetID) {
        showToast('Error', 'URL inválida. Asegúrate de copiar la URL completa', 'error');
        return;
    }

    try {
        showLoading('Cargando datos desde Google Sheets...');

        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetID}/export?format=csv`;
        const response = await fetch(csvUrl);
        const csv = await response.text();
        const lineas = csv.split('\n');

        indicadores = [];

        // Leer encabezados
        const headers = lineas[0].split(',').map(h => h.replace(/"/g, '').trim());

        // Encontrar índices de columnas importantes
        const getColIndex = (nombre) => {
            const idx = headers.findIndex(h => h.toLowerCase().includes(nombre.toLowerCase()));
            return idx >= 0 ? idx : -1;
        };

        const idxCodigo = getColIndex('código');
        const idxCriterio = getColIndex('criterio');
        const idxIndicador = getColIndex('indicador');
        const idxDescripcion = getColIndex('descripción');
        const idxNivel = getColIndex('nivel');
        const idxTiempo = getColIndex('tiempo');

        for (let i = 1; i < lineas.length; i++) {
            const linea = lineas[i].trim();
            if (!linea) continue;

            const cols = parseCSVLine(linea);

            const codigo = getColValue(cols, idxCodigo);
            const criterio = getColValue(cols, idxCriterio);
            const nombre = getColValue(cols, idxIndicador);
            const desc = getColValue(cols, idxDescripcion);
            const nivel = getColValue(cols, idxNivel);
            const tiempo = getColValue(cols, idxTiempo);

            // Validar que tenemos datos mínimos
            if (!codigo || !nombre || codigo.includes('#') || codigo === 'Código') continue;

            // Detectar tipo
            let tipo = detectarTipo(tiempo, criterio, nombre);

            // Detectar departamento
            let depto = detectarDepartamento(codigo);

            // Extraer programa del código
            const programa = codigo.includes('.') ? codigo.split('.')[0] + '.' + codigo.split('.')[1].charAt(0) : codigo.split('.')[0];

            indicadores.push({
                codigo,
                criterio,
                nombre,
                desc,
                tipo,
                depto,
                nivel,
                tiempo,
                programa
            });
        }

        hideLoading();

        if (indicadores.length === 0) {
            showToast('Advertencia', 'No se encontraron indicadores válidos en el archivo', 'warning');
            return;
        }

        renderizarTodo();
        localStorage.setItem('urlSheet', url);
        document.getElementById('emptyState').style.display = 'none';

        showToast('Éxito', `${indicadores.length} indicadores cargados correctamente`, 'success');

    } catch (error) {
        hideLoading();
        console.error('Error completo:', error);
        showToast('Error', `No se pudieron cargar los datos: ${error.message}`, 'error');
    }
}

// ===== UTILIDADES UI =====

// Dark Mode
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    // Actualizar icono
    const icon = themeToggle.querySelector('.theme-icon');
    icon.textContent = isDark ? '☀️' : '🌙';

    // Mostrar toast
    showToast('Tema actualizado', `Modo ${isDark ? 'oscuro' : 'claro'} activado`, 'info');
}

// Toast Notifications
function showToast(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || 'ℹ️'}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">&times;</button>
    `;

    toastContainer.appendChild(toast);

    // Animar entrada
    setTimeout(() => toast.classList.add('show'), 10);

    // Configurar cierre
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => removeToast(toast));

    // Auto-cerrar después de 5 segundos
    setTimeout(() => removeToast(toast), 5000);
}

function removeToast(toast) {
    toast.classList.remove('show');
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
}

// Loading Overlay
function showLoading(text = 'Cargando datos...') {
    loadingOverlay.querySelector('.loading-text').textContent = text;
    loadingOverlay.classList.add('active');
}

function hideLoading() {
    loadingOverlay.classList.remove('active');
}

// Keyboard Shortcuts
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl + K: Búsqueda rápida
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
        }

        // Ctrl + 1: Vista Tarjetas
        if (e.ctrlKey && e.key === '1') {
            e.preventDefault();
            cambiarVista('cards');
        }

        // Ctrl + 2: Vista Diagrama
        if (e.ctrlKey && e.key === '2') {
            e.preventDefault();
            cambiarVista('diagram');
        }

        // Ctrl + 3: Vista Lista
        if (e.ctrlKey && e.key === '3') {
            e.preventDefault();
            cambiarVista('list');
        }

        // Ctrl + D: Modo Oscuro
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            toggleTheme();
        }

        // Esc: Cerrar Modal
        if (e.key === 'Escape') {
            if (modalOverlay.classList.contains('active')) {
                cerrarModal();
            }
            if (shortcutsModal.classList.contains('active')) {
                toggleShortcutsModal();
            }
        }

        // ?: Mostrar Ayuda
        if (e.key === '?' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
            e.preventDefault();
            toggleShortcutsModal();
        }
    });
}

function toggleShortcutsModal() {
    shortcutsModal.classList.toggle('active');
}

// ===== OBTENER VALOR DE COLUMNA =====
function getColValue(cols, index) {
    if (index < 0 || index >= cols.length) return '';
    return (cols[index] || '').replace(/"/g, '').trim();
}

// ===== PARSEAR LÍNEA CSV =====
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    
    return result;
}

// ===== DETECTAR TIPO =====
function detectarTipo(tiempo, criterio, nombre) {
    const texto = (tiempo + ' ' + criterio + ' ' + nombre).toLowerCase();
    
    if (texto.includes('proceso')) return 'Proceso';
    if (texto.includes('resultado') || texto.includes('eficacia')) return 'Resultado';
    if (texto.includes('impacto')) return 'Impacto';
    
    return 'No especificado';
}

// ===== DETECTAR DEPARTAMENTO =====
function detectarDepartamento(codigo) {
    // Convertir a mayúsculas para comparación
    const codigoUpper = codigo.toUpperCase().trim();

    if (codigoUpper.startsWith('IL')) return 'IL';
    if (codigoUpper.startsWith('AE')) return 'AE';
    if (codigoUpper.startsWith('CEEX')) return 'CEEX';
    if (codigoUpper.startsWith('CCI')) return 'CCI';
    if (codigoUpper.startsWith('ME')) return 'ME';
    if (codigoUpper.startsWith('C.') || codigoUpper.startsWith('C-')) return 'Creamos';

    // Detectar si es código de Creamos por patrón C.X.X
    if (/^C\.\d+/.test(codigoUpper)) return 'Creamos';

    return 'Otros';
}

// ===== ACTUALIZAR ESTADÍSTICAS =====
function actualizarEstadisticas() {
    const programasUnicos = [...new Set(indicadores.map(i => i.programa))];

    document.getElementById('totalCount').textContent = indicadores.length;
    document.getElementById('programasCount').textContent = programasUnicos.length;
}

// ===== RENDERIZAR TODO =====
function renderizarTodo() {
    actualizarEstadisticas();
    renderizarVista();
}

// ===== RENDERIZAR VISTA SEGÚN SELECCIÓN =====
function renderizarVista() {
    switch(vistaActual) {
        case 'diagram':
            renderizarDiagrama();
            break;
        case 'cards':
            renderizarTarjetas();
            break;
        case 'list':
            renderizarLista();
            break;
    }
}

// ===== RENDERIZAR VISTA DIAGRAMA =====
function renderizarDiagrama() {
    const programasLevel = document.getElementById('programasRow');
    const indicadoresLevel = document.getElementById('indicadoresRow');
    const rootNode = document.getElementById('rootNode');

    // Contar todos los indicadores filtrados
    const indsFiltrados = obtenerIndicadoresFiltrados();
    document.getElementById('rootCount').textContent = `${indsFiltrados.length}/${indicadores.length} indicadores`;

    programasLevel.innerHTML = '';
    indicadoresLevel.innerHTML = '';

    // Actualizar clase selected del nodo raíz
    if (programaSeleccionado === 'CREAMOS') {
        rootNode.classList.add('selected');
    } else {
        rootNode.classList.remove('selected');
    }

    // CASO 1: Se seleccionó CREAMOS - mostrar TODOS los indicadores
    if (programaSeleccionado === 'CREAMOS') {
        if (indsFiltrados.length === 0) {
            indicadoresLevel.innerHTML = '<p style="text-align:center;padding:20px;color:var(--text-secondary);">No hay indicadores que coincidan con los filtros seleccionados</p>';
        } else {
            indsFiltrados.forEach(ind => {
                const node = document.createElement('div');
                node.className = `diagram-node indicador-node tipo-${ind.tipo.toLowerCase().replace(' ', '-')}`;
                const nombreCorto = ind.nombre.length > 50 ? ind.nombre.substring(0, 50) + '...' : ind.nombre;
                node.innerHTML = `
                    <div class="node-code">${ind.codigo}</div>
                    <div class="node-label">${nombreCorto}</div>
                    <div class="node-type">${ind.tipo}</div>
                `;
                node.addEventListener('click', (e) => {
                    e.stopPropagation();
                    abrirModal(ind);
                });
                indicadoresLevel.appendChild(node);
            });
        }
        return;
    }

    // CASO 2: Se seleccionó un programa específico - mostrar sus indicadores
    if (programaSeleccionado) {
        const indsProgramaFiltrados = indsFiltrados.filter(i => i.programa === programaSeleccionado);

        if (indsProgramaFiltrados.length === 0) {
            indicadoresLevel.innerHTML = '<p style="text-align:center;padding:20px;color:var(--text-secondary);">No hay indicadores que coincidan con los filtros seleccionados</p>';
        } else {
            indsProgramaFiltrados.forEach(ind => {
                const node = document.createElement('div');
                node.className = `diagram-node indicador-node tipo-${ind.tipo.toLowerCase().replace(' ', '-')}`;
                const nombreCorto = ind.nombre.length > 50 ? ind.nombre.substring(0, 50) + '...' : ind.nombre;
                node.innerHTML = `
                    <div class="node-code">${ind.codigo}</div>
                    <div class="node-label">${nombreCorto}</div>
                    <div class="node-type">${ind.tipo}</div>
                `;
                node.addEventListener('click', (e) => {
                    e.stopPropagation();
                    abrirModal(ind);
                });
                indicadoresLevel.appendChild(node);
            });
        }
        return;
    }

    // CASO 3: Por defecto - mostrar PROGRAMAS
    const programasUnicos = [...new Set(indicadores.map(i => i.programa))].sort();

    if (programasUnicos.length === 0) {
        programasLevel.innerHTML = '<p style="text-align:center;padding:20px;color:var(--text-secondary);">No hay programas disponibles</p>';
        return;
    }

    programasUnicos.forEach(prog => {
        const indsPrograma = indicadores.filter(i => i.programa === prog);
        const indsProgramaFiltrados = indsFiltrados.filter(i => i.programa === prog);
        const icono = prog.includes('I') ? '💫' : prog.includes('P') ? '🎯' : '✅';

        const node = document.createElement('div');
        node.className = 'diagram-node programa-node';
        node.dataset.programa = prog;
        node.innerHTML = `
            <div class="node-icon">${icono}</div>
            <div class="node-label">${prog}</div>
            <div class="node-count">${indsProgramaFiltrados.length}/${indsPrograma.length}</div>
        `;
        node.addEventListener('click', () => seleccionarPrograma(prog));
        programasLevel.appendChild(node);
    });
}

// ===== SELECCIONAR PROGRAMA EN DIAGRAMA =====
function seleccionarPrograma(programa) {
    programaSeleccionado = programa;
    renderizarDiagrama();
}

// ===== RENDERIZAR VISTA TARJETAS =====
function renderizarTarjetas() {
    const container = document.getElementById('cardsGrid');
    const indsFiltrados = obtenerIndicadoresFiltrados();

    // Actualizar contador
    const countElement = document.getElementById('cardsCount');
    if (countElement) {
        countElement.textContent = `${indsFiltrados.length} indicadores`;
    }

    container.innerHTML = '';

    if (indsFiltrados.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:40px;color:var(--text-secondary);">No hay indicadores que coincidan con los filtros</p>';
        return;
    }

    // Renderizar cada indicador individual
    indsFiltrados.forEach(ind => {
        const icono = ind.programa.includes('I') ? '💫' : ind.programa.includes('P') ? '🎯' : '✅';
        const tipoClass = ind.tipo.toLowerCase().replace(' ', '-');

        // Crear tarjeta de indicador
        const indicadorCard = document.createElement('div');
        indicadorCard.className = 'program-card';
        indicadorCard.innerHTML = `
            <div class="program-icon">${icono}</div>
            <div class="program-name">${ind.codigo}</div>
            <div class="program-department">${ind.nombre}</div>
            <div class="program-count">Programa: ${ind.programa}</div>
            <div class="program-types">
                <span class="type-badge ${tipoClass}">${ind.tipo}</span>
            </div>
        `;

        indicadorCard.addEventListener('click', () => {
            abrirModal(ind);
        });

        container.appendChild(indicadorCard);
    });
}

// ===== RENDERIZAR VISTA LISTA =====
function renderizarLista() {
    const container = document.getElementById('listAccordion');
    container.innerHTML = '';

    if (indicadores.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:40px;color:var(--text-secondary);">No hay indicadores cargados</p>';
        return;
    }

    // Obtener todos los programas únicos
    const programasUnicos = [...new Set(indicadores.map(i => i.programa))].sort();

    // Crear un accordion por cada programa
    programasUnicos.forEach(prog => {
        const progsInds = indicadores.filter(i => i.programa === prog);
        const icono = prog.includes('I') ? '💫' : prog.includes('P') ? '🎯' : '✅';

        const programaDiv = crearPrograma(`${icono} ${prog}`, progsInds);
        container.appendChild(programaDiv);
    });

    aplicarFiltros();
}

// ===== CREAR PROGRAMA =====
function crearPrograma(nombre, indicadores) {
    const programa = document.createElement('div');
    programa.className = 'programa';
    
    const header = document.createElement('button');
    header.className = 'programa-header';
    header.innerHTML = `
        <span class="programa-icon">→</span>
        <span class="programa-name">${nombre}</span>
        <span class="programa-count">${indicadores.length}</span>
    `;
    
    const items = document.createElement('div');
    items.className = 'programa-items';
    items.innerHTML = renderItems(indicadores);
    
    header.addEventListener('click', () => {
        programa.classList.toggle('open');
    });
    
    programa.appendChild(header);
    programa.appendChild(items);
    
    return programa;
}

// ===== RENDERIZAR ITEMS =====
function renderItems(items) {
    return items.map(ind => `
        <div class="indicador-item" data-codigo="${ind.codigo}">
            <div class="indicador-codigo">${ind.codigo}</div>
            <div class="indicador-nombre">${ind.nombre}</div>
            <div class="indicador-tipo">${ind.tipo}</div>
        </div>
    `).join('');
}

// ===== OBTENER INDICADORES FILTRADOS =====
function obtenerIndicadoresFiltrados() {
    const texto = searchInput.value.toLowerCase();
    const filtrosTipo = document.querySelectorAll('.filter-tipo:checked');
    const tiposFiltrados = Array.from(filtrosTipo).map(f => f.value);

    return indicadores.filter(ind => {
        const coincideTexto =
            ind.codigo.toLowerCase().includes(texto) ||
            ind.nombre.toLowerCase().includes(texto) ||
            ind.criterio.toLowerCase().includes(texto);

        const coincideTipo = tiposFiltrados.includes(ind.tipo);

        return coincideTexto && coincideTipo;
    });
}

// ===== APLICAR FILTROS =====
function aplicarFiltros() {
    if (vistaActual !== 'list') return;

    const indsFiltrados = obtenerIndicadoresFiltrados();
    const codigosFiltrados = indsFiltrados.map(i => i.codigo);

    document.querySelectorAll('.indicador-item').forEach(item => {
        const codigo = item.dataset.codigo;
        item.style.display = codigosFiltrados.includes(codigo) ? 'block' : 'none';
    });

    setupIndicadorClicks();
}

// ===== SETUP CLICKS EN INDICADORES =====
function setupIndicadorClicks() {
    document.querySelectorAll('.indicador-item').forEach(item => {
        item.onclick = function() {
            const codigo = this.dataset.codigo;
            const ind = indicadores.find(i => i.codigo === codigo);
            if (ind) abrirModal(ind);
        };
    });
}

// ===== ABRIR MODAL =====
function abrirModal(ind) {
    // Guardar indicador actual para exportación
    window.indicadorActual = ind;

    // Tab Información
    document.getElementById('modalTitle').textContent = ind.nombre;
    document.getElementById('modalCode').textContent = ind.codigo;
    document.getElementById('modalType').textContent = ind.tipo;
    document.getElementById('modalDeptTag').textContent = ind.depto;
    document.getElementById('modalCodigo').textContent = ind.codigo;
    document.getElementById('modalCriterio').textContent = ind.criterio || 'No especificado';
    document.getElementById('modalDesc').textContent = ind.desc || 'Sin descripción disponible';
    document.getElementById('modalTipo').textContent = ind.tipo;
    document.getElementById('modalDepto').textContent = ind.depto;
    document.getElementById('modalPrograma').textContent = ind.programa;
    document.getElementById('modalNivel').textContent = ind.nivel || 'No especificado';

    // Tab Medición
    document.getElementById('modalPeriodicidad').textContent = ind.tiempo || 'No especificado';

    // Resetear a la primera tab
    document.querySelectorAll('.modal-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.modal-tab-content').forEach(content => content.classList.remove('active'));
    document.querySelector('.modal-tab[data-tab="info"]').classList.add('active');
    document.getElementById('tabInfo').classList.add('active');

    modalOverlay.classList.add('active');
}

// ===== CERRAR MODAL =====
function cerrarModal() {
    modalOverlay.classList.remove('active');
}

// ===== CAMBIAR TAB MODAL =====
function cambiarTabModal(tabName) {
    document.querySelectorAll('.modal-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.modal-tab-content').forEach(content => {
        content.classList.remove('active');
    });

    document.querySelector(`.modal-tab[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`).classList.add('active');
}

// ===== EXPORTAR A PDF =====
function exportarPDF() {
    const ind = window.indicadorActual;
    if (!ind) return;

    // Crear contenido HTML para imprimir
    const contenido = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Indicador ${ind.codigo}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
                h1 { color: #2C5AA0; border-bottom: 3px solid #FF6B35; padding-bottom: 10px; }
                .header { background: #F8F9FA; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
                .tag { display: inline-block; padding: 5px 15px; border-radius: 20px; margin-right: 10px; font-weight: bold; font-size: 12px; }
                .tag-code { background: #FF6B35; color: white; }
                .tag-type { background: #27AE60; color: white; }
                .tag-dept { background: #2C5AA0; color: white; }
                .section { margin-bottom: 30px; }
                .section-title { color: #2C5AA0; font-size: 18px; font-weight: bold; margin-bottom: 10px; border-left: 4px solid #FF6B35; padding-left: 10px; }
                .field { margin-bottom: 15px; }
                .field-label { font-weight: bold; color: #5A6C7D; font-size: 13px; text-transform: uppercase; }
                .field-value { margin-top: 5px; color: #2C3E50; }
                .formula { background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%); color: white; padding: 15px; border-radius: 8px; text-align: center; font-weight: bold; }
                .guidance ol { padding-left: 20px; }
                .guidance li { margin-bottom: 8px; }
            </style>
        </head>
        <body>
            <h1>${ind.nombre}</h1>
            <div class="header">
                <span class="tag tag-code">${ind.codigo}</span>
                <span class="tag tag-type">${ind.tipo}</span>
                <span class="tag tag-dept">${ind.depto}</span>
            </div>

            <div class="section">
                <div class="section-title">📋 Información General</div>
                <div class="field">
                    <div class="field-label">Código</div>
                    <div class="field-value">${ind.codigo}</div>
                </div>
                <div class="field">
                    <div class="field-label">Criterio</div>
                    <div class="field-value">${ind.criterio || 'No especificado'}</div>
                </div>
                <div class="field">
                    <div class="field-label">Descripción</div>
                    <div class="field-value">${ind.desc || 'Sin descripción disponible'}</div>
                </div>
                <div class="field">
                    <div class="field-label">Programa</div>
                    <div class="field-value">${ind.programa}</div>
                </div>
                <div class="field">
                    <div class="field-label">Nivel de Medición</div>
                    <div class="field-value">${ind.nivel || 'No especificado'}</div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">📏 Medición</div>
                <div class="field">
                    <div class="field-label">Fórmula de Cálculo</div>
                    <div class="formula">% = (Numerador / Denominador) × 100</div>
                </div>
                <div class="field">
                    <div class="field-label">Periodicidad</div>
                    <div class="field-value">${ind.tiempo || 'No especificado'}</div>
                </div>
                <div class="field">
                    <div class="field-label">Desagregación Recomendada</div>
                    <div class="field-value">Por sexo, edad, ubicación geográfica</div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">📖 Guía de Recolección</div>
                <div class="guidance">
                    <ol>
                        <li>Identificar la fuente de datos apropiada</li>
                        <li>Definir el método de recolección</li>
                        <li>Establecer el tamaño de muestra necesario</li>
                        <li>Recolectar datos de manera sistemática</li>
                        <li>Verificar la calidad de los datos</li>
                    </ol>
                </div>
                <div class="field">
                    <div class="field-label">Fuentes de Verificación</div>
                    <div class="field-value">Registros administrativos, encuestas, entrevistas, observación directa</div>
                </div>
            </div>

            <div style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #E1E8ED; text-align: center; color: #95A5A6; font-size: 12px;">
                Documento generado por Sistema de Indicadores - Creamos
            </div>
        </body>
        </html>
    `;

    // Abrir ventana de impresión
    const ventana = window.open('', '', 'width=800,height=600');
    ventana.document.write(contenido);
    ventana.document.close();
    ventana.print();
}

// ===== EXPORTAR A EXCEL =====
function exportarExcel() {
    const ind = window.indicadorActual;
    if (!ind) return;

    // Crear contenido CSV
    const csv = [
        ['Campo', 'Valor'],
        ['Código', ind.codigo],
        ['Nombre', ind.nombre],
        ['Criterio', ind.criterio || ''],
        ['Descripción', ind.desc || ''],
        ['Tipo', ind.tipo],
        ['Departamento', ind.depto],
        ['Programa', ind.programa],
        ['Nivel', ind.nivel || ''],
        ['Periodicidad', ind.tiempo || ''],
        [''],
        ['Fórmula', '% = (Numerador / Denominador) × 100'],
        ['Desagregación', 'Por sexo, edad, ubicación geográfica'],
        ['Fuentes de Verificación', 'Registros administrativos, encuestas, entrevistas, observación directa']
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    // Crear y descargar archivo
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Indicador_${ind.codigo}.csv`;
    link.click();
}

// ===== IMPRIMIR INDICADOR =====
function imprimirIndicador() {
    exportarPDF();
}

// ===== ACTUALIZAR BREADCRUMBS =====
function actualizarBreadcrumbs() {
    const viewNames = {
        'cards': '📇 Tarjetas',
        'diagram': '🔷 Diagrama',
        'list': '📋 Lista'
    };

    const breadcrumbView = document.getElementById('breadcrumbView');
    if (breadcrumbView) {
        breadcrumbView.textContent = viewNames[vistaActual] || 'Vista';
    }
}

// ===== CAMBIAR VISTA =====
function cambiarVista(vista) {
    vistaActual = vista;
    programaSeleccionado = null;

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === vista) {
            btn.classList.add('active');
        }
    });

    document.querySelectorAll('.view-content').forEach(container => {
        container.classList.remove('active');
    });

    const viewMap = {
        'diagram': 'viewDiagram',
        'cards': 'viewCards',
        'list': 'viewList'
    };

    document.getElementById(viewMap[vista]).classList.add('active');

    // Actualizar breadcrumbs
    actualizarBreadcrumbs();

    if (indicadores.length > 0) {
        renderizarVista();
    }
}

// ===== EVENT LISTENERS =====
btnCargar.addEventListener('click', cargarDatos);

searchInput.addEventListener('input', () => {
    if (vistaActual === 'list') {
        aplicarFiltros();
    } else {
        renderizarVista();
    }
});

modalClose.addEventListener('click', cerrarModal);
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) cerrarModal();
});

document.querySelectorAll('.filter-tipo').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        if (vistaActual === 'list') {
            aplicarFiltros();
        } else {
            renderizarVista();
        }
    });
});

// Event listener para el nodo raíz (CREAMOS)
const rootNode = document.getElementById('rootNode');
if (rootNode) {
    rootNode.addEventListener('click', () => {
        if (programaSeleccionado === 'CREAMOS') {
            // Si ya está seleccionado, deseleccionar
            programaSeleccionado = null;
            rootNode.classList.remove('selected');
        } else {
            // Seleccionar CREAMOS
            programaSeleccionado = 'CREAMOS';
            rootNode.classList.add('selected');
        }
        renderizarDiagrama();
    });
}

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        cambiarVista(btn.dataset.view);
    });
});

// Event listeners para tabs del modal
document.querySelectorAll('.modal-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        cambiarTabModal(tab.dataset.tab);
    });
});

// Event listeners para botones de exportación
document.getElementById('btnExportPDF').addEventListener('click', exportarPDF);
document.getElementById('btnExportExcel').addEventListener('click', exportarExcel);
document.getElementById('btnPrint').addEventListener('click', imprimirIndicador);

// Event listeners para nuevas funcionalidades UI
themeToggle.addEventListener('click', toggleTheme);

shortcutsClose.addEventListener('click', toggleShortcutsModal);
shortcutsModal.addEventListener('click', (e) => {
    if (e.target === shortcutsModal) toggleShortcutsModal();
});

// ===== INICIALIZACIÓN =====
window.addEventListener('load', () => {
    // Cargar URL guardada
    const url = localStorage.getItem('urlSheet');
    if (url) {
        urlSheet.value = url;
    }

    // Inicializar tema desde localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        const icon = themeToggle.querySelector('.theme-icon');
        if (icon) icon.textContent = '☀️';
    }

    // Inicializar atajos de teclado
    initKeyboardShortcuts();

    // Mostrar mensaje de bienvenida
    setTimeout(() => {
        showToast('Bienvenido', 'Presiona ? para ver los atajos de teclado', 'info');
    }, 1000);
});