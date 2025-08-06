document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.card').forEach(card => {
    const url = card.dataset.url;
    if (card.id === 'new-order-card') {
      const idInput = card.querySelector('#client-id');
      const findBtn = card.querySelector('#find-client');
      const dropdown = card.querySelector('.dropdown');
      const msg = card.querySelector('#lookup-msg');
      let currentId = '';

      card.addEventListener('click', () => {
        card.classList.toggle('active');
        card.classList.remove('ready');
      });

      idInput.addEventListener('click', ev => ev.stopPropagation());

      findBtn.addEventListener('click', ev => {
        ev.stopPropagation();
        const id = idInput.value.trim();
        if (!id) return;
        fetch(`/api/usuario/${id}`)
          .then(r => (r.ok ? r.json() : null))
          .then(data => {
            if (data) {
              currentId = id;
              card.classList.add('ready');
              msg.textContent = '';
            } else {
              currentId = '';
              card.classList.remove('ready');
              msg.textContent = 'Usuario no ha sido encontrado';
            }
          })
          .catch(() => {
            currentId = '';
            card.classList.remove('ready');
            msg.textContent = 'Error al buscar usuario';
          });
      });

      dropdown.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', ev => {
          ev.stopPropagation();
          if (!currentId) return;
          const tipo = btn.dataset.type;
          window.location.href = `${url}?tipo=${tipo}&id=${currentId}`;
        });
      });
    } else if (url) {
      card.addEventListener('click', () => {
        window.location.href = url;
      });
    }
  });
});
