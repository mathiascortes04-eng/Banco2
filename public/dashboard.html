<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Mi Cuenta — Banco Capital RP</title>
<link rel="icon" href="assets/logo.png">
<link rel="stylesheet" href="css/style.css">
</head>
<body>
<div id="toast-wrap"></div>
<div class="sidebar-overlay" id="sidebar-overlay"></div>

<div class="app-shell">
  <aside class="sidebar" id="sidebar">
    <div class="sidebar-brand">
      <img src="assets/logo.png" alt="Capital RP">
      <div>
        <span class="gradient-text">Banco Capital</span>
        <small>ROLEPLAY OFICIAL</small>
      </div>
    </div>

    <nav class="nav-group">
      <a class="nav-link active" data-section="inicio"><span class="ic">🏠</span> Inicio</a>
      <a class="nav-link" data-section="transacciones"><span class="ic">📜</span> Transacciones</a>
      <a class="nav-link" data-section="transferir"><span class="ic">💸</span> Transferir</a>
      <a class="nav-link" data-section="prestamos"><span class="ic">🏦</span> Préstamos</a>
      <a class="nav-link" data-section="movimientos"><span class="ic">💵</span> Depósitos / Retiros</a>
      <a class="nav-link" data-section="estadisticas"><span class="ic">📈</span> Estadísticas</a>
      <a class="nav-link" data-section="perfil"><span class="ic">👤</span> Perfil</a>
      <a class="nav-link hidden" id="admin-link" data-section="" href="admin.html"><span class="ic">👮</span> Panel Admin</a>
    </nav>

    <div class="sidebar-footer">
      <div class="user-chip">
        <div class="avatar" id="user-avatar">--</div>
        <div class="info">
          <strong id="user-name">Cargando...</strong>
          <small id="user-account">—</small>
        </div>
      </div>
      <button class="btn btn-ghost btn-block btn-sm" onclick="logout()">Cerrar sesión</button>
    </div>
  </aside>

  <main class="main">
    <div class="mobile-topbar glass">
      <button id="menu-toggle">☰</button>
      <strong class="gradient-text">Banco Capital RP</strong>
      <img src="assets/logo.png" style="width:30px">
    </div>

    <!-- ============ INICIO ============ -->
    <section class="page-section" id="section-inicio">
      <div class="topbar">
        <div>
          <h1>Bienvenido, <span id="hi-name" class="gradient-text">—</span></h1>
          <p>Este es el resumen de tu cuenta en Banco Capital RP</p>
        </div>
        <span class="badge" id="status-badge">—</span>
      </div>

      <div class="two-col">
        <div class="bank-card">
          <div class="row-top">
            <div>
              <div class="bank-name">BANCO CAPITAL RP</div>
              <div style="font-size:11px;color:rgba(244,242,255,0.7);margin-top:2px;" id="card-holder">—</div>
            </div>
            <div class="chip"></div>
          </div>
          <div class="number" id="card-number">•••• •••• •••• ••••</div>
          <div class="row-bottom">
            <div>CVV<strong id="card-cvv">•••</strong></div>
            <div>VÁLIDA HASTA<strong id="card-expiry">••/••</strong></div>
            <div>NIVEL<strong id="card-nivel">—</strong></div>
          </div>
        </div>

        <div class="glass panel" style="margin-bottom:0;">
          <div class="panel-head"><h2>Cuenta</h2></div>
          <div style="display:flex;flex-direction:column;gap:10px;font-size:13.5px;">
            <div style="display:flex;justify-content:space-between;"><span class="text-dim">Número de cuenta</span><strong id="p-accnum">—</strong></div>
            <div style="display:flex;justify-content:space-between;"><span class="text-dim">Usuario Discord</span><strong id="p-discord">—</strong></div>
            <div style="display:flex;justify-content:space-between;"><span class="text-dim">Último ingreso</span><strong id="p-lastincome">—</strong></div>
            <div style="display:flex;justify-content:space-between;"><span class="text-dim">Última transferencia</span><strong id="p-lasttransfer">—</strong></div>
            <div style="display:flex;justify-content:space-between;"><span class="text-dim">Último préstamo</span><strong id="p-lastloan">—</strong></div>
          </div>
        </div>
      </div>

      <div class="cards-grid">
        <div class="glass stat-card accent-fuchsia">
          <div class="icon-badge">💰</div>
          <div class="label">Saldo disponible</div>
          <div class="value" id="stat-balance">₡0</div>
          <div class="sub">Dinero en el banco</div>
        </div>
        <div class="glass stat-card accent-purple">
          <div class="icon-badge">🏦</div>
          <div class="label">Dinero prestado</div>
          <div class="value" id="stat-loaned">₡0</div>
          <div class="sub" id="stat-loaned-sub">Sin préstamos activos</div>
        </div>
        <div class="glass stat-card accent-blue">
          <div class="icon-badge">🏆</div>
          <div class="label">Nivel de cliente</div>
          <div class="value" id="stat-nivel">Bronce</div>
          <div class="sub">Según tu saldo actual</div>
        </div>
      </div>

      <div class="glass panel">
        <div class="panel-head">
          <div><h2>Historial reciente</h2><p>Últimos movimientos de tu cuenta</p></div>
          <button class="btn btn-ghost btn-sm" data-section-link="transacciones">Ver todo</button>
        </div>
        <div id="recent-history"><div class="empty-state">Cargando historial...</div></div>
      </div>
    </section>

    <!-- ============ TRANSACCIONES ============ -->
    <section class="page-section hidden" id="section-transacciones">
      <div class="topbar">
        <div><h1>Transacciones</h1><p>Historial completo: ingresos, pérdidas y movimientos de tu cuenta</p></div>
      </div>
      <div class="glass panel">
        <div id="full-history"><div class="empty-state">Cargando historial...</div></div>
      </div>
    </section>

    <!-- ============ TRANSFERIR ============ -->
    <section class="page-section hidden" id="section-transferir">
      <div class="topbar"><div><h1>Transferir dinero</h1><p>Envía colones a otra cuenta o Usuario de Discord</p></div></div>
      <div class="two-col">
        <div class="glass panel">
          <form id="transfer-form">
            <div class="field">
              <label>Usuario de Discord o Número de Cuenta destino</label>
              <input type="text" id="transfer-target" placeholder="ej. usuario.crp o CR-00000002" required>
            </div>
            <div class="field">
              <label>Monto a transferir (₡)</label>
              <input type="number" id="transfer-amount" min="1" placeholder="50000" required>
            </div>
            <button type="submit" class="btn btn-primary btn-block">Continuar</button>
          </form>
        </div>
        <div class="glass panel">
          <h2 style="font-size:15px;margin-bottom:12px;">Recomendaciones</h2>
          <p class="text-dim" style="font-size:13px;line-height:1.6;">
            • Verifica bien el Usuario de Discord antes de enviar.<br>
            • No es posible transferirte dinero a ti mismo.<br>
            • Las transferencias se reflejan al instante y no se pueden revertir.<br>
            • El destinatario recibirá una notificación de ingreso.
          </p>
        </div>
      </div>
    </section>

    <!-- ============ PRÉSTAMOS ============ -->
    <section class="page-section hidden" id="section-prestamos">
      <div class="topbar"><div><h1>Sistema de préstamos</h1><p>Préstamo máximo ₡40.000.000 — pagos semanales automáticos</p></div></div>

      <div class="tier-box">
        <div class="tier"><div class="range">₡1M – ₡5M</div><div class="weekly">₡1.000.000 / semana</div></div>
        <div class="tier"><div class="range">₡5M – ₡10M</div><div class="weekly">₡5.000.000 / semana</div></div>
        <div class="tier"><div class="range">Más de ₡10M</div><div class="weekly">₡10.000.000 / semana</div></div>
      </div>

      <div class="two-col">
        <div class="glass panel" id="loan-request-panel">
          <div class="panel-head"><h2>Solicitar préstamo</h2></div>
          <form id="loan-form">
            <div class="field">
              <label>Monto a solicitar (₡1.000.000 – ₡40.000.000)</label>
              <input type="number" id="loan-amount" min="1000000" max="40000000" step="1" placeholder="5000000" required>
              <small id="loan-preview" class="text-dim">El pago semanal se calculará automáticamente.</small>
            </div>
            <button type="submit" class="btn btn-primary btn-block">Solicitar préstamo</button>
          </form>
        </div>

        <div class="glass panel">
          <div class="panel-head"><h2>Mi préstamo activo</h2></div>
          <div id="active-loan-box"><div class="empty-state">No tienes préstamos activos.</div></div>
        </div>
      </div>
    </section>

    <!-- ============ DEPÓSITOS / RETIROS ============ -->
    <section class="page-section hidden" id="section-movimientos">
      <div class="topbar"><div><h1>Depósitos y retiros</h1><p>Agrega o retira dinero manualmente de tu cuenta</p></div></div>
      <div class="two-col">
        <div class="glass panel">
          <div class="panel-head"><h2>💵 Depósito</h2></div>
          <form id="deposit-form">
            <div class="field"><label>Monto a depositar (₡)</label><input type="number" id="deposit-amount" min="1" required></div>
            <button type="submit" class="btn btn-secondary btn-block">Depositar</button>
          </form>
        </div>
        <div class="glass panel">
          <div class="panel-head"><h2>💰 Retiro</h2></div>
          <form id="withdraw-form">
            <div class="field"><label>Monto a retirar (₡)</label><input type="number" id="withdraw-amount" min="1" required></div>
            <button type="submit" class="btn btn-danger btn-block">Retirar</button>
          </form>
        </div>
      </div>
    </section>

    <!-- ============ ESTADÍSTICAS ============ -->
    <section class="page-section hidden" id="section-estadisticas">
      <div class="topbar"><div><h1>Estadísticas</h1><p>Resumen de tu actividad financiera</p></div></div>
      <div class="cards-grid">
        <div class="glass stat-card accent-fuchsia"><div class="label">Balance diario</div><div class="value" id="st-diario">₡0</div></div>
        <div class="glass stat-card accent-purple"><div class="label">Balance semanal</div><div class="value" id="st-semanal">₡0</div></div>
        <div class="glass stat-card accent-blue"><div class="label">Balance mensual</div><div class="value" id="st-mensual">₡0</div></div>
        <div class="glass stat-card accent-fuchsia"><div class="label">Total recibido</div><div class="value" id="st-recibido">₡0</div></div>
        <div class="glass stat-card accent-purple"><div class="label">Total enviado</div><div class="value" id="st-enviado">₡0</div></div>
      </div>
    </section>

    <!-- ============ PERFIL ============ -->
    <section class="page-section hidden" id="section-perfil">
      <div class="topbar"><div><h1>Mi perfil</h1><p>Información de tu identidad IC registrada en el banco</p></div></div>
      <div class="glass panel" style="max-width:520px;">
        <div style="display:flex;flex-direction:column;gap:14px;font-size:14px;">
          <div style="display:flex;justify-content:space-between;"><span class="text-dim">Usuario Discord</span><strong id="pf-discord">—</strong></div>
          <div style="display:flex;justify-content:space-between;"><span class="text-dim">Nombre IC</span><strong id="pf-nombre">—</strong></div>
          <div style="display:flex;justify-content:space-between;"><span class="text-dim">Cédula IC</span><strong id="pf-cedula">—</strong></div>
          <div style="display:flex;justify-content:space-between;"><span class="text-dim">Edad IC</span><strong id="pf-edad">—</strong></div>
          <div style="display:flex;justify-content:space-between;"><span class="text-dim">Número de cuenta</span><strong id="pf-cuenta">—</strong></div>
          <div style="display:flex;justify-content:space-between;"><span class="text-dim">Fecha de creación</span><strong id="pf-fecha">—</strong></div>
          <div style="display:flex;justify-content:space-between;"><span class="text-dim">Nivel de cliente</span><span class="badge" id="pf-nivel">—</span></div>
        </div>
      </div>
    </section>
  </main>
</div>

<!-- Modal de confirmación de transferencia -->
<div class="modal-overlay" id="transfer-modal">
  <div class="modal-box glass">
    <h3>Confirmar transferencia</h3>
    <p class="text-dim" style="font-size:13.5px;">Estás a punto de enviar:</p>
    <p style="font-family:'Rajdhani',sans-serif;font-size:24px;font-weight:700;margin:10px 0;" id="modal-amount">₡0</p>
    <p class="text-dim" style="font-size:13.5px;">A: <strong id="modal-target" style="color:var(--white);">—</strong></p>
    <div class="modal-actions">
      <button class="btn btn-ghost btn-block" id="modal-cancel">Cancelar</button>
      <button class="btn btn-primary btn-block" id="modal-confirm">Confirmar envío</button>
    </div>
  </div>
</div>

<script src="js/common.js"></script>
<script src="js/dashboard.js"></script>
</body>
</html>
