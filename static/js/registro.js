// static/js/registro.js
// Script dedicado a animaciones de la página de registro. Todas las
// comprobaciones de datos se manejan en el backend o mediante los atributos
// HTML; aquí solo se aplican efectos visuales.

document.addEventListener('DOMContentLoaded', () => {
  const form        = document.querySelector('.login-form');
  const inputs      = document.querySelectorAll('.login-input input');
  const submitBtn   = document.querySelector('button[type="submit"]');
  const rootStyles  = getComputedStyle(document.documentElement);
  const accent      = rootStyles.getPropertyValue('--accent').trim();
  const accentHover = (rootStyles.getPropertyValue('--accent-hover') || accent).trim();

  // Efecto de aparición del formulario
  form.style.opacity = 0;
  form.style.transition = 'opacity 0.6s ease-in';
  requestAnimationFrame(() => {
    form.style.opacity = 1;
  });

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
});
