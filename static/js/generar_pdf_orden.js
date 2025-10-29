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
  const radioGroups = {};
  
  form.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
    const name = radio.name;
    const value = radio.value;
    const label = radio.closest('.field')?.querySelector('label')?.textContent?.trim() || name;
    
    if (!radioGroups[name]) {
      radioGroups[name] = { label, value };
    }
  });

  for (const [name, data] of Object.entries(radioGroups)) {
    checklist.push({
      item: data.label,
      estado: data.value
    });
  }

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

    y = checkPageOverflow(doc, y, marginBottom);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("TÉRMINOS Y CONDICIONES", 10, y);
    y += 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    
    const terminos = [
      "Si el equipo llega apagado o la pantalla sin imagen, no es posible verificar el estado de componentes como cámara, micrófono, señal u otros. Por tanto, PALMATRÓNICA no se hace responsable por fallas adicionales no detectadas al momento del ingreso.",
      "El cliente declara haber informado los daños visibles o conocidos del equipo. Cualquier falla adicional que se evidencie durante o después del proceso de reparación no será responsabilidad del centro de reparación.",
      "En procedimientos de alto riesgo (como cambio de visor, microelectrónica, o reparación de placa base), el cliente acepta que existe la posibilidad de que la reparación no sea exitosa o que el dispositivo presente daños adicionales debido a la condición previa del equipo. Estos casos se realizan únicamente con autorización expresa del cliente.",
      "Las piezas reemplazadas pueden ser originales, genéricas o reacondicionadas según disponibilidad y presupuesto acordado con el cliente. La garantía aplica únicamente sobre el repuesto nuevo y por defectos de fábrica, no por daños ocasionados por mal uso o golpes posteriores.",
      "La garantía no cubre daños por caídas, humedad, manipulación de terceros, sobrecarga eléctrica o instalación de software no autorizado."
    ];

    // Hacer líneas más largas para ocupar menos espacio vertical
    terminos.forEach(termino => {
      y = checkPageOverflow(doc, y, marginBottom);
      const terminoLines = doc.splitTextToSize(termino, pageWidth - 20); // margen lateral más pequeño
      terminoLines.forEach((line, idx) => {
        y = checkPageOverflow(doc, y, marginBottom);
        const bullet = idx === 0 ? '• ' : '  ';
        doc.text(`${bullet}${line}`, 12, y);
        y += 4;
      });
      y += 2;
    });

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

    y = checkPageOverflow(doc, y, marginBottom);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("TÉRMINOS Y CONDICIONES", 10, y);
    y += 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    
    const terminos2 = [
      "Si el equipo llega apagado o la pantalla sin imagen, no es posible verificar el estado de componentes como cámara, micrófono, señal u otros. Por tanto, PALMATRÓNICA no se hace responsable por fallas adicionales no detectadas al momento del ingreso.",
      "El cliente declara haber informado los daños visibles o conocidos del equipo. Cualquier falla adicional que se evidencie durante o después del proceso de reparación no será responsabilidad del centro de reparación.",
      "En procedimientos de alto riesgo (como cambio de visor, microelectrónica, o reparación de placa base), el cliente acepta que existe la posibilidad de que la reparación no sea exitosa o que el dispositivo presente daños adicionales debido a la condición previa del equipo. Estos casos se realizan únicamente con autorización expresa del cliente.",
      "Las piezas reemplazadas pueden ser originales, genéricas o reacondicionadas según disponibilidad y presupuesto acordado con el cliente. La garantía aplica únicamente sobre el repuesto nuevo y por defectos de fábrica, no por daños ocasionados por mal uso o golpes posteriores.",
      "La garantía no cubre daños por caídas, humedad, manipulación de terceros, sobrecarga eléctrica o instalación de software no autorizado."
    ];

    // Hacer líneas más largas para ocupar menos espacio vertical
    terminos2.forEach(termino => {
      y = checkPageOverflow(doc, y, marginBottom);
      const terminoLines = doc.splitTextToSize(termino, pageWidth - 20);
      terminoLines.forEach((line, idx) => {
        y = checkPageOverflow(doc, y, marginBottom);
        const bullet = idx === 0 ? '• ' : '  ';
        doc.text(`${bullet}${line}`, 12, y);
        y += 4;
      });
      y += 2;
    });

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
