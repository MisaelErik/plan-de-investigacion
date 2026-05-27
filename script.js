/* --- DIBUJO DE CONEXIONES DE MAPA (SVG DINÁMICO) --- */
document.addEventListener('DOMContentLoaded', () => {
    // Dibujar conexiones al cargar
    setTimeout(drawConnections, 300);

    // Volver a dibujar conexiones al redimensionar la ventana
    window.addEventListener('resize', drawConnections);

    // Ajustar conexiones si hay scrolling horizontal en el contenedor del mapa
    const wrapper = document.querySelector('.map-wrapper');
    if (wrapper) {
        wrapper.addEventListener('scroll', drawConnections);
    }
});

let mapZoomLevel = 1.0;

function drawConnections() {
    const canvas = document.getElementById('canvas-overlay');
    const outerWrapper = document.querySelector('.map-wrapper');
    const zoomArea = document.getElementById('map-zoom-area');
    if (!canvas || !outerWrapper || !zoomArea) return;

    // El tamaño del canvas debe ser el tamaño completo del contenedor sin escalar
    canvas.setAttribute('width', zoomArea.scrollWidth);
    canvas.setAttribute('height', zoomArea.scrollHeight);

    // Limpiar canvas
    canvas.innerHTML = '';

    // Definir las conexiones (Pirámide: de arriba hacia abajo)
    const connections = [
        // Nivel 1 → Nivel 2: Tema → Variables y PG
        { parent: 'node-tema', child: 'node-v1', type: 'v1' },
        { parent: 'node-tema', child: 'node-pg', type: 'general' },
        { parent: 'node-tema', child: 'node-v2', type: 'v2' },

        // Nivel 2 → Nivel 3: PG → OG y HG
        { parent: 'node-pg', child: 'node-og', type: 'general' },
        { parent: 'node-pg', child: 'node-hg', type: 'general' },

        // Nivel 2 → Nivel 3: V1 → Dimensiones V1
        { parent: 'node-v1', child: 'node-v1-d1', type: 'v1' },
        { parent: 'node-v1', child: 'node-v1-d2', type: 'v1' },
        { parent: 'node-v1', child: 'node-v1-d3', type: 'v1' },

        // Nivel 2 → Nivel 3: V2 → Dimensiones V2
        { parent: 'node-v2', child: 'node-v2-d1', type: 'v2' },
        { parent: 'node-v2', child: 'node-v2-d2', type: 'v2' },

        // Nivel 3 → Nivel 4: Dimensiones → Indicadores
        { parent: 'node-v1-d1', child: 'node-v1-d1-ind', type: 'v1' },
        { parent: 'node-v1-d2', child: 'node-v1-d2-ind', type: 'v1' },
        { parent: 'node-v1-d3', child: 'node-v1-d3-ind', type: 'v1' },
        { parent: 'node-v2-d1', child: 'node-v2-d1-ind', type: 'v2' },
        { parent: 'node-v2-d2', child: 'node-v2-d2-ind', type: 'v2' },

        // Nivel 4 → Nivel 5: Indicadores/Dimensiones → PE (cruces)
        { parent: 'node-v1-d1', child: 'node-pe1', type: 'v1' },
        { parent: 'node-v2-d1', child: 'node-pe1', type: 'v2' },
        { parent: 'node-v1-d2', child: 'node-pe2', type: 'v1' },
        { parent: 'node-v2-d1', child: 'node-pe2', type: 'v2' },
        { parent: 'node-v1-d3', child: 'node-pe3', type: 'v1' },
        { parent: 'node-v2-d2', child: 'node-pe3', type: 'v2' },

        // Dentro del Nivel 5: PE → OE → HE
        { parent: 'node-pe1', child: 'node-oe1', type: 'general' },
        { parent: 'node-oe1', child: 'node-he1', type: 'general' },
        { parent: 'node-pe2', child: 'node-oe2', type: 'general' },
        { parent: 'node-oe2', child: 'node-he2', type: 'general' },
        { parent: 'node-pe3', child: 'node-oe3', type: 'general' },
        { parent: 'node-oe3', child: 'node-he3', type: 'general' }
    ];

    const rectWrapper = zoomArea.getBoundingClientRect();

    connections.forEach(conn => {
        const parentEl = document.getElementById(conn.parent);
        const childEl = document.getElementById(conn.child);

        if (parentEl && childEl) {
            const rectParent = parentEl.getBoundingClientRect();
            const rectChild = childEl.getBoundingClientRect();

            let x1, y1, x2, y2;
            
            // Si están en la misma línea vertical (altura muy parecida), dibujamos horizontalmente de lado a lado
            const isHorizontal = Math.abs((rectParent.top + rectParent.height / 2) - (rectChild.top + rectChild.height / 2)) < 20;

            if (isHorizontal) {
                // De borde derecho de padre a borde izquierdo de hijo (o viceversa si hijo está a la izquierda)
                if (rectParent.left < rectChild.left) {
                    x1 = (rectParent.right - rectWrapper.left) / mapZoomLevel;
                    y1 = (rectParent.top - rectWrapper.top + rectParent.height / 2) / mapZoomLevel;
                    x2 = (rectChild.left - rectWrapper.left) / mapZoomLevel;
                    y2 = (rectChild.top - rectWrapper.top + rectChild.height / 2) / mapZoomLevel;
                } else {
                    x1 = (rectParent.left - rectWrapper.left) / mapZoomLevel;
                    y1 = (rectParent.top - rectWrapper.top + rectParent.height / 2) / mapZoomLevel;
                    x2 = (rectChild.right - rectWrapper.left) / mapZoomLevel;
                    y2 = (rectChild.top - rectWrapper.top + rectChild.height / 2) / mapZoomLevel;
                }
            } else {
                // Por defecto, de abajo de padre a arriba de hijo
                x1 = (rectParent.left - rectWrapper.left + rectParent.width / 2) / mapZoomLevel;
                y1 = (rectParent.bottom - rectWrapper.top) / mapZoomLevel;
                x2 = (rectChild.left - rectWrapper.left + rectChild.width / 2) / mapZoomLevel;
                y2 = (rectChild.top - rectWrapper.top) / mapZoomLevel;
            }

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            
            // Dibujar un camino bezier curvo
            let d;
            if (isHorizontal) {
                const controlX = x1 + (x2 - x1) / 2;
                d = `M ${x1} ${y1} C ${controlX} ${y1}, ${controlX} ${y2}, ${x2} ${y2}`;
            } else {
                const controlY = y1 + (y2 - y1) / 2;
                d = `M ${x1} ${y1} C ${x1} ${controlY}, ${x2} ${controlY}, ${x2} ${y2}`;
            }

            path.setAttribute('d', d);
            path.setAttribute('data-parent', conn.parent);
            path.setAttribute('data-child', conn.child);
            path.setAttribute('data-branch', conn.type);

            canvas.appendChild(path);
        }
    });
}

