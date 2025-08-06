from flask import Flask, request, redirect, render_template, url_for, flash, jsonify, session, abort
from componentes.helpers.autenticador_login import md5_hash, autenticar_usuario
from componentes.helpers.conexion_bd import obtener_conexion
from contextlib import closing
import secrets

app = Flask(__name__)
app.secret_key = 'change_me'


@app.before_request
def csrf_protect():
    if request.method == "POST":
        token = session.get('_csrf_token')
        form_token = request.form.get('csrf_token')
        if not token or token != form_token:
            abort(400)


def generate_csrf_token():
    token = session.get('_csrf_token')
    if not token:
        token = secrets.token_hex(16)
        session['_csrf_token'] = token
    return token


@app.context_processor
def csrf_token():
    return dict(csrf_token=generate_csrf_token)



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
    with closing(obtener_conexion()) as conexion:
        with conexion.cursor(dictionary=True) as cursor:
            cursor.execute(
                "SELECT nombre, apellido, correo, telefono, direccion FROM usuarios WHERE ld = %s",
                (usuario_id,),
            )
            usuario = cursor.fetchone()
    if usuario:
        return jsonify(usuario)
    return jsonify({'error': 'Usuario no encontrado'}), 404


@app.route('/nueva_orden', methods=['GET', 'POST'])
def nueva_orden():
    """Formulario para crear una nueva orden de servicio."""
    if request.method == 'POST':
        identificacion = request.form['id_usuario']
        descripcion = request.form['descripcion']
        tipo = request.form.get('tipo', 'computador')

        if tipo not in ('computador', 'celular'):
            flash('Tipo de servicio inválido')
            return redirect(url_for('nueva_orden', tipo='', id=identificacion))

        with closing(obtener_conexion()) as conexion:
            with conexion.cursor() as cursor:
                cursor.execute("SELECT id_usuario FROM usuarios WHERE ld = %s", (identificacion,))
                usuario = cursor.fetchone()
                if not usuario:
                    flash('El usuario no existe')
                    return redirect(url_for('nueva_orden', tipo=tipo, id=identificacion))

                id_usuario = usuario[0]
                cursor.execute(
                    "INSERT INTO ordenes_servicio (id_usuario, fecha_ingreso, descripcion_falla) "
                    "VALUES (%s, CURDATE(), %s)",
                    (id_usuario, descripcion),
                )
                id_orden = cursor.lastrowid
                cursor.execute(
                    "INSERT INTO servicios (id_orden, tipo) VALUES (%s, %s)",
                    (id_orden, tipo),
                )
                conexion.commit()

        flash('Orden creada correctamente')
        return redirect(url_for('inicio_admin'))

    tipo = request.args.get('tipo', '')
    id_usuario = request.args.get('id', '')
    return render_template('admin/nueva_orden.html', tipo=tipo, id_usuario=id_usuario)




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
