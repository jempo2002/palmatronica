from flask import Flask, request, redirect, render_template, url_for, flash, jsonify
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
    elif rol == "correo_no_existe":
        return render_template("login.html", error_email="Este correo no se encuentra registrado")
    elif rol == "contrasena_incorrecta":
        return render_template("login.html", error_pwd="La contraseña es incorrecta.")
    else:
        return render_template("login.html", error="Usuario o contraseña incorrectos"), 401

@app.route("/inicio_admin")
def inicio_admin():
    return render_template("admin/inicio_admin.html")

@app.route("/historial")
def historial():
    return render_template("admin/historial.html")

@app.route('/api/ordenes')
def api_ordenes():
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        """SELECT o.id_orden, o.fecha_ingreso as fecha, s.tipo as tipo_dispositivo, s.id_servicio,
                  d.marca, d.modelo, d.imei, d.serial,
                  u.cc as cc_cliente, u.nombre as nombre_cliente
           FROM ordenes_servicio o
           INNER JOIN servicios s ON o.id_orden = s.id_orden
           LEFT JOIN dispositivos d ON s.id_servicio = d.id_servicio
           INNER JOIN usuarios u ON o.id_usuario = u.id_usuario
           ORDER BY o.fecha_ingreso DESC"""
    )
    ordenes = cursor.fetchall()
    cursor.close()
    conexion.close()
    return jsonify({'ordenes': ordenes})

@app.route('/api/usuario/<int:usuario_id>')
def api_usuario(usuario_id: int):
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        "SELECT id_usuario, nombre, apellido, correo, telefono, direccion FROM usuarios WHERE cc = %s",
        (usuario_id,)
    )
    usuario = cursor.fetchone()
    cursor.close()
    conexion.close()
    if usuario:
        return jsonify(usuario)
    return jsonify({}), 404


@app.route('/api/usuario/<int:usuario_id>/ordenes')
def api_ordenes_usuario(usuario_id: int):
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        """SELECT o.id_orden, o.fecha_ingreso, o.fecha_entrega, o.descripcion_falla, 
                  o.diagnostico, o.costo_total, s.tipo, s.id_servicio,
                  d.marca, d.modelo, d.imei, d.serial
           FROM ordenes_servicio o
           INNER JOIN servicios s ON o.id_orden = s.id_orden
           LEFT JOIN dispositivos d ON s.id_servicio = d.id_servicio
           INNER JOIN usuarios u ON o.id_usuario = u.id_usuario
           WHERE u.cc = %s
           ORDER BY o.fecha_ingreso DESC""",
        (usuario_id,)
    )
    ordenes = cursor.fetchall()
    cursor.close()
    conexion.close()
    return jsonify(ordenes)


@app.route('/api/orden/<int:id_orden>')
def api_orden(id_orden: int):
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    
    cursor.execute(
        """SELECT o.*, s.tipo, s.id_servicio, d.marca, d.modelo, d.imei, d.serial, d.password_patron,
                  u.cc, u.nombre, u.apellido, u.correo, u.telefono, u.direccion
           FROM ordenes_servicio o
           INNER JOIN servicios s ON o.id_orden = s.id_orden
           LEFT JOIN dispositivos d ON s.id_servicio = d.id_servicio
           INNER JOIN usuarios u ON o.id_usuario = u.id_usuario
           WHERE o.id_orden = %s""",
        (id_orden,)
    )
    orden = cursor.fetchone()
    
    if orden:
        cursor.execute(
            "SELECT nombre_item, valor, observacion FROM checklist_respuestas WHERE id_servicio = %s",
            (orden['id_servicio'],)
        )
        orden['checklist'] = cursor.fetchall()
    
    cursor.close()
    conexion.close()
    
    if orden:
        return jsonify(orden)
    return jsonify({}), 404


