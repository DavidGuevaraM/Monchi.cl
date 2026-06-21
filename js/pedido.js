// ─────────────────────────────────────────────────────────────
//  Seguimiento de pedido
// ─────────────────────────────────────────────────────────────
const ESTADOS_ORDEN = ['pendiente', 'confirmado', 'preparando', 'enviado', 'entregado'];

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(location.search);
  const numero = params.get('numero');
  const isNew  = params.get('nuevo') === '1';

  if (isNew && numero) {
    document.getElementById('success-banner')?.classList.remove('hidden');
    setText('banner-number', numero);
  }

  if (numero) {
    document.getElementById('tracking-form')?.classList.add('hidden');
    buscarPedido(numero);
  }

  const form = document.getElementById('tracking-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const num = document.getElementById('order-number-input').value.trim().toUpperCase();
      if (!num) return;
      history.pushState({}, '', `?numero=${encodeURIComponent(num)}`);
      buscarPedido(num);
    });
  }
});

async function buscarPedido(numero) {
  const resultEl = document.getElementById('tracking-result');
  if (!resultEl) return;

  resultEl.innerHTML = '<div class="loading-pulse">Buscando tu pedido…</div>';

  try {
    const snap = await db.collection('pedidos').where('numero', '==', numero).limit(1).get();
    if (snap.empty) {
      resultEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📦</div>
          <p>No encontramos el pedido <strong>${numero}</strong>.</p>
          <p class="text-muted">Verifica el número o contáctanos por WhatsApp.</p>
          <a href="https://wa.me/${(TIENDA.whatsapp || '').replace(/\D/g,'')}"
             class="btn-primary" target="_blank">Contactar por WhatsApp</a>
        </div>`;
      return;
    }

    const pedido = { id: snap.docs[0].id, ...snap.docs[0].data() };
    renderPedido(pedido, resultEl);
  } catch(e) {
    console.error(e);
    resultEl.innerHTML = '<div class="empty-state"><p>Error al buscar. Intenta de nuevo.</p></div>';
  }
}

function renderPedido(pedido, container) {
  const fecha  = pedido.fechaCreacion?.toDate
    ? pedido.fechaCreacion.toDate().toLocaleDateString('es-CL', { day:'numeric', month:'long', year:'numeric' })
    : '—';
  const estadoIdx = ESTADOS_ORDEN.indexOf(pedido.estado);
  const cancelled = pedido.estado === 'cancelado';

  container.innerHTML = `
<div class="order-card">
  <div class="order-header">
    <div>
      <h2>Pedido <span class="order-num">${pedido.numero}</span></h2>
      <p class="order-date">Realizado el ${fecha}</p>
    </div>
    <span class="status-badge ${getEstadoClass(pedido.estado)}">${getEstadoLabel(pedido.estado)}</span>
  </div>

  <!-- Timeline -->
  <div class="timeline ${cancelled ? 'cancelled' : ''}">
    ${cancelled ? `
      <div class="timeline-cancelled">
        <span class="tl-icon">✕</span>
        <p>Pedido cancelado</p>
      </div>
    ` : ESTADOS_ORDEN.map((estado, i) => `
      <div class="tl-step ${i <= estadoIdx ? 'done' : ''} ${i === estadoIdx ? 'current' : ''}">
        <div class="tl-dot">
          ${i < estadoIdx ? '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : i === estadoIdx ? '<span class="tl-pulse"></span>' : ''}
        </div>
        <p class="tl-label">${getEstadoLabel(estado)}</p>
      </div>
      ${i < ESTADOS_ORDEN.length - 1 ? '<div class="tl-line ' + (i < estadoIdx ? 'done' : '') + '"></div>' : ''}
    `).join('')}
  </div>

  <!-- Items -->
  <div class="order-items">
    <h3>Productos</h3>
    ${pedido.items.map(item => `
      <div class="order-item">
        <div class="order-item-info">
          <span class="item-name">${item.nombre}</span>
          <span class="item-meta">Talla ${item.talla} · x${item.cantidad}</span>
        </div>
        <span class="item-price">${formatPrice(item.precio * item.cantidad)}</span>
      </div>
    `).join('')}
    <div class="order-totals">
      <div class="total-row"><span>Subtotal</span><span>${formatPrice(pedido.subtotal)}</span></div>
      <div class="total-row"><span>Envío</span><span>${pedido.envio === 0 ? 'GRATIS' : formatPrice(pedido.envio)}</span></div>
      <div class="total-row total-final"><span>Total</span><span>${formatPrice(pedido.total)}</span></div>
    </div>
  </div>

  <!-- Delivery -->
  <div class="order-delivery">
    <h3>Datos de entrega</h3>
    <p><strong>${pedido.cliente.nombre}</strong></p>
    <p>${pedido.cliente.email} · ${pedido.cliente.telefono}</p>
    <p>${pedido.direccion.calle}, ${pedido.direccion.ciudad}, ${pedido.direccion.region}</p>
    ${pedido.trackingUrl ? `<a href="${pedido.trackingUrl}" target="_blank" class="btn-secondary mt-sm">Rastrear envío</a>` : ''}
  </div>

  <div class="order-support">
    <p>¿Tienes dudas sobre tu pedido?</p>
    <a href="https://wa.me/${(TIENDA.whatsapp || '').replace(/\D/g,'')}" target="_blank" class="btn-whatsapp">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      Contactar por WhatsApp
    </a>
  </div>
</div>`;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
