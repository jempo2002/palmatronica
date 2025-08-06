document.addEventListener('DOMContentLoaded', () => {
  const idInput = document.getElementById('id_usuario');
  const errorMsg = document.getElementById('user-error');
  const campos = {
    nombre: document.getElementById('nombre'),
    apellido: document.getElementById('apellido'),
    correo: document.getElementById('correo'),
    telefono: document.getElementById('telefono'),
    direccion: document.getElementById('direccion'),
  };

  idInput.addEventListener('change', () => {
    const id = idInput.value.trim();
    if (!id) {
      errorMsg.textContent = '';
      Object.values(campos).forEach(c => c.value = '');
      return;
    }
    fetch(`/api/usuario/${id}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data) {
          campos.nombre.value = data.nombre || '';
          campos.apellido.value = data.apellido || '';
          campos.correo.value = data.correo || '';
          campos.telefono.value = data.telefono || '';
          campos.direccion.value = data.direccion || '';
          errorMsg.textContent = '';
        } else {
          Object.values(campos).forEach(c => c.value = '');
          errorMsg.textContent = 'Usuario no encontrado';
        }
      })
      .catch(() => {
        Object.values(campos).forEach(c => c.value = '');
        errorMsg.textContent = 'Error al consultar usuario';
      });
  });

  if (idInput.value.trim()) {
    idInput.dispatchEvent(new Event('change'));
  }
});
