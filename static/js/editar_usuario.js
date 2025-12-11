document.addEventListener('DOMContentLoaded', () => {
  const form   = document.querySelector('.registro-form');
  const inputs = document.querySelectorAll('.registro-input input');
  const selects = document.querySelectorAll('.registro-input select');
  const submit = document.querySelector('button[type="submit"]');
  const rolSel = document.getElementById('rol');
  const adminPwdContainer = document.getElementById('admin-password-container');
  const adminPwdInput = document.getElementById('contrasena_admin');

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

  // Realce selects
  selects?.forEach(el => {
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

  // Mostrar/ocultar contraseña de admin según rol
  function toggleAdminPwd() {
    if (!rolSel || !adminPwdContainer || !adminPwdInput) return;
    const isAdmin = rolSel.value === 'admin';
    adminPwdContainer.hidden = !isAdmin;
    // En edición, la contraseña es opcional
    adminPwdInput.required = false;
    if (!isAdmin) {
      adminPwdInput.value = '';
    }
  }

  if (rolSel) {
    rolSel.addEventListener('change', toggleAdminPwd);
    toggleAdminPwd();
  }
});