@app.route('/api/orden/<int:id_orden>', methods=['PUT', 'DELETE'])
def api_actualizar_orden(id_orden: int):
    if request.method == 'DELETE':
        conexion = obtener_conexion()
        cursor = conexion.cursor()
        try:
            # El borrado en cascada se encargará de las tablas relacionadas
            cursor.execute("DELETE FROM ordenes_servicio WHERE id_orden = %s", (id_orden,))
            conexion.commit()
            if cursor.rowcount > 0:
                return jsonify({'success': True, 'message': 'Orden eliminada correctamente'})
            else:
                return jsonify({'success': False, 'message': 'La orden no fue encontrada'}), 404
        except Exception as e:
            conexion.rollback()
            return jsonify({'success': False, 'error': str(e)}), 400
        finally:
            cursor.close()
            conexion.close()

    # Lógica PUT existente con soporte de actualización de dispositivo
    data = request.get_json()
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    
    try:
        if 'descripcion_falla' in data or 'diagnostico' in data or 'costo_total' in data or 'fecha_entrega' in data:
            campos = []
            valores = []
            
            if 'descripcion_falla' in data:
                campos.append("descripcion_falla = %s")
                valores.append(data['descripcion_falla'])
            if 'diagnostico' in data:
                campos.append("diagnostico = %s")
                valores.append(data['diagnostico'])
            if 'costo_total' in data:
                campos.append("costo_total = %s")
                valores.append(data['costo_total'])
            if 'fecha_entrega' in data:
                campos.append("fecha_entrega = %s")
                valores.append(data['fecha_entrega'])
            
            valores.append(id_orden)
            cursor.execute(
                f"UPDATE ordenes_servicio SET {', '.join(campos)} WHERE id_orden = %s",
                tuple(valores)
            )
        
        if 'checklist' in data or 'dispositivo' in data:
            cursor.execute("SELECT id_servicio FROM servicios WHERE id_orden = %s", (id_orden,))
            result = cursor.fetchone()
            if result:
                id_servicio = result[0]
                if 'checklist' in data:
                    cursor.execute("DELETE FROM checklist_respuestas WHERE id_servicio = %s", (id_servicio,))
                    for item, valor in data['checklist'].items():
                        cursor.execute(
                            "INSERT INTO checklist_respuestas (id_servicio, nombre_item, valor) VALUES (%s, %s, %s)",
                            (id_servicio, item, valor)
                        )
                if 'dispositivo' in data:
                    disp = data['dispositivo'] or {}
                    campos_d = []
                    valores_d = []
                    for campo_api, campo_db in (
                        ('marca','marca'),('modelo','modelo'),('imei','imei'),('serial','serial'),('password','password_patron')
                    ):
                        if disp.get(campo_api) is not None:
                            campos_d.append(f"{campo_db} = %s")
                            valores_d.append(disp.get(campo_api))
                    if campos_d:
                        valores_d.append(id_servicio)
                        cursor.execute(
                            f"UPDATE dispositivos SET {', '.join(campos_d)} WHERE id_servicio = %s",
                            tuple(valores_d)
                        )
        
        conexion.commit()
        return jsonify({'success': True, 'message': 'Orden actualizada correctamente'})
    except Exception as e:
        conexion.rollback()
        return jsonify({'success': False, 'error': str(e)}), 400
    finally:
        cursor.close()
        conexion.close()


@app.route('/admin/orden/<int:id_orden>')
def ver_orden(id_orden: int):
    """Muestra la plantilla de orden con datos guardados para ver/editar."""
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute(
        """SELECT o.id_orden, o.descripcion_falla, o.fecha_ingreso, o.fecha_entrega, o.diagnostico, o.costo_total,
                         s.tipo, s.id_servicio,
                         d.marca, d.modelo, d.imei, d.serial, d.password_patron,
                         u.id_usuario, u.cc, u.nombre, u.apellido, u.correo, u.telefono, u.direccion
                FROM ordenes_servicio o
                INNER JOIN servicios s ON o.id_orden = s.id_orden
                LEFT JOIN dispositivos d ON s.id_servicio = d.id_servicio
                INNER JOIN usuarios u ON o.id_usuario = u.id_usuario
                WHERE o.id_orden = %s""",
        (id_orden,)
    )
    orden = cursor.fetchone()
    cursor.close()
    conexion.close()
    if not orden:
        return redirect(url_for('historial'))

    # Elegir plantilla por tipo
    tipo = orden['tipo']
    if tipo == 'consola':
        return render_template('admin/nueva_orden_consola.html', edit=True, id_orden=id_orden, id_usuario=orden['cc'])
    else:
        return render_template('admin/nueva_orden.html', edit=True, id_orden=id_orden, id_usuario=orden['cc'], tipo='celular')


