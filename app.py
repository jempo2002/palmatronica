from flask import Flask, request, redirect, render_template_string, render_template
from componentes.helpers.autenticador_login import autenticar_usuario

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
        return redirect("/inicio_admin")
    elif rol == "cliente":
        return redirect("/clientes_inicio")
    else:
        return "Usuario o contraseña incorrectos", 401

@app.route("/inicio_admin")
def inicio_admin():
    return "Bienvenido, administrador"

@app.route("/clientes_inicio")
def clientes_inicio():
    return "Bienvenido, cliente"

if __name__ == "__main__":
    app.run(debug=True)
