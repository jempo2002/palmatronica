// static/js/registro.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".login-form");

  form.addEventListener("submit", (e) => {
    const nombre    = document.getElementById("nombre").value.trim();
    const apellido  = document.getElementById("apellido").value.trim();
    const correo    = document.getElementById("correo").value.trim();
    const telefono  = document.getElementById("telefono").value.trim();
    const direccion = document.getElementById("direccion").value.trim();
    const password  = document.getElementById("palabra_cliente").value;
    const confirmPw = document.getElementById("password_cliente_conf").value;

    // Verificar que no haya campos vacíos
    if (!nombre || !apellido || !correo || !telefono || !direccion || !password || !confirmPw) {
      alert("Por favor, completa todos los campos.");
      e.preventDefault();
      return;
    }

    // Validar correo
    const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correoRegex.test(correo)) {
      alert("Correo electrónico inválido.");
      e.preventDefault();
      return;
    }

    // Validar teléfono (10 dígitos)
    const telRegex = /^\d{10}$/;
    if (!telRegex.test(telefono)) {
      alert("Teléfono inválido. Debe tener 10 dígitos.");
      e.preventDefault();
      return;
    }

    // Validar contraseña (8–16 caracteres alfanuméricos)
    const pwRegex = /^[A-Za-z0-9]{8,16}$/;
    if (!pwRegex.test(password)) {
      alert("Contraseña inválida. Debe tener entre 8 y 16 caracteres alfanuméricos.");
      e.preventDefault();
      return;
    }

    // Confirmar que las contraseñas coincidan
    if (password !== confirmPw) {
      alert("Las contraseñas no coinciden.");
      e.preventDefault();
      return;
    }

    // Si todo es válido, el formulario se envía
  });
});
