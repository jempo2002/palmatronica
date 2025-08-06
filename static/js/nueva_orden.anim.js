// static/js/nueva_orden.anim.js
// Animaciones e interacciones visuales para la página de nueva orden.

document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('.section');
  const header   = document.querySelector('.page__header');

  // Aparición progresiva de las secciones
  sections.forEach(sec => {
    sec.style.opacity = 0;
    sec.style.transition = 'opacity 0.6s ease-in';
  });
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = 1;
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  sections.forEach(sec => observer.observe(sec));

  // Sombra del header al hacer scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 0) {
      header.classList.add('header--scrolled');
    } else {
      header.classList.remove('header--scrolled');
    }
  });

});

