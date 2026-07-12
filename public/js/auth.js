// auth.js — Lógica de la página de acceso (login / registro)
document.addEventListener('DOMContentLoaded', () => {
  // Si ya hay sesión activa, saltar directo al dashboard
  if (getToken()) {
    api('/me').then(() => { window.location.href = 'dashboard.html'; }).catch(() => clearToken());
  }

  const tabs = document.querySelectorAll('.tab-btn');
  const forms = document.querySelectorAll('.auth-form');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      forms.forEach(f => f.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab + '-form').classList.add('active');
      hideAlerts();
    });
  });

  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('register-form').addEventListener('submit', handleRegister);
});

function hideAlerts() {
  document.getElementById('alert-error').classList.remove('show');
  document.getElementById('alert-success').classList.remove('show');
}

function showError(msg) {
  const el = document.getElementById('alert-error');
  el.textContent = msg;
  el.classList.add('show');
  document.getElementById('alert-success').classList.remove('show');
}

function showSuccess(msg) {
  const el = document.getElementById('alert-success');
  el.textContent = msg;
  el.classList.add('show');
  document.getElementById('alert-error').classList.remove('show');
}

async function handleLogin(e) {
  e.preventDefault();
  hideAlerts();
  const btn = document.getElementById('login-submit');
  const payload = {
    discordUser: document.getElementById('login-discord').value.trim(),
    nombreIC: document.getElementById('login-nombre').value.trim(),
    cedulaIC: document.getElementById('login-cedula').value.trim(),
    password: document.getElementById('login-password').value
  };
  btn.disabled = true;
  btn.textContent = 'Verificando...';
  try {
    const data = await api('/login', { method: 'POST', body: JSON.stringify(payload) });
    setToken(data.token);
    showSuccess('Acceso concedido. Redirigiendo...');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 500);
  } catch (err) {
    showError(err.message);
    btn.disabled = false;
    btn.textContent = 'Ingresar a mi cuenta';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  hideAlerts();
  const btn = document.getElementById('register-submit');
  const payload = {
    discordUser: document.getElementById('reg-discord').value.trim(),
    nombreIC: document.getElementById('reg-nombre').value.trim(),
    cedulaIC: document.getElementById('reg-cedula').value.trim(),
    edadIC: document.getElementById('reg-edad').value,
    password: document.getElementById('reg-password').value
  };
  btn.disabled = true;
  btn.textContent = 'Creando cuenta...';
  try {
    const data = await api('/register', { method: 'POST', body: JSON.stringify(payload) });
    setToken(data.token);
    showSuccess(`Cuenta creada — número asignado ${data.account.accountNumber}. Redirigiendo...`);
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 700);
  } catch (err) {
    showError(err.message);
    btn.disabled = false;
    btn.textContent = 'Crear mi cuenta bancaria';
  }
}
