/**
 * Módulo para generar PDF de órdenes de servicio
 * Basado en el sistema de generación de presupuestos
 * Captura todos los datos del formulario y genera un PDF profesional
 */

// Función auxiliar para capitalizar texto
function capitalize(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

// Función para verificar salto de página
function checkPageOverflow(doc, y, marginBottom = 20) {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y >= pageHeight - marginBottom) {
    doc.addPage();
    return 20; // Reiniciar posición Y con margen superior
  }
  return y;
}

// Renderiza la segunda página de términos y condiciones.
function renderTerminosCondicionesPage(doc) {
  const marginTop = 14;
  const marginBottom = 12;
  const marginLeft = 10;
  const marginRight = 10;
  const columnGap = 6;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - marginLeft - marginRight;
  const columnWidth = (contentWidth - columnGap) / 2;
  const maxY = pageHeight - marginBottom;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const titleLines = doc.splitTextToSize('TÉRMINOS Y CONDICIONES DE SERVICIO – PALMATRÓNICA', contentWidth);
  let titleY = marginTop;
  titleLines.forEach((line) => {
    doc.text(line, marginLeft, titleY);
    titleY += 4;
  });

  const columnStartY = titleY + 2;
  let currentColumn = 0;
  let y = columnStartY;

  const columnX = () => marginLeft + (currentColumn * (columnWidth + columnGap));

  const moveToNextColumn = () => {
    if (currentColumn === 0) {
      currentColumn = 1;
      y = columnStartY;
      return true;
    }
    return false;
  };

  const ensureSpace = (requiredHeight) => {
    if (y + requiredHeight <= maxY) {
      return true;
    }
    return moveToNextColumn();
  };

  const printWrappedText = (text, options = {}) => {
    const {
      indent = 0,
      font = 'normal',
      fontSize = 6.6,
      color = [30, 30, 30],
      lineHeight = 2.95,
      spacingAfter = 1.2
    } = options;

    doc.setFontSize(fontSize);
    doc.setFont('helvetica', font);
    doc.setTextColor(...color);

    const availableWidth = columnWidth - indent;
    const lines = doc.splitTextToSize(text, availableWidth);

    lines.forEach((line) => {
      if (!ensureSpace(lineHeight + 0.5)) {
        return;
      }
      doc.text(line, columnX() + indent, y);
      y += lineHeight;
    });

    if (!ensureSpace(spacingAfter)) {
      return;
    }
    y += spacingAfter;
  };

  const secciones = [
    {
      titulo: '1. ESTADO DEL EQUIPO AL INGRESO',
      parrafos: [
        'Equipos Apagados: Si el equipo se recibe apagado, sin imagen, sin táctil o con bloqueo de software que impida el acceso, no es posible verificar el estado previo de componentes (cámaras, micrófonos, sensores, señal, etc.). En estos casos, PALMATRÓNICA no se hace responsable por fallas adicionales detectadas tras el encendido.',
        'Declaración del Cliente: El cliente debe informar sobre daños conocidos. Cualquier falla no declarada que se evidencie durante el proceso técnico será responsabilidad del estado previo del equipo.'
      ]
    },
    {
      titulo: '2. EQUIPOS PREVIAMENTE INTERVENIDOS',
      parrafos: [
        'PALMATRÓNICA no se responsabiliza por daños derivados de reparaciones anteriores realizadas por terceros. Equipos que presenten sellos rotos, falta de tornillería interna o puentes de soldadura previos pueden presentar fallas críticas durante la apertura o manipulación.'
      ]
    },
    {
      titulo: '3. PROCEDIMIENTOS DE ALTO RIESGO',
      parrafos: [
        'En trabajos de microelectrónica, reparación de Board o cambio de visor (glass), el cliente acepta el riesgo de que el equipo no sea reparable o presente fallas en otros componentes debido a la exposición al calor o la fragilidad del circuito. Estos procesos se ejecutan bajo autorización expresa.'
      ]
    },
    {
      titulo: '4. REPUESTOS Y COMPATIBILIDAD',
      parrafos: [
        'Se instalarán repuestos originales, compatibles o genéricos según el acuerdo previo.',
        'Advertencia Apple/iPhone: El cliente acepta que, tras el cambio de piezas en dispositivos iPhone (baterías, pantallas, Face ID), el sistema puede mostrar mensajes de "Pieza desconocida" o limitar funciones de salud de batería, incluso con repuestos de alta calidad, debido a las restricciones del fabricante.'
      ]
    },
    {
      titulo: '5. GARANTÍA DEL SERVICIO',
      parrafos: [
        'La garantía es de 90 días y cubre exclusivamente la mano de obra y el repuesto instalado. La garantía en pantallas solo cubre para repuestos originales. Las pantallas que no son originales tienen garantía de 7 días y aplica solo para el táctil.',
        'Nulidad de Garantía: Se anula automáticamente por:'
      ],
      subitems: [
        'Ruptura o manipulación de los sellos de seguridad de PALMATRÓNICA.',
        'Daños por humedad, golpes, sobrecargas eléctricas o mal uso.',
        'Intervención técnica ajena a este centro posterior a la entrega.',
        'Instalación de software no oficial o modificaciones de firmware.'
      ]
    },
    {
      titulo: '6. EQUIPOS CON DAÑO POR LÍQUIDO',
      parrafos: [
        'Debido a la naturaleza progresiva de la corrosión y la sulfatación, los equipos mojados no cuentan con garantía. El servicio se enfoca en el intento de recuperación de encendido o información, pero no se garantiza la estabilidad del equipo a largo plazo.'
      ]
    },
    {
      titulo: '7. RESPONSABILIDAD DE DATOS E INFORMACIÓN',
      parrafos: [
        'Es responsabilidad exclusiva del cliente realizar copias de seguridad (backup). PALMATRÓNICA no se hace responsable por la pérdida de datos, fotos o archivos durante procesos de reparación o actualización.'
      ]
    },
    {
      titulo: '8. SOFTWARE Y BLOQUEOS DE SEGURIDAD',
      parrafos: [
        'No se realizan desbloqueos de cuentas Google (FRP), Samsung Account y iCloud.',
        'El centro no garantiza la permanencia de servicios de liberación o modificaciones de software si el usuario decide actualizar el sistema operativo posteriormente.'
      ]
    },
    {
      titulo: '9. TIEMPOS Y COSTOS DE REVISIÓN',
      parrafos: [
        'Tiempos: Son estimados. Las reparaciones de microelectrónica tienen un tiempo mínimo de 30 días hábiles.',
        'Diagnóstico: El diagnóstico básico para Android es gratuito. Diagnósticos que requieran desensamble avanzado o micro-mediciones en placa para otros dispositivos tendrán un costo de revisión que será informado previamente.'
      ]
    },
    {
      titulo: '10. VALIDEZ DE LA COTIZACIÓN',
      parrafos: [
        'Los presupuestos entregados tienen una validez de 3 días hábiles. Pasado este tiempo, el costo puede variar según la disponibilidad y fluctuación de precio de los repuestos.'
      ]
    },
    {
      titulo: '11. EQUIPOS NO RECLAMADOS (ABANDONO)',
      parrafos: [
        'Equipos no retirados después de 60 días de la notificación de finalización generarán costos de almacenamiento.',
        'Cláusula de Abandono: Cumplidos 90 días calendario, el equipo se considerará legalmente abandonado. PALMATRÓNICA podrá disponer del mismo para recuperar costos de repuestos, insumos y almacenamiento, sin lugar a indemnizaciones.'
      ]
    },
    {
      titulo: '12. ACCESORIOS Y PERIFÉRICOS',
      parrafos: [
        'El cliente debe retirar tarjetas SIM, memorias SD, fundas y cargadores (a menos que el técnico los solicite). No nos hacemos responsables por la pérdida de accesorios no registrados en la orden de ingreso.'
      ]
    },
    {
      titulo: '13. CONFORMIDAD Y TRATAMIENTO DE DATOS',
      parrafos: [
        'Al retirar el equipo, el cliente firma su conformidad tras verificar el funcionamiento.',
        'El cliente autoriza el tratamiento de sus datos de contacto exclusivamente para fines de seguimiento del servicio y facturación.'
      ]
    }
  ];

  secciones.forEach((seccion) => {
    const headingHeight = 3.6;
    if (!ensureSpace(headingHeight + 1)) {
      return;
    }

    doc.setFontSize(7.1);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    const headingLines = doc.splitTextToSize(seccion.titulo, columnWidth);
    headingLines.forEach((line) => {
      if (!ensureSpace(headingHeight)) {
        return;
      }
      doc.text(line, columnX(), y);
      y += headingHeight;
    });
    y += 0.6;

    seccion.parrafos.forEach((parrafo) => {
      printWrappedText(parrafo);
    });

    if (Array.isArray(seccion.subitems) && seccion.subitems.length > 0) {
      seccion.subitems.forEach((subitem) => {
        printWrappedText(`- ${subitem}`, { indent: 2.5, spacingAfter: 1 });
      });
    }

    y += 0.8;
  });
}