@app.route('/nueva_orden', methods=['GET', 'POST'])
def nueva_orden():
    """Formulario para crear una nueva orden de servicio para celulares."""
    if request.method == 'POST':
        # Verificar si es una petición JSON (desde JavaScript)
        if request.is_json:
            data = request.get_json()
            # id_usuario recibido desde el formulario es en realidad la CC del cliente
            cc = data.get('id_usuario')
            descripcion = data.get('descripcion')
            tipo = data.get('tipo', 'celular')
            
            # Datos del dispositivo
            marca = data.get('marca')
            modelo = data.get('modelo')
            imei = data.get('imei')
            password_patron = data.get('password', '')
            
            # Checklist
            checklist = data.get('checklist', {})
            
            conexion = obtener_conexion()
            cursor = conexion.cursor(dictionary=True)
            
            try:
                # Mapear CC a id_usuario (PK)
                cursor.execute("SELECT id_usuario FROM usuarios WHERE cc = %s", (cc,))
                fila_usuario = cursor.fetchone()
                if not fila_usuario:
                    return jsonify({'success': False, 'error': 'El usuario no existe (CC no registrada).'}), 400
                id_usuario_pk = fila_usuario['id_usuario']

                # Inserción dinámica permitiendo diagnostico, costo_total y fecha_entrega si vienen en la petición
                campos = ["id_usuario", "fecha_ingreso", "descripcion_falla"]
                placeholders = ["%s", "NOW()", "%s"]
                valores = [id_usuario_pk, descripcion]

                if data.get('diagnostico') is not None:
                    campos.append('diagnostico')
                    placeholders.append('%s')
                    valores.append(data.get('diagnostico'))
                if data.get('costo_total') is not None:
                    campos.append('costo_total')
                    placeholders.append('%s')
                    valores.append(data.get('costo_total'))
                if data.get('fecha_entrega') is not None:
                    campos.append('fecha_entrega')
                    placeholders.append('%s')
                    valores.append(data.get('fecha_entrega'))

                cursor.execute(
                    f"INSERT INTO ordenes_servicio ({', '.join(campos)}) VALUES ({', '.join(placeholders)})",
                    tuple(valores)
                )
                id_orden = cursor.lastrowid
                
                cursor.execute(
                    "INSERT INTO servicios (id_orden, tipo) VALUES (%s, %s)",
                    (id_orden, tipo),
                )
                id_servicio = cursor.lastrowid
                
                cursor.execute(
                    "INSERT INTO dispositivos (id_servicio, marca, modelo, imei, password_patron) "
                    "VALUES (%s, %s, %s, %s, %s)",
                    (id_servicio, marca, modelo, imei, password_patron),
                )
                
                # Guardar respuestas del checklist
                for nombre_item, valor in checklist.items():
                    cursor.execute(
                        "INSERT INTO checklist_respuestas (id_servicio, nombre_item, valor) "
                        "VALUES (%s, %s, %s)",
                        (id_servicio, nombre_item, valor)
                    )
                
                conexion.commit()
                return jsonify({'success': True, 'id_orden': id_orden, 'message': f'Orden {id_orden} creada correctamente'})
            except Exception as e:
                conexion.rollback()
                return jsonify({'success': False, 'error': str(e)}), 400
            finally:
                cursor.close()
                conexion.close()
        else:
            # Petición tradicional de formulario (fallback)
            cc = request.form['id_usuario']
            descripcion = request.form['descripcion']
            tipo = request.form.get('tipo')

            conexion = obtener_conexion()
            cursor = conexion.cursor(dictionary=True)
            
            # Mapear CC a id_usuario (PK)
            cursor.execute("SELECT id_usuario FROM usuarios WHERE cc = %s", (cc,))
            fila_usuario = cursor.fetchone()
            if not fila_usuario:
                cursor.close()
                conexion.close()
                flash('No existe un usuario con esa identificación (CC).')
                return redirect(url_for('inicio_admin'))
            id_usuario_pk = fila_usuario['id_usuario']
            cursor.execute(
                "INSERT INTO ordenes_servicio (id_usuario, fecha_ingreso, descripcion_falla) "
                "VALUES (%s, NOW(), %s)",
                (id_usuario_pk, descripcion),
            )
            id_orden = cursor.lastrowid
            cursor.execute(
                "INSERT INTO servicios (id_orden, tipo) VALUES (%s, %s)",
                (id_orden, tipo or 'celular'),
            )
            conexion.commit()
            cursor.close()
            conexion.close()
            flash(f'Orden creada correctamente. Número de orden: {id_orden}')
            return redirect(url_for('inicio_admin'))

    tipo = request.args.get('tipo', '')
    id_usuario = request.args.get('id', '')
    return render_template('admin/nueva_orden.html', tipo=tipo, id_usuario=id_usuario)