// Mapa de relaciones para resaltado inteligente
const nodeRelations = {
    'node-tema': ['node-tema', 'node-v1', 'node-v2', 'node-pg', 'node-og', 'node-hg'],
    
    'node-v1': ['node-v1', 'node-v1-d1', 'node-v1-d2', 'node-v1-d3', 'node-v1-d1-ind', 'node-v1-d2-ind', 'node-v1-d3-ind', 'node-tema'],
    'node-v2': ['node-v2', 'node-v2-d1', 'node-v2-d2', 'node-v2-d1-ind', 'node-v2-d2-ind', 'node-tema'],
    
    'node-pg': ['node-pg', 'node-v1', 'node-v2', 'node-tema', 'node-og', 'node-hg'],
    'node-og': ['node-og', 'node-pg', 'node-v1', 'node-v2', 'node-tema', 'node-hg'],
    'node-hg': ['node-hg', 'node-og', 'node-pg', 'node-v1', 'node-v2', 'node-tema'],
    
    // Dimensiones V1 y sus ramificaciones
    'node-v1-d1': ['node-v1-d1', 'node-v1', 'node-v1-d1-ind', 'node-pe1', 'node-oe1', 'node-he1', 'node-v2-d1-ind', 'node-v2-d1', 'node-v2'],
    'node-v1-d2': ['node-v1-d2', 'node-v1', 'node-v1-d2-ind', 'node-pe2', 'node-oe2', 'node-he2', 'node-v2-d1-ind', 'node-v2-d1', 'node-v2'],
    'node-v1-d3': ['node-v1-d3', 'node-v1', 'node-v1-d3-ind', 'node-pe3', 'node-oe3', 'node-he3', 'node-v2-d2-ind', 'node-v2-d2', 'node-v2'],
    
    // Indicadores V1
    'node-v1-d1-ind': ['node-v1-d1-ind', 'node-v1-d1', 'node-v1', 'node-pe1', 'node-oe1', 'node-he1', 'node-v2-d1-ind', 'node-v2-d1', 'node-v2'],
    'node-v1-d2-ind': ['node-v1-d2-ind', 'node-v1-d2', 'node-v1', 'node-pe2', 'node-oe2', 'node-he2', 'node-v2-d1-ind', 'node-v2-d1', 'node-v2'],
    'node-v1-d3-ind': ['node-v1-d3-ind', 'node-v1-d3', 'node-v1', 'node-pe3', 'node-oe3', 'node-he3', 'node-v2-d2-ind', 'node-v2-d2', 'node-v2'],

    // Dimensiones V2 y sus ramificaciones
    'node-v2-d1': ['node-v2-d1', 'node-v2', 'node-v2-d1-ind', 'node-pe1', 'node-oe1', 'node-he1', 'node-pe2', 'node-oe2', 'node-he2', 'node-v1-d1', 'node-v1-d2', 'node-v1-d1-ind', 'node-v1-d2-ind', 'node-v1'],
    'node-v2-d2': ['node-v2-d2', 'node-v2', 'node-v2-d2-ind', 'node-pe3', 'node-oe3', 'node-he3', 'node-v1-d3', 'node-v1-d3-ind', 'node-v1'],
    
    // Indicadores V2
    'node-v2-d1-ind': ['node-v2-d1-ind', 'node-v2-d1', 'node-v2', 'node-pe1', 'node-oe1', 'node-he1', 'node-pe2', 'node-oe2', 'node-he2', 'node-v1-d1', 'node-v1-d2', 'node-v1-d1-ind', 'node-v1-d2-ind', 'node-v1'],
    'node-v2-d2-ind': ['node-v2-d2-ind', 'node-v2-d2', 'node-v2', 'node-pe3', 'node-oe3', 'node-he3', 'node-v1-d3', 'node-v1-d3-ind', 'node-v1'],

    // PE / OE / HE Específicas 1
    'node-pe1': ['node-pe1', 'node-oe1', 'node-he1', 'node-v1-d1-ind', 'node-v1-d1', 'node-v1', 'node-v2-d1-ind', 'node-v2-d1', 'node-v2'],
    'node-oe1': ['node-oe1', 'node-pe1', 'node-he1', 'node-v1-d1-ind', 'node-v1-d1', 'node-v1', 'node-v2-d1-ind', 'node-v2-d1', 'node-v2'],
    'node-he1': ['node-he1', 'node-pe1', 'node-oe1', 'node-v1-d1-ind', 'node-v1-d1', 'node-v1', 'node-v2-d1-ind', 'node-v2-d1', 'node-v2'],
    
    // PE / OE / HE Específicas 2
    'node-pe2': ['node-pe2', 'node-oe2', 'node-he2', 'node-v1-d2-ind', 'node-v1-d2', 'node-v1', 'node-v2-d1-ind', 'node-v2-d1', 'node-v2'],
    'node-oe2': ['node-oe2', 'node-pe2', 'node-he2', 'node-v1-d2-ind', 'node-v1-d2', 'node-v1', 'node-v2-d1-ind', 'node-v2-d1', 'node-v2'],
    'node-he2': ['node-he2', 'node-pe2', 'node-oe2', 'node-v1-d2-ind', 'node-v1-d2', 'node-v1', 'node-v2-d1-ind', 'node-v2-d1', 'node-v2'],
    
    // PE / OE / HE Específicas 3
    'node-pe3': ['node-pe3', 'node-oe3', 'node-he3', 'node-v1-d3-ind', 'node-v1-d3', 'node-v1', 'node-v2-d2-ind', 'node-v2-d2', 'node-v2'],
    'node-oe3': ['node-oe3', 'node-pe3', 'node-he3', 'node-v1-d3-ind', 'node-v1-d3', 'node-v1', 'node-v2-d2-ind', 'node-v2-d2', 'node-v2'],
    'node-he3': ['node-he3', 'node-pe3', 'node-oe3', 'node-v1-d3-ind', 'node-v1-d3', 'node-v1', 'node-v2-d2-ind', 'node-v2-d2', 'node-v2']
};

