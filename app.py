from flask import Flask, request, redirect, render_template, url_for, flash
from componentes.helpers.autenticador_login import md5_hash, autenticar_usuario
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
    return render_template("user/inicio_user.html")


@app.route('/registrarse', methods=['GET', 'POST'])
def registrarse():
    if request.method == 'POST':
        nombre    = request.form['nombre'].strip()
        apellido  = request.form['apellido'].strip()
        identificacion = request.form['identificacion'].strip()
        correo    = request.form['correo'].strip().lower()
        telefono  = request.form['telefono'].strip()
        direccion = request.form['direccion'].strip()
        pwd       = request.form['palabra_cliente']
        pwd_conf  = request.form['password_cliente_conf']

        # 1. Verificar que las contraseñas coincidan
        if pwd != pwd_conf:
            return render_template('registro.html', error_pwd="Las contraseñas no coinciden.")

        conexion = obtener_conexion()
        cursor   = conexion.cursor(dictionary=True)

        # 2. Comprobar si el correo ya existe (correo es UNIQUE en la tabla)
        cursor.execute("SELECT COUNT(*) AS cnt FROM usuarios WHERE correo = %s", (correo,))
        existe = cursor.fetchone()['cnt']

        if existe:
            cursor.close()
            conexion.close()
            return render_template('registro.html', error_email="El correo ya está registrado.")

        # 3. Comprobar si el número de identificación ya existe
        cursor.execute("SELECT COUNT(*) AS cnt FROM usuarios WHERE ld = %s", (identificacion,))
        existe_id = cursor.fetchone()['cnt']

        if existe_id:
            cursor.close()
            conexion.close()
            return render_template('registro.html', error_id="La identificación ya está registrada.")
        # 4. Insertar nuevo usuario
        pwd_hash = md5_hash(pwd)
        cursor.execute(
            "INSERT INTO usuarios (nombre, apellido, ld, correo, contrasena, telefono, direccion, rol) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
            (nombre, apellido, identificacion, correo, pwd_hash, telefono, direccion, 'cliente')
        )
        conexion.commit()
        cursor.close()
        conexion.close()

        # 4. Éxito: redirigir al login
        flash("Registro exitoso. Por favor, inicia sesión.")
        return redirect(url_for('index'))

    # GET
    return render_template('registro.html')


if __name__ == "__main__":
    app.run(debug=True)
