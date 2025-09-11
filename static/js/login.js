document.addEventListener('DOMContentLoaded', () => {
  const form   = document.querySelector('.login-form');
  const inputs = document.querySelectorAll('.login-input input');
  const submit = document.querySelector('button[type="submit"]');

  // Fade-in del formulario
  requestAnimationFrame(() => { form.style.opacity = 1; });

  // Realce al enfocar inputs
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

  // Pequeno efecto de "lift" en hover del boton
  if (submit) {
    submit.addEventListener('mouseenter', () => submit.classList.add('is-hovering'));
    submit.addEventListener('mouseleave', () => submit.classList.remove('is-hovering'));
  }
});

