document.addEventListener('DOMContentLoaded', () => {
  const form   = document.querySelector('.registro-form');
  const inputs = document.querySelectorAll('.registro-input input');
  const submit = document.querySelector('button[type="submit"]');

  // Fade-in
  requestAnimationFrame(() => { form.style.opacity = 1; });

  // Realce inputs
  inputs.forEach(el => {
    el.addEventListener('focus', () => {
      el.style.borderColor = 'var(--accent)';
      el.style.boxShadow = '0 0 0 3px rgba(34,211,238,.3)';
    });
    el.addEventListener('blur', () => {
      el.style.borderColor = 'var(--border)';
      el.style.boxShadow = 'none';
    });
  });

  // Efecto hover en botón
  if (submit) {
    submit.addEventListener('mouseenter', () => submit.classList.add('is-hovering'));
    submit.addEventListener('mouseleave', () => submit.classList.remove('is-hovering'));
  }
});
