from flask import Flask, request, redirect, render_template, url_for
from componentes.helpers.autenticador_login import autenticar_usuario, md5_hash
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
    return render_template("admin/inicio_admin.html")

@app.route("/clientes_inicio")
def clientes_inicio():
    return render_template("admin/clientes_inicio.html")


@app.route('/registrarse', methods=['GET', 'POST'])
def registrarse():
    if request.method == 'POST':
        # lógica de registro…
        nombre = request.form['nombre']
        apellido = request.form['apellido']
        correo = request.form['correo']
        telefono = request.form['telefono']
        direccion = request.form['direccion']
        contrasena = request.form['palabra_cliente']

        conexion = obtener_conexion()
        cursor = conexion.cursor()
        cursor.execute('SELECT 1 FROM usuarios WHERE correo=%s', (correo,))
        existente = cursor.fetchone()

        if existente:
            cursor.close()
            conexion.close()
            return render_template('registro.html', mensaje='El correo ya está en uso')

        cursor.execute(
            'INSERT INTO usuarios(nombre, apellido, correo, contrasena, telefono, direccion) '
            'VALUES (%s, %s, %s, %s, %s, %s)',
            (nombre, apellido, correo, md5_hash(contrasena), telefono, direccion),
        )
        conexion.commit()
        cursor.close()
        conexion.close()
        return redirect(url_for('index'))
    return render_template('registro.html')


if __name__ == "__main__":
    app.run(debug=True)
