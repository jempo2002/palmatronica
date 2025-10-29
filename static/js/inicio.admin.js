document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.main-container');
  requestAnimationFrame(() => { container.style.opacity = 1; });

  document.querySelectorAll('.card').forEach(card => {
    const url = card.dataset.url || '';

    if (card.id === 'new-order-card') {
      const idInput   = card.querySelector('#client-id');
      const dropdown  = card.querySelector('.dropdown');
      const errEl     = card.querySelector('#client-error');

      const debounce = (fn, wait=400) => {
        let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
      };

      const showError = (msg) => {
        if (errEl) { errEl.textContent = msg; errEl.hidden = false; }
        idInput.classList.add('is-invalid');
      };

      const clearError = () => {
        if (errEl) { errEl.hidden = true; }
        idInput.classList.remove('is-invalid');
      };

      const validateId = async () => {
        const id = idInput.value.trim();
        if (!id) { showError('Ingresa el número de CC.'); return false; }
        try {
          const res = await fetch(`/api/usuario/${encodeURIComponent(id)}`);
          if (!res.ok) { showError('El usuario no existe.'); return false; }
        } catch (_) {
          showError('No se pudo validar el usuario. Intenta de nuevo.');
          return false;
        }
        clearError();
        return true;
      };

      // hide any pre-existing error on load
      clearError();

      card.addEventListener('click', () => {
        card.classList.toggle('active');
        clearError();
      });

      idInput.addEventListener('click', ev => ev.stopPropagation());

      idInput.addEventListener('input', debounce(() => { if (idInput.value.trim()) validateId(); else clearError(); }, 500));
      idInput.addEventListener('blur', () => { if (idInput.value.trim()) validateId(); });

      dropdown.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', async ev => {
          ev.stopPropagation();
          const ok = await validateId();
          if (!ok) { idInput.focus(); return; }
          const id = idInput.value.trim();
          const tipo = btn.dataset.type;
          const targetUrl = btn.dataset.url;
          if (targetUrl) {
            window.location.href = `${targetUrl}?tipo=${encodeURIComponent(tipo)}&id=${encodeURIComponent(id)}`;
          }
        });
      });

    } else if (url) {
      card.addEventListener('click', () => { window.location.href = url; });
    }
  });
});
