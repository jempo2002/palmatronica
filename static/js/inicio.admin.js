document.addEventListener('DOMContentLoaded', () => {
  const newOrderCard = document.getElementById('new-order-card');
  if (newOrderCard) {
    newOrderCard.addEventListener('click', (e) => {
      newOrderCard.classList.toggle('active');
    });
  }
});
