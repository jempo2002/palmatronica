// static/js/registro.js

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.login-form');
  const inputs = document.querySelectorAll('.login-input input');
  const submitBtn = document.querySelector('button[type="submit"]');

  // Obtener colores desde variables CSS
  const rootStyles = getComputedStyle(document.documentElement);
  const accent    = rootStyles.getPropertyValue('--accent').trim();
  const accentHover = rootStyles.getPropertyValue('--accent-hover')?.trim() || accent;

  // Efectos de foco y desenfoque en inputs
  inputs.forEach(input => {
    input.addEventListener('focus', () => {
      input.style.borderColor = accent;
      input.style.boxShadow   = `0 0 8px ${accent}`;
    });
    input.addEventListener('blur', () => {
      input.style.borderColor = rootStyles.getPropertyValue('--input-border').trim();
      input.style.boxShadow   = 'none';
    });
  });

  // Efectos de hover en botón
  submitBtn.addEventListener('mouseenter', () => {
    submitBtn.style.backgroundColor = accentHover;
    submitBtn.style.transform       = 'translateY(-2px)';
  });
  submitBtn.addEventListener('mouseleave', () => {
    submitBtn.style.backgroundColor = accent;
    submitBtn.style.transform       = 'none';
  });

  // Validación de formulario
  form.addEventListener('submit', (e) => {
    const nombre    = document.getElementById('nombre').value.trim();
    const apellido  = document.getElementById('apellido').value.trim();
    const correo    = document.getElementById('correo').value.trim();
    const telefono  = document.getElementById('telefono').value.trim();
    const direccion = document.getElementById('direccion').value.trim();
    const pwd       = document.getElementById('palabra_cliente').value;
    const pwdConf   = document.getElementById('password_cliente_conf').value;

    if (!nombre || !apellido || !correo || !telefono || !direccion || !pwd || !pwdConf) {
      alert('Por favor, completa todos los campos.');
      e.preventDefault();
      return;
    }


    if (pwd !== pwdConf) {
      alert('Las contraseñas no coinciden.');
      e.preventDefault();
      return;
    }

    // Si todo está bien, el formulario se envía
  });
});
