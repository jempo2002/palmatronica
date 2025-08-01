document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.card').forEach(card => {
    const url = card.dataset.url;
    if (card.id === 'new-order-card') {
      card.addEventListener('click', () => {
        card.classList.toggle('active');
      });
      card.querySelectorAll('.dropdown button').forEach(btn => {
        btn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          if (url) {
            const tipo = btn.dataset.type;
            window.location.href = `${url}?tipo=${tipo}`;
          }
        });
      });
    } else if (url) {
      card.addEventListener('click', () => {
        window.location.href = url;
      });
    }
  });
});