function hoverNode(nodeId) {
    // Quitar todas las clases activas e iluminaciones
    document.querySelectorAll('.tree-node').forEach(node => {
        node.classList.remove('active-highlight');
    });

    document.querySelectorAll('#canvas-overlay path').forEach(path => {
        path.classList.remove('active-v1', 'active-v2', 'active-general');
    });

    if (!nodeId) return;

    // Obtener los nodos que forman parte de la ruta
    const related = nodeRelations[nodeId];
    if (!related) return;

    // Iluminar los nodos del camino
    related.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.add('active-highlight');
        }
    });

    // Iluminar los caminos (SVG Paths) cuyos dos extremos estén iluminados
    document.querySelectorAll('#canvas-overlay path').forEach(path => {
        const parent = path.getAttribute('data-parent');
        const child = path.getAttribute('data-child');
        const branchType = path.getAttribute('data-branch');

        if (related.includes(parent) && related.includes(child)) {
            // Aplicar el color de rama correspondiente
            path.classList.add(`active-${branchType}`);
        }
    });
}

/* --- FADE IN EN SCROLL --- */
const fadeSections = document.querySelectorAll('.fade-in-section');
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
        }
    });
}, { threshold: 0.1 });

fadeSections.forEach(section => {
    observer.observe(section);
});

/* --- MODAL PARA DETALLES --- */
const modal = document.getElementById('modal-container');
const modalTitle = document.getElementById('modal-title-text');
const modalBody = document.getElementById('modal-body-text');

