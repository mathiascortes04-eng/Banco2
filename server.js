// server.js — Banco Capital RP
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'capital-rp-banco-secreto-cambiar-en-produccion';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

db.initDB();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------------- Auth middleware ----------------
function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No autorizado. Inicia sesión de nuevo.' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const account = db.findAccountById(payload.id);
    if (!account) return res.status(401).json({ error: 'Cuenta no encontrada.' });
    if (account.status === 'bloqueado') return res.status(403).json({ error: 'Esta cuenta ha sido bloqueada.' });
    req.account = account;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Sesión inválida o expirada.' });
  }
}

function adminOnly(req, res, next) {
  if (req.account.role !== 'admin') return res.status(403).json({ error: 'Acceso solo para administradores.' });
  next();
}

function publicAccount(a) {
  return {
    id: a.id,
    accountNumber: a.accountNumber,
    discordUser: a.discordUser,
    nombreIC: a.nombreIC,
    cedulaIC: a.cedulaIC,
    edadIC: a.edadIC,
    role: a.role,
    balance: a.balance,
    status: a.status,
    cardNumber: a.cardNumber,
    cardCVV: a.cardCVV,
    cardExpiry: a.cardExpiry,
    createdAt: a.createdAt,
    lastIncome: a.lastIncome,
    lastTransfer: a.lastTransfer,
    lastLoan: a.lastLoan,
    nivel: db.clienteNivel(a.balance)
  };
}

// ---------------- Validaciones ----------------
function validCedula(cedula) {
  // Formato flexible tipo cédula/IC costarricense: dígitos y guiones, 6-12 caracteres
  return typeof cedula === 'string' && /^[0-9\-]{4,15}$/.test(cedula.trim());
}

// ================= RUTAS DE AUTENTICACIÓN =================

