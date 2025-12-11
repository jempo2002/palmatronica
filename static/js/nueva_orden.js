document.addEventListener('DOMContentLoaded', () => {
  const idInput = document.getElementById('id_usuario');
  const form = document.getElementById('order-form');
  const formMode = form?.dataset.mode || 'create';
  const orderId = form?.dataset.idOrden || '';
  const formError = document.getElementById('form-error');
  const campos = {
    nombre: document.getElementById('nombre'),
    apellido: document.getElementById('apellido'),
    correo: document.getElementById('correo'),
    telefono: document.getElementById('telefono'),
    direccion: document.getElementById('direccion'),
  };

  idInput.addEventListener('change', () => {
    const id = idInput.value.trim();
    if (!id) return;
    fetch(`/api/usuario/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          campos.nombre.value = data.nombre || '';
          campos.apellido.value = data.apellido || '';
          campos.correo.value = data.correo || '';
          campos.telefono.value = data.telefono || '';
          campos.direccion.value = data.direccion || '';
        } else {
          Object.values(campos).forEach(c => c.value = '');
        }
      });
  });

  if (idInput.value.trim() && formMode === 'create') {
    idInput.dispatchEvent(new Event('change'));
  }

  // Modo edición: cargar datos de la orden
  if (formMode === 'edit' && orderId) {
    (async () => {
      try {
        const r = await fetch(`/api/orden/${orderId}`);
        if (!r.ok) throw new Error('No se pudo cargar la orden');
        const o = await r.json();

        // Cliente
        idInput.value = o.cc || '';
        if (campos.nombre) campos.nombre.value = o.nombre || '';
        if (campos.apellido) campos.apellido.value = o.apellido || '';
        if (campos.correo) campos.correo.value = o.correo || '';
        if (campos.telefono) campos.telefono.value = o.telefono || '';
        if (campos.direccion) campos.direccion.value = o.direccion || '';

        // Dispositivo
        document.getElementById('marca')?.setAttribute('value', o.marca || '');
        document.getElementById('modelo')?.setAttribute('value', o.modelo || '');
        if (document.getElementById('imei')) {
          document.getElementById('imei').setAttribute('value', o.imei || '');
        }
        if (document.getElementById('serial')) {
          document.getElementById('serial').setAttribute('value', o.serial || '');
        }
        if (document.getElementById('password')) {
          document.getElementById('password').setAttribute('value', o.password_patron || '');
        }

        // Descripción
        const desc = document.getElementById('descripcion');
        if (desc) desc.value = o.descripcion_falla || '';

        // Checklist
        if (Array.isArray(o.checklist)) {
          o.checklist.forEach(item => {
            const nombre = item.nombre_item;
            const valor = String(item.valor).toLowerCase();
            const input = document.querySelector(`input[type="radio"][name="${nombre}"][value="${valor}"]`);
            if (input) input.checked = true;
          });

          // Ajustar el estado del switch según el checklist cargado (si todo es "no" => encendido)
          const apagadoSwitch = document.getElementById('switch-apagado');
          if (apagadoSwitch) {
            const valores = o.checklist.map(i => String(i.valor).toLowerCase());
            const allNo = valores.length > 0 && valores.every(v => v === 'no');
            const allSi = valores.length > 0 && valores.every(v => v === 'si');
            apagadoSwitch.checked = allNo ? true : false;
            apagadoSwitch.setAttribute('aria-checked', apagadoSwitch.checked ? 'true' : 'false');
            // Estado mixto no se refleja visualmente; mantenemos apagadoSwitch en false si hay mezcla
          }
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }

  // Función para recopilar todos los datos del formulario
  const recopilarDatosOrden = () => {
    const formData = new FormData(form);
    const data = {
      id_usuario: formData.get('id_usuario'),
      tipo: formData.get('tipo'),
      marca: formData.get('marca'),
      modelo: formData.get('modelo'),
      imei: formData.get('imei') || formData.get('serial'),
      serial: formData.get('serial'),
      password: formData.get('password') || '',
      descripcion: formData.get('descripcion'),
      checklist: {}
    };

    // Capturar checklist
    const radios = form.querySelectorAll('input[type="radio"]:checked');
    radios.forEach(radio => {
      data.checklist[radio.name] = radio.value;
    });

    return data;
  };

  // Función para guardar la orden en la base de datos
  const guardarOrden = async (datos) => {
    const url = form.action;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datos)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al guardar la orden');
    }

    return await response.json();
  };

  if (form) {
    // Interceptar el submit del formulario (botón "Guardar orden")
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Validar formulario
      if (!form.checkValidity()) {
        if (formError) { formError.hidden = false; }
        const firstInvalid = form.querySelector(':invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      if (formError) { formError.hidden = true; }

      // Deshabilitar botón de submit
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Guardando...';

      try {
        // 1. Recopilar datos
        const datos = recopilarDatosOrden();
        console.log('Datos a guardar:', datos);

        // 2. Guardar/Actualizar en base de datos
        let idCreada = orderId;
        if (formMode === 'create') {
          submitBtn.textContent = 'Guardando en BD...';
          const resultado = await guardarOrden(datos);
          console.log('Orden guardada:', resultado);
          idCreada = resultado.id_orden;
        } else {
          submitBtn.textContent = 'Actualizando...';
          const payload = {
            descripcion_falla: datos.descripcion,
            dispositivo: {
              marca: datos.marca,
              modelo: datos.modelo,
              imei: datos.imei,
              serial: datos.serial,
              password: datos.password
            },
            checklist: datos.checklist
          };
          const r = await fetch(`/api/orden/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!r.ok) {
            const err = await r.json().catch(() => ({}));
            throw new Error(err.error || 'No se pudo actualizar la orden');
          }
        }

        // 3. Generar PDF automáticamente
        submitBtn.textContent = 'Generando PDF...';
        if (typeof window.generarPDFOrden === 'function') {
          await window.generarPDFOrden(idCreada);
        }

        // 4. Mostrar mensaje de éxito
        if (formMode === 'create') {
          alert(`Orden creada correctamente. Número de orden: ${idCreada}\nEl PDF se ha descargado automáticamente.`);
        } else {
          alert(`Orden #${orderId} actualizada. El PDF se ha descargado automáticamente.`);
        }

        // 5. Redireccionar al inicio
        window.location.href = '/inicio_admin';

      } catch (error) {
        console.error('Error:', error);
        alert(`Error: ${error.message}`);
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  // Conectar botón de vista previa PDF (solo abre PDF en nueva pestaña, no guarda)
  const previewButton = document.getElementById('preview-pdf');
  if (previewButton) {
    previewButton.addEventListener('click', async (e) => {
      e.preventDefault();
      
      // Validar formulario antes de generar PDF
      if (!form.checkValidity()) {
        if (formError) { formError.hidden = false; }
        const firstInvalid = form.querySelector(':invalid');
        if (firstInvalid) firstInvalid.focus();
        alert('Por favor completa todos los campos requeridos antes de generar la vista previa.');
        return;
      }

      // Mostrar indicador de carga
      const originalText = previewButton.textContent;
      previewButton.disabled = true;
      previewButton.textContent = 'Generando vista previa...';
      previewButton.style.opacity = '0.6';

      try {
        // Generar vista previa del PDF en nueva pestaña (sin guardar en BD)
        if (typeof window.previsualizarPDFOrden === 'function') {
          const idForPreview = formMode === 'edit' ? orderId : undefined;
          await window.previsualizarPDFOrden(idForPreview);
        } else {
          throw new Error('La función de vista previa de PDF no está disponible');
        }
      } catch (error) {
        console.error('Error al generar vista previa:', error);
        alert('Ocurrió un error al generar la vista previa del PDF');
      } finally {
        // Restaurar botón
        previewButton.disabled = false;
        previewButton.textContent = originalText;
        previewButton.style.opacity = '1';
      }
    });
  }

  // Lógica del switch "apagado" para checklist: ON => todo "no", OFF => todo "si"
  const apagadoSwitch = document.getElementById('switch-apagado');
  const checklistRoot = document.querySelector('.checklist');
  const descField = document.getElementById('descripcion');
  function setChecklistAll(valor) {
    if (!checklistRoot) return;
    const targets = checklistRoot.querySelectorAll(`input[type="radio"][value="${valor}"]`);
    targets.forEach(r => { r.checked = true; });
  }

  // Inserta o elimina el marcador de "equipo ingresa apagado, " al inicio de la descripción
  function setApagadoMarker(isOn) {
    if (!descField) return;
    const marker = 'equipo ingresa apagado, ';
    const re = /^\s*equipo ingresa apagado,\s*/i;
    const text = descField.value || '';
    if (isOn) {
      if (!re.test(text)) {
        // Prepend marker; mantener el resto sin espacios iniciales extra
        descField.value = marker + text.replace(/^\s+/, '');
      }
    } else {
      // Quitar marcador si existe
      descField.value = text.replace(re, '');
    }
  }
  if (apagadoSwitch) {
    // Estado inicial: en modo creación, el switch viene encendido por defecto => marcar todo "no"
    if (formMode === 'create') {
      setChecklistAll('no');
      apagadoSwitch.checked = true;
      apagadoSwitch.setAttribute('aria-checked', 'true');
      setApagadoMarker(true);
    }
    apagadoSwitch.addEventListener('change', () => {
      const isOn = apagadoSwitch.checked;
      apagadoSwitch.setAttribute('aria-checked', isOn ? 'true' : 'false');
      setChecklistAll(isOn ? 'no' : 'si');
      setApagadoMarker(isOn);
    });
  }
});