@app.route('/nueva_orden_consola', methods=['GET', 'POST'])
def nueva_orden_consola():
    """Formulario para crear una nueva orden de servicio para consolas/computadores."""
    if request.method == 'POST':
        if request.is_json:
            data = request.get_json()
            # El campo id_usuario del formulario es la CC
            cc = data.get('id_usuario')
            descripcion = data.get('descripcion')
            tipo = data.get('tipo', 'consola')

            marca = data.get('marca')
            modelo = data.get('modelo')
            serial = data.get('serial')
            password_patron = data.get('password', '')

            checklist = data.get('checklist', {})

            conexion = obtener_conexion()
            cursor = conexion.cursor(dictionary=True)
            try:
                # Mapear CC a PK
                cursor.execute("SELECT id_usuario FROM usuarios WHERE cc = %s", (cc,))
                fila_usuario = cursor.fetchone()
                if not fila_usuario:
                    return jsonify({'success': False, 'error': 'El usuario no existe (CC no registrada).'}), 400
                id_usuario_pk = fila_usuario['id_usuario']

                # Insert orden
                campos = ["id_usuario", "fecha_ingreso", "descripcion_falla"]
                placeholders = ["%s", "NOW()", "%s"]
                valores = [id_usuario_pk, descripcion]

                if data.get('diagnostico') is not None:
                    campos.append('diagnostico')
                    placeholders.append('%s')
                    valores.append(data.get('diagnostico'))
                if data.get('costo_total') is not None:
                    campos.append('costo_total')
                    placeholders.append('%s')
                    valores.append(data.get('costo_total'))
                if data.get('fecha_entrega') is not None:
                    campos.append('fecha_entrega')
                    placeholders.append('%s')
                    valores.append(data.get('fecha_entrega'))

                cursor.execute(
                    f"INSERT INTO ordenes_servicio ({', '.join(campos)}) VALUES ({', '.join(placeholders)})",
                    tuple(valores)
                )
                id_orden = cursor.lastrowid

                cursor.execute(
                    "INSERT INTO servicios (id_orden, tipo) VALUES (%s, %s)",
                    (id_orden, tipo),
                )
                id_servicio = cursor.lastrowid

                cursor.execute(
                    "INSERT INTO dispositivos (id_servicio, marca, modelo, serial, password_patron) "
                    "VALUES (%s, %s, %s, %s, %s)",
                    (id_servicio, marca, modelo, serial, password_patron),
                )

                for nombre_item, valor in checklist.items():
                    cursor.execute(
                        "INSERT INTO checklist_respuestas (id_servicio, nombre_item, valor) VALUES (%s, %s, %s)",
                        (id_servicio, nombre_item, valor)
                    )

                conexion.commit()
                return jsonify({'success': True, 'id_orden': id_orden, 'message': f'Orden {id_orden} creada correctamente'})
            except Exception as e:
                conexion.rollback()
                return jsonify({'success': False, 'error': str(e)}), 400
            finally:
                cursor.close()
                conexion.close()
        else:
            # Fallback formulario tradicional
            cc = request.form['id_usuario']
            descripcion = request.form['descripcion']
            tipo = request.form.get('tipo')

            conexion = obtener_conexion()
            cursor = conexion.cursor(dictionary=True)
            cursor.execute("SELECT id_usuario FROM usuarios WHERE cc = %s", (cc,))
            fila_usuario = cursor.fetchone()
            if not fila_usuario:
                cursor.close()
                conexion.close()
                flash('No existe un usuario con esa identificación (CC).')
                return redirect(url_for('inicio_admin'))
            id_usuario_pk = fila_usuario['id_usuario']

            cursor = conexion.cursor()
            cursor.execute(
                "INSERT INTO ordenes_servicio (id_usuario, fecha_ingreso, descripcion_falla) VALUES (%s, NOW(), %s)",
                (id_usuario_pk, descripcion),
            )
            id_orden = cursor.lastrowid
            cursor.execute(
                "INSERT INTO servicios (id_orden, tipo) VALUES (%s, %s)",
                (id_orden, (tipo or 'consola')),
            )
            conexion.commit()
            cursor.close()
            conexion.close()
            flash(f'Orden creada correctamente. Número de orden: {id_orden}')
            return redirect(url_for('inicio_admin'))

    tipo = request.args.get('tipo', '')
    id_usuario = request.args.get('id', '')
    return render_template('admin/nueva_orden_consola.html', tipo=tipo, id_usuario=id_usuario)


