// db.js — Capa de persistencia en archivos JSON para Banco Capital RP
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, 'data');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
const TX_FILE = path.join(DATA_DIR, 'transactions.json');
const LOANS_FILE = path.join(DATA_DIR, 'loans.json');
const COUNTERS_FILE = path.join(DATA_DIR, 'counters.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function readJSON(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, 'utf8').trim();
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error leyendo ${file}:`, e.message);
    return fallback;
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// ---------- Inicialización ----------
function initDB() {
  if (!fs.existsSync(ACCOUNTS_FILE)) writeJSON(ACCOUNTS_FILE, []);
  if (!fs.existsSync(TX_FILE)) writeJSON(TX_FILE, []);
  if (!fs.existsSync(LOANS_FILE)) writeJSON(LOANS_FILE, []);
  if (!fs.existsSync(COUNTERS_FILE)) writeJSON(COUNTERS_FILE, { nextAccountNumber: 1 });

  const accounts = readJSON(ACCOUNTS_FILE, []);
  const adminExists = accounts.some(a => a.role === 'admin');
  if (!adminExists) {
    const hash = bcrypt.hashSync('AdminBancoCRPH2K', 10);
    const adminAccount = {
      id: genId(),
      accountNumber: formatAccountNumber(nextAccountNumber()),
      discordUser: 'Admin',
      nombreIC: 'adminCRP',
      cedulaIC: 'Admin',
      edadIC: 99,
      passwordHash: hash,
      role: 'admin',
      balance: 0,
      status: 'activo', // activo | bloqueado
      cardNumber: generateCardNumber(),
      cardCVV: generateCVV(),
      cardExpiry: generateExpiry(),
      createdAt: new Date().toISOString(),
      lastIncome: null,
      lastTransfer: null,
      lastLoan: null
    };
    accounts.push(adminAccount);
    writeJSON(ACCOUNTS_FILE, accounts);
    console.log('✔ Cuenta de administrador creada (Usuario Discord: Admin)');
  }
}

function genId() {
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
}

function nextAccountNumber() {
  const counters = readJSON(COUNTERS_FILE, { nextAccountNumber: 1 });
  const n = counters.nextAccountNumber;
  counters.nextAccountNumber = n + 1;
  writeJSON(COUNTERS_FILE, counters);
  return n;
}

function formatAccountNumber(n) {
  return 'CR-' + String(n).padStart(8, '0');
}

function generateCardNumber() {
  const part = () => String(Math.floor(1000 + Math.random() * 9000));
  return `5400 89${Math.floor(10 + Math.random() * 89)} ${part()} ${part()}`;
}

function generateCVV() {
  return String(Math.floor(100 + Math.random() * 900));
}

function generateExpiry() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 4);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${yy}`;
}

// ---------- Accounts ----------
function getAccounts() {
  return readJSON(ACCOUNTS_FILE, []);
}
function saveAccounts(accounts) {
  writeJSON(ACCOUNTS_FILE, accounts);
}
function findAccountByDiscord(discordUser) {
  const accounts = getAccounts();
  return accounts.find(a => a.discordUser.toLowerCase() === String(discordUser).toLowerCase());
}
function findAccountById(id) {
  const accounts = getAccounts();
  return accounts.find(a => a.id === id);
}
function findAccountByNumber(accountNumber) {
  const accounts = getAccounts();
  return accounts.find(a => a.accountNumber === accountNumber);
}
function createAccount({ discordUser, nombreIC, cedulaIC, edadIC, password }) {
  const accounts = getAccounts();
  const passwordHash = bcrypt.hashSync(password, 10);
  const account = {
    id: genId(),
    accountNumber: formatAccountNumber(nextAccountNumber()),
    discordUser,
    nombreIC,
    cedulaIC,
    edadIC,
    passwordHash,
    role: 'user',
    balance: 0,
    status: 'activo',
    cardNumber: generateCardNumber(),
    cardCVV: generateCVV(),
    cardExpiry: generateExpiry(),
    createdAt: new Date().toISOString(),
    lastIncome: null,
    lastTransfer: null,
    lastLoan: null
  };
  accounts.push(account);
  saveAccounts(accounts);
  return account;
}
function updateAccount(id, patch) {
  const accounts = getAccounts();
  const idx = accounts.findIndex(a => a.id === id);
  if (idx === -1) return null;
  accounts[idx] = { ...accounts[idx], ...patch };
  saveAccounts(accounts);
  return accounts[idx];
}
function deleteAccount(id) {
  const accounts = getAccounts();
  const filtered = accounts.filter(a => a.id !== id);
  saveAccounts(filtered);
}

// ---------- Transactions ----------
function getTransactions() {
  return readJSON(TX_FILE, []);
}
function addTransaction(tx) {
  const list = getTransactions();
  const entry = {
    id: genId(),
    date: new Date().toISOString(),
    ...tx
  };
  list.unshift(entry);
  writeJSON(TX_FILE, list);
  return entry;
}
function getTransactionsForAccount(accountId) {
  return getTransactions().filter(t => t.accountId === accountId);
}

// ---------- Loans ----------
function getLoans() {
  return readJSON(LOANS_FILE, []);
}
function saveLoans(loans) {
  writeJSON(LOANS_FILE, loans);
}
function addLoan(loan) {
  const loans = getLoans();
  const entry = { id: genId(), createdAt: new Date().toISOString(), ...loan };
  loans.push(entry);
  saveLoans(loans);
  return entry;
}
function updateLoan(id, patch) {
  const loans = getLoans();
  const idx = loans.findIndex(l => l.id === id);
  if (idx === -1) return null;
  loans[idx] = { ...loans[idx], ...patch };
  saveLoans(loans);
  return loans[idx];
}
function getLoansForAccount(accountId) {
  return getLoans().filter(l => l.accountId === accountId);
}

// ---------- Reglas de préstamo ----------
function weeklyPaymentFor(amount) {
  if (amount > 10000000) return 10000000;
  if (amount >= 5000000) return 5000000;
  if (amount >= 1000000) return 1000000;
  return Math.ceil(amount); // montos menores a 1M (no debería ocurrir, mínimo forzado en API)
}

function clienteNivel(balance) {
  if (balance >= 60000000) return 'Diamante';
  if (balance >= 30000000) return 'Platino';
  if (balance >= 15000000) return 'Oro';
  if (balance >= 5000000) return 'Plata';
  return 'Bronce';
}

module.exports = {
  initDB,
  genId,
  formatAccountNumber,
  getAccounts,
  saveAccounts,
  findAccountByDiscord,
  findAccountById,
  findAccountByNumber,
  createAccount,
  updateAccount,
  deleteAccount,
  getTransactions,
  addTransaction,
  getTransactionsForAccount,
  getLoans,
  saveLoans,
  addLoan,
  updateLoan,
  getLoansForAccount,
  weeklyPaymentFor,
  clienteNivel
};
