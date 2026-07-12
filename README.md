# 🏦 Banco Capital RP

Sistema bancario web completo para el servidor de roleplay **Capital Roleplay**. Incluye registro/inicio de sesión con verificación de identidad IC, transferencias, sistema de préstamos con pagos semanales automáticos, tarjetas bancarias decorativas, niveles de cliente, estadísticas y un panel de administrador completo.

## 🎨 Diseño
Colores tomados directamente del logo oficial: negro profundo, morado neón, fucsia neón y azul neón, con efecto glassmorphism, brillos y animaciones sutiles. El banner oficial se usa como fondo ambiental de baja opacidad.

## 📦 Instalación local

```bash
npm install
npm start
```

El servidor arranca en `http://localhost:3000` (o el puerto que indique `PORT`).

Al iniciar por primera vez se crea automáticamente la **cuenta de administrador**:

| Campo | Valor |
|---|---|
| Usuario de Discord | `Admin` |
| Nombre IC | `adminCRP` |
| Cédula IC | `Admin` |
| Contraseña | `AdminBancoCRPH2K` |

⚠️ Usa exactamente esos 4 valores para iniciar sesión como administrador (el login pide los 4 campos, igual que el registro, como verificación extra de identidad).

## 🚀 Despliegue en Railway

1. Sube esta carpeta a un repositorio de GitHub (por ejemplo `capital-rp-banco`, igual que hiciste con `capital-rp-tickets`).
2. En Railway: **New Project → Deploy from GitHub repo**.
3. Railway detecta `package.json` y ejecuta `npm start` automáticamente.
4. Variables de entorno recomendadas (Settings → Variables):
   - `JWT_SECRET` → una clave larga y aleatoria (cámbiala del valor por defecto).
   - `PORT` → Railway la asigna automáticamente, no es necesario configurarla.
5. **Importante:** los datos se guardan en `data/*.json` dentro del propio contenedor. Si usas un plan de Railway sin volumen persistente, los datos se reinician en cada despliegue. Para producción real, agrega un **Volume** en Railway apuntando a la carpeta `/app/data`.

## 🗂 Estructura del proyecto

```
banco-capital-rp/
├── server.js          # Backend Express (rutas API, autenticación, lógica de préstamos)
├── db.js              # Capa de persistencia en JSON (cuentas, transacciones, préstamos)
├── package.json
├── data/               # Se crea automáticamente (accounts.json, transactions.json, loans.json)
└── public/
    ├── index.html      # Login / Registro
    ├── dashboard.html  # Panel de usuario
    ├── admin.html       # Panel de administrador
    ├── css/style.css
    ├── js/common.js     # Utilidades compartidas (API, toasts, formato de colones)
    ├── js/auth.js
    ├── js/dashboard.js
    ├── js/admin.js
    └── assets/          # logo.png y banner.webp
```

## 🔐 Seguridad implementada
- Contraseñas encriptadas con **bcrypt** (nunca se guardan ni se muestran en texto plano).
- Sesiones con **JWT** (12 horas de duración), enviado como `Authorization: Bearer`.
- Login pide Usuario Discord + Nombre IC + Cédula IC + Contraseña, los 4 deben coincidir.
- Validación de cédula, edad mínima (18 años) y Usuario Discord único.
- Middleware de autenticación y de administrador separados; las rutas `/api/admin/*` están bloqueadas para cuentas normales.

## 🏦 Reglas del sistema de préstamos
- Máximo por préstamo: **₡40.000.000**. Mínimo: **₡1.000.000**.
- Un usuario solo puede tener **un préstamo activo a la vez**.
- Pago automático semanal según el monto solicitado:
  - ₡1.000.000 – ₡4.999.999 → se rebaja **₡1.000.000** cada semana.
  - ₡5.000.000 – ₡10.000.000 → se rebaja **₡5.000.000** cada semana.
  - Más de ₡10.000.000 → se rebaja **₡10.000.000** cada semana.
- El servidor revisa pagos vencidos cada hora automáticamente y también al abrir el dashboard. Si el usuario no tiene saldo suficiente el día del pago, queda registrado como atrasado y se reintenta en la siguiente revisión sin perder el ciclo semanal.
- Los usuarios pueden abonar manualmente antes de tiempo o cancelar el préstamo desde su panel.

## 👮 Panel de administrador
Desde `admin.html` (o el enlace "Panel Admin" que aparece automáticamente en el menú al iniciar sesión como Admin):
- Crear, editar y eliminar cuentas.
- Dar o quitar dinero manualmente.
- Bloquear / desbloquear cuentas.
- Buscar cuentas por Discord, nombre, cédula o número de cuenta.
- Ver y cancelar cualquier préstamo del banco.
- Ver los últimos 300 movimientos de todo el banco.

## ✏️ Personalización rápida
- **Colores:** todos definidos como variables CSS al inicio de `public/css/style.css` (`--purple`, `--fuchsia`, `--blue-neon`, etc.).
- **Niveles de cliente:** función `clienteNivel()` en `db.js`.
- **Tramos de préstamo:** función `weeklyPaymentFor()` en `db.js`.