@app.route('/logout')
def logout():
    """Cierra la sesión actual y vuelve al inicio de sesión."""
    return redirect(url_for('index'))


@app.route('/registrarse', methods=['GET', 'POST'])
def registrarse():
    if request.method == 'POST':
        nombre = request.form['nombre'].strip()
        apellido = request.form['apellido'].strip()
        identificacion = request.form['identificacion'].strip()
        correo = request.form['correo'].strip().lower()
        telefono = request.form['telefono'].strip()
        direccion = request.form['direccion'].strip()
        rol = request.form.get('rol', 'cliente')
        pwd_hash = md5_hash(identificacion)

        conexion = obtener_conexion()
        cursor = conexion.cursor(dictionary=True)

        cursor.execute("SELECT COUNT(*) AS cnt FROM usuarios WHERE correo = %s", (correo,))
        existe = cursor.fetchone()['cnt']

        if existe:
            cursor.close()
            conexion.close()
            return render_template('registro.html', error_email="El correo ya está registrado.", es_admin=True)

        cursor.execute("SELECT COUNT(*) AS cnt FROM usuarios WHERE cc = %s", (identificacion,))
        existe_id = cursor.fetchone()['cnt']

        if existe_id:
            cursor.close()
            conexion.close()
            return render_template('registro.html', error_id="La identificación ya está registrada.", es_admin=True)
        
        cursor.execute(
            "INSERT INTO usuarios (nombre, apellido, cc, correo, contrasena, telefono, direccion, rol) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
            (nombre, apellido, identificacion, correo, pwd_hash, telefono, direccion, rol)
        )
        conexion.commit()
        cursor.close()
        conexion.close()

        flash("Usuario registrado correctamente.")
        return redirect(url_for('inicio_admin'))

    return render_template('registro.html', es_admin=True)


if __name__ == "__main__":
    app.run(debug=True)
