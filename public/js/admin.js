// admin.js — Lógica del panel de administrador
let allAccounts = [];
let editingAccountId = null;
let moneyModalMode = null; // 'give' | 'take'
let moneyModalAccountId = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  await verifyAdmin();
  setupNav();
  setupMobileMenu();
  setupAccountModal();
  setupMoneyModal();
  await loadAccounts();

  document.getElementById('search-input').addEventListener('input', debounce(e => {
    loadAccounts(e.target.value);
  }, 300));
});

async function verifyAdmin() {
  try {
    const data = await api('/me');
    if (data.account.role !== 'admin') {
      toast('Acceso solo para administradores.', 'err');
      setTimeout(() => window.location.href = 'dashboard.html', 1200);
      return;
    }
    document.getElementById('user-avatar').textContent = initials(data.account.nombreIC);
    document.getElementById('user-name').textContent = data.account.nombreIC;
  } catch (err) {
    logout();
  }
}

function setupNav() {
  document.querySelectorAll('.nav-link[data-section]').forEach(link => {
    link.addEventListener('click', () => showSection(link.dataset.section));
  });
}
function showSection(name) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));
  document.getElementById('section-' + name).classList.remove('hidden');
  document.querySelectorAll('.nav-link[data-section]').forEach(l => l.classList.remove('active'));
  document.querySelector(`.nav-link[data-section="${name}"]`)?.classList.add('active');
  if (name === 'prestamos') loadLoans();
  if (name === 'movimientos') loadGlobalHistory();
  closeSidebar();
}
function setupMobileMenu() {
  const toggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  toggle?.addEventListener('click', () => { sidebar.classList.add('open'); overlay.classList.add('show'); });
  overlay?.addEventListener('click', closeSidebar);
}
function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('show');
}

// ---------------- Cuentas ----------------
async function loadAccounts(q = '') {
  try {
    const data = await api('/admin/accounts' + (q ? `?q=${encodeURIComponent(q)}` : ''));
    allAccounts = data.accounts;
    renderAccountsTable();
  } catch (err) { toast(err.message, 'err'); }
}

function renderAccountsTable() {
  const tbody = document.getElementById('accounts-tbody');
  if (allAccounts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No se encontraron cuentas.</td></tr>';
    return;
  }
  tbody.innerHTML = allAccounts.map(a => `
    <tr>
      <td>${a.accountNumber}</td>
      <td>${escapeHtml(a.discordUser)}</td>
      <td>${escapeHtml(a.nombreIC)}</td>
      <td>${escapeHtml(a.cedulaIC)}</td>
      <td>${fmtColones(a.cash || 0)}</td>
      <td>${fmtColones(a.balance)}</td>
      <td><span class="badge ${nivelBadgeClass(a.nivel)}">${a.nivel}</span></td>
      <td><span class="badge ${a.status === 'activo' ? 'badge-activo' : 'badge-bloqueado'}">${a.status}</span></td>
      <td>
        <div class="row-actions">
          <button class="btn btn-secondary btn-sm" onclick="openEditAccount('${a.id}')">Editar</button>
          <button class="btn btn-ghost btn-sm" onclick="openMoneyModal('give','${a.id}','${escapeHtml(a.discordUser)}')">+ Dinero</button>
          <button class="btn btn-ghost btn-sm" onclick="openMoneyModal('take','${a.id}','${escapeHtml(a.discordUser)}')">− Dinero</button>
          ${a.status === 'activo'
            ? `<button class="btn btn-danger btn-sm" onclick="toggleBlock('${a.id}', true)">Bloquear</button>`
            : `<button class="btn btn-secondary btn-sm" onclick="toggleBlock('${a.id}', false)">Desbloquear</button>`}
          ${a.role !== 'admin' ? `<button class="btn btn-danger btn-sm" onclick="deleteAccount('${a.id}','${escapeHtml(a.discordUser)}')">Eliminar</button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

function setupAccountModal() {
  const modal = document.getElementById('account-modal');
  document.getElementById('new-account-btn').addEventListener('click', () => {
    editingAccountId = null;
    document.getElementById('account-modal-title').textContent = 'Crear cuenta';
    document.getElementById('am-password-label').textContent = 'Contraseña';
    document.getElementById('account-form').reset();
    document.getElementById('am-password').required = true;
    modal.classList.add('show');
  });
  document.getElementById('account-modal-cancel').addEventListener('click', () => modal.classList.remove('show'));

  document.getElementById('account-form').addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      discordUser: document.getElementById('am-discord').value.trim(),
      nombreIC: document.getElementById('am-nombre').value.trim(),
      cedulaIC: document.getElementById('am-cedula').value.trim(),
      edadIC: document.getElementById('am-edad').value,
      password: document.getElementById('am-password').value
    };
    try {
      if (editingAccountId) {
        if (!payload.password) delete payload.password;
        await api(`/admin/accounts/${editingAccountId}`, { method: 'PUT', body: JSON.stringify(payload) });
        toast('Cuenta actualizada correctamente.', 'ok');
      } else {
        await api('/admin/accounts', { method: 'POST', body: JSON.stringify(payload) });
        toast('Cuenta creada correctamente.', 'ok');
      }
      modal.classList.remove('show');
      await loadAccounts();
    } catch (err) { toast(err.message, 'err'); }
  });
}

