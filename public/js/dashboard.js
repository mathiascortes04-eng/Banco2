// dashboard.js — Lógica del dashboard de usuario
let currentAccount = null;
let pendingTransfer = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  setupNav();
  setupMobileMenu();
  setupForms();
  await loadDashboard();

  // Refresca el saldo cada 20s — así si el bot de Discord mueve dinero
  // (transferencia, depósito, retiro) se ve reflejado aquí sin recargar la página.
  setInterval(() => { loadDashboard().catch(() => {}); }, 20000);
});

// ---------------- Navegación entre secciones ----------------
function setupNav() {
  document.querySelectorAll('.nav-link[data-section]').forEach(link => {
    if (!link.dataset.section) return;
    link.addEventListener('click', () => showSection(link.dataset.section));
  });
  document.querySelectorAll('[data-section-link]').forEach(btn => {
    btn.addEventListener('click', () => showSection(btn.dataset.sectionLink));
  });
}

function showSection(name) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));
  document.getElementById('section-' + name).classList.remove('hidden');
  document.querySelectorAll('.nav-link[data-section]').forEach(l => l.classList.remove('active'));
  const active = document.querySelector(`.nav-link[data-section="${name}"]`);
  if (active) active.classList.add('active');

  if (name === 'transacciones') loadFullHistory();
  if (name === 'prestamos') loadLoans();
  if (name === 'estadisticas') loadStats();

  closeSidebar();
}

function setupMobileMenu() {
  const toggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  toggle?.addEventListener('click', () => {
    sidebar.classList.add('open');
    overlay.classList.add('show');
  });
  overlay?.addEventListener('click', closeSidebar);
}
function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('show');
}

// ---------------- Carga principal ----------------
async function loadDashboard() {
  try {
    const data = await api('/dashboard');
    currentAccount = data.account;
    renderUserChrome(data.account);
    renderInicio(data.account, data.dineroPrestado, data.activeLoans);
    renderHistory('recent-history', data.history);
  } catch (err) {
    toast(err.message, 'err');
    if (err.status === 401) setTimeout(logout, 1200);
  }
}

function renderUserChrome(acc) {
  document.getElementById('user-avatar').textContent = initials(acc.nombreIC);
  document.getElementById('user-name').textContent = acc.nombreIC;
  document.getElementById('user-account').textContent = acc.accountNumber;
  document.getElementById('hi-name').textContent = acc.nombreIC;

  const statusBadge = document.getElementById('status-badge');
  statusBadge.textContent = acc.status === 'activo' ? 'Cuenta activa' : 'Cuenta bloqueada';
  statusBadge.className = 'badge ' + (acc.status === 'activo' ? 'badge-activo' : 'badge-bloqueado');

  if (acc.role === 'admin') {
    document.getElementById('admin-link').classList.remove('hidden');
  }

  // Tarjeta bancaria
  document.getElementById('card-holder').textContent = acc.nombreIC.toUpperCase();
  document.getElementById('card-number').textContent = acc.cardNumber;
  document.getElementById('card-cvv').textContent = acc.cardCVV;
  document.getElementById('card-expiry').textContent = acc.cardExpiry;
  document.getElementById('card-nivel').textContent = acc.nivel;

  // Perfil (cuenta)
  document.getElementById('p-accnum').textContent = acc.accountNumber;
  document.getElementById('p-discord').textContent = acc.discordUser;
  document.getElementById('p-lastincome').textContent = fmtDate(acc.lastIncome);
  document.getElementById('p-lasttransfer').textContent = fmtDate(acc.lastTransfer);
  document.getElementById('p-lastloan').textContent = fmtDate(acc.lastLoan);

  // Perfil (sección completa)
  document.getElementById('pf-discord').textContent = acc.discordUser;
  document.getElementById('pf-nombre').textContent = acc.nombreIC;
  document.getElementById('pf-cedula').textContent = acc.cedulaIC;
  document.getElementById('pf-edad').textContent = acc.edadIC;
  document.getElementById('pf-cuenta').textContent = acc.accountNumber;
  document.getElementById('pf-fecha').textContent = fmtDate(acc.createdAt);
  const nivelBadge = document.getElementById('pf-nivel');
  nivelBadge.textContent = acc.nivel;
  nivelBadge.className = 'badge ' + nivelBadgeClass(acc.nivel);
}

