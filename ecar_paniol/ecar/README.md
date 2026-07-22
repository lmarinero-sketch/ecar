# ECAR Pañol — Sistema de Gestión de Almacén

## Cómo arrancar

1. Asegurarse de tener **Python** instalado (https://www.python.org)
2. Hacer doble clic en **INICIAR_ECAR.bat**
3. El navegador se abre solo en http://localhost:5000
4. Desde otra PC en la misma red: abrir http://[IP-DE-ESTA-PC]:5000

## Usuarios de prueba

| Usuario              | Contraseña    | Rol      |
|----------------------|---------------|----------|
| Administrador ECAR   | gerencia123   | Gerencia |
| Juan Pérez           | panolero123   | Pañolero |
| Carlos López         | panolero123   | Pañolero |

## Qué puede hacer cada rol

### Pañolero
- Buscar productos y máquinas
- Ver stock y ubicación
- Entregar material (descuenta stock automáticamente)
- Registrar entradas y devoluciones
- Prestar y recibir devolución de máquinas
- Cambiar estado de máquinas

### Gerencia logística
- Todo lo anterior
- Agregar productos nuevos
- Agregar máquinas nuevas
- Agregar empleados
- Ajustar stock manualmente
- Ver historial completo de movimientos

## Estructura de archivos

```
ecar/
├── app.py              ← Servidor principal
├── ecar.db             ← Base de datos (se crea sola al iniciar)
├── INICIAR_ECAR.bat    ← Doble clic para arrancar
├── templates/
│   ├── login.html
│   └── buscador.html
└── README.md
```

## Base de datos

Los datos se guardan en `ecar.db` (SQLite).
Para hacer backup: copiar ese archivo.
Para migrar al futuro ERP: exportar desde SQLite a CSV o Excel.

## Rubros incluidos

Consumibles: Agua, Gas, Cloaca, Electricidad, Luz, Bulonería, EPP, Pintura, Estufas, Varios, Sin clasificar
Máquinas: Máquinas eléctricas, Máquinas de mano
