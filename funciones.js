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

// ===== CARGAR DATOS =====
async function cargarDatos() {
    const url = urlSheet.value.trim();
    if (!url) {
        alert('⚠️ Por favor pega la URL de Google Sheets');
        return;
    }

    const sheetID = url.includes('/d/') ? url.split('/d/')[1].split('/')[0] : null;
    if (!sheetID) {
        alert('❌ URL inválida. Asegúrate de copiar la URL completa.');
        return;
    }

    try {
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

        if (indicadores.length === 0) {
            alert('⚠️ No se encontraron indicadores válidos en el archivo');
            return;
        }

        renderizarTodo();
        localStorage.setItem('urlSheet', url);
        document.getElementById('emptyState').style.display = 'none';
        
        alert(`✅ ${indicadores.length} indicadores cargados exitosamente`);

    } catch (error) {
        console.error('Error completo:', error);
        alert('❌ Error al cargar datos: ' + error.message);
    }
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
    if (codigo.startsWith('IL')) return 'IL';
    if (codigo.startsWith('AE.')) return 'AE';
    if (codigo.startsWith('CEEX')) return 'CEEX';
    if (codigo.startsWith('CCI')) return 'CCI';
    if (codigo.startsWith('C.')) return 'Creamos';
    if (codigo.startsWith('ME')) return 'ME';
    return 'Otros';
}

// ===== ACTUALIZAR ESTADÍSTICAS =====
function actualizarEstadisticas() {
    const creamosIndicadores = indicadores.filter(i => i.depto === 'Creamos');
    const otrosIndicadores = indicadores.filter(i => i.depto !== 'Creamos');

    document.getElementById('totalCount').textContent = indicadores.length;
    document.getElementById('creamosCount').textContent = creamosIndicadores.length;
    document.getElementById('otrosCount').textContent = otrosIndicadores.length;
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
    const creamosIndicadores = indicadores.filter(i => i.depto === 'Creamos');
    const programasLevel = document.getElementById('programasRow');
    const indicadoresLevel = document.getElementById('indicadoresRow');

    // Contar solo indicadores de Creamos que pasan los filtros
    const creamosFiltrados = obtenerIndicadoresFiltrados().filter(i => i.depto === 'Creamos');
    document.getElementById('rootCount').textContent = `${creamosFiltrados.length}/${creamosIndicadores.length} indicadores`;

    programasLevel.innerHTML = '';
    indicadoresLevel.innerHTML = '';

    // Obtener programas únicos de Creamos
    const programasUnicos = [...new Set(creamosIndicadores.map(i => i.programa))].sort();

    if (programasUnicos.length === 0) {
        programasLevel.innerHTML = '<p style="text-align:center;padding:20px;color:#999;">No hay programas de Creamos</p>';
        return;
    }

    programasUnicos.forEach(prog => {
        // Filtrar por programa Y por filtros de tipo
        const indsPrograma = creamosIndicadores.filter(i => i.programa === prog);
        const indsFiltrados = obtenerIndicadoresFiltrados().filter(i => i.programa === prog && i.depto === 'Creamos');

        // Determinar icono según el código del programa
        const icono = prog.includes('I') ? '💫' : prog.includes('P') ? '🎯' : '✅';

        const node = document.createElement('div');
        node.className = `diagram-node programa-node ${programaSeleccionado === prog ? 'selected' : ''}`;
        node.dataset.programa = prog;
        node.innerHTML = `
            <div class="node-icon">${icono}</div>
            <div class="node-label">${prog}</div>
            <div class="node-count">${indsFiltrados.length}/${indsPrograma.length}</div>
        `;
        node.addEventListener('click', () => seleccionarPrograma(prog));
        programasLevel.appendChild(node);
    });

    // Mostrar indicadores del programa seleccionado
    if (programaSeleccionado) {
        const indsFiltrados = obtenerIndicadoresFiltrados()
            .filter(i => i.programa === programaSeleccionado && i.depto === 'Creamos');

        if (indsFiltrados.length === 0) {
            indicadoresLevel.innerHTML = '<p style="text-align:center;padding:20px;color:#999;">No hay indicadores que coincidan con los filtros seleccionados</p>';
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
                node.addEventListener('click', () => abrirModal(ind));
                indicadoresLevel.appendChild(node);
            });
        }
    } else {
        indicadoresLevel.innerHTML = '<p style="text-align:center;padding:20px;color:#999;">Haz clic en un programa para ver sus indicadores</p>';
    }
}

