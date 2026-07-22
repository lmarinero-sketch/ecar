from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import sqlite3, os, hashlib
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'ecar-paniol-2024'
DB = os.path.join(os.path.dirname(__file__), 'ecar.db')

def get_db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.executescript('''
        CREATE TABLE IF NOT EXISTS rubros (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL UNIQUE,
            tipo TEXT NOT NULL DEFAULT 'consumible'
        );
        CREATE TABLE IF NOT EXISTS empleados (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            rol TEXT NOT NULL DEFAULT 'pañolero',
            password TEXT NOT NULL,
            activo INTEGER NOT NULL DEFAULT 1
        );
        CREATE TABLE IF NOT EXISTS productos (
            codigo TEXT PRIMARY KEY,
            descripcion TEXT NOT NULL,
            rubro_id INTEGER,
            medida TEXT,
            unidad TEXT NOT NULL DEFAULT 'unidad',
            estanteria INTEGER,
            nivel INTEGER,
            bin INTEGER,
            stock_estanteria REAL NOT NULL DEFAULT 0,
            stock_reserva REAL NOT NULL DEFAULT 0,
            stock_obra REAL NOT NULL DEFAULT 0,
            stock_minimo REAL NOT NULL DEFAULT 0,
            conteo_completo INTEGER DEFAULT 0,
            observaciones TEXT,
            activo INTEGER NOT NULL DEFAULT 1,
            FOREIGN KEY (rubro_id) REFERENCES rubros(id)
        );
        CREATE TABLE IF NOT EXISTS movimientos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha_hora TEXT NOT NULL,
            codigo_producto TEXT NOT NULL,
            tipo TEXT NOT NULL,
            cantidad REAL NOT NULL,
            empleado_id INTEGER,
            observaciones TEXT,
            FOREIGN KEY (codigo_producto) REFERENCES productos(codigo),
            FOREIGN KEY (empleado_id) REFERENCES empleados(id)
        );
        CREATE TABLE IF NOT EXISTS maquinas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            numero_serie TEXT NOT NULL UNIQUE,
            nombre TEXT NOT NULL,
            marca TEXT,
            modelo TEXT,
            rubro_id INTEGER,
            estanteria INTEGER,
            nivel INTEGER,
            bin INTEGER,
            estado TEXT NOT NULL DEFAULT 'Disponible',
            observaciones TEXT,
            activo INTEGER NOT NULL DEFAULT 1,
            FOREIGN KEY (rubro_id) REFERENCES rubros(id)
        );
        CREATE TABLE IF NOT EXISTS prestamos_maquinas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            maquina_id INTEGER NOT NULL,
            empleado_id INTEGER NOT NULL,
            fecha_salida TEXT NOT NULL,
            fecha_devolucion TEXT,
            observaciones TEXT,
            FOREIGN KEY (maquina_id) REFERENCES maquinas(id),
            FOREIGN KEY (empleado_id) REFERENCES empleados(id)
        );
        CREATE TABLE IF NOT EXISTS historial_estados_maquinas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            maquina_id INTEGER NOT NULL,
            estado_anterior TEXT NOT NULL,
            estado_nuevo TEXT NOT NULL,
            empleado_id INTEGER,
            fecha_hora TEXT NOT NULL,
            motivo TEXT NOT NULL,
            FOREIGN KEY (maquina_id) REFERENCES maquinas(id),
            FOREIGN KEY (empleado_id) REFERENCES empleados(id)
        );
    ''')
    # Seed data
    rubros = [
        ('Agua','consumible'),('Gas','consumible'),('Cloaca','consumible'),
        ('Electricidad','consumible'),('Luz','consumible'),('Bulonería','consumible'),
        ('EPP','consumible'),('Pintura','consumible'),('Estufas','consumible'),
        ('Varios','consumible'),('Sin clasificar','consumible'),
        ('Máquinas eléctricas','maquina'),('Máquinas de mano','maquina')
    ]
    for r in rubros:
        c.execute('INSERT OR IGNORE INTO rubros (nombre, tipo) VALUES (?,?)', r)
    pw_gerencia = hashlib.sha256('gerencia123'.encode()).hexdigest()
    pw_panolero = hashlib.sha256('panolero123'.encode()).hexdigest()
    c.execute('INSERT OR IGNORE INTO empleados (id,nombre,rol,password) VALUES (1,"Administrador ECAR","gerencia",?)', (pw_gerencia,))
    c.execute('INSERT OR IGNORE INTO empleados (id,nombre,rol,password) VALUES (2,"Juan Pérez","pañolero",?)', (pw_panolero,))
    c.execute('INSERT OR IGNORE INTO empleados (id,nombre,rol,password) VALUES (3,"Carlos López","pañolero",?)', (pw_panolero,))
    conn.commit()
    conn.close()

