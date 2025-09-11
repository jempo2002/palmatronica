document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.main-container');
  requestAnimationFrame(() => { container.style.opacity = 1; });

  document.querySelectorAll('.card').forEach(card => {
    const url = card.dataset.url || '';

    if (card.id === 'new-order-card') {
      const idInput  = card.querySelector('#client-id');
      const findBtn  = card.querySelector('#find-client');
      const dropdown = card.querySelector('.dropdown');
      let currentId  = '';

      card.addEventListener('click', () => {
        card.classList.toggle('active');
        card.classList.remove('ready');
      });

      idInput.addEventListener('click', ev => ev.stopPropagation());
      findBtn.addEventListener('click', ev => ev.stopPropagation());

      findBtn.addEventListener('click', async () => {
        const id = idInput.value.trim();
        if (!id) return;
        try {
          const res = await fetch(`/api/usuario/${id}`);
          if (!res.ok) throw new Error('not ok');
          const data = await res.json();
          if (data) {
            currentId = id;
            card.classList.add('ready');
            dropdown.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          } else {
            currentId = '';
            card.classList.remove('ready');
            alert('Usuario no ha sido encontrado');
          }
        } catch {
          currentId = '';
          card.classList.remove('ready');
          alert('Error consultando el usuario');
        }
      });

      dropdown.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', ev => {
          ev.stopPropagation();
          if (!currentId || !url) return;
          const tipo = btn.dataset.type;
          window.location.href = `${url}?tipo=${encodeURIComponent(tipo)}&id=${encodeURIComponent(currentId)}`;
        });
      });

    } else if (url) {
      card.addEventListener('click', () => { window.location.href = url; });
    }
  });
});
