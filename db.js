// common.js — utilidades compartidas por todas las páginas
const API = '/api';

function getToken() { return localStorage.getItem('crp_token'); }
function setToken(t) { localStorage.setItem('crp_token', t); }
function clearToken() { localStorage.removeItem('crp_token'); }

async function api(path, options = {}) {
  const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API + path, { ...options, headers });
  let data = {};
  try { data = await res.json(); } catch (e) { /* sin cuerpo */ }
  if (!res.ok) {
    const err = new Error(data.error || 'Ocurrió un error inesperado.');
    err.status = res.status;
    throw err;
  }
  return data;
}

function fmtColones(n) {
  const num = Number(n) || 0;
  return '₡' + num.toLocaleString('es-CR', { maximumFractionDigits: 0 });
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('es-CR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function toast(message, type = 'info') {
  const wrap = document.getElementById('toast-wrap');
  if (!wrap) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  wrap.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(30px)';
    el.style.transition = 'all 0.25s ease';
    setTimeout(() => el.remove(), 250);
  }, 4200);
}

function requireAuth() {
  if (!getToken()) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

function logout() {
  clearToken();
  window.location.href = 'index.html';
}

function nivelBadgeClass(nivel) {
  return {
    Bronce: 'badge-bronce', Plata: 'badge-plata', Oro: 'badge-oro',
    Platino: 'badge-platino', Diamante: 'badge-diamante'
  }[nivel] || 'badge-bronce';
}

function initials(name) {
  return (name || '?').trim().slice(0, 2).toUpperCase();
}