function openEditAccount(id) {
  const acc = allAccounts.find(a => a.id === id);
  if (!acc) return;
  editingAccountId = id;
  document.getElementById('account-modal-title').textContent = 'Editar cuenta';
  document.getElementById('am-password-label').textContent = 'Nueva contraseña (opcional)';
  document.getElementById('am-password').required = false;
  document.getElementById('am-discord').value = acc.discordUser;
  document.getElementById('am-nombre').value = acc.nombreIC;
  document.getElementById('am-cedula').value = acc.cedulaIC;
  document.getElementById('am-edad').value = acc.edadIC;
  document.getElementById('am-password').value = '';
  document.getElementById('account-modal').classList.add('show');
}

async function toggleBlock(id, block) {
  try {
    await api(`/admin/accounts/${id}/${block ? 'block' : 'unblock'}`, { method: 'POST' });
    toast(block ? 'Cuenta bloqueada.' : 'Cuenta desbloqueada.', 'info');
    await loadAccounts();
  } catch (err) { toast(err.message, 'err'); }
}

async function deleteAccount(id, discordUser) {
  if (!confirm(`¿Eliminar la cuenta de ${discordUser}? Esta acción no se puede deshacer.`)) return;
  try {
    await api(`/admin/accounts/${id}`, { method: 'DELETE' });
    toast('Cuenta eliminada.', 'info');
    await loadAccounts();
  } catch (err) { toast(err.message, 'err'); }
}

function setupMoneyModal() {
  document.getElementById('money-modal-cancel').addEventListener('click', () => {
    document.getElementById('money-modal').classList.remove('show');
  });
  document.getElementById('money-modal-confirm').addEventListener('click', async () => {
    const amount = Number(document.getElementById('money-amount').value);
    const target = document.getElementById('money-target').value;
    if (!amount || amount <= 0) return toast('Monto inválido.', 'err');
    try {
      await api(`/admin/accounts/${moneyModalAccountId}/${moneyModalMode}`, { method: 'POST', body: JSON.stringify({ amount, target }) });
      toast(moneyModalMode === 'give' ? 'Dinero agregado correctamente.' : 'Dinero retirado correctamente.', 'ok');
      document.getElementById('money-modal').classList.remove('show');
      await loadAccounts();
    } catch (err) { toast(err.message, 'err'); }
  });
}

function openMoneyModal(mode, accountId, discordUser) {
  moneyModalMode = mode;
  moneyModalAccountId = accountId;
  document.getElementById('money-modal-title').textContent = mode === 'give' ? 'Agregar dinero' : 'Quitar dinero';
  document.getElementById('money-modal-sub').textContent = `Cuenta de: ${discordUser}`;
  document.getElementById('money-amount').value = '';
  document.getElementById('money-target').value = 'bank';
  document.getElementById('money-modal').classList.add('show');
}

// ---------------- Préstamos ----------------
async function loadLoans() {
  try {
    const data = await api('/admin/loans');
    const tbody = document.getElementById('loans-tbody');
    if (data.loans.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No hay préstamos registrados.</td></tr>';
      return;
    }
    tbody.innerHTML = data.loans.map(l => `
      <tr>
        <td>${escapeHtml(l.discordUser)}</td>
        <td>${l.accountNumber}</td>
        <td>${fmtColones(l.amount)}</td>
        <td>${fmtColones(l.remaining)}</td>
        <td>${fmtColones(l.weeklyPayment)}</td>
        <td><span class="badge ${loanBadgeClass(l.status)}">${l.status}</span></td>
        <td>
          <div class="row-actions">
            ${l.status === 'activo' ? `<button class="btn btn-danger btn-sm" onclick="adminCancelLoan('${l.id}')">Cancelar</button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) { toast(err.message, 'err'); }
}

function loanBadgeClass(status) {
  return { activo: 'badge-activo-loan', pagado: 'badge-pagado', cancelado: 'badge-cancelado', pendiente: 'badge-pendiente' }[status] || 'badge-pendiente';
}

async function adminCancelLoan(id) {
  if (!confirm('¿Cancelar este préstamo?')) return;
  try {
    await api(`/admin/loans/${id}/cancel`, { method: 'POST' });
    toast('Préstamo cancelado.', 'info');
    await loadLoans();
  } catch (err) { toast(err.message, 'err'); }
}

// ---------------- Movimientos globales ----------------
async function loadGlobalHistory() {
  try {
    const data = await api('/admin/transactions');
    const el = document.getElementById('global-history');
    if (data.transactions.length === 0) {
      el.innerHTML = '<div class="empty-state">No hay movimientos registrados.</div>';
      return;
    }
    el.innerHTML = data.transactions.map(h => {
      const pos = h.amount >= 0;
      return `
        <div class="history-item">
          <div class="history-icon ${pos ? 'pos' : 'neg'}">${pos ? '↓' : '↑'}</div>
          <div class="history-detail">
            <div class="desc">${escapeHtml(h.description)}</div>
            <div class="date">${fmtDate(h.date)}</div>
          </div>
          <div class="history-amount ${pos ? 'pos' : 'neg'}">${pos ? '+' : ''}${fmtColones(h.amount)}</div>
        </div>`;
    }).join('');
  } catch (err) { toast(err.message, 'err'); }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function debounce(fn, delay) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}
