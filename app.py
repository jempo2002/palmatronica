from flask import Flask, request, redirect, render_template, url_for
from componentes.helpers.autenticador_login import md5_hash
from componentes.helpers.conexion_bd import obtener_conexion

app = Flask(__name__)



@app.route("/")
def index():
    return render_template("login.html")

@app.route("/login", methods=["POST"])
def login():
    correo = request.form["correo"]
    contrasena = request.form["contrasena"]
    rol = autenticar_usuario(correo, contrasena)

    if rol == "admin":
        return redirect("admin/inicio_admin.html")
    elif rol == "cliente":
        return redirect("user/inicio_user.html")
    else:
        return "Usuario o contraseña incorrectos", 401

@app.route("/inicio_admin")
def inicio_admin():
    return "Bienvenido, administrador"

@app.route("/clientes_inicio")
def clientes_inicio():
    return "Bienvenido, cliente"


@app.route('/registrarse', methods=['GET', 'POST'])
def registrarse():
    if request.method == 'POST':
        # lógica de registro…
        return redirect(url_for('login'))
    return render_template('registro.html')


if __name__ == "__main__":
    app.run(debug=True)
