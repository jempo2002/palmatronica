// static/js/registro.js

document.addEventListener('DOMContentLoaded', () => {
  const form         = document.querySelector('.login-form');
  const inputs       = document.querySelectorAll('.login-input input');
  const submitBtn    = document.querySelector('button[type="submit"]');
  const rootStyles   = getComputedStyle(document.documentElement);
  const accent       = rootStyles.getPropertyValue('--accent').trim();
  const accentHover  = (rootStyles.getPropertyValue('--accent-hover') || accent).trim();

  // 1. Efectos de foco/desenfoque en los inputs
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

  // 2. Efectos de hover en el botón
  submitBtn.addEventListener('mouseenter', () => {
    submitBtn.style.backgroundColor = accentHover;
    submitBtn.style.transform       = 'translateY(-2px)';
  });
  submitBtn.addEventListener('mouseleave', () => {
    submitBtn.style.backgroundColor = accent;
    submitBtn.style.transform       = 'none';
  });

  // 3. Validación en tiempo real de "confirma tu contraseña"
  const passwordInput = document.getElementById('palabra_cliente');
  const confirmInput  = document.getElementById('password_cliente_conf');

  confirmInput.addEventListener('input', () => {
    if (passwordInput.value !== confirmInput.value) {
      confirmInput.setCustomValidity('Las contraseñas no coinciden.');
    } else {
      confirmInput.setCustomValidity('');
    }
  });

  // 4. Validaciones al enviar el formulario
  form.addEventListener('submit', (e) => {
    const nombre    = document.getElementById('nombre').value.trim();
    const apellido  = document.getElementById('apellido').value.trim();
    const correo    = document.getElementById('correo').value.trim();
    const telefono  = document.getElementById('telefono').value.trim();
    const direccion = document.getElementById('direccion').value.trim();
    const pwd       = passwordInput.value;
    const pwdConf   = confirmInput.value;

    // Campos vacíos
    if (!nombre || !apellido || !correo || !telefono || !direccion || !pwd || !pwdConf) {
      alert('Por favor, completa todos los campos.');
      e.preventDefault();
      return;
    }

    // Ya no hace falta check de pwd !== pwdConf aquí, 
    // el navegador usará tu setCustomValidity.
    // Si quisieras un chequeo extra, podrías reactivar esto:
    // if (pwd !== pwdConf) {
    //   alert('Las contraseñas no coinciden.');
    //   e.preventDefault();
    // }
  });
});