function renderInicio(acc, dineroPrestado, activeLoans) {
  document.getElementById('stat-cash').textContent = fmtColones(acc.cash || 0);
  document.getElementById('stat-balance').textContent = fmtColones(acc.balance);
  document.getElementById('stat-loaned').textContent = fmtColones(dineroPrestado);
  document.getElementById('stat-loaned-sub').textContent = activeLoans.length > 0
    ? `${activeLoans.length} préstamo(s) activo(s)` : 'Sin préstamos activos';
  document.getElementById('stat-nivel').textContent = acc.nivel;
}

function renderHistory(elId, history) {
  const el = document.getElementById(elId);
  if (!history || history.length === 0) {
    el.innerHTML = '<div class="empty-state">Aún no hay movimientos registrados en tu cuenta.</div>';
    return;
  }
  el.innerHTML = history.map(h => {
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
}

async function loadFullHistory() {
  try {
    const data = await api('/history');
    renderHistory('full-history', data.history);
  } catch (err) { toast(err.message, 'err'); }
}

// ---------------- Préstamos ----------------
async function loadLoans() {
  try {
    const data = await api('/loans');
    const active = data.loans.find(l => l.status === 'activo');
    const box = document.getElementById('active-loan-box');
    const requestPanel = document.getElementById('loan-request-panel');

    if (!active) {
      box.innerHTML = '<div class="empty-state">No tienes préstamos activos.</div>';
      requestPanel.querySelector('button').disabled = false;
      return;
    }
    requestPanel.querySelector('button').disabled = true;

    const pct = Math.max(0, Math.min(100, 100 - (active.remaining / active.amount) * 100));
    box.innerHTML = `
      <div style="font-size:13.5px;display:flex;flex-direction:column;gap:10px;">
        <div style="display:flex;justify-content:space-between;"><span class="text-dim">Monto original</span><strong>${fmtColones(active.amount)}</strong></div>
        <div style="display:flex;justify-content:space-between;"><span class="text-dim">Saldo pendiente</span><strong>${fmtColones(active.remaining)}</strong></div>
        <div style="display:flex;justify-content:space-between;"><span class="text-dim">Pago semanal</span><strong>${fmtColones(active.weeklyPayment)}</strong></div>
        <div style="display:flex;justify-content:space-between;"><span class="text-dim">Próximo pago</span><strong>${fmtDate(active.nextPaymentDate)}</strong></div>
        <div class="progress-bar"><div class="fill" style="width:${pct}%"></div></div>
        <div class="text-dim" style="font-size:11.5px;text-align:right;">${pct.toFixed(0)}% pagado</div>
      </div>
      <div style="display:flex;gap:8px;margin-top:16px;">
        <button class="btn btn-secondary btn-sm" style="flex:1" onclick="openPayEarly('${active.id}', ${active.remaining})">Abonar</button>
        <button class="btn btn-danger btn-sm" style="flex:1" onclick="cancelLoan('${active.id}')">Cancelar</button>
      </div>
    `;
  } catch (err) { toast(err.message, 'err'); }
}

async function openPayEarly(loanId, remaining) {
  const amount = prompt(`¿Cuánto deseas abonar? (Saldo pendiente: ${fmtColones(remaining)})`);
  if (!amount) return;
  try {
    const data = await api('/loan/pay-early', { method: 'POST', body: JSON.stringify({ loanId, amount: Number(amount) }) });
    toast('Abono realizado correctamente.', 'ok');
    await loadDashboard();
    await loadLoans();
  } catch (err) { toast(err.message, 'err'); }
}

async function cancelLoan(loanId) {
  if (!confirm('¿Seguro que deseas cancelar este préstamo? Esta acción quedará registrada.')) return;
  try {
    await api('/loan/cancel', { method: 'POST', body: JSON.stringify({ loanId }) });
    toast('Préstamo cancelado.', 'info');
    await loadDashboard();
    await loadLoans();
  } catch (err) { toast(err.message, 'err'); }
}

// ---------------- Estadísticas ----------------
async function loadStats() {
  try {
    const s = await api('/stats');
    document.getElementById('st-diario').textContent = fmtColones(s.diario);
    document.getElementById('st-semanal').textContent = fmtColones(s.semanal);
    document.getElementById('st-mensual').textContent = fmtColones(s.mensual);
    document.getElementById('st-recibido').textContent = fmtColones(s.recibido);
    document.getElementById('st-enviado').textContent = fmtColones(s.enviado);
  } catch (err) { toast(err.message, 'err'); }
}

// ---------------- Formularios ----------------
function setupForms() {
  document.getElementById('transfer-form').addEventListener('submit', e => {
    e.preventDefault();
    const target = document.getElementById('transfer-target').value.trim();
    const amount = Number(document.getElementById('transfer-amount').value);
    if (!target || !amount || amount <= 0) return toast('Completa los datos correctamente.', 'err');
    pendingTransfer = { target, amount };
    document.getElementById('modal-amount').textContent = fmtColones(amount);
    document.getElementById('modal-target').textContent = target;
    document.getElementById('transfer-modal').classList.add('show');
  });

  document.getElementById('modal-cancel').addEventListener('click', () => {
    document.getElementById('transfer-modal').classList.remove('show');
  });

  document.getElementById('modal-confirm').addEventListener('click', async () => {
    if (!pendingTransfer) return;
    const btn = document.getElementById('modal-confirm');
    btn.disabled = true;
    btn.textContent = 'Enviando...';
    try {
      const data = await api('/transfer', { method: 'POST', body: JSON.stringify(pendingTransfer) });
      toast(data.message, 'ok');
      document.getElementById('transfer-modal').classList.remove('show');
      document.getElementById('transfer-form').reset();
      await loadDashboard();
    } catch (err) {
      toast(err.message, 'err');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Confirmar envío';
      pendingTransfer = null;
    }
  });

  document.getElementById('loan-amount').addEventListener('input', e => {
    const amount = Number(e.target.value);
    const preview = document.getElementById('loan-preview');
    if (!amount) { preview.textContent = 'El pago semanal se calculará automáticamente.'; return; }
    let weekly = amount > 10000000 ? 10000000 : amount >= 5000000 ? 5000000 : 1000000;
    preview.textContent = `Pago semanal estimado: ${fmtColones(weekly)}`;
  });

  document.getElementById('loan-form').addEventListener('submit', async e => {
    e.preventDefault();
    const amount = Number(document.getElementById('loan-amount').value);
    if (amount < 1000000 || amount > 40000000) return toast('El préstamo debe estar entre ₡1.000.000 y ₡40.000.000.', 'err');
    try {
      const data = await api('/loan/request', { method: 'POST', body: JSON.stringify({ amount }) });
      toast('Préstamo aprobado y depositado en tu cuenta.', 'ok');
      document.getElementById('loan-form').reset();
      document.getElementById('loan-preview').textContent = 'El pago semanal se calculará automáticamente.';
      await loadDashboard();
      await loadLoans();
    } catch (err) { toast(err.message, 'err'); }
  });

  document.getElementById('deposit-form').addEventListener('submit', async e => {
    e.preventDefault();
    const amount = Number(document.getElementById('deposit-amount').value);
    try {
      await api('/deposit', { method: 'POST', body: JSON.stringify({ amount }) });
      toast(`Depósito de ${fmtColones(amount)} realizado.`, 'ok');
      document.getElementById('deposit-form').reset();
      await loadDashboard();
    } catch (err) { toast(err.message, 'err'); }
  });

  document.getElementById('withdraw-form').addEventListener('submit', async e => {
    e.preventDefault();
    const amount = Number(document.getElementById('withdraw-amount').value);
    try {
      await api('/withdraw', { method: 'POST', body: JSON.stringify({ amount }) });
      toast(`Retiro de ${fmtColones(amount)} realizado.`, 'ok');
      document.getElementById('withdraw-form').reset();
      await loadDashboard();
    } catch (err) { toast(err.message, 'err'); }
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