// Función para obtener todos los datos del formulario
function obtenerDatosOrden() {
  const form = document.getElementById('order-form');
  if (!form) {
    console.error('Formulario no encontrado');
    return null;
  }

  // Obtener tipo de dispositivo
  const tipoInput = form.querySelector('input[name="tipo"]');
  const tipo = tipoInput ? tipoInput.value : 'desconocido';
  const esCelular = tipo === 'celular';
  
  // Datos del cliente
  const cliente = {
    cc: document.getElementById('id_usuario')?.value || 'N/A',
    nombre: document.getElementById('nombre')?.value || 'N/A',
    apellido: document.getElementById('apellido')?.value || 'N/A',
    direccion: document.getElementById('direccion')?.value || 'N/A',
    correo: document.getElementById('correo')?.value || 'N/A',
    telefono: document.getElementById('telefono')?.value || 'N/A'
  };

  // Información del dispositivo
  const dispositivo = {
    marca: document.getElementById('marca')?.value || 'N/A',
    modelo: document.getElementById('modelo')?.value || 'N/A'
  };

  // IMEI para celulares o serial para computadores
  if (esCelular) {
    dispositivo.imei = document.getElementById('imei')?.value || 'N/A';
  } else {
    dispositivo.serial = document.getElementById('serial')?.value || 'N/A';
  }

  // Capturar checklist (todos los radios seleccionados)
  const checklist = [];
  const radioGroups = new Set();
  
  form.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
    const name = radio.name;
    // Saltar si ya procesamos este grupo (solo debe haber uno checked por grupo)
    if (radioGroups.has(name)) return;
    radioGroups.add(name);
    
    const value = radio.value;
    const label = radio.closest('.field')?.querySelector('label:not(.choice)')?.textContent?.trim() || name;
    
    checklist.push({
      item: label,
      estado: value
    });
  });

  // Descripción
  const descripcion = document.getElementById('descripcion')?.value || 'Sin descripción adicional';

  // Fecha actual
  const fecha = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return {
    tipo,
    esCelular,
    cliente,
    dispositivo,
    checklist,
    descripcion,
    fecha
  };
}

