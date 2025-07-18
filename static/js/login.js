document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".login-form");
  const correoInput = document.getElementById("correo");
  const contrasenaInput = document.getElementById("contrasena");

  form.addEventListener("submit", (e) => {
    const correo = correoInput.value.trim();
    const contrasena = contrasenaInput.value.trim();

    const correoRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!correoRegex.test(correo)) {
      alert("Por favor ingresa un correo electrónico válido.");
      correoInput.focus();
      e.preventDefault();
      return;
    }

    if (contrasena === "") {
      alert("La contraseña no puede estar vacía.");
      contrasenaInput.focus();
      e.preventDefault();
      return;
    }

    // Si todo está bien, el formulario se enviará
  });
});
