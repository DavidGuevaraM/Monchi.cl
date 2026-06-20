// ─────────────────────────────────────────────────────────────
//  Proceso de checkout
// ─────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const cart = getCart();
  if (cart.length === 0) {
    window.location.href = 'carrito.html';
    return;
  }
  renderOrderSummary();
  bindForm();
});

function renderOrderSummary() {
  const cart     = getCart();
  const subtotal = getCartSubtotal();
  const envio    = getShipping(subtotal);
  const total    = subtotal + envio;

  const listEl = document.getElementById('checkout-items');
  if (listEl) {
    listEl.innerHTML = cart.map(item => `
      <div class="checkout-item">
        <img src="${item.imagen || 'img/no-image.jpg'}" alt="${item.nombre}" onerror="this.src='img/no-image.jpg'">
        <div class="checkout-item-info">
          <p class="item-name">${item.nombre}</p>
          <p class="item-meta">Talla: ${item.talla} · Cantidad: ${item.cantidad}</p>
        </div>
        <span class="item-price">${formatPrice(item.precio * item.cantidad)}</span>
      </div>
    `).join('');
  }

  setText('co-subtotal', formatPrice(subtotal));
  setText('co-envio', envio === 0 ? 'GRATIS 🎉' : formatPrice(envio));
  setText('co-total', formatPrice(total));

  if (subtotal < TIENDA.minimoEnvioGratis) {
    const diff = TIENDA.minimoEnvioGratis - subtotal;
    setText('free-shipping-note', `Agrega ${formatPrice(diff)} más para envío gratis`);
  } else {
    setText('free-shipping-note', '¡Felicidades! Tienes envío gratis');
  }
}

function bindForm() {
  const form = document.getElementById('checkout-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm(form)) return;

    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Procesando...';

    try {
      const pedido = buildOrder(form);
      const ref    = await db.collection('pedidos').add(pedido);

      // Email notifications (non-blocking)
      Promise.all([
        enviarConfirmacionPedido(pedido).catch(console.error),
        notificarAdminNuevoPedido(pedido).catch(console.error)
      ]);

      clearCart();
      window.location.href = `pedido.html?numero=${encodeURIComponent(pedido.numero)}&nuevo=1`;
    } catch (err) {
      console.error(err);
      showToast('Error al procesar el pedido. Intenta de nuevo.', 'error');
      btn.disabled = false;
      btn.textContent = 'Confirmar Pedido';
    }
  });
}

function buildOrder(form) {
  const data = Object.fromEntries(new FormData(form));
  const cart = getCart();
  const subtotal = getCartSubtotal();
  const envio    = getShipping(subtotal);

  return {
    numero:    generarNumeroPedido(),
    estado:    'pendiente',
    cliente: {
      nombre:   data.nombre,
      email:    data.email,
      telefono: data.telefono
    },
    direccion: {
      calle:   data.calle,
      ciudad:  data.ciudad,
      region:  data.region,
      cp:      data.cp || ''
    },
    items: cart.map(i => ({
      productId: i.productId,
      nombre:    i.nombre,
      talla:     i.talla,
      cantidad:  i.cantidad,
      precio:    i.precio
    })),
    subtotal,
    envio,
    total: subtotal + envio,
    notas:           data.notas || '',
    fechaCreacion:   firebase.firestore.FieldValue.serverTimestamp(),
    fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
  };
}

function validateForm(form) {
  let valid = true;
  form.querySelectorAll('[required]').forEach(el => {
    el.classList.remove('error');
    if (!el.value.trim()) {
      el.classList.add('error');
      valid = false;
    }
  });

  const email = form.querySelector('[name="email"]');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    email.classList.add('error');
    valid = false;
  }

  if (!valid) showToast('Completa todos los campos requeridos', 'warning');
  return valid;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