const modalDatabase = {
    tema: {
        title: "Tema de Tesis",
        body: "<p><strong>Título Oficial del Proyecto:</strong></p><p><em>\"Adopción de sistemas digitales y su relación con el desempeño comercial de las microempresas del sector comercio en el distrito de Bellavista, Callao, 2026.\"</em></p><p><strong>¿Qué representa?</strong> El marco principal del estudio, que delimita conceptualmente y empíricamente todo el contenido de la tesis.</p>"
    },
    problema_gen: {
        title: "Problema General (PG)",
        body: "<p><strong>Definición:</strong> Es la interrogante principal de la investigación que guía todo el estudio.</p><p><strong>En el proyecto:</strong> ¿Qué relación existe entre la adopción de sistemas digitales (V1) y el desempeño comercial (V2) de las microempresas del sector comercio en el distrito de Bellavista, Callao, 2026?</p>"
    },
    objetivo_gen: {
        title: "Objetivo General (OG)",
        body: "<p><strong>Definición:</strong> La meta principal que busca alcanzar la investigación para responder al Problema General.</p><p><strong>En el proyecto:</strong> Determinar la relación que existe entre la adopción de sistemas digitales (V1) y el desempeño comercial (V2) de las microempresas del sector comercio en el distrito de Bellavista, Callao, 2026.</p>"
    },
    hipotesis_gen: {
        title: "Hipótesis General (HG)",
        body: "<p><strong>Definición:</strong> Respuesta tentativa y afirmativa al problema formulado.</p><p><strong>En el proyecto:</strong> Existe una relación directa y significativa entre la adopción de sistemas digitales (V1) y el desempeño comercial (V2) de las microempresas del sector comercio en el distrito de Bellavista, Callao, 2026.</p>"
    },
    variables: {
        title: "Variables de Investigación",
        body: "<p><strong>Variable Independiente (V1):</strong> Adopción de Sistemas Digitales. Es la variable predictora.</p><p><strong>Variable Dependiente (V2):</strong> Desempeño Comercial. Es la variable de resultado comercial y operativa.</p>"
    },
    // Modales de dimensiones
    'v1-d1': {
        title: "V1 Dimensión 1: Medios de Pago Electrónicos",
        body: "<p>Representa la capacidad operativa de cobros digitales del negocio mediante Yape, Plin, POS físicos y transferencias inmediatas.</p>"
    },
    'v1-d2': {
        title: "V1 Dimensión 2: Canales de Venta y Atención Digital",
        body: "<p>Evalúa el uso comercial de WhatsApp, catálogos interactivos, redes sociales activas e inversión publicitaria local.</p>"
    },
    'v1-d3': {
        title: "V1 Dimensión 3: Visibilidad y Geolocalización Local",
        body: "<p>Mide el posicionamiento del negocio en Google Maps, participación en comunidades de Facebook y SEO local.</p>"
    },
    'v2-d1': {
        title: "V2 Dimensión 1: Flujo de Ingresos Monetarios",
        body: "<p>Mide el volumen de facturación captado digitalmente, el ticket promedio diario de compra y la frecuencia de recompra del cliente.</p>"
    },
    'v2-d2': {
        title: "V2 Dimensión 2: Eficiencia Operativa del Servicio",
        body: "<p>Evalúa el ahorro de vuelto en caja, velocidad en mostrador, facilidad de cuadres diarios y reducción del riesgo por manejo de efectivo.</p>"
    },
    // Modales de Indicadores por separado
    'v1-d1-ind': {
        title: "Indicadores de Medios de Pago (V1D1)",
        body: `<ul>
            <li><strong>Ítem 1:</strong> Frecuencia de cobros con billeteras móviles (Yape/Plin).</li>
            <li><strong>Ítem 2:</strong> Proporción de cobros vía terminales POS (Tarjetas).</li>
            <li><strong>Ítem 3:</strong> Presencia de material visual QR oficial en caja.</li>
            <li><strong>Ítem 4:</strong> Uso operativo de transferencias bancarias de abono inmediato.</li>
        </ul>`
    },
    'v1-d2-ind': {
        title: "Indicadores de Canales de Venta (V1D2)",
        body: `<ul>
            <li><strong>Ítem 5:</strong> WhatsApp comercial activo para pedidos y listas de precios.</li>
            <li><strong>Ítem 6:</strong> Disposición de catálogos o menús virtuales para clientes.</li>
            <li><strong>Ítem 7:</strong> Gestión de perfiles comerciales en Redes Sociales (FB, IG) o web propia.</li>
            <li><strong>Ítem 8:</strong> Inversión mensual en pautas de publicidad digital con segmentación local.</li>
        </ul>`
    },
    'v1-d3-ind': {
        title: "Indicadores de Geolocalización (V1D3)",
        body: `<ul>
            <li><strong>Ítem 9:</strong> Registro de ubicación exacta en Google Maps o Waze.</li>
            <li><strong>Ítem 10:</strong> Publicación en grupos y páginas vecinales de Facebook del distrito.</li>
            <li><strong>Ítem 11:</strong> Listas de difusión de WhatsApp para contactar a vecinos de la cuadra.</li>
            <li><strong>Ítem 12:</strong> Optimización SEO local para aparecer ante búsquedas móviles en Bellavista.</li>
        </ul>`
    },
    'v2-d1-ind': {
        title: "Indicadores de Flujo de Ingresos (V2D1)",
        body: `<ul>
            <li><strong>Ítem 13:</strong> Porcentaje de recaudación semanal que proviene de medios digitales.</li>
            <li><strong>Ítem 14:</strong> Ticket promedio de compras de clientes que pagan digitalmente.</li>
            <li><strong>Ítem 15:</strong> Aceleración del recaudo diario en comparación a la época analógica.</li>
            <li><strong>Ítem 16:</strong> Flexibilidad de límites en caja (sin montos mínimos condicionantes).</li>
            <li><strong>Ítem 17:</strong> Frecuencia de recompra motivada por conveniencia digital.</li>
            <li><strong>Ítem 18:</strong> Retorno en volumen de ventas al liquidar stock por promociones digitales.</li>
        </ul>`
    },
    'v2-d2-ind': {
        title: "Indicadores de Eficiencia Operativa (V2D2)",
        body: `<ul>
            <li><strong>Ítem 19:</strong> Ventas no frustradas por falta de sencillo/vuelto físico.</li>
            <li><strong>Ítem 20:</strong> Reducción de tiempo de cobro en mostrador comparado con efectivo.</li>
            <li><strong>Ítem 21:</strong> Simplificación práctica y reducción de tiempo en arqueos de caja diarios.</li>
            <li><strong>Ítem 22:</strong> Disminución del riesgo de robos locales al reducir el efectivo en caja.</li>
            <li><strong>Ítem 23:</strong> Ahorro en tiempo y traslados logísticos riesgosos al banco.</li>
            <li><strong>Ítem 24:</strong> Cero errores humanos (billetes falsos, vuelto equivocado) en cobranza.</li>
        </ul>`
    },
    pe1: {
        title: "Problema Específico 1 (PE1)",
        body: "<p>Estudia la relación de la <strong>Dimensión 1 de V1 (Medios de Pago Electrónicos)</strong> con el desempeño comercial.</p><p><strong>Pregunta:</strong> ¿Qué relación existe entre los medios de pago electrónicos y el desempeño comercial de las microempresas del sector comercio en el distrito de Bellavista, Callao, 2026?</p>"
    },
    oe1: {
        title: "Objetivo Específico 1 (OE1)",
        body: "<p>La meta orientada a contrastar el PE1.</p><p><strong>Texto:</strong> Determinar la relación que existe entre los medios de pago electrónicos y el desempeño comercial de las microempresas del sector comercio en el distrito de Bellavista, Callao, 2026.</p>"
    },
    he1: {
        title: "Hipótesis Específica 1 (HE1)",
        body: "<p>La respuesta tentativa al PE1.</p><p><strong>Texto:</strong> Existe una relación directa y significativa entre los medios de pago electrónicos y el desempeño comercial de las microempresas del sector comercio en el distrito de Bellavista, Callao, 2026.</p>"
    },
    pe2: {
        title: "Problema Específico 2 (PE2)",
        body: "<p>Estudia la relación de la <strong>Dimensión 2 de V1 (Canales de Venta y Atención Digital)</strong> con el desempeño comercial.</p><p><strong>Pregunta:</strong> ¿Qué relación existe entre los canales de venta y atención digital y el desempeño comercial de las microempresas del sector comercio en el distrito de Bellavista, Callao, 2026?</p>"
    },
    oe2: {
        title: "Objetivo Específico 2 (OE2)",
        body: "<p>La meta orientada a contrastar el PE2.</p><p><strong>Texto:</strong> Determinar la relación que existe entre los canales de venta y atención digital y el desempeño comercial de las microempresas del sector comercio en el distrito de Bellavista, Callao, 2026.</p>"
    },
    he2: {
        title: "Hipótesis Específica 2 (HE2)",
        body: "<p>La respuesta tentativa al PE2.</p><p><strong>Texto:</strong> Existe una relación directa y significativa entre los canales de venta y atención digital y el desempeño comercial de las microempresas del sector comercio en el distrito de Bellavista, Callao, 2026.</p>"
    },
    pe3: {
        title: "Problema Específico 3 (PE3)",
        body: "<p>Estudia la relación de la <strong>Dimensión 3 de V1 (Visibilidad y Geolocalización Local)</strong> con el desempeño comercial.</p><p><strong>Pregunta:</strong> ¿Qué relación existe entre la visibilidad y geolocalización local y el desempeño comercial de las microempresas del sector comercio en el distrito de Bellavista, Callao, 2026?</p>"
    },
    oe3: {
        title: "Objetivo Específico 3 (OE3)",
        body: "<p>La meta orientada a contrastar el PE3.</p><p><strong>Texto:</strong> Determinar la relación que existe entre la visibilidad y geolocalización local y el desempeño comercial de las microempresas del sector comercio en el distrito de Bellavista, Callao, 2026.</p>"
    },
    he3: {
        title: "Hipótesis Específica 3 (HE3)",
        body: "<p>La respuesta tentativa al PE3.</p><p><strong>Texto:</strong> Existe una relación directa y significativa entre la visibilidad y geolocalización local y el desempeño comercial de las microempresas del sector comercio en el distrito de Bellavista, Callao, 2026.</p>"
    }
};

