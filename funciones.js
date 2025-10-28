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

        const idxOrden = getColIndex('orden');
        const idxCodigo = getColIndex('código');
        const idxCriterio = getColIndex('criterio');
        const idxIndicador = getColIndex('indicador');
        const idxDescripcion = getColIndex('descripción');
        const idxNivel = getColIndex('nivel');
        const idxTiempo = getColIndex('tiempo');
        const idxHerramienta = getColIndex('herramienta');
        const idxFuenteVerificacion = getColIndex('fuente de verificación');
        const idxResponsable = getColIndex('responsable');
        const idxFrecuencia = getColIndex('frecuencia');
        const idxDesagregacion = getColIndex('desagregación');
        const idxRecogiendoDatos = getColIndex('ya recogiendo datos');
        const idxEstadoFuente = getColIndex('estado de fuente');
        const idxNecesitaCampoSF = getColIndex('se necesita campo en sf');
        const idxEstadoSF = getColIndex('estado en sf');
        const idxHistorico2024 = getColIndex('histórico 2024');
        const idxTarget2025 = getColIndex('target 2025');
        const idxProyecciones2026 = getColIndex('proyecciones 2026');
        const idxM1 = getColIndex('m1');
        const idxM2 = getColIndex('m2');
        const idxM3 = getColIndex('m3');
        const idxQ1 = getColIndex('q1');
        const idxM4 = getColIndex('m4');
        const idxM5 = getColIndex('m5');
        const idxM6 = getColIndex('m6');
        const idxQ2 = getColIndex('q2');
        const idxM7 = getColIndex('m7');
        const idxM8 = getColIndex('m8');
        const idxM9 = getColIndex('m9');
        const idxQ3 = getColIndex('q3');
        const idxM10 = getColIndex('m10');
        const idxM11 = getColIndex('m11');
        const idxM12 = getColIndex('m12');
        const idxQ4 = getColIndex('q4');

        for (let i = 1; i < lineas.length; i++) {
            const linea = lineas[i].trim();
            if (!linea) continue;

            const cols = parseCSVLine(linea);

            const codigo = getColValue(cols, idxCodigo);
            const criterio = getColValue(cols, idxCriterio);
            const nombre = getColValue(cols, idxIndicador);

            // Validar que tenemos datos mínimos
            if (!codigo || !nombre || codigo.includes('#') || codigo === 'Código') continue;

            // Detectar tipo
            let tipo = detectarTipo(getColValue(cols, idxTiempo), criterio, nombre);

            // Detectar departamento
            let depto = detectarDepartamento(codigo);

            // Extraer programa del código (CEEX, IL, ME, AE, CCi)
            let programa = 'Otros';
            if (codigo.includes('.')) {
                const partes = codigo.split('.');
                programa = partes[0]; // CEEX, IL, ME, AE, CCi
            }

            // Extraer nombre del programa desde el código
            const nombrePrograma = extraerNombrePrograma(programa);

            indicadores.push({
                orden: getColValue(cols, idxOrden),
                codigo,
                criterio,
                nombre,
                desc: getColValue(cols, idxDescripcion),
                nivel: getColValue(cols, idxNivel),
                tiempo: getColValue(cols, idxTiempo),
                herramienta: getColValue(cols, idxHerramienta),
                fuenteVerificacion: getColValue(cols, idxFuenteVerificacion),
                responsable: getColValue(cols, idxResponsable),
                frecuencia: getColValue(cols, idxFrecuencia),
                desagregacion: getColValue(cols, idxDesagregacion),
                recogiendoDatos: getColValue(cols, idxRecogiendoDatos),
                estadoFuente: getColValue(cols, idxEstadoFuente),
                necesitaCampoSF: getColValue(cols, idxNecesitaCampoSF),
                estadoSF: getColValue(cols, idxEstadoSF),
                historico2024: getColValue(cols, idxHistorico2024),
                target2025: getColValue(cols, idxTarget2025),
                proyecciones2026: getColValue(cols, idxProyecciones2026),
                m1: getColValue(cols, idxM1),
                m2: getColValue(cols, idxM2),
                m3: getColValue(cols, idxM3),
                q1: getColValue(cols, idxQ1),
                m4: getColValue(cols, idxM4),
                m5: getColValue(cols, idxM5),
                m6: getColValue(cols, idxM6),
                q2: getColValue(cols, idxQ2),
                m7: getColValue(cols, idxM7),
                m8: getColValue(cols, idxM8),
                m9: getColValue(cols, idxM9),
                q3: getColValue(cols, idxQ3),
                m10: getColValue(cols, idxM10),
                m11: getColValue(cols, idxM11),
                m12: getColValue(cols, idxM12),
                q4: getColValue(cols, idxQ4),
                tipo,
                depto,
                programa,
                nombrePrograma
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

// ===== EXTRAER NOMBRE DEL PROGRAMA =====
function extraerNombrePrograma(codigoPrograma) {
    if (!codigoPrograma) return 'Sin programa';

    // Mapeo de códigos a nombres de programas (ESTRUCTURA CREAMOS)
    const programasMap = {
        'CEEX': 'Educación (CEEX)',
        'IL': 'Inclusión Laboral (IL)',
        'ME': 'Mi-Eelo (ME)',
        'AE': 'Apoyo Emocional (AE)',
        'CCI': 'Centro de Cuidado Infantil (CCI)',
        'CCi': 'Centro de Cuidado Infantil (CCI)',
        'CCİ': 'Centro de Cuidado Infantil (CCI)'
    };

    // Buscar el código exacto
    const codigo = codigoPrograma.toUpperCase().trim();
    if (programasMap[codigo]) {
        return programasMap[codigo];
    }

    // Si no coincide, devolver el código tal cual
    return codigoPrograma;
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

    programasLevel.innerHTML = '';
    indicadoresLevel.innerHTML = '';

    // CASO 1: Se seleccionó CREAMOS - mostrar todos los programas
    if (!programaSeleccionado || programaSeleccionado === 'CREAMOS') {
        // Mostrar CREAMOS como raíz
        rootNode.innerHTML = `
            <div class="node-icon">🌟</div>
            <div class="node-title">CREAMOS</div>
            <div class="node-count">${indsFiltrados.length}/${indicadores.length} indicadores</div>
        `;
        rootNode.classList.add('selected');

        // Mostrar todos los programas
        const programasCREAMOS = [
            { codigo: 'CEEX', nombre: 'Educación (CEEX)', icono: '📚' },
            { codigo: 'IL', nombre: 'Inclusión Laboral (IL)', icono: '💼' },
            { codigo: 'ME', nombre: 'Mi-Eelo (ME)', icono: '🌟' },
            { codigo: 'AE', nombre: 'Apoyo Emocional (AE)', icono: '💙' },
            { codigo: 'CCI', nombre: 'Centro de Cuidado Infantil (CCI)', icono: '👶' }
        ];

        programasCREAMOS.forEach(programa => {
            const codigoProg = programa.codigo;
            const nombreProg = programa.nombre;
            const icono = programa.icono;

            // Contar indicadores que pertenecen a este programa
            const indsPrograma = indicadores.filter(i => i.programa === codigoProg);
            const indsProgramaFiltrados = indsFiltrados.filter(i => i.programa === codigoProg);

            const node = document.createElement('div');
            node.className = 'diagram-node programa-node';
            node.dataset.programa = nombreProg;
            node.innerHTML = `
                <div class="node-icon">${icono}</div>
                <div class="node-label">${nombreProg}</div>
                <div class="node-count">${indsProgramaFiltrados.length}/${indsPrograma.length} indicadores</div>
            `;
            node.addEventListener('click', () => seleccionarPrograma(nombreProg));
            programasLevel.appendChild(node);
        });

        indicadoresLevel.innerHTML = '';
        return;
    }

    // CASO 2: Se seleccionó un programa específico - mostrar ese programa arriba y sus indicadores abajo
    if (programaSeleccionado) {
        rootNode.classList.remove('selected');

        // Encontrar el programa seleccionado
        const programasCREAMOS = [
            { codigo: 'CEEX', nombre: 'Educación (CEEX)', icono: '📚' },
            { codigo: 'IL', nombre: 'Inclusión Laboral (IL)', icono: '💼' },
            { codigo: 'ME', nombre: 'Mi-Eelo (ME)', icono: '🌟' },
            { codigo: 'AE', nombre: 'Apoyo Emocional (AE)', icono: '💙' },
            { codigo: 'CCI', nombre: 'Centro de Cuidado Infantil (CCI)', icono: '👶' }
        ];

        const programaEncontrado = programasCREAMOS.find(p => p.nombre === programaSeleccionado);

        if (programaEncontrado) {
            // Cambiar el nodo raíz para mostrar el programa seleccionado
            rootNode.innerHTML = `
                <div class="node-icon">${programaEncontrado.icono}</div>
                <div class="node-title">${programaEncontrado.nombre}</div>
                <div class="node-count" id="rootCount">Programa seleccionado</div>
            `;
            rootNode.classList.add('selected', 'programa-selected');
        }

        // Filtrar indicadores del programa seleccionado
        const indsProgramaFiltrados = indsFiltrados.filter(i =>
            i.nombrePrograma === programaSeleccionado ||
            i.criterio.toLowerCase().includes(programaSeleccionado.toLowerCase())
        );

        // Ocultar la fila de programas
        programasLevel.style.display = 'none';

        // Mostrar indicadores agrupados por tipo
        if (indsProgramaFiltrados.length === 0) {
            indicadoresLevel.innerHTML = '<p style="text-align:center;padding:20px;color:var(--text-secondary);">No hay indicadores que coincidan con los filtros seleccionados</p>';
        } else {
            // Agrupar por tipo
            const porTipo = {
                'Impacto': [],
                'Resultado': [],
                'Proceso': [],
                'No especificado': []
            };

            indsProgramaFiltrados.forEach(ind => {
                const tipo = ind.tipo || 'No especificado';
                if (!porTipo[tipo]) porTipo[tipo] = [];
                porTipo[tipo].push(ind);
            });

            // Renderizar por tipo
            Object.keys(porTipo).forEach(tipo => {
                if (porTipo[tipo].length > 0) {
                    porTipo[tipo].forEach(ind => {
                        const node = document.createElement('div');
                        node.className = `diagram-node indicador-node tipo-${ind.tipo.toLowerCase().replace(' ', '-')}`;

                        // Icono según tipo
                        let tipoIcono = '📊';
                        if (ind.tipo === 'Impacto') tipoIcono = '💫';
                        else if (ind.tipo === 'Resultado') tipoIcono = '✅';
                        else if (ind.tipo === 'Proceso') tipoIcono = '📊';

                        const nombreCorto = ind.nombre.length > 60 ? ind.nombre.substring(0, 60) + '...' : ind.nombre;

                        node.innerHTML = `
                            <div class="indicator-card">
                                <div class="indicator-header">
                                    <span class="indicator-type-badge ${ind.tipo.toLowerCase()}">${tipoIcono} ${ind.tipo}</span>
                                    <span class="indicator-code">${ind.codigo}</span>
                                </div>
                                <div class="indicator-title">${nombreCorto}</div>
                                <div class="indicator-footer">
                                    <span class="indicator-meta">${ind.nivel || 'N/A'}</span>
                                    <span class="indicator-frequency">${ind.tiempo || 'N/A'}</span>
                                </div>
                            </div>
                        `;
                        node.addEventListener('click', (e) => {
                            e.stopPropagation();
                            abrirModal(ind);
                        });
                        indicadoresLevel.appendChild(node);
                    });
                }
            });
        }

        // Mostrar la fila de indicadores
        indicadoresLevel.style.display = 'flex';
        return;
    }
}

// ===== SELECCIONAR PROGRAMA EN DIAGRAMA =====
function seleccionarPrograma(programa) {
    programaSeleccionado = programa;
    renderizarDiagrama();
    actualizarBreadcrumb();
}

// ===== ACTUALIZAR BREADCRUMB =====
function actualizarBreadcrumb() {
    const breadcrumbs = document.getElementById('breadcrumbs');

    if (programaSeleccionado && programaSeleccionado !== 'CREAMOS') {
        breadcrumbs.innerHTML = `
            <span class="breadcrumb-item breadcrumb-link" onclick="volverACREAMOS()">🏠 CREAMOS</span>
            <span class="breadcrumb-separator">›</span>
            <span class="breadcrumb-item active">${programaSeleccionado}</span>
        `;
    } else {
        breadcrumbs.innerHTML = `
            <span class="breadcrumb-item active">🏠 Inicio</span>
            <span class="breadcrumb-separator">›</span>
            <span class="breadcrumb-item" id="breadcrumbView">Diagrama</span>
        `;
    }
}

// ===== VOLVER A CREAMOS =====
function volverACREAMOS() {
    programaSeleccionado = 'CREAMOS';
    renderizarDiagrama();
    actualizarBreadcrumb();
    showToast('Navegación', 'Volviste a la vista principal de CREAMOS', 'info');
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

    // Helper function para mostrar valor o 'No especificado'
    const mostrarValor = (valor) => valor || 'No especificado';

    // Tab Información
    document.getElementById('modalTitle').textContent = ind.nombre;
    document.getElementById('modalCode').textContent = ind.codigo;
    document.getElementById('modalType').textContent = ind.tipo;
    document.getElementById('modalDeptTag').textContent = ind.nombrePrograma || ind.programa;
    document.getElementById('modalCodigo').textContent = ind.codigo;
    document.getElementById('modalCriterio').textContent = mostrarValor(ind.criterio);
    document.getElementById('modalDesc').textContent = ind.desc || 'Sin descripción disponible';
    document.getElementById('modalTipo').textContent = ind.tipo;
    document.getElementById('modalPrograma').textContent = ind.nombrePrograma || ind.programa;
    document.getElementById('modalNivel').textContent = mostrarValor(ind.nivel);
    document.getElementById('modalHerramienta').textContent = mostrarValor(ind.herramienta);
    document.getElementById('modalResponsable').textContent = mostrarValor(ind.responsable);

    // Tab Medición
    document.getElementById('modalPeriodicidad').textContent = mostrarValor(ind.tiempo);
    document.getElementById('modalFrecuencia').textContent = mostrarValor(ind.frecuencia);
    document.getElementById('modalDesagregacion').textContent = mostrarValor(ind.desagregacion);
    document.getElementById('modalRecogiendoDatos').textContent = mostrarValor(ind.recogiendoDatos);
    document.getElementById('modalEstadoFuente').textContent = mostrarValor(ind.estadoFuente);
    document.getElementById('modalNecesitaCampoSF').textContent = mostrarValor(ind.necesitaCampoSF);
    document.getElementById('modalEstadoSF').textContent = mostrarValor(ind.estadoSF);

    // Tab Datos M&E
    document.getElementById('modalHistorico2024').textContent = mostrarValor(ind.historico2024);
    document.getElementById('modalTarget2025').textContent = mostrarValor(ind.target2025);
    document.getElementById('modalProyecciones2026').textContent = mostrarValor(ind.proyecciones2026);
    document.getElementById('modalM1').textContent = mostrarValor(ind.m1);
    document.getElementById('modalM2').textContent = mostrarValor(ind.m2);
    document.getElementById('modalM3').textContent = mostrarValor(ind.m3);
    document.getElementById('modalQ1').textContent = mostrarValor(ind.q1);
    document.getElementById('modalM4').textContent = mostrarValor(ind.m4);
    document.getElementById('modalM5').textContent = mostrarValor(ind.m5);
    document.getElementById('modalM6').textContent = mostrarValor(ind.m6);
    document.getElementById('modalQ2').textContent = mostrarValor(ind.q2);
    document.getElementById('modalM7').textContent = mostrarValor(ind.m7);
    document.getElementById('modalM8').textContent = mostrarValor(ind.m8);
    document.getElementById('modalM9').textContent = mostrarValor(ind.m9);
    document.getElementById('modalQ3').textContent = mostrarValor(ind.q3);
    document.getElementById('modalM10').textContent = mostrarValor(ind.m10);
    document.getElementById('modalM11').textContent = mostrarValor(ind.m11);
    document.getElementById('modalM12').textContent = mostrarValor(ind.m12);
    document.getElementById('modalQ4').textContent = mostrarValor(ind.q4);

    // Tab Guía
    document.getElementById('modalFuenteVerificacion').textContent = mostrarValor(ind.fuenteVerificacion);

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

// ===== PANEL DE ADMINISTRACIÓN =====

// Variables de estado
let programasLocal = [];
let indicadoresLocal = [];
let editandoPrograma = null;
let editandoIndicador = null;

// Referencias DOM
const adminModal = document.getElementById('adminModal');
const btnAdmin = document.getElementById('btnAdmin');
const adminModalClose = document.getElementById('adminModalClose');
const adminTabs = document.querySelectorAll('.admin-tab');
const adminTabContents = document.querySelectorAll('.admin-tab-content');

// Botones de formulario - Programas
const btnSaveProgram = document.getElementById('btnSaveProgram');
const btnCancelProgram = document.getElementById('btnCancelProgram');
const programCodigo = document.getElementById('programCodigo');
const programNombre = document.getElementById('programNombre');
const programDescripcion = document.getElementById('programDescripcion');
const programIcon = document.getElementById('programIcon');
const programsList = document.getElementById('programsList');

// Botones de formulario - Indicadores
const btnSaveIndicator = document.getElementById('btnSaveIndicator');
const btnCancelIndicator = document.getElementById('btnCancelIndicator');
const indicatorCodigo = document.getElementById('indicatorCodigo');
const indicatorPrograma = document.getElementById('indicatorPrograma');
const indicatorCriterio = document.getElementById('indicatorCriterio');
const indicatorNombre = document.getElementById('indicatorNombre');
const indicatorDesc = document.getElementById('indicatorDesc');
const indicatorTipo = document.getElementById('indicatorTipo');
const indicatorDepto = document.getElementById('indicatorDepto');
const indicatorNivel = document.getElementById('indicatorNivel');
const indicatorTiempo = document.getElementById('indicatorTiempo');
const indicatorsList = document.getElementById('indicatorsList');
const adminSearchIndicators = document.getElementById('adminSearchIndicators');
const adminFilterProgram = document.getElementById('adminFilterProgram');

// ===== FUNCIONES DE LOCALSTORAGE =====

function cargarDatosLocales() {
    const programasGuardados = localStorage.getItem('programasLocal');
    const indicadoresGuardados = localStorage.getItem('indicadoresLocal');

    if (programasGuardados) {
        try {
            programasLocal = JSON.parse(programasGuardados);
        } catch (e) {
            console.error('Error al cargar programas:', e);
            programasLocal = [];
        }
    }

    if (indicadoresGuardados) {
        try {
            indicadoresLocal = JSON.parse(indicadoresGuardados);
        } catch (e) {
            console.error('Error al cargar indicadores:', e);
            indicadoresLocal = [];
        }
    }
}

function guardarProgramas() {
    localStorage.setItem('programasLocal', JSON.stringify(programasLocal));
}

function guardarIndicadores() {
    localStorage.setItem('indicadoresLocal', JSON.stringify(indicadoresLocal));
}

// ===== CONTROL DEL MODAL =====

function abrirAdminModal() {
    cargarDatosLocales();
    renderizarListaProgramas();
    renderizarListaIndicadores();
    actualizarSelectProgramas();
    adminModal.classList.add('active');
}

function cerrarAdminModal() {
    adminModal.classList.remove('active');
    limpiarFormularioPrograma();
    limpiarFormularioIndicador();
}

// ===== CONTROL DE TABS =====

function cambiarTabAdmin(tabName) {
    // Desactivar todas las tabs
    adminTabs.forEach(tab => tab.classList.remove('active'));
    adminTabContents.forEach(content => content.classList.remove('active'));

    // Activar tab seleccionada
    const tabBtn = document.querySelector(`[data-admin-tab="${tabName}"]`);
    const tabContent = document.getElementById(`adminTab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);

    if (tabBtn) tabBtn.classList.add('active');
    if (tabContent) tabContent.classList.add('active');
}

// ===== GESTIÓN DE PROGRAMAS =====

function limpiarFormularioPrograma() {
    programCodigo.value = '';
    programNombre.value = '';
    programDescripcion.value = '';
    programIcon.value = '';
    editandoPrograma = null;
    btnSaveProgram.innerHTML = '💾 Guardar Programa';
}

function validarFormularioPrograma() {
    if (!programCodigo.value.trim()) {
        showToast('Error', 'El código del programa es requerido', 'error');
        return false;
    }
    if (!programNombre.value.trim()) {
        showToast('Error', 'El nombre del programa es requerido', 'error');
        return false;
    }
    return true;
}

function guardarPrograma() {
    if (!validarFormularioPrograma()) return;

    const programa = {
        codigo: programCodigo.value.trim(),
        nombre: programNombre.value.trim(),
        descripcion: programDescripcion.value.trim(),
        icono: programIcon.value.trim() || '📚'
    };

    if (editandoPrograma !== null) {
        // Editar programa existente
        programasLocal[editandoPrograma] = programa;
        showToast('Éxito', 'Programa actualizado correctamente', 'success');
    } else {
        // Agregar nuevo programa
        // Verificar que no exista el código
        if (programasLocal.some(p => p.codigo === programa.codigo)) {
            showToast('Error', 'Ya existe un programa con ese código', 'error');
            return;
        }
        programasLocal.push(programa);
        showToast('Éxito', 'Programa agregado correctamente', 'success');
    }

    guardarProgramas();
    renderizarListaProgramas();
    actualizarSelectProgramas();
    limpiarFormularioPrograma();
}

function editarPrograma(index) {
    const programa = programasLocal[index];
    programCodigo.value = programa.codigo;
    programNombre.value = programa.nombre;
    programDescripcion.value = programa.descripcion || '';
    programIcon.value = programa.icono || '';
    editandoPrograma = index;
    btnSaveProgram.innerHTML = '✏️ Actualizar Programa';

    // Scroll al formulario
    document.querySelector('.admin-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function eliminarPrograma(index) {
    const programa = programasLocal[index];

    // Verificar si hay indicadores asociados
    const indicadoresAsociados = indicadoresLocal.filter(i => i.programa === programa.codigo);

    if (indicadoresAsociados.length > 0) {
        if (!confirm(`Este programa tiene ${indicadoresAsociados.length} indicadores asociados. ¿Desea eliminarlo de todos modos? Los indicadores quedarán sin programa asignado.`)) {
            return;
        }
        // Actualizar indicadores para quitar referencia al programa
        indicadoresLocal = indicadoresLocal.map(ind => {
            if (ind.programa === programa.codigo) {
                return { ...ind, programa: '' };
            }
            return ind;
        });
        guardarIndicadores();
    }

    programasLocal.splice(index, 1);
    guardarProgramas();
    renderizarListaProgramas();
    actualizarSelectProgramas();
    renderizarListaIndicadores();
    showToast('Éxito', 'Programa eliminado correctamente', 'success');
}

function renderizarListaProgramas() {
    if (programasLocal.length === 0) {
        programsList.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:2rem;">No hay programas registrados</p>';
        return;
    }

    programsList.innerHTML = programasLocal.map((programa, index) => `
        <div class="admin-item">
            <div class="admin-item-header">
                <h4 class="admin-item-title">${programa.icono} ${programa.nombre}</h4>
                <span class="admin-item-code">${programa.codigo}</span>
            </div>
            ${programa.descripcion ? `<div class="admin-item-body">${programa.descripcion}</div>` : ''}
            <div class="admin-item-actions">
                <button class="btn-admin-edit" onclick="editarPrograma(${index})">✏️ Editar</button>
                <button class="btn-admin-delete" onclick="eliminarPrograma(${index})">🗑️ Eliminar</button>
            </div>
        </div>
    `).join('');
}

function actualizarSelectProgramas() {
    // Actualizar select en formulario de indicadores
    indicatorPrograma.innerHTML = '<option value="">Seleccionar programa...</option>' +
        programasLocal.map(p => `<option value="${p.codigo}">${p.icono} ${p.nombre}</option>`).join('');

    // Actualizar filtro de programas
    adminFilterProgram.innerHTML = '<option value="">Todos los programas</option>' +
        programasLocal.map(p => `<option value="${p.codigo}">${p.icono} ${p.nombre}</option>`).join('');
}

// ===== GESTIÓN DE INDICADORES =====

function limpiarFormularioIndicador() {
    indicatorCodigo.value = '';
    indicatorPrograma.value = '';
    indicatorCriterio.value = '';
    indicatorNombre.value = '';
    indicatorDesc.value = '';
    indicatorTipo.value = '';
    indicatorDepto.value = '';
    indicatorNivel.value = '';
    indicatorTiempo.value = '';
    editandoIndicador = null;
    btnSaveIndicator.innerHTML = '💾 Guardar Indicador';
}

function validarFormularioIndicador() {
    if (!indicatorCodigo.value.trim()) {
        showToast('Error', 'El código del indicador es requerido', 'error');
        return false;
    }
    if (!indicatorPrograma.value) {
        showToast('Error', 'Debe seleccionar un programa', 'error');
        return false;
    }
    if (!indicatorCriterio.value.trim()) {
        showToast('Error', 'El criterio es requerido', 'error');
        return false;
    }
    if (!indicatorNombre.value.trim()) {
        showToast('Error', 'El nombre del indicador es requerido', 'error');
        return false;
    }
    if (!indicatorTipo.value) {
        showToast('Error', 'Debe seleccionar un tipo de indicador', 'error');
        return false;
    }
    return true;
}

function guardarIndicador() {
    if (!validarFormularioIndicador()) return;

    const indicador = {
        codigo: indicatorCodigo.value.trim(),
        programa: indicatorPrograma.value,
        criterio: indicatorCriterio.value.trim(),
        nombre: indicatorNombre.value.trim(),
        desc: indicatorDesc.value.trim(),
        tipo: indicatorTipo.value,
        depto: indicatorDepto.value.trim() || 'No especificado',
        nivel: indicatorNivel.value.trim() || 'No especificado',
        tiempo: indicatorTiempo.value.trim() || 'No especificado',
        nombrePrograma: extraerNombrePrograma(indicatorCriterio.value.trim())
    };

    if (editandoIndicador !== null) {
        // Editar indicador existente
        indicadoresLocal[editandoIndicador] = indicador;
        showToast('Éxito', 'Indicador actualizado correctamente', 'success');
    } else {
        // Agregar nuevo indicador
        // Verificar que no exista el código
        if (indicadoresLocal.some(i => i.codigo === indicador.codigo)) {
            showToast('Error', 'Ya existe un indicador con ese código', 'error');
            return;
        }
        indicadoresLocal.push(indicador);
        showToast('Éxito', 'Indicador agregado correctamente', 'success');
    }

    guardarIndicadores();
    renderizarListaIndicadores();
    limpiarFormularioIndicador();
}

function editarIndicador(index) {
    const indicador = indicadoresLocal[index];
    indicatorCodigo.value = indicador.codigo;
    indicatorPrograma.value = indicador.programa;
    indicatorCriterio.value = indicador.criterio;
    indicatorNombre.value = indicador.nombre;
    indicatorDesc.value = indicador.desc || '';
    indicatorTipo.value = indicador.tipo;
    indicatorDepto.value = indicador.depto || '';
    indicatorNivel.value = indicador.nivel || '';
    indicatorTiempo.value = indicador.tiempo || '';
    editandoIndicador = index;
    btnSaveIndicator.innerHTML = '✏️ Actualizar Indicador';

    // Cambiar a la tab de indicadores si no está activa
    cambiarTabAdmin('indicators');

    // Scroll al formulario
    setTimeout(() => {
        document.querySelector('#adminTabIndicators .admin-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

function eliminarIndicador(index) {
    if (!confirm('¿Está seguro de eliminar este indicador?')) return;

    indicadoresLocal.splice(index, 1);
    guardarIndicadores();
    renderizarListaIndicadores();
    showToast('Éxito', 'Indicador eliminado correctamente', 'success');
}

function renderizarListaIndicadores() {
    const textoFiltro = adminSearchIndicators.value.toLowerCase();
    const programaFiltro = adminFilterProgram.value;

    let indicadoresFiltrados = indicadoresLocal.filter(ind => {
        const coincideTexto =
            ind.codigo.toLowerCase().includes(textoFiltro) ||
            ind.nombre.toLowerCase().includes(textoFiltro) ||
            ind.criterio.toLowerCase().includes(textoFiltro);

        const coincidePrograma = !programaFiltro || ind.programa === programaFiltro;

        return coincideTexto && coincidePrograma;
    });

    if (indicadoresFiltrados.length === 0) {
        indicatorsList.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:2rem;">No hay indicadores que coincidan con los filtros</p>';
        return;
    }

    // Obtener icono del tipo
    const getTipoIcono = (tipo) => {
        switch(tipo) {
            case 'Impacto': return '💫';
            case 'Resultado': return '✅';
            case 'Proceso': return '📊';
            default: return '❓';
        }
    };

    indicatorsList.innerHTML = indicadoresFiltrados.map((indicador, originalIndex) => {
        const index = indicadoresLocal.indexOf(indicador);
        const programa = programasLocal.find(p => p.codigo === indicador.programa);

        return `
            <div class="admin-item">
                <div class="admin-item-header">
                    <h4 class="admin-item-title">${getTipoIcono(indicador.tipo)} ${indicador.nombre}</h4>
                    <span class="admin-item-code">${indicador.codigo}</span>
                </div>
                <div class="admin-item-body">
                    <strong>Programa:</strong> ${programa ? programa.icono + ' ' + programa.nombre : 'Sin programa'}<br>
                    <strong>Criterio:</strong> ${indicador.criterio}<br>
                    <strong>Tipo:</strong> ${indicador.tipo}
                </div>
                <div class="admin-item-actions">
                    <button class="btn-admin-edit" onclick="editarIndicador(${index})">✏️ Editar</button>
                    <button class="btn-admin-delete" onclick="eliminarIndicador(${index})">🗑️ Eliminar</button>
                </div>
            </div>
        `;
    }).join('');
}

// ===== SINCRONIZAR CON DATOS PRINCIPALES =====

function sincronizarDatosLocalesConPrincipales() {
    // Si hay datos en localStorage, cargarlos en el array principal
    if (indicadoresLocal.length > 0) {
        // Preguntar al usuario si desea usar datos locales o de Google Sheets
        if (indicadores.length > 0) {
            if (confirm('Se detectaron datos locales. ¿Desea usar los datos guardados localmente en lugar de los datos de Google Sheets?')) {
                indicadores = [...indicadoresLocal];
                aplicarFiltros();
                showToast('Datos cargados', 'Se cargaron los datos desde el almacenamiento local', 'info');
            }
        } else {
            // Si no hay datos de Sheets, usar los locales directamente
            indicadores = [...indicadoresLocal];
            aplicarFiltros();
            showToast('Datos cargados', 'Se cargaron los datos desde el almacenamiento local', 'info');
        }
    }
}

// ===== EVENT LISTENERS =====

btnAdmin.addEventListener('click', abrirAdminModal);
adminModalClose.addEventListener('click', cerrarAdminModal);

// Cerrar modal al hacer clic fuera
adminModal.addEventListener('click', (e) => {
    if (e.target === adminModal) cerrarAdminModal();
});

// Tabs
adminTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.dataset.adminTab;
        cambiarTabAdmin(tabName);
    });
});

// Programas
btnSaveProgram.addEventListener('click', guardarPrograma);
btnCancelProgram.addEventListener('click', limpiarFormularioPrograma);

// Indicadores
btnSaveIndicator.addEventListener('click', guardarIndicador);
btnCancelIndicator.addEventListener('click', limpiarFormularioIndicador);

// Filtros de indicadores
adminSearchIndicators.addEventListener('input', renderizarListaIndicadores);
adminFilterProgram.addEventListener('change', renderizarListaIndicadores);

// ===== SIDEBAR TOGGLE =====
const sidebarToggle = document.getElementById('sidebarToggle');
const mainWrapper = document.querySelector('.main-wrapper');

if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
        mainWrapper.classList.toggle('sidebar-collapsed');

        // Guardar estado en localStorage
        const isCollapsed = mainWrapper.classList.contains('sidebar-collapsed');
        localStorage.setItem('sidebarCollapsed', isCollapsed);
    });
}

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

    // Restaurar estado del sidebar
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed');
    if (sidebarCollapsed === 'true') {
        const mainWrapper = document.querySelector('.main-wrapper');
        if (mainWrapper) {
            mainWrapper.classList.add('sidebar-collapsed');
        }
    }

    // Cargar datos locales
    cargarDatosLocales();
    sincronizarDatosLocalesConPrincipales();

    // Mostrar mensaje de bienvenida
    setTimeout(() => {
        showToast('Bienvenido', 'Presiona ? para ver los atajos de teclado', 'info');
    }, 1000);
});