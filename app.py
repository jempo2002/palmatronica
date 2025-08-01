from flask import Flask, request, redirect, render_template, url_for, flash
from componentes.helpers.autenticador_login import md5_hash, autenticar_usuario
from componentes.helpers.conexion_bd import obtener_conexion

app = Flask(__name__)
app.secret_key = 'change_me'



@app.route("/")
def index():
    return render_template("login.html")

@app.route("/login", methods=["POST"])
def login():
    correo = request.form["correo"]
    contrasena = request.form["contrasena"]
    rol = autenticar_usuario(correo, contrasena)

    if rol == "admin":
        return redirect(url_for("inicio_admin"))
    elif rol == "cliente":
        return redirect(url_for("clientes_inicio"))

    elif rol == "correo_no_existe":
        return render_template("login.html", error_email="Este correo no se encuentra registrado, por favor registrate")
    elif rol == "contrasena_incorrecta":
        return render_template("login.html", error_pwd="La contraseña es incorrecta.")
    else:
        return render_template("login.html", error="Usuario o contraseña incorrectos"), 401

@app.route("/inicio_admin")
def inicio_admin():
    return render_template("admin/inicio_admin.html")

@app.route("/clientes_inicio")
def clientes_inicio():
    return render_template("user/inicio_user.html")


@app.route('/api/usuario/<int:usuario_id>')
def api_usuario(usuario_id: int):
    """Devuelve la información de un usuario en formato JSON."""
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        "SELECT nombre, apellido, correo, telefono, direccion FROM usuarios WHERE ld = %s",
        (usuario_id,)
    )
    usuario = cursor.fetchone()
    cursor.close()
    conexion.close()
    if usuario:
        return usuario
    return {}, 404


@app.route('/nueva_orden', methods=['GET', 'POST'])
def nueva_orden():
    """Formulario para crear una nueva orden de servicio."""
    if request.method == 'POST':
        id_usuario = request.form['id_usuario']
        descripcion = request.form['descripcion']
        tipo = request.form.get('tipo')

        conexion = obtener_conexion()
        cursor = conexion.cursor()
        cursor.execute(
            "INSERT INTO ordenes_servicio (id_usuario, fecha_ingreso, descripcion_falla) "
            "VALUES (%s, CURDATE(), %s)",
            (id_usuario, descripcion),
        )
        id_orden = cursor.lastrowid
        cursor.execute(
            "INSERT INTO servicios (id_orden, tipo) VALUES (%s, %s)",
            (id_orden, tipo or 'computador'),
        )
        conexion.commit()
        cursor.close()
        conexion.close()
        flash('Orden creada correctamente')
        return redirect(url_for('inicio_admin'))

    tipo = request.args.get('tipo', '')
    return render_template('admin/nueva_orden.html', tipo=tipo)


@app.route('/logout')
def logout():
    """Cierra la sesión actual y vuelve al inicio de sesión."""
    return redirect(url_for('index'))


@app.route('/registrarse', methods=['GET', 'POST'])
def registrarse():
    if request.method == 'POST':
        nombre    = request.form['nombre'].strip()
        apellido  = request.form['apellido'].strip()
        identificacion = request.form['identificacion'].strip()
        correo    = request.form['correo'].strip().lower()
        telefono  = request.form['telefono'].strip()
        direccion = request.form['direccion'].strip()
        # La contraseña será la identificación en texto plano hasheada
        pwd_hash  = md5_hash(identificacion)

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
        cursor.execute(
            "INSERT INTO usuarios (nombre, apellido, ld, correo, contrasena, telefono, direccion, rol) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
            (nombre, apellido, identificacion, correo, pwd_hash, telefono, direccion, 'cliente')
        )
        conexion.commit()
        cursor.close()
        conexion.close()

        # Éxito: volver al inicio de administrador
        flash("Usuario registrado correctamente.")
        return redirect(url_for('inicio_admin'))

    # GET
    return render_template('registro.html')


if __name__ == "__main__":
    app.run(debug=True)