function showModal(key, customTitle, customBody) {
    const data = modalDatabase[key];
    if (data) {
        modalTitle.innerHTML = data.title;
        modalBody.innerHTML = data.body;
    } else {
        modalTitle.innerText = customTitle || "Información";
        modalBody.innerHTML = customBody || "";
    }
    modal.classList.add('active');
}

function closeModal() {
    modal.classList.remove('active');
}

// Cerrar modal al hacer clic fuera del recuadro
window.onclick = function(event) {
    if (event.target == modal) {
        closeModal();
    }
}

/* --- PARSER INTERACTIVO DE REDACCIÓN --- */
const parserData = {
    problema: {
        general: {
            label: "Problema General (PG)",
            btnV1Label: "Variable 1 (V1)",
            btnV2Label: "Variable 2 (V2)",
            formula: "¿<span class='part-verbo'>[Pregunta Clave]</span> + la <span class='part-v1'>[Variable 1 (V1)]</span> + <span class='part-nexo'>[Nexo]</span> + el <span class='part-v2'>[Variable 2 (V2)]</span> + de las <span class='part-poblacion'>[Población]</span> + en el <span class='part-espacio'>[Espacio]</span>, <span class='part-tiempo'>[Tiempo]</span>?",
            text: "¿<span class='part-verbo'>De qué manera</span> la <span class='part-v1'>adopción de sistemas digitales</span> <span class='part-nexo'>se relaciona con</span> el <span class='part-v2'>desempeño comercial</span> de las <span class='part-poblacion'>microempresas del sector comercio</span> en el <span class='part-espacio'>distrito de Bellavista, Callao</span>, <span class='part-tiempo'>2026</span>?"
        },
        pe1: {
            label: "Problema Específico 1 (PE1)",
            btnV1Label: "Dimensión V1 (D1)",
            btnV2Label: "Dimensión V2 (D1)",
            formula: "¿<span class='part-verbo'>[Pregunta Clave]</span> + los <span class='part-v1'>[Dimensión 1 (V1-D1)]</span> + <span class='part-nexo'>[Nexo]</span> + el <span class='part-v2'>[Dimensión 1 (V2-D1)]</span> + de las <span class='part-poblacion'>[Población]</span> + en el <span class='part-espacio'>[Espacio]</span>, <span class='part-tiempo'>[Tiempo]</span>?",
            text: "¿<span class='part-verbo'>De qué manera</span> los <span class='part-v1'>medios de pago electrónicos</span> <span class='part-nexo'>se relacionan con</span> el <span class='part-v2'>flujo de ingresos monetarios</span> de las <span class='part-poblacion'>microempresas del sector comercio</span> en el <span class='part-espacio'>distrito de Bellavista, Callao</span>, <span class='part-tiempo'>2026</span>?"
        },
        pe2: {
            label: "Problema Específico 2 (PE2)",
            btnV1Label: "Dimensión V1 (D2)",
            btnV2Label: "Dimensión V2 (D1)",
            formula: "¿<span class='part-verbo'>[Pregunta Clave]</span> + los <span class='part-v1'>[Dimensión 2 (V1-D2)]</span> + <span class='part-nexo'>[Nexo]</span> + el <span class='part-v2'>[Dimensión 1 (V2-D1)]</span> + de las <span class='part-poblacion'>[Población]</span> + en el <span class='part-espacio'>[Espacio]</span>, <span class='part-tiempo'>[Tiempo]</span>?",
            text: "¿<span class='part-verbo'>De qué manera</span> los <span class='part-v1'>canales de venta y atención digital</span> <span class='part-nexo'>se relacionan con</span> el <span class='part-v2'>flujo de ingresos monetarios</span> de las <span class='part-poblacion'>microempresas del sector comercio</span> en el <span class='part-espacio'>distrito de Bellavista, Callao</span>, <span class='part-tiempo'>2026</span>?"
        },
        pe3: {
            label: "Problema Específico 3 (PE3)",
            btnV1Label: "Dimensión V1 (D3)",
            btnV2Label: "Dimensión V2 (D2)",
            formula: "¿<span class='part-verbo'>[Pregunta Clave]</span> + la <span class='part-v1'>[Dimensión 3 (V1-D3)]</span> + <span class='part-nexo'>[Nexo]</span> + la <span class='part-v2'>[Dimensión 2 (V2-D2)]</span> + de las <span class='part-poblacion'>[Población]</span> + en el <span class='part-espacio'>[Espacio]</span>, <span class='part-tiempo'>[Tiempo]</span>?",
            text: "¿<span class='part-verbo'>De qué manera</span> la <span class='part-v1'>visibilidad y geolocalización local</span> <span class='part-nexo'>se relaciona con</span> la <span class='part-v2'>eficiencia operativa</span> de las <span class='part-poblacion'>microempresas del sector comercio</span> en el <span class='part-espacio'>distrito de Bellavista, Callao</span>, <span class='part-tiempo'>2026</span>?"
        }
    },
    objetivo: {
        general: {
            label: "Objetivo General (OG)",
            btnV1Label: "Variable 1 (V1)",
            btnV2Label: "Variable 2 (V2)",
            formula: "<span class='part-verbo'>[Verbo Amplio Infinitivo]</span> + la <span class='part-v1'>[Variable 1 (V1)]</span> + <span class='part-nexo'>[Nexo Relacional]</span> + el <span class='part-v2'>[Variable 2 (V2)]</span> + de las <span class='part-poblacion'>[Población]</span> + en el <span class='part-espacio'>[Espacio]</span>, <span class='part-tiempo'>[Tiempo]</span>",
            text: "<span class='part-verbo'>Determinar</span> la <span class='part-v1'>adopción de sistemas digitales</span> <span class='part-nexo'>y su relación con</span> el <span class='part-v2'>desempeño comercial</span> de las <span class='part-poblacion'>microempresas del sector comercio</span> en el <span class='part-espacio'>distrito de Bellavista, Callao</span>, <span class='part-tiempo'>2026</span>"
        },
        pe1: {
            label: "Objetivo Específico 1 (OE1)",
            btnV1Label: "Dimensión V1 (D1)",
            btnV2Label: "Dimensión V2 (D1)",
            formula: "<span class='part-verbo'>[Verbo Específico]</span> + la relación de los <span class='part-v1'>[Dimensión 1 (V1-D1)]</span> + <span class='part-nexo'>[Nexo Relacional]</span> + el <span class='part-v2'>[Dimensión 1 (V2-D1)]</span> + de las <span class='part-poblacion'>[Población]</span> + en el <span class='part-espacio'>[Espacio]</span>, <span class='part-tiempo'>[Tiempo]</span>",
            text: "<span class='part-verbo'>Identificar</span> la relación de los <span class='part-v1'>medios de pago electrónicos</span> <span class='part-nexo'>con</span> el <span class='part-v2'>flujo de ingresos monetarios</span> de las <span class='part-poblacion'>microempresas del sector comercio</span> en el <span class='part-espacio'>distrito de Bellavista, Callao</span>, <span class='part-tiempo'>2026</span>"
        },
        pe2: {
            label: "Objetivo Específico 2 (OE2)",
            btnV1Label: "Dimensión V1 (D2)",
            btnV2Label: "Dimensión V2 (D1)",
            formula: "<span class='part-verbo'>[Verbo Específico]</span> + la relación de los <span class='part-v1'>[Dimensión 2 (V1-D2)]</span> + <span class='part-nexo'>[Nexo Relacional]</span> + el <span class='part-v2'>[Dimensión 1 (V2-D1)]</span> + de las <span class='part-poblacion'>[Población]</span> + en el <span class='part-espacio'>[Espacio]</span>, <span class='part-tiempo'>[Tiempo]</span>",
            text: "<span class='part-verbo'>Establecer</span> la relación de los <span class='part-v1'>canales de venta y atención digital</span> <span class='part-nexo'>con</span> el <span class='part-v2'>flujo de ingresos monetarios</span> de las <span class='part-poblacion'>microempresas del sector comercio</span> en el <span class='part-espacio'>distrito de Bellavista, Callao</span>, <span class='part-tiempo'>2026</span>"
        },
        pe3: {
            label: "Objetivo Específico 3 (OE3)",
            btnV1Label: "Dimensión V1 (D3)",
            btnV2Label: "Dimensión V2 (D2)",
            formula: "<span class='part-verbo'>[Verbo Específico]</span> + la relación de la <span class='part-v1'>[Dimensión 3 (V1-D3)]</span> + <span class='part-nexo'>[Nexo Relacional]</span> + la <span class='part-v2'>[Dimensión 2 (V2-D2)]</span> + de las <span class='part-poblacion'>[Población]</span> + en el <span class='part-espacio'>[Espacio]</span>, <span class='part-tiempo'>[Tiempo]</span>",
            text: "<span class='part-verbo'>Analizar</span> la relación de la <span class='part-v1'>visibilidad y geolocalización local</span> <span class='part-nexo'>con</span> la <span class='part-v2'>eficiencia operativa</span> de las <span class='part-poblacion'>microempresas del sector comercio</span> en el <span class='part-espacio'>distrito de Bellavista, Callao</span>, <span class='part-tiempo'>2026</span>"
        }
    },
    hipotesis: {
        general: {
            label: "Hipótesis General (HG)",
            btnV1Label: "Variable 1 (V1)",
            btnV2Label: "Variable 2 (V2)",
            formula: "Existe <span class='part-nexo'>[Nexo Afirmativo]</span> entre la <span class='part-v1'>[Variable 1 (V1)]</span> y el <span class='part-v2'>[Variable 2 (V2)]</span> de las <span class='part-poblacion'>[Población]</span> en el <span class='part-espacio'>[Espacio]</span>, <span class='part-tiempo'>[Tiempo]</span>",
            text: "Existe <span class='part-nexo'>relación directa y significativa</span> entre la <span class='part-v1'>adopción de sistemas digitales</span> y el <span class='part-v2'>desempeño comercial</span> de las <span class='part-poblacion'>microempresas del sector comercio</span> en el <span class='part-espacio'>distrito de Bellavista, Callao</span>, <span class='part-tiempo'>2026</span>"
        },
        pe1: {
            label: "Hipótesis Específica 1 (HE1)",
            btnV1Label: "Dimensión V1 (D1)",
            btnV2Label: "Dimensión V2 (D1)",
            formula: "Existe <span class='part-nexo'>[Nexo Afirmativo]</span> entre los <span class='part-v1'>[Dimensión 1 (V1-D1)]</span> y el <span class='part-v2'>[Dimensión 1 (V2-D1)]</span> de las <span class='part-poblacion'>[Población]</span> en el <span class='part-espacio'>[Espacio]</span>, <span class='part-tiempo'>[Tiempo]</span>",
            text: "Existe <span class='part-nexo'>relación directa y significativa</span> entre los <span class='part-v1'>medios de pago electrónicos</span> y el <span class='part-v2'>flujo de ingresos monetarios</span> de las <span class='part-poblacion'>microempresas del sector comercio</span> en el <span class='part-espacio'>distrito de Bellavista, Callao</span>, <span class='part-tiempo'>2026</span>"
        },
        pe2: {
            label: "Hipótesis Específica 2 (HE2)",
            btnV1Label: "Dimensión V1 (D2)",
            btnV2Label: "Dimensión V2 (D1)",
            formula: "Existe <span class='part-nexo'>[Nexo Afirmativo]</span> entre los <span class='part-v1'>[Dimensión 2 (V1-D2)]</span> y el <span class='part-v2'>[Dimensión 1 (V2-D1)]</span> de las <span class='part-poblacion'>[Población]</span> en el <span class='part-espacio'>[Espacio]</span>, <span class='part-tiempo'>[Tiempo]</span>",
            text: "Existe <span class='part-nexo'>relación directa y significativa</span> entre los <span class='part-v1'>canales de venta y atención digital</span> y el <span class='part-v2'>flujo de ingresos monetarios</span> de las <span class='part-poblacion'>microempresas del sector comercio</span> en el <span class='part-espacio'>distrito de Bellavista, Callao</span>, <span class='part-tiempo'>2026</span>"
        },
        pe3: {
            label: "Hipótesis Específica 3 (HE3)",
            btnV1Label: "Dimensión V1 (D3)",
            btnV2Label: "Dimensión V2 (D2)",
            formula: "Existe <span class='part-nexo'>[Nexo Afirmativo]</span> entre la <span class='part-v1'>[Dimensión 3 (V1-D3)]</span> y la <span class='part-v2'>[Dimensión 2 (V2-D2)]</span> de las <span class='part-poblacion'>[Población]</span> en el <span class='part-espacio'>[Espacio]</span>, <span class='part-tiempo'>[Tiempo]</span>",
            text: "Existe <span class='part-nexo'>relación directa y significativa</span> entre la <span class='part-v1'>visibilidad y geolocalización local</span> y la <span class='part-v2'>eficiencia operativa</span> de las <span class='part-poblacion'>microempresas del sector comercio</span> en el <span class='part-espacio'>distrito de Bellavista, Callao</span>, <span class='part-tiempo'>2026</span>"
        }
    }
};