def login_required(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated

def gerencia_required(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        if session.get('rol') != 'gerencia':
            return jsonify({'error': 'Sin permisos'}), 403
        return f(*args, **kwargs)
    return decorated

@app.route('/')
def index():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return redirect(url_for('buscador'))

@app.route('/login', methods=['GET','POST'])
def login():
    error = None
    if request.method == 'POST':
        data = request.get_json() if request.is_json else request.form
        emp_id = int(data.get('empleado_id', 0))
        password = data.get('password', '')
        pw_hash = hashlib.sha256(password.encode()).hexdigest()
        conn = get_db()
        emp = conn.execute('SELECT * FROM empleados WHERE id=? AND password=? AND activo=1', (emp_id, pw_hash)).fetchone()
        conn.close()
        if emp:
            session['user_id'] = emp['id']
            session['nombre'] = emp['nombre']
            session['rol'] = emp['rol']
            if request.is_json:
                return jsonify({'ok': True, 'rol': emp['rol']})
            return redirect(url_for('buscador'))
        error = 'Contraseña incorrecta'
        if request.is_json:
            return jsonify({'ok': False, 'error': error}), 401
    conn = get_db()
    empleados = conn.execute('SELECT id, nombre FROM empleados WHERE activo=1 ORDER BY nombre').fetchall()
    conn.close()
    return render_template('login.html', empleados=empleados, error=error)

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/buscador')
@login_required
def buscador():
    conn = get_db()
    rubros = conn.execute('SELECT * FROM rubros ORDER BY nombre').fetchall()
    empleados = conn.execute('SELECT id, nombre FROM empleados WHERE activo=1 ORDER BY nombre').fetchall()
    conn.close()
    return render_template('buscador.html', rubros=rubros, empleados=empleados,
                           nombre=session['nombre'], rol=session['rol'])

@app.route('/api/buscar')
@login_required
def api_buscar():
    q = request.args.get('q', '').strip()
    rubro_id = request.args.get('rubro_id', '')
    tipo = request.args.get('tipo', 'consumible')
    conn = get_db()
    if tipo == 'maquina':
        sql = '''SELECT m.*, r.nombre as rubro_nombre
                 FROM maquinas m LEFT JOIN rubros r ON m.rubro_id=r.id
                 WHERE m.activo=1'''
        params = []
        if q:
            sql += ' AND (m.nombre LIKE ? OR m.numero_serie LIKE ? OR m.marca LIKE ?)'
            params += [f'%{q}%', f'%{q}%', f'%{q}%']
        if rubro_id:
            sql += ' AND m.rubro_id=?'
            params.append(rubro_id)
        sql += ' ORDER BY m.nombre LIMIT 50'
        rows = conn.execute(sql, params).fetchall()
        result = [dict(r) for r in rows]
    else:
        sql = '''SELECT p.*, r.nombre as rubro_nombre,
                        (p.stock_estanteria + p.stock_reserva + p.stock_obra) as stock_total
                 FROM productos p LEFT JOIN rubros r ON p.rubro_id=r.id
                 WHERE p.activo=1'''
        params = []
        if q:
            sql += ' AND (p.descripcion LIKE ? OR p.codigo LIKE ? OR p.medida LIKE ?)'
            params += [f'%{q}%', f'%{q}%', f'%{q}%']
        if rubro_id:
            sql += ' AND p.rubro_id=?'
            params.append(rubro_id)
        sql += ' ORDER BY p.descripcion LIMIT 50'
        rows = conn.execute(sql, params).fetchall()
        result = [dict(r) for r in rows]
    conn.close()
    return jsonify(result)

@app.route('/api/producto/<codigo>')
@login_required
def api_producto(codigo):
    conn = get_db()
    p = conn.execute('''SELECT p.*, r.nombre as rubro_nombre,
                               (p.stock_estanteria+p.stock_reserva+p.stock_obra) as stock_total
                        FROM productos p LEFT JOIN rubros r ON p.rubro_id=r.id
                        WHERE p.codigo=?''', (codigo,)).fetchone()
    movs = conn.execute('''SELECT m.*, e.nombre as empleado_nombre
                           FROM movimientos m LEFT JOIN empleados e ON m.empleado_id=e.id
                           WHERE m.codigo_producto=? ORDER BY m.fecha_hora DESC LIMIT 10''', (codigo,)).fetchall()
    conn.close()
    if not p:
        return jsonify({'error': 'No encontrado'}), 404
    return jsonify({'producto': dict(p), 'movimientos': [dict(m) for m in movs]})

@app.route('/api/maquina/<int:mid>')
@login_required
def api_maquina(mid):
    conn = get_db()
    m = conn.execute('''SELECT m.*, r.nombre as rubro_nombre
                        FROM maquinas m LEFT JOIN rubros r ON m.rubro_id=r.id
                        WHERE m.id=?''', (mid,)).fetchone()
    prestamo = conn.execute('''SELECT p.*, e.nombre as empleado_nombre
                               FROM prestamos_maquinas p LEFT JOIN empleados e ON p.empleado_id=e.id
                               WHERE p.maquina_id=? AND p.fecha_devolucion IS NULL
                               ORDER BY p.fecha_salida DESC LIMIT 1''', (mid,)).fetchone()
    historial = conn.execute('''SELECT h.*, e.nombre as empleado_nombre
                                FROM historial_estados_maquinas h LEFT JOIN empleados e ON h.empleado_id=e.id
                                WHERE h.maquina_id=? ORDER BY h.fecha_hora DESC LIMIT 10''', (mid,)).fetchall()
    conn.close()
    if not m:
        return jsonify({'error': 'No encontrado'}), 404
    return jsonify({'maquina': dict(m),
                    'prestamo_activo': dict(prestamo) if prestamo else None,
                    'historial': [dict(h) for h in historial]})

@app.route('/api/movimiento', methods=['POST'])
@login_required
def api_movimiento():
    data = request.get_json()
    codigo = data.get('codigo_producto')
    tipo = data.get('tipo')
    cantidad = float(data.get('cantidad', 0))
    empleado_id = data.get('empleado_id')
    obs = data.get('observaciones', '')
    if not codigo or not tipo or cantidad <= 0:
        return jsonify({'error': 'Datos incompletos'}), 400
    conn = get_db()
    p = conn.execute('SELECT * FROM productos WHERE codigo=?', (codigo,)).fetchone()
    if not p:
        conn.close()
        return jsonify({'error': 'Producto no encontrado'}), 404
    if tipo == 'Salida' and p['stock_estanteria'] < cantidad:
        conn.close()
        return jsonify({'error': f'Stock insuficiente. Disponible: {p["stock_estanteria"]}'}), 400
    if tipo == 'Salida':
        conn.execute('UPDATE productos SET stock_estanteria=stock_estanteria-? WHERE codigo=?', (cantidad, codigo))
    elif tipo == 'Entrada':
        conn.execute('UPDATE productos SET stock_estanteria=stock_estanteria+? WHERE codigo=?', (cantidad, codigo))
    elif tipo == 'Devolución':
        conn.execute('UPDATE productos SET stock_estanteria=stock_estanteria+?, stock_obra=MAX(0,stock_obra-?) WHERE codigo=?', (cantidad, cantidad, codigo))
    elif tipo == 'Ajuste':
        if session.get('rol') != 'gerencia':
            conn.close()
            return jsonify({'error': 'Sin permisos para ajustar'}), 403
        conn.execute('UPDATE productos SET stock_estanteria=? WHERE codigo=?', (cantidad, codigo))
    conn.execute('INSERT INTO movimientos (fecha_hora,codigo_producto,tipo,cantidad,empleado_id,observaciones) VALUES (?,?,?,?,?,?)',
                 (datetime.now().strftime('%Y-%m-%d %H:%M:%S'), codigo, tipo, cantidad, empleado_id, obs))
    conn.commit()
    p2 = conn.execute('SELECT stock_estanteria,stock_reserva,stock_obra FROM productos WHERE codigo=?', (codigo,)).fetchone()
    conn.close()
    return jsonify({'ok': True, 'stock': dict(p2)})

@app.route('/api/prestar_maquina', methods=['POST'])
@login_required
def api_prestar_maquina():
    data = request.get_json()
    mid = data.get('maquina_id')
    emp_id = data.get('empleado_id')
    obs = data.get('observaciones', '')
    conn = get_db()
    m = conn.execute('SELECT * FROM maquinas WHERE id=?', (mid,)).fetchone()
    if not m or m['estado'] != 'Disponible':
        conn.close()
        return jsonify({'error': 'Máquina no disponible'}), 400
    conn.execute('INSERT INTO prestamos_maquinas (maquina_id,empleado_id,fecha_salida,observaciones) VALUES (?,?,?,?)',
                 (mid, emp_id, datetime.now().strftime('%Y-%m-%d %H:%M:%S'), obs))
    conn.execute('INSERT INTO historial_estados_maquinas (maquina_id,estado_anterior,estado_nuevo,empleado_id,fecha_hora,motivo) VALUES (?,?,?,?,?,?)',
                 (mid, 'Disponible', 'En obra', session['user_id'], datetime.now().strftime('%Y-%m-%d %H:%M:%S'), f'Préstamo a empleado'))
    conn.execute('UPDATE maquinas SET estado="En obra" WHERE id=?', (mid,))
    conn.commit()
    conn.close()
    return jsonify({'ok': True})

@app.route('/api/devolver_maquina', methods=['POST'])
@login_required
def api_devolver_maquina():
    data = request.get_json()
    mid = data.get('maquina_id')
    obs = data.get('observaciones', '')
    conn = get_db()
    conn.execute('UPDATE prestamos_maquinas SET fecha_devolucion=? WHERE maquina_id=? AND fecha_devolucion IS NULL',
                 (datetime.now().strftime('%Y-%m-%d %H:%M:%S'), mid))
    m = conn.execute('SELECT * FROM maquinas WHERE id=?', (mid,)).fetchone()
    conn.execute('INSERT INTO historial_estados_maquinas (maquina_id,estado_anterior,estado_nuevo,empleado_id,fecha_hora,motivo) VALUES (?,?,?,?,?,?)',
                 (mid, m['estado'], 'Disponible', session['user_id'], datetime.now().strftime('%Y-%m-%d %H:%M:%S'), obs or 'Devolución'))
    conn.execute('UPDATE maquinas SET estado="Disponible" WHERE id=?', (mid,))
    conn.commit()
    conn.close()
    return jsonify({'ok': True})

@app.route('/api/cambiar_estado_maquina', methods=['POST'])
@login_required
def api_cambiar_estado_maquina():
    data = request.get_json()
    mid = data.get('maquina_id')
    estado_nuevo = data.get('estado')
    motivo = data.get('motivo', '')
    estados_validos = ['Disponible','En obra','En reparación','En cuarentena','A reemplazar','Fuera de servicio']
    if estado_nuevo not in estados_validos:
        return jsonify({'error': 'Estado inválido'}), 400
    conn = get_db()
    m = conn.execute('SELECT * FROM maquinas WHERE id=?', (mid,)).fetchone()
    conn.execute('INSERT INTO historial_estados_maquinas (maquina_id,estado_anterior,estado_nuevo,empleado_id,fecha_hora,motivo) VALUES (?,?,?,?,?,?)',
                 (mid, m['estado'], estado_nuevo, session['user_id'], datetime.now().strftime('%Y-%m-%d %H:%M:%S'), motivo))
    conn.execute('UPDATE maquinas SET estado=? WHERE id=?', (estado_nuevo, mid))
    conn.commit()
    conn.close()
    return jsonify({'ok': True})

# --- GERENCIA ENDPOINTS ---
@app.route('/api/producto', methods=['POST'])
@gerencia_required
def api_crear_producto():
    data = request.get_json()
    codigo = data.get('codigo','').strip()
    if not codigo:
        return jsonify({'error': 'Código requerido'}), 400
    conn = get_db()
    try:
        conn.execute('''INSERT INTO productos (codigo,descripcion,rubro_id,medida,unidad,estanteria,nivel,bin,
                        stock_estanteria,stock_reserva,stock_obra,stock_minimo,observaciones)
                        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)''',
                     (codigo, data.get('descripcion'), data.get('rubro_id'), data.get('medida'),
                      data.get('unidad','unidad'), data.get('estanteria'), data.get('nivel'), data.get('bin'),
                      data.get('stock_estanteria',0), data.get('stock_reserva',0), data.get('stock_obra',0),
                      data.get('stock_minimo',0), data.get('observaciones','')))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Código ya existe'}), 409
    conn.close()
    return jsonify({'ok': True})

@app.route('/api/producto/<codigo>', methods=['PUT'])
@gerencia_required
def api_editar_producto(codigo):
    data = request.get_json()
    conn = get_db()
    conn.execute('''UPDATE productos SET descripcion=?,rubro_id=?,medida=?,unidad=?,estanteria=?,nivel=?,bin=?,
                    stock_minimo=?,observaciones=?,conteo_completo=? WHERE codigo=?''',
                 (data.get('descripcion'), data.get('rubro_id'), data.get('medida'), data.get('unidad'),
                  data.get('estanteria'), data.get('nivel'), data.get('bin'),
                  data.get('stock_minimo'), data.get('observaciones'), data.get('conteo_completo',0), codigo))
    conn.commit()
    conn.close()
    return jsonify({'ok': True})

@app.route('/api/maquina', methods=['POST'])
@gerencia_required
def api_crear_maquina():
    data = request.get_json()
    conn = get_db()
    try:
        conn.execute('''INSERT INTO maquinas (numero_serie,nombre,marca,modelo,rubro_id,estanteria,nivel,bin,observaciones)
                        VALUES (?,?,?,?,?,?,?,?,?)''',
                     (data.get('numero_serie'), data.get('nombre'), data.get('marca'), data.get('modelo'),
                      data.get('rubro_id'), data.get('estanteria'), data.get('nivel'), data.get('bin'),
                      data.get('observaciones','')))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Número de serie ya existe'}), 409
    conn.close()
    return jsonify({'ok': True})

@app.route('/api/empleado', methods=['POST'])
@gerencia_required
def api_crear_empleado():
    data = request.get_json()
    nombre = data.get('nombre','').strip()
    rol = data.get('rol', 'pañolero')
    password = data.get('password','panolero123')
    if not nombre:
        return jsonify({'error': 'Nombre requerido'}), 400
    pw_hash = hashlib.sha256(password.encode()).hexdigest()
    conn = get_db()
    conn.execute('INSERT INTO empleados (nombre,rol,password) VALUES (?,?,?)', (nombre, rol, pw_hash))
    conn.commit()
    conn.close()
    return jsonify({'ok': True})

@app.route('/api/empleados')
@login_required
def api_empleados():
    conn = get_db()
    rows = conn.execute('SELECT id, nombre, rol FROM empleados WHERE activo=1 ORDER BY nombre').fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/api/rubros')
@login_required
def api_rubros():
    conn = get_db()
    rows = conn.execute('SELECT * FROM rubros ORDER BY nombre').fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/api/alertas')
@login_required
def api_alertas():
    conn = get_db()
    rows = conn.execute('''SELECT p.*, r.nombre as rubro_nombre,
                                  (p.stock_estanteria+p.stock_reserva+p.stock_obra) as stock_total
                           FROM productos p LEFT JOIN rubros r ON p.rubro_id=r.id
                           WHERE p.activo=1 AND (p.stock_estanteria+p.stock_reserva+p.stock_obra) <= p.stock_minimo
                           ORDER BY (p.stock_estanteria+p.stock_reserva+p.stock_obra) ASC''').fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/api/movimientos')
@login_required
def api_movimientos():
    conn = get_db()
    rows = conn.execute('''SELECT m.*, e.nombre as empleado_nombre, p.descripcion as producto_nombre
                           FROM movimientos m
                           LEFT JOIN empleados e ON m.empleado_id=e.id
                           LEFT JOIN productos p ON m.codigo_producto=p.codigo
                           ORDER BY m.fecha_hora DESC LIMIT 200''').fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

if __name__ == '__main__':
    init_db()
    print('\n✅ ECAR Pañol corriendo en http://localhost:5000\n')
    print('   Usuarios de prueba:')
    print('   • Administrador ECAR → contraseña: gerencia123')
    print('   • Juan Pérez / Carlos López → contraseña: panolero123\n')
    app.run(debug=False, host='0.0.0.0', port=5000)