// Función principal para generar el PDF
async function generarPDFOrden(orderId) {
  try {
    // Validar que jsPDF esté disponible
    if (typeof window.jspdf === 'undefined') {
      console.error('jsPDF no está cargado');
      alert('Error: La librería de generación de PDF no está disponible.');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const marginTop = 20;
    const marginBottom = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Obtener datos del formulario
    const datos = obtenerDatosOrden();
    if (!datos) {
      alert('No se pudieron obtener los datos del formulario');
      return;
    }

    let y = marginTop;

    // ===== ENCABEZADO =====
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    const titulo = `Orden de Servicio - ${datos.esCelular ? 'Celular' : 'Computador'}`;
    const tituloWidth = doc.getTextWidth(titulo);
    const tituloX = (pageWidth - tituloWidth) / 2;
    doc.text(titulo, tituloX, y);
    
    // Línea decorativa bajo el título
    doc.setLineWidth(0.5);
    doc.setDrawColor(6, 182, 212); // Color turquesa
    doc.line(10, y + 3, pageWidth - 10, y + 3);
    y += 12;

    // Fecha y número de orden
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    if (orderId) {
      doc.text(`Orden: #${orderId}`, 10, y);
    }
    doc.text(`Fecha: ${datos.fecha}`, pageWidth - 60, y);
    y += 10;

    // ===== DATOS DEL CLIENTE =====
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("DATOS DEL CLIENTE", 10, y);
    y += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    const clienteFields = [
      { label: 'CC', value: datos.cliente.cc },
      { label: 'Nombre completo', value: `${datos.cliente.nombre} ${datos.cliente.apellido}` },
      { label: 'Dirección', value: datos.cliente.direccion },
      { label: 'Correo', value: datos.cliente.correo },
      { label: 'Teléfono', value: datos.cliente.telefono }
    ];

    clienteFields.forEach(field => {
      doc.setFont("helvetica", "bold");
      doc.text(`${field.label}:`, 15, y);
      doc.setFont("helvetica", "normal");
      doc.text(field.value, 55, y);
      y += 5;
    });

    y += 5;

    // ===== INFORMACIÓN DEL DISPOSITIVO =====
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("INFORMACIÓN DEL DISPOSITIVO", 10, y);
    y += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    // Presentación en cuadrícula 2x2 para armonía visual
    const dispositivoFields = [];
    dispositivoFields.push({ label: 'Marca', value: datos.dispositivo.marca });
    dispositivoFields.push({ label: 'Modelo', value: datos.dispositivo.modelo });
    dispositivoFields.push(datos.esCelular 
      ? { label: 'IMEI', value: datos.dispositivo.imei } 
      : { label: 'Número de serie', value: datos.dispositivo.serial }
    );
    dispositivoFields.push({ label: 'Tipo', value: datos.esCelular ? 'Celular' : 'Consola' });

    const startYDevice = y;
    const colWidth = (pageWidth - 30) / 2; // margen 15 a cada lado
    const labelWidth = 35; // ancho reservado para etiqueta
    for (let i = 0; i < dispositivoFields.length; i++) {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const x = 15 + col * colWidth;
      const yPos = startYDevice + row * 6;
      const f = dispositivoFields[i];
      doc.setFont("helvetica", "bold");
      doc.text(`${f.label}:`, x, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(String(f.value || 'N/A'), x + labelWidth, yPos);
    }
    y = startYDevice + Math.ceil(dispositivoFields.length / 2) * 6 + 7;

    // ===== CHECKLIST =====
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("CHECKLIST DE REVISIÓN", 10, y);
    y += 7;

    // Cabecera del checklist
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text("Componente", 15, y);
    doc.text("Estado", pageWidth - 40, y);
    y += 2;
    
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(15, y, pageWidth - 15, y);
    y += 5;

    // Items del checklist en dos columnas
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    
    const columnWidth = (pageWidth - 30) / 2;
    let currentColumn = 0;
    let columnY = y;

    datos.checklist.forEach((item, index) => {
      y = checkPageOverflow(doc, columnY, marginBottom);
      if (y === 20) columnY = y; // Página nueva

      const xPos = 15 + (currentColumn * columnWidth);
      
      // Nombre del componente
      doc.text(capitalize(item.item), xPos, columnY);
      
      // Estado con color
      const estadoX = xPos + columnWidth - 25;
      if (item.estado === 'si') {
        doc.setTextColor(34, 197, 94); // Verde
        doc.text('✓ Sí', estadoX, columnY);
      } else {
        doc.setTextColor(239, 68, 68); // Rojo
        doc.text('✗ No', estadoX, columnY);
      }
      doc.setTextColor(0, 0, 0);

      currentColumn++;
      if (currentColumn === 2) {
        currentColumn = 0;
        columnY += 5;
      }
    });

    // Ajustar Y después del checklist
    if (currentColumn === 1) columnY += 5;
    y = columnY + 5;

    // ===== DESCRIPCIÓN =====
    y = checkPageOverflow(doc, y, marginBottom);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("DESCRIPCIÓN DEL PROBLEMA", 10, y);
    y += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    // Dividir descripción en líneas que quepan en el ancho disponible
    const descripcionLines = doc.splitTextToSize(datos.descripcion, pageWidth - 30);
    descripcionLines.forEach(line => {
      y = checkPageOverflow(doc, y, marginBottom);
      doc.text(line, 15, y);
      y += 5;
    });

    y += 10;

    // Página 2: términos y condiciones extendidos
    doc.addPage();
    renderTerminosCondicionesPage(doc);

    const nombreArchivo = `orden_servicio_${datos.cliente.cc}_${Date.now()}.pdf`;
    doc.save(nombreArchivo);

    console.log('PDF generado exitosamente:', nombreArchivo);
    return true;

  } catch (error) {
    console.error('Error al generar PDF:', error);
    alert('Ocurrió un error al generar el PDF. Por favor, revisa la consola para más detalles.');
    return false;
  }
}

// Función para abrir el PDF en una nueva pestaña (vista previa)
async function previsualizarPDFOrden(orderId) {
  try {
    // Validar que jsPDF esté disponible
    if (typeof window.jspdf === 'undefined') {
      console.error('jsPDF no está cargado');
      alert('Error: La librería de generación de PDF no está disponible.');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const marginTop = 20;
    const marginBottom = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Obtener datos del formulario
    const datos = obtenerDatosOrden();
    if (!datos) {
      alert('No se pudieron obtener los datos del formulario');
      return;
    }

    let y = marginTop;

    // ===== ENCABEZADO =====
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    const titulo = `Orden de Servicio - ${datos.esCelular ? 'Celular' : 'Computador'}`;
    const tituloWidth = doc.getTextWidth(titulo);
    const tituloX = (pageWidth - tituloWidth) / 2;
    doc.text(titulo, tituloX, y);
    
    // Línea decorativa bajo el título
    doc.setLineWidth(0.5);
    doc.setDrawColor(6, 182, 212); // Color turquesa
    doc.line(10, y + 3, pageWidth - 10, y + 3);
    y += 12;

    // Fecha y número de orden (si está disponible)
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    if (orderId) {
      doc.text(`Orden: #${orderId}`, 10, y);
    }
    doc.text(`Fecha: ${datos.fecha}`, pageWidth - 60, y);
    y += 10;

    // ===== DATOS DEL CLIENTE =====
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("DATOS DEL CLIENTE", 10, y);
    y += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    const clienteFields = [
      { label: 'CC', value: datos.cliente.cc },
      { label: 'Nombre completo', value: `${datos.cliente.nombre} ${datos.cliente.apellido}` },
      { label: 'Dirección', value: datos.cliente.direccion },
      { label: 'Correo', value: datos.cliente.correo },
      { label: 'Teléfono', value: datos.cliente.telefono }
    ];

    clienteFields.forEach(field => {
      doc.setFont("helvetica", "bold");
      doc.text(`${field.label}:`, 15, y);
      doc.setFont("helvetica", "normal");
      doc.text(field.value, 55, y);
      y += 5;
    });

    y += 5;

    // ===== INFORMACIÓN DEL DISPOSITIVO =====
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("INFORMACIÓN DEL DISPOSITIVO", 10, y);
    y += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    // Presentación en cuadrícula 2x2 para armonía visual
    const dispositivoFields = [];
    dispositivoFields.push({ label: 'Marca', value: datos.dispositivo.marca });
    dispositivoFields.push({ label: 'Modelo', value: datos.dispositivo.modelo });
    dispositivoFields.push(datos.esCelular 
      ? { label: 'IMEI', value: datos.dispositivo.imei } 
      : { label: 'Número de serie', value: datos.dispositivo.serial }
    );
    dispositivoFields.push({ label: 'Tipo', value: datos.esCelular ? 'Celular' : 'Consola' });

    const startYDevice = y;
    const colWidth = (pageWidth - 30) / 2; // margen 15 a cada lado
    const labelWidth = 35; // ancho reservado para etiqueta
    for (let i = 0; i < dispositivoFields.length; i++) {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const x = 15 + col * colWidth;
      const yPos = startYDevice + row * 6;
      const f = dispositivoFields[i];
      doc.setFont("helvetica", "bold");
      doc.text(`${f.label}:`, x, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(String(f.value || 'N/A'), x + labelWidth, yPos);
    }
    y = startYDevice + Math.ceil(dispositivoFields.length / 2) * 6 + 7;

    // ===== CHECKLIST =====
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("CHECKLIST DE REVISIÓN", 10, y);
    y += 7;

    // Cabecera del checklist
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text("Componente", 15, y);
    doc.text("Estado", pageWidth - 40, y);
    y += 2;
    
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(15, y, pageWidth - 15, y);
    y += 5;

    // Items del checklist en dos columnas
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    
    const columnWidth = (pageWidth - 30) / 2;
    let currentColumn = 0;
    let columnY = y;

    datos.checklist.forEach((item, index) => {
      y = checkPageOverflow(doc, columnY, marginBottom);
      if (y === 20) columnY = y; // Página nueva

      const xPos = 15 + (currentColumn * columnWidth);
      
      // Nombre del componente
      doc.text(capitalize(item.item), xPos, columnY);
      
      // Estado con color
      const estadoX = xPos + columnWidth - 25;
      if (item.estado === 'si') {
        doc.setTextColor(34, 197, 94); // Verde
        doc.text('✓ Sí', estadoX, columnY);
      } else {
        doc.setTextColor(239, 68, 68); // Rojo
        doc.text('✗ No', estadoX, columnY);
      }
      doc.setTextColor(0, 0, 0);

      currentColumn++;
      if (currentColumn === 2) {
        currentColumn = 0;
        columnY += 5;
      }
    });

    // Ajustar Y después del checklist
    if (currentColumn === 1) columnY += 5;
    y = columnY + 5;

    // ===== DESCRIPCIÓN =====
    y = checkPageOverflow(doc, y, marginBottom);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("DESCRIPCIÓN DEL PROBLEMA", 10, y);
    y += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    // Dividir descripción en líneas que quepan en el ancho disponible
    const descripcionLines = doc.splitTextToSize(datos.descripcion, pageWidth - 30);
    descripcionLines.forEach(line => {
      y = checkPageOverflow(doc, y, marginBottom);
      doc.text(line, 15, y);
      y += 5;
    });

    y += 10;

    // Página 2: términos y condiciones extendidos
    doc.addPage();
    renderTerminosCondicionesPage(doc);

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');

    console.log('PDF abierto en nueva pestaña');
    return true;

  } catch (error) {
    console.error('Error al generar PDF:', error);
    alert('Ocurrió un error al generar el PDF. Por favor, revisa la consola para más detalles.');
    return false;
  }
}

// Exponer funciones globalmente para uso en otros scripts
window.generarPDFOrden = generarPDFOrden;
window.previsualizarPDFOrden = previsualizarPDFOrden;