let currentParserCategory = 'problema';
let currentParserScope = 'general';
let activeHighlights = { verbo: false, v1: false, nexo: false, v2: false, poblacion: false, espacio: false, tiempo: false };

function switchParserCategory(category) {
    currentParserCategory = category;
    
    // Activar botón de tab correspondiente
    document.querySelectorAll('.parser-cat-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-cat-${category}`).classList.add('active');
    
    updateParserDisplay();
}

function switchParserScope(scope) {
    currentParserScope = scope;
    
    // Activar botón de selector correspondiente
    document.querySelectorAll('.parser-select-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-scope-${scope}`).classList.add('active');
    
    updateParserDisplay();
}

function updateParserDisplay() {
    const data = parserData[currentParserCategory][currentParserScope];
    
    document.getElementById('parser-type-label').innerText = data.label;
    document.getElementById('parser-formula-text').innerHTML = data.formula;
    document.getElementById('parser-output-text').innerHTML = data.text;
    
    // Actualizar dinámicamente el botón de Verbo / Pregunta según la categoría
    const btnVerbo = document.querySelector('.btn-verbo');
    if (btnVerbo) {
        if (currentParserCategory === 'hipotesis') {
            btnVerbo.style.display = 'none';
            activeHighlights.verbo = false;
            btnVerbo.classList.remove('active');
        } else {
            btnVerbo.style.display = 'inline-block';
            if (currentParserCategory === 'problema') {
                btnVerbo.innerText = "Pregunta Clave";
            } else if (currentParserCategory === 'objetivo') {
                btnVerbo.innerText = "Verbo Infinitivo";
            }
        }
    }

    // Actualizar dinámicamente las etiquetas de los botones de leyenda de variables
    const btnV1 = document.querySelector('.btn-v1');
    const btnV2 = document.querySelector('.btn-v2');
    if (btnV1) btnV1.innerText = data.btnV1Label;
    if (btnV2) btnV2.innerText = data.btnV2Label;
    
    applyActiveHighlights();
}

function toggleHighlight(type) {
    activeHighlights[type] = !activeHighlights[type];
    
    // Alternar estado visual del botón de la leyenda
    const btn = document.querySelector(`.btn-${type}`);
    if (btn) {
        if (activeHighlights[type]) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    }

    applyActiveHighlights();
}

function applyActiveHighlights() {
    Object.keys(activeHighlights).forEach(type => {
        // Resaltar en la Fórmula
        const formulaElements = document.querySelectorAll(`#parser-formula-text span.part-${type}`);
        formulaElements.forEach(el => {
            if (activeHighlights[type]) {
                el.className = `part-${type} active-tag-${type}`;
            } else {
                el.className = `part-${type}`;
            }
        });
        
        // Resaltar en el Texto Real
        const textElements = document.querySelectorAll(`#parser-output-text span.part-${type}`);
        textElements.forEach(el => {
            if (activeHighlights[type]) {
                el.className = `part-${type} active-tag-${type}`;
            } else {
                el.className = `part-${type}`;
            }
        });
    });
}

// Inicializar el parser en el primer renderizado
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById('parser-formula-text')) {
        updateParserDisplay();
    }
});