// ===== SELECCIONAR PROGRAMA EN DIAGRAMA =====
function seleccionarPrograma(programa) {
    if (programaSeleccionado === programa) {
        programaSeleccionado = null;
    } else {
        programaSeleccionado = programa;
    }
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
        container.innerHTML = '<p style="text-align:center;padding:40px;color:#999;">No hay indicadores que coincidan con los filtros</p>';
        return;
    }

    // Agrupar por programa
    const porPrograma = {};
    indsFiltrados.forEach(ind => {
        if (!porPrograma[ind.programa]) {
            porPrograma[ind.programa] = [];
        }
        porPrograma[ind.programa].push(ind);
    });

    // Renderizar por programa
    Object.keys(porPrograma).sort().forEach(programa => {
        const programaInds = porPrograma[programa];
        const icono = programa.includes('I') ? '💫' : programa.includes('P') ? '🎯' : '✅';

        // Crear tarjeta de programa
        const programCard = document.createElement('div');
        programCard.className = 'program-card';
        programCard.innerHTML = `
            <div class="program-icon">${icono}</div>
            <div class="program-name">${programa}</div>
            <div class="program-count">${programaInds.length} indicadores</div>
            <div class="program-types">
                ${[...new Set(programaInds.map(i => i.tipo))].map(tipo => {
                    const tipoClass = tipo.toLowerCase().replace(' ', '-');
                    return `<span class="type-badge ${tipoClass}">${tipo}</span>`;
                }).join('')}
            </div>
        `;

        programCard.addEventListener('click', () => {
            // Mostrar el primer indicador del programa como ejemplo
            if (programaInds.length > 0) {
                abrirModal(programaInds[0]);
            }
        });

        container.appendChild(programCard);
    });
}

// ===== RENDERIZAR VISTA LISTA =====
function renderizarLista() {
    const container = document.getElementById('listAccordion');
    container.innerHTML = '';

    const creamosIndicadores = indicadores.filter(i => i.depto === 'Creamos');
    const otrosDepts = indicadores.filter(i => i.depto !== 'Creamos');

    // ===== CREAMOS =====
    if (creamosIndicadores.length > 0) {
        const creamosAccordion = crearAccordion('🌟', 'Creamos', creamosIndicadores.length, true);
        
        // Obtener programas únicos de Creamos
        const programasCreamos = [...new Set(creamosIndicadores.map(i => i.programa))].sort();
        
        programasCreamos.forEach(prog => {
            const progsInds = creamosIndicadores.filter(i => i.programa === prog);
            const programaDiv = crearPrograma(prog, progsInds);
            creamosAccordion.content.appendChild(programaDiv);
        });
        
        container.appendChild(creamosAccordion.element);
    }

    // ===== OTROS DEPARTAMENTOS =====
    if (otrosDepts.length > 0) {
        const otrosAccordion = crearAccordion('📋', 'Otros Departamentos', otrosDepts.length, false);
        
        const deptos = [...new Set(otrosDepts.map(i => i.depto))].sort();
        
        deptos.forEach(depto => {
            const deptInds = otrosDepts.filter(i => i.depto === depto);
            const icono = { 
                'IL': '💼', 
                'AE': '💚', 
                'CEEX': '📚', 
                'CCI': '👶', 
                'ME': '👩‍💼' 
            }[depto] || '📋';
            
            const programaDiv = crearPrograma(`${icono} ${depto}`, deptInds);
            otrosAccordion.content.appendChild(programaDiv);
        });
        
        container.appendChild(otrosAccordion.element);
    }

    aplicarFiltros();
}

// ===== CREAR ACCORDION =====
function crearAccordion(icono, titulo, count, abierto = false) {
    const accordionItem = document.createElement('div');
    accordionItem.className = `accordion-item ${abierto ? 'open' : ''}`;
    
    const header = document.createElement('button');
    header.className = 'accordion-header';
    header.innerHTML = `
        <span class="accordion-icon">${icono}</span>
        <span class="accordion-title">${titulo}</span>
        <span class="accordion-count">${count}</span>
        <span class="accordion-toggle">▼</span>
    `;
    
    const content = document.createElement('div');
    content.className = 'accordion-content';
    
    header.addEventListener('click', () => {
        accordionItem.classList.toggle('open');
    });
    
    accordionItem.appendChild(header);
    accordionItem.appendChild(content);
    
    return { element: accordionItem, content };
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
    const filtros = document.querySelectorAll('.filter-checkbox:checked');
    const tiposFiltrados = Array.from(filtros).map(f => f.value);

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
    document.getElementById('modalTitle').textContent = ind.nombre;
    document.getElementById('modalCode').textContent = ind.codigo;
    document.getElementById('modalType').textContent = ind.tipo;
    document.getElementById('modalCodigo').textContent = ind.codigo;
    document.getElementById('modalCriterio').textContent = ind.criterio;
    document.getElementById('modalDesc').textContent = ind.desc || 'Sin descripción';
    document.getElementById('modalTipo').textContent = ind.tipo;
    document.getElementById('modalDepto').textContent = ind.depto;
    document.getElementById('modalPrograma').textContent = ind.programa;

    modalOverlay.classList.add('active');
}

// ===== CERRAR MODAL =====
function cerrarModal() {
    modalOverlay.classList.remove('active');
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

document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        if (vistaActual === 'list') {
            aplicarFiltros();
        } else {
            renderizarVista();
        }
    });
});

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        cambiarVista(btn.dataset.view);
    });
});

// ===== INICIALIZACIÓN =====
window.addEventListener('load', () => {
    const url = localStorage.getItem('urlSheet');
    if (url) {
        urlSheet.value = url;
    }
});