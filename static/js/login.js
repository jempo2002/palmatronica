// static/js/login.js
// Este script se encarga únicamente de los efectos visuales en la página de
// inicio de sesión. Todas las validaciones del formulario se realizan ahora en
// el servidor o mediante los atributos HTML.

document.addEventListener('DOMContentLoaded', () => {
  const form       = document.querySelector('.login-form');
  const inputs     = document.querySelectorAll('.login-input input');
  const submitBtn  = document.querySelector('button[type="submit"]');
  const rootStyles = getComputedStyle(document.documentElement);
  const accent     = rootStyles.getPropertyValue('--accent').trim();
  const accentHover = (rootStyles.getPropertyValue('--accent-hover') || accent).trim();

  // Efecto de aparición del formulario al cargar la página
  form.style.opacity = 0;
  form.style.transition = 'opacity 0.6s ease-in';
  requestAnimationFrame(() => {
    form.style.opacity = 1;
  });

  // 1. Efectos de foco en los campos de entrada
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

  // 2. Efectos de hover en el botón de envío
  submitBtn.addEventListener('mouseenter', () => {
    submitBtn.style.backgroundColor = accentHover;
    submitBtn.style.transform       = 'translateY(-2px)';
  });
  submitBtn.addEventListener('mouseleave', () => {
    submitBtn.style.backgroundColor = accent;
    submitBtn.style.transform       = 'none';
  });
});