/* --- TABS DE CUESTIONARIO --- */
function switchSurveyTab(tabId) {
    document.querySelectorAll('.survey-tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    document.querySelectorAll('.survey-block').forEach(block => block.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
}

function selectRadio(labelEl) {
    const container = labelEl.parentElement;
    // Remover clase selected de todos los labels hermanos
    container.querySelectorAll('.option-label').forEach(lbl => lbl.classList.remove('selected'));
    // Añadir clase al seleccionado
    labelEl.classList.add('selected');
    // Checkear el radio input interno
    labelEl.querySelector('input[type="radio"]').checked = true;
}

/* --- TABS DE ANTECEDENTES --- */
function switchAntTab(btnEl, paneId) {
    const card = btnEl.closest('.antecedent-card');
    
    // Remover active de botones en esta card
    card.querySelectorAll('.ant-tab-btn').forEach(btn => btn.classList.remove('active'));
    btnEl.classList.add('active');

    // Remover active de paneles en esta card
    card.querySelectorAll('.ant-tab-pane').forEach(pane => pane.classList.remove('active'));
    card.querySelector(`#${paneId}`).classList.add('active');
}

/* --- MÉTODO DEL EMBUDO (REALIDAD PROBLEMÁTICA) --- */
const funnelData = {
    macro: {
        title: "Nivel Macro: La Revolución Digital en el Comercio Minorista Global",
        desc: "A nivel internacional, la adopción de tecnologías digitales (medios de pago rápidos, canales de e-commerce y mapas de geolocalización) ha redefinido la competitividad del comercio. Las microempresas que no se adaptan digitalmente quedan aisladas frente a los nuevos hábitos de consumo y la competencia corporativa."
    },
    meso: {
        title: "Nivel Meso: Situación y Brecha Digital en el Perú",
        desc: "En el Perú, a pesar de la rápida masificación de billeteras digitales (Yape, Plin), persiste una brecha estructural de digitalización comercial. La mayoría de microempresas aún carece de canales integrados de atención, no están geolocalizadas formalmente y gestionan sus ingresos de forma tradicional con dinero físico, limitando su escala."
    },
    micro: {
        title: "Nivel Micro: Microempresas del Sector Comercio en Bellavista, Callao",
        desc: "En Bellavista, Callao, las microempresas minoristas (bodegas, tiendas locales) afrontan problemas cotidianos de ineficiencia por cuadres manuales, inseguridad ciudadana al manejar efectivo, y nula visibilidad web. Esto reduce directamente su flujo de ingresos y frena su crecimiento ante competidores tecnificados."
    }
};

function selectFunnelLevel(level) {
    // Quitar active de todos los niveles
    document.querySelectorAll('.funnel-level').forEach(el => el.classList.remove('active'));
    // Agregar active al seleccionado
    document.querySelector(`.level-${level}`).classList.add('active');
    
    // Transición suave del detalle
    const detailBox = document.getElementById('funnel-detail');
    detailBox.style.opacity = '0';
    
    setTimeout(() => {
        document.getElementById('funnel-detail-title').innerText = funnelData[level].title;
        document.getElementById('funnel-detail-desc').innerText = funnelData[level].desc;
        detailBox.style.opacity = '1';
    }, 150);
}

// Inicializar seleccionando el nivel macro por defecto
document.addEventListener("DOMContentLoaded", () => {
    // Si existe el embudo en la página actual, autoseleccionar macro
    if (document.querySelector('.funnel-level')) {
        setTimeout(() => selectFunnelLevel('macro'), 200);
    }
});

/* --- CONTROLES DE ZOOM DEL MAPA --- */
function changeMapZoom(amount) {
    mapZoomLevel = Math.max(0.3, Math.min(1.5, mapZoomLevel + amount));
    const zoomArea = document.getElementById('map-zoom-area');
    const indicator = document.getElementById('zoom-value');
    if (zoomArea) {
        zoomArea.style.transform = `scale(${mapZoomLevel})`;
        if (indicator) {
            indicator.innerText = `${Math.round(mapZoomLevel * 100)}%`;
        }
        // Volver a dibujar conexiones
        setTimeout(drawConnections, 100);
    }
}

function resetMapZoom() {
    mapZoomLevel = 1.0;
    const zoomArea = document.getElementById('map-zoom-area');
    const indicator = document.getElementById('zoom-value');
    if (zoomArea) {
        zoomArea.style.transform = `scale(${mapZoomLevel})`;
        if (indicator) {
            indicator.innerText = '100%';
        }
        setTimeout(drawConnections, 100);
    }
}