app.post('/api/register', (req, res) => {
  try {
    const { discordUser, nombreIC, cedulaIC, edadIC, password } = req.body;
    if (!discordUser || !nombreIC || !cedulaIC || !edadIC || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }
    if (String(discordUser).trim().length < 2) {
      return res.status(400).json({ error: 'Usuario de Discord inválido.' });
    }
    if (!validCedula(cedulaIC)) {
      return res.status(400).json({ error: 'Cédula IC inválida. Use solo números y guiones.' });
    }
    const edad = parseInt(edadIC, 10);
    if (isNaN(edad) || edad < 18 || edad > 99) {
      return res.status(400).json({ error: 'La edad IC debe estar entre 18 y 99 años.' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }
    if (db.findAccountByDiscord(discordUser)) {
      return res.status(409).json({ error: 'Ese Usuario de Discord ya tiene una cuenta registrada.' });
    }
    const accounts = db.getAccounts();
    if (accounts.some(a => a.cedulaIC.toLowerCase() === cedulaIC.trim().toLowerCase())) {
      return res.status(409).json({ error: 'Esa Cédula IC ya está registrada en otra cuenta.' });
    }

    const account = db.createAccount({
      discordUser: discordUser.trim(),
      nombreIC: nombreIC.trim(),
      cedulaIC: cedulaIC.trim(),
      edadIC: edad,
      password
    });

    db.addTransaction({
      accountId: account.id,
      type: 'apertura',
      amount: 0,
      description: `Cuenta creada — número asignado ${account.accountNumber}`
    });

    const token = jwt.sign({ id: account.id }, JWT_SECRET, { expiresIn: '12h' });
    res.json({ token, account: publicAccount(account) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno al registrar la cuenta.' });
  }
});

app.post('/api/login', (req, res) => {
  try {
    const { discordUser, nombreIC, cedulaIC, password } = req.body;
    if (!discordUser || !nombreIC || !cedulaIC || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }
    const account = db.findAccountByDiscord(discordUser);
    if (!account) return res.status(401).json({ error: 'Credenciales incorrectas.' });
    if (account.status === 'bloqueado') return res.status(403).json({ error: 'Esta cuenta ha sido bloqueada. Contacte a un administrador.' });

    const nombreOk = account.nombreIC.toLowerCase() === String(nombreIC).trim().toLowerCase();
    const cedulaOk = account.cedulaIC.toLowerCase() === String(cedulaIC).trim().toLowerCase();
    const passOk = bcrypt.compareSync(password, account.passwordHash);

    if (!nombreOk || !cedulaOk || !passOk) {
      return res.status(401).json({ error: 'Credenciales incorrectas. Verifique Usuario Discord, Nombre IC, Cédula IC y Contraseña.' });
    }

    const token = jwt.sign({ id: account.id }, JWT_SECRET, { expiresIn: '12h' });
    res.json({ token, account: publicAccount(account) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno al iniciar sesión.' });
  }
});

app.get('/api/me', auth, (req, res) => {
  res.json({ account: publicAccount(req.account) });
});

// ================= DASHBOARD / HISTORIAL =================

app.get('/api/dashboard', auth, (req, res) => {
  processLoansForAccount(req.account.id);
  const fresh = db.findAccountById(req.account.id);
  const loans = db.getLoansForAccount(fresh.id);
  const activeLoans = loans.filter(l => l.status === 'activo');
  const dineroPrestado = activeLoans.reduce((sum, l) => sum + l.remaining, 0);
  const history = db.getTransactionsForAccount(fresh.id).slice(0, 15);

  res.json({
    account: publicAccount(fresh),
    dineroPrestado,
    activeLoans,
    history
  });
});

app.get('/api/history', auth, (req, res) => {
  const history = db.getTransactionsForAccount(req.account.id);
  res.json({ history });
});

app.get('/api/stats', auth, (req, res) => {
  const history = db.getTransactionsForAccount(req.account.id);
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const buckets = { diario: 0, semanal: 0, mensual: 0, recibido: 0, enviado: 0 };
  history.forEach(t => {
    const t0 = new Date(t.date).getTime();
    const isIncome = t.amount > 0;
    if (isIncome) buckets.recibido += t.amount; else buckets.enviado += Math.abs(t.amount);
    if (now - t0 <= day) buckets.diario += t.amount;
    if (now - t0 <= 7 * day) buckets.semanal += t.amount;
    if (now - t0 <= 30 * day) buckets.mensual += t.amount;
  });
  res.json(buckets);
});

// ================= TRANSFERENCIAS =================

app.post('/api/transfer', auth, (req, res) => {
  try {
    const { target, amount } = req.body;
    const monto = Number(amount);
    if (!target || !monto || monto <= 0) {
      return res.status(400).json({ error: 'Datos de transferencia inválidos.' });
    }
    const sender = db.findAccountById(req.account.id);
    let recipient = db.findAccountByDiscord(target) || db.findAccountByNumber(target);
    if (!recipient) return res.status(404).json({ error: 'No existe ninguna cuenta con ese Usuario de Discord o Número de Cuenta.' });
    if (recipient.id === sender.id) return res.status(400).json({ error: 'No puedes transferirte dinero a ti mismo.' });
    if (sender.balance < monto) return res.status(400).json({ error: 'Saldo insuficiente para realizar la transferencia.' });

    const newSenderBalance = sender.balance - monto;
    const newRecipientBalance = recipient.balance + monto;
    db.updateAccount(sender.id, { balance: newSenderBalance, lastTransfer: new Date().toISOString() });
    db.updateAccount(recipient.id, { balance: newRecipientBalance, lastIncome: new Date().toISOString() });

    db.addTransaction({ accountId: sender.id, type: 'transferencia_enviada', amount: -monto, description: `Transferencia enviada a ${recipient.discordUser} (${recipient.accountNumber})` });
    db.addTransaction({ accountId: recipient.id, type: 'transferencia_recibida', amount: monto, description: `Transferencia recibida de ${sender.discordUser} (${sender.accountNumber})` });

    res.json({ ok: true, balance: newSenderBalance, message: `Transferencia de ₡${monto.toLocaleString('es-CR')} enviada correctamente.` });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno al procesar la transferencia.' });
  }
});

// ================= PRÉSTAMOS =================

const LOAN_MAX = 40000000;
const LOAN_MIN = 1000000;

app.post('/api/loan/request', auth, (req, res) => {
  try {
    const monto = Number(req.body.amount);
    if (!monto || monto < LOAN_MIN) return res.status(400).json({ error: `El préstamo mínimo es ₡${LOAN_MIN.toLocaleString('es-CR')}.` });
    if (monto > LOAN_MAX) return res.status(400).json({ error: `El préstamo máximo es ₡${LOAN_MAX.toLocaleString('es-CR')}.` });

    const existing = db.getLoansForAccount(req.account.id).filter(l => l.status === 'activo');
    if (existing.length > 0) return res.status(400).json({ error: 'Ya tienes un préstamo activo. Debes finalizarlo antes de solicitar otro.' });

    const weekly = db.weeklyPaymentFor(monto);
    const loan = db.addLoan({
      accountId: req.account.id,
      amount: monto,
      remaining: monto,
      weeklyPayment: weekly,
      status: 'activo',
      nextPaymentDate: new Date(Date.now() + WEEK_MS).toISOString(),
      history: []
    });

    const account = db.findAccountById(req.account.id);
    const newBalance = account.balance + monto;
    db.updateAccount(account.id, { balance: newBalance, lastLoan: new Date().toISOString() });
    db.addTransaction({ accountId: account.id, type: 'prestamo_aprobado', amount: monto, description: `Préstamo aprobado por ₡${monto.toLocaleString('es-CR')} (pago semanal ₡${weekly.toLocaleString('es-CR')})` });

    res.json({ ok: true, loan, balance: newBalance });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno al solicitar el préstamo.' });
  }
});

app.get('/api/loans', auth, (req, res) => {
  processLoansForAccount(req.account.id);
  res.json({ loans: db.getLoansForAccount(req.account.id) });
});

app.post('/api/loan/pay-early', auth, (req, res) => {
  try {
    const { loanId, amount } = req.body;
    const monto = Number(amount);
    const loan = db.getLoansForAccount(req.account.id).find(l => l.id === loanId && l.status === 'activo');
    if (!loan) return res.status(404).json({ error: 'Préstamo no encontrado o ya finalizado.' });
    if (!monto || monto <= 0) return res.status(400).json({ error: 'Monto de abono inválido.' });
    const account = db.findAccountById(req.account.id);
    if (account.balance < monto) return res.status(400).json({ error: 'Saldo insuficiente para realizar el abono.' });

    const abono = Math.min(monto, loan.remaining);
    const newRemaining = loan.remaining - abono;
    const newBalance = account.balance - abono;
    db.updateAccount(account.id, { balance: newBalance });
    db.updateLoan(loan.id, {
      remaining: newRemaining,
      status: newRemaining <= 0 ? 'pagado' : 'activo',
      history: [...(loan.history || []), { date: new Date().toISOString(), amount: abono, type: 'abono_manual' }]
    });
    db.addTransaction({ accountId: account.id, type: 'pago_prestamo', amount: -abono, description: `Abono manual a préstamo — ₡${abono.toLocaleString('es-CR')}` });

    res.json({ ok: true, balance: newBalance, remaining: newRemaining, status: newRemaining <= 0 ? 'pagado' : 'activo' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno al abonar el préstamo.' });
  }
});

app.post('/api/loan/cancel', auth, (req, res) => {
  const { loanId } = req.body;
  const loan = db.getLoansForAccount(req.account.id).find(l => l.id === loanId && l.status === 'activo');
  if (!loan) return res.status(404).json({ error: 'Préstamo no encontrado.' });
  db.updateLoan(loan.id, { status: 'cancelado' });
  db.addTransaction({ accountId: req.account.id, type: 'prestamo_cancelado', amount: 0, description: `Préstamo cancelado. Saldo pendiente al momento: ₡${loan.remaining.toLocaleString('es-CR')}` });
  res.json({ ok: true });
});

// Procesa pagos semanales automáticos vencidos para una cuenta específica
function processLoansForAccount(accountId) {
  const loans = db.getLoansForAccount(accountId).filter(l => l.status === 'activo');
  if (loans.length === 0) return;
  const account = db.findAccountById(accountId);
  let balance = account.balance;

  loans.forEach(loan => {
    let next = new Date(loan.nextPaymentDate).getTime();
    let remaining = loan.remaining;
    let history = loan.history || [];
    let changed = false;

    while (Date.now() >= next && remaining > 0) {
      const pago = Math.min(loan.weeklyPayment, remaining);
      if (balance >= pago) {
        balance -= pago;
        remaining -= pago;
        history.push({ date: new Date(next).toISOString(), amount: pago, type: 'pago_automatico' });
        db.addTransaction({ accountId, type: 'pago_prestamo_automatico', amount: -pago, description: `Pago semanal automático de préstamo — ₡${pago.toLocaleString('es-CR')}` });
      } else {
        history.push({ date: new Date(next).toISOString(), amount: 0, type: 'pago_atrasado_saldo_insuficiente' });
      }
      next += WEEK_MS;
      changed = true;
    }

    if (changed) {
      db.updateLoan(loan.id, {
        remaining,
        nextPaymentDate: new Date(next).toISOString(),
        status: remaining <= 0 ? 'pagado' : 'activo',
        history
      });
    }
  });

  if (balance !== account.balance) {
    db.updateAccount(accountId, { balance });
  }
}

function processAllLoans() {
  const accounts = db.getAccounts();
  accounts.forEach(a => processLoansForAccount(a.id));
}

// Revisa préstamos vencidos cada hora (además de revisarlos en cada login/consulta)
setInterval(processAllLoans, 60 * 60 * 1000);

// ================= DEPÓSITOS / RETIROS (usuario) =================

app.post('/api/deposit', auth, (req, res) => {
  const monto = Number(req.body.amount);
  if (!monto || monto <= 0) return res.status(400).json({ error: 'Monto inválido.' });
  const account = db.findAccountById(req.account.id);
  const newBalance = account.balance + monto;
  db.updateAccount(account.id, { balance: newBalance, lastIncome: new Date().toISOString() });
  db.addTransaction({ accountId: account.id, type: 'deposito', amount: monto, description: `Depósito manual de ₡${monto.toLocaleString('es-CR')}` });
  res.json({ ok: true, balance: newBalance });
});

app.post('/api/withdraw', auth, (req, res) => {
  const monto = Number(req.body.amount);
  if (!monto || monto <= 0) return res.status(400).json({ error: 'Monto inválido.' });
  const account = db.findAccountById(req.account.id);
  if (account.balance < monto) return res.status(400).json({ error: 'Saldo insuficiente.' });
  const newBalance = account.balance - monto;
  db.updateAccount(account.id, { balance: newBalance });
  db.addTransaction({ accountId: account.id, type: 'retiro', amount: -monto, description: `Retiro de ₡${monto.toLocaleString('es-CR')}` });
  res.json({ ok: true, balance: newBalance });
});

// ================= PANEL DE ADMINISTRADOR =================

app.get('/api/admin/accounts', auth, adminOnly, (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  let accounts = db.getAccounts();
  if (q) {
    accounts = accounts.filter(a =>
      a.discordUser.toLowerCase().includes(q) ||
      a.nombreIC.toLowerCase().includes(q) ||
      a.cedulaIC.toLowerCase().includes(q) ||
      a.accountNumber.toLowerCase().includes(q)
    );
  }
  res.json({ accounts: accounts.map(publicAccount) });
});

app.post('/api/admin/accounts', auth, adminOnly, (req, res) => {
  try {
    const { discordUser, nombreIC, cedulaIC, edadIC, password } = req.body;
    if (!discordUser || !nombreIC || !cedulaIC || !edadIC || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }
    if (db.findAccountByDiscord(discordUser)) {
      return res.status(409).json({ error: 'Ese Usuario de Discord ya tiene una cuenta.' });
    }
    const account = db.createAccount({ discordUser, nombreIC, cedulaIC, edadIC: parseInt(edadIC, 10), password });
    db.addTransaction({ accountId: account.id, type: 'apertura_admin', amount: 0, description: `Cuenta creada por administrador (${req.account.discordUser})` });
    res.json({ ok: true, account: publicAccount(account) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno al crear la cuenta.' });
  }
});

app.put('/api/admin/accounts/:id', auth, adminOnly, (req, res) => {
  const target = db.findAccountById(req.params.id);
  if (!target) return res.status(404).json({ error: 'Cuenta no encontrada.' });
  const { nombreIC, cedulaIC, edadIC, discordUser, password } = req.body;
  const patch = {};
  if (nombreIC) patch.nombreIC = nombreIC;
  if (cedulaIC) patch.cedulaIC = cedulaIC;
  if (edadIC) patch.edadIC = parseInt(edadIC, 10);
  if (discordUser) patch.discordUser = discordUser;
  if (password) patch.passwordHash = bcrypt.hashSync(password, 10);
  const updated = db.updateAccount(target.id, patch);
  db.addTransaction({ accountId: target.id, type: 'ajuste_admin', amount: 0, description: `Datos de la cuenta editados por administrador (${req.account.discordUser})` });
  res.json({ ok: true, account: publicAccount(updated) });
});

app.delete('/api/admin/accounts/:id', auth, adminOnly, (req, res) => {
  const target = db.findAccountById(req.params.id);
  if (!target) return res.status(404).json({ error: 'Cuenta no encontrada.' });
  if (target.role === 'admin') return res.status(400).json({ error: 'No se puede eliminar la cuenta de administrador.' });
  db.deleteAccount(target.id);
  res.json({ ok: true });
});

app.post('/api/admin/accounts/:id/give', auth, adminOnly, (req, res) => {
  const target = db.findAccountById(req.params.id);
  if (!target) return res.status(404).json({ error: 'Cuenta no encontrada.' });
  const monto = Number(req.body.amount);
  if (!monto || monto <= 0) return res.status(400).json({ error: 'Monto inválido.' });
  const newBalance = target.balance + monto;
  db.updateAccount(target.id, { balance: newBalance, lastIncome: new Date().toISOString() });
  db.addTransaction({ accountId: target.id, type: 'ajuste_admin_credito', amount: monto, description: `Dinero agregado por administrador (${req.account.discordUser}): ₡${monto.toLocaleString('es-CR')}` });
  res.json({ ok: true, balance: newBalance });
});

app.post('/api/admin/accounts/:id/take', auth, adminOnly, (req, res) => {
  const target = db.findAccountById(req.params.id);
  if (!target) return res.status(404).json({ error: 'Cuenta no encontrada.' });
  const monto = Number(req.body.amount);
  if (!monto || monto <= 0) return res.status(400).json({ error: 'Monto inválido.' });
  const newBalance = Math.max(0, target.balance - monto);
  db.updateAccount(target.id, { balance: newBalance });
  db.addTransaction({ accountId: target.id, type: 'ajuste_admin_debito', amount: -monto, description: `Dinero retirado por administrador (${req.account.discordUser}): ₡${monto.toLocaleString('es-CR')}` });
  res.json({ ok: true, balance: newBalance });
});

app.post('/api/admin/accounts/:id/block', auth, adminOnly, (req, res) => {
  const target = db.findAccountById(req.params.id);
  if (!target) return res.status(404).json({ error: 'Cuenta no encontrada.' });
  db.updateAccount(target.id, { status: 'bloqueado' });
  res.json({ ok: true });
});

app.post('/api/admin/accounts/:id/unblock', auth, adminOnly, (req, res) => {
  const target = db.findAccountById(req.params.id);
  if (!target) return res.status(404).json({ error: 'Cuenta no encontrada.' });
  db.updateAccount(target.id, { status: 'activo' });
  res.json({ ok: true });
});

app.get('/api/admin/loans', auth, adminOnly, (req, res) => {
  const loans = db.getLoans();
  const accounts = db.getAccounts();
  const enriched = loans.map(l => {
    const acc = accounts.find(a => a.id === l.accountId);
    return { ...l, discordUser: acc ? acc.discordUser : '—', accountNumber: acc ? acc.accountNumber : '—' };
  });
  res.json({ loans: enriched });
});

app.post('/api/admin/loans/:id/approve', auth, adminOnly, (req, res) => {
  const loan = db.getLoans().find(l => l.id === req.params.id);
  if (!loan) return res.status(404).json({ error: 'Préstamo no encontrado.' });
  db.updateLoan(loan.id, { status: 'activo' });
  res.json({ ok: true });
});

app.post('/api/admin/loans/:id/cancel', auth, adminOnly, (req, res) => {
  const loan = db.getLoans().find(l => l.id === req.params.id);
  if (!loan) return res.status(404).json({ error: 'Préstamo no encontrado.' });
  db.updateLoan(loan.id, { status: 'cancelado' });
  res.json({ ok: true });
});

app.get('/api/admin/transactions', auth, adminOnly, (req, res) => {
  res.json({ transactions: db.getTransactions().slice(0, 300) });
});

// ================= SPA fallback =================
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🏦 Banco Capital RP corriendo en el puerto ${PORT}`);
});
