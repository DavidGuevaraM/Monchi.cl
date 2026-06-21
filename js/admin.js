// ─────────────────────────────────────────────────────────────
//  Panel de administración — GELYboutique
// ─────────────────────────────────────────────────────────────
let currentTab     = 'pedidos';
let unsubscribers  = [];

// ── Auth ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  auth.onAuthStateChanged(user => {
    document.getElementById('login-screen')?.classList.toggle('hidden', !!user);
    document.getElementById('admin-panel')?.classList.toggle('hidden', !user);
    if (user) { loadStats(); openTab('pedidos'); }
  });

  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-pass').value;
    const errEl    = document.getElementById('login-error');
    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch(err) {
      errEl.textContent = 'Credenciales incorrectas. Intenta de nuevo.';
      errEl.classList.remove('hidden');
    }
  });

  document.getElementById('logout-btn')?.addEventListener('click', () => auth.signOut());

  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => openTab(btn.dataset.tab));
  });
});

function openTab(tab) {
  currentTab = tab;
  document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('hidden', c.id !== `tab-${tab}`));

  unsubscribers.forEach(u => u());
  unsubscribers = [];

  if (tab === 'pedidos')   loadPedidos();
  if (tab === 'productos') loadProductos();
  if (tab === 'inventario') loadInventario();
}

// ── Stats ─────────────────────────────────────────────────────
async function loadStats() {
  try {
    const [pedidosSnap, productosSnap] = await Promise.all([
      db.collection('pedidos').get(),
      db.collection('productos').where('activo','==',true).get()
    ]);

    const pendientes = pedidosSnap.docs.filter(d => d.data().estado === 'pendiente').length;
    const ingresos   = pedidosSnap.docs
      .filter(d => !['cancelado','pendiente'].includes(d.data().estado))
      .reduce((s, d) => s + (d.data().total || 0), 0);

    setText('stat-pedidos',    pedidosSnap.size);
    setText('stat-pendientes', pendientes);
    setText('stat-productos',  productosSnap.size);
    setText('stat-ingresos',   formatPrice(ingresos));
  } catch(e) { console.error(e); }
}

// ── Pedidos ───────────────────────────────────────────────────
function loadPedidos() {
  const filtroEstado = document.getElementById('filtro-estado')?.value || 'todos';
  let query = db.collection('pedidos').orderBy('fechaCreacion', 'desc');
  if (filtroEstado !== 'todos') query = query.where('estado', '==', filtroEstado);

  const unsub = query.onSnapshot(snap => {
    const pedidos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderPedidos(pedidos);
  });
  unsubscribers.push(unsub);
}

function renderPedidos(pedidos) {
  const tbody = document.getElementById('pedidos-tbody');
  if (!tbody) return;

  if (pedidos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No hay pedidos aún.</td></tr>';
    return;
  }

  tbody.innerHTML = pedidos.map(p => {
    const fecha = p.fechaCreacion?.toDate
      ? p.fechaCreacion.toDate().toLocaleDateString('es-CL')
      : '—';
    return `
    <tr>
      <td data-label="N° Pedido"><span class="order-num-sm">${p.numero || '—'}</span></td>
      <td data-label="Cliente">${p.cliente?.nombre || '—'}</td>
      <td data-label="Email" class="col-email">${p.cliente?.email || '—'}</td>
      <td data-label="Total">${formatPrice(p.total)}</td>
      <td data-label="Estado"><span class="status-badge ${getEstadoClass(p.estado)}">${getEstadoLabel(p.estado)}</span></td>
      <td data-label="Fecha">${fecha}</td>
      <td>
        <button class="btn-icon" onclick="openPedidoModal('${p.id}')" title="Ver / Editar">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      </td>
    </tr>`;
  }).join('');
}

async function openPedidoModal(pedidoId) {
  const doc  = await db.collection('pedidos').doc(pedidoId).get();
  const p    = { id: doc.id, ...doc.data() };
  const modal = document.getElementById('pedido-modal');
  if (!modal) return;

  modal.querySelector('.modal-title').textContent = `Pedido ${p.numero}`;
  modal.querySelector('#modal-cliente').innerHTML = `
    <strong>${p.cliente.nombre}</strong><br>
    ${p.cliente.email} · ${p.cliente.telefono}<br>
    ${p.direccion.calle}, ${p.direccion.ciudad}, ${p.direccion.region}
  `;
  modal.querySelector('#modal-items').innerHTML = p.items.map(i =>
    `<div class="modal-item"><span>${i.nombre} (${i.talla}) x${i.cantidad}</span><span>${formatPrice(i.precio * i.cantidad)}</span></div>`
  ).join('') + `
    <div class="modal-item total"><span><strong>Total</strong></span><span><strong>${formatPrice(p.total)}</strong></span></div>`;

  const estadoSel = modal.querySelector('#modal-estado');
  estadoSel.value = p.estado;

  const trackInput = modal.querySelector('#modal-tracking');
  if (trackInput) trackInput.value = p.trackingUrl || '';

  modal.querySelector('#modal-save').onclick = async () => {
    const nuevoEstado = estadoSel.value;
    const trackingUrl = trackInput?.value.trim() || '';
    await db.collection('pedidos').doc(pedidoId).update({
      estado: nuevoEstado,
      trackingUrl,
      fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
    });
    // Send email notification
    if (nuevoEstado !== p.estado) {
      enviarActualizacionEstado({ ...p, estado: nuevoEstado, trackingUrl }).catch(console.error);
    }
    closeModal('pedido-modal');
    showToast('Pedido actualizado y cliente notificado por email');
  };

  modal.classList.remove('hidden');
}

// ── Productos ─────────────────────────────────────────────────
function loadProductos() {
  const unsub = db.collection('productos').orderBy('nombre').onSnapshot(snap => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderProductosAdmin(list);
  });
  unsubscribers.push(unsub);
}

function renderProductosAdmin(list) {
  const tbody = document.getElementById('productos-tbody');
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="padding:48px;text-align:center;">
      <p style="color:var(--brown-light);margin-bottom:16px;">No hay productos aún.</p>
      <button class="btn-seed" onclick="document.getElementById('seed-btn').click()">+ Cargar productos de demo</button>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(p => `
    <tr class="${p.activo ? '' : 'row-inactive'}">
      <td><img src="${p.imagen || 'img/no-image.jpg'}" alt="${p.nombre}" class="thumb" onerror="this.src='img/no-image.jpg'"></td>
      <td data-label="Nombre"><strong>${p.nombre}</strong></td>
      <td data-label="Categoría">${CAT_LABELS[p.categoria] || p.categoria}</td>
      <td data-label="Precio">${formatPrice(p.precio)}</td>
      <td data-label="Stock">${p.tallas?.reduce((s,t) => s + t.stock, 0) || 0}</td>
      <td data-label="Estado"><span class="badge ${p.activo ? 'badge-active' : 'badge-inactive'}">${p.activo ? 'Activo' : 'Inactivo'}</span></td>
      <td data-label="⭐">
        <button class="btn-icon ${p.destacado ? 'btn-star-on' : 'btn-star-off'}"
                onclick="toggleDestacado('${p.id}', ${!!p.destacado})"
                title="${p.destacado ? 'Quitar de destacados' : 'Marcar como destacado'}">★</button>
      </td>
      <td class="actions">
        <button class="btn-icon" onclick="editarProducto('${p.id}')" title="Editar">✏️</button>
        <button class="btn-icon danger" onclick="toggleProductoActivo('${p.id}', ${p.activo})" title="${p.activo ? 'Desactivar' : 'Activar'}">
          ${p.activo ? '🔒' : '✅'}
        </button>
        <button class="btn-icon danger" onclick="eliminarProducto('${p.id}')" title="Eliminar">🗑️</button>
      </td>
    </tr>
  `).join('');
}

async function toggleDestacado(pid, isDestacado) {
  await db.collection('productos').doc(pid).update({ destacado: !isDestacado, fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp() });
  showToast(isDestacado ? 'Quitado de destacados' : '⭐ Marcado como destacado');
}

async function guardarProducto(e) {
  e.preventDefault();
  const form = document.getElementById('product-form');
  const data = Object.fromEntries(new FormData(form));
  const pid  = form.dataset.pid;

  const tallas = ['XS','S','M','L','XL','XXL'].map(t => ({
    talla: t,
    stock: parseInt(document.getElementById(`stock-${t}`)?.value || '0')
  }));

  const productData = {
    nombre:        data.nombre,
    descripcion:   data.descripcion || '',
    precio:        parseInt(data.precio),
    precioOriginal: parseInt(data.precioOriginal || '0'),
    categoria:     data.categoria,
    imagen:        data.imagen || '',
    tallas,
    destacado:     data.destacado === 'on',
    nuevo:         data.nuevo === 'on',
    activo:        true,
    fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
  };

  if (pid) {
    await db.collection('productos').doc(pid).update(productData);
    showToast('Producto actualizado');
  } else {
    productData.fechaCreacion = firebase.firestore.FieldValue.serverTimestamp();
    await db.collection('productos').add(productData);
    showToast('Producto creado');
  }

  closeModal('product-modal');
  form.reset();
  form.dataset.pid = '';
}

async function editarProducto(pid) {
  const doc  = await db.collection('productos').doc(pid).get();
  const p    = doc.data();
  const form = document.getElementById('product-form');
  form.dataset.pid = pid;

  ['nombre','descripcion','precio','precioOriginal','categoria','imagen'].forEach(field => {
    const el = form.querySelector(`[name="${field}"]`);
    if (el) el.value = p[field] || '';
  });

  const chkDest = form.querySelector('[name="destacado"]');
  const chkNuevo = form.querySelector('[name="nuevo"]');
  if (chkDest) chkDest.checked = !!p.destacado;
  if (chkNuevo) chkNuevo.checked = !!p.nuevo;

  (p.tallas || []).forEach(t => {
    const el = document.getElementById(`stock-${t.talla}`);
    if (el) el.value = t.stock;
  });

  document.getElementById('product-modal')?.classList.remove('hidden');
  document.getElementById('modal-product-title').textContent = 'Editar Producto';
}

function nuevoProducto() {
  const form = document.getElementById('product-form');
  form.reset();
  form.dataset.pid = '';
  ['XS','S','M','L','XL','XXL'].forEach(t => {
    const el = document.getElementById(`stock-${t}`);
    if (el) el.value = 0;
  });
  document.getElementById('modal-product-title').textContent = 'Nuevo Producto';
  document.getElementById('product-modal')?.classList.remove('hidden');
}

async function toggleProductoActivo(pid, activo) {
  await db.collection('productos').doc(pid).update({ activo: !activo });
  showToast(`Producto ${!activo ? 'activado' : 'desactivado'}`);
}

async function eliminarProducto(pid) {
  if (!confirm('¿Eliminar este producto permanentemente?')) return;
  await db.collection('productos').doc(pid).delete();
  showToast('Producto eliminado');
}

// ── Inventario ────────────────────────────────────────────────
function loadInventario() {
  const unsub = db.collection('productos').where('activo','==',true).onSnapshot(snap => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderInventario(list);
  });
  unsubscribers.push(unsub);
}

function renderInventario(list) {
  const el = document.getElementById('inventario-list');
  if (!el) return;

  el.innerHTML = list.map(p => {
    const tallasHTML = (p.tallas || []).map(t => `
      <div class="inv-size-item">
        <span class="inv-size-label">${t.talla}</span>
        <input type="number" class="inv-stock-input" min="0" value="${t.stock}"
               onchange="actualizarStock('${p.id}', '${t.talla}', this.value)">
        ${t.stock === 0 ? '<span class="inv-warn">⚠️</span>' : t.stock <= 3 ? '<span class="inv-low">🔶 Bajo</span>' : ''}
      </div>
    `).join('');

    return `
    <div class="inv-card">
      <div class="inv-header">
        <img src="${p.imagen || 'img/no-image.jpg'}" alt="${p.nombre}" class="inv-thumb" onerror="this.src='img/no-image.jpg'">
        <div>
          <h4>${p.nombre}</h4>
          <p class="text-muted">${CAT_LABELS[p.categoria] || p.categoria}</p>
        </div>
      </div>
      <div class="inv-sizes">${tallasHTML}</div>
    </div>`;
  }).join('');
}

async function actualizarStock(productId, talla, nuevoStock) {
  const doc   = await db.collection('productos').doc(productId).get();
  const tallas = (doc.data().tallas || []).map(t =>
    t.talla === talla ? { ...t, stock: Math.max(0, parseInt(nuevoStock) || 0) } : t
  );
  await db.collection('productos').doc(productId).update({ tallas });
}

// ── Helpers ───────────────────────────────────────────────────
function closeModal(id) {
  document.getElementById(id)?.classList.add('hidden');
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

const CAT_LABELS = {
  tops:'Tops & Bras', bottoms:'Bottoms & Leggings',
  calzado:'Calzado', accesorios:'Accesorios', conjuntos:'Conjuntos'
};

document.getElementById('filtro-estado')?.addEventListener('change', () => {
  if (currentTab === 'pedidos') loadPedidos();
});

document.getElementById('product-form')?.addEventListener('submit', guardarProducto);

// Close modals on backdrop click
document.querySelectorAll('.modal-backdrop').forEach(m => {
  m.addEventListener('click', (e) => {
    if (e.target === m) m.classList.add('hidden');
  });
});

// Seed demo products button
document.getElementById('seed-btn')?.addEventListener('click', seedDemoProducts);

function showToast(msg, type = 'success') {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  requestAnimationFrame(() => t.classList.add('show'));
  clearTimeout(t._tid);
  t._tid = setTimeout(() => { t.classList.remove('show'); }, 3200);
}

async function seedDemoProducts() {
  if (!confirm('¿Agregar productos de demostración?')) return;
  const demo = [
    { nombre:'Conjunto Vino & Crema', descripcion:'Set halter top + shorts sculpt en vinotinto y crema. Tela de alto rendimiento con compresión media.', precio:54990, precioOriginal:69990, categoria:'conjuntos', imagen:'img/producto-1.jpg', tallas:[{talla:'XS',stock:3},{talla:'S',stock:5},{talla:'M',stock:4},{talla:'L',stock:2},{talla:'XL',stock:1},{talla:'XXL',stock:0}], destacado:true, nuevo:true, activo:true },
    { nombre:'Top Espalda Abierta', descripcion:'Top manga larga con espalda abierta en chocolate y negro. Tejido técnico suave de secado rápido.', precio:28990, precioOriginal:0, categoria:'tops', imagen:'img/producto-2.jpg', tallas:[{talla:'XS',stock:4},{talla:'S',stock:6},{talla:'M',stock:5},{talla:'L',stock:3},{talla:'XL',stock:2},{talla:'XXL',stock:0}], destacado:true, nuevo:true, activo:true },
    { nombre:'Sport Bra Halter', descripcion:'Bra deportivo halter con fruncido frontal. Disponible en plateado, negro y crema. Sujeción media, ideal para pilates y yoga.', precio:24990, precioOriginal:32990, categoria:'tops', imagen:'img/producto-3.jpg', tallas:[{talla:'XS',stock:5},{talla:'S',stock:8},{talla:'M',stock:3},{talla:'L',stock:0},{talla:'XL',stock:2},{talla:'XXL',stock:0}], destacado:true, nuevo:false, activo:true },
    { nombre:'Conjunto Khaki Active', descripcion:'Top manga larga + shorts coordinados en beige khaki. Corte relajado y tela ultrasuave para entrenamientos ligeros.', precio:49990, precioOriginal:0, categoria:'conjuntos', imagen:'img/producto-4.jpg', tallas:[{talla:'XS',stock:2},{talla:'S',stock:4},{talla:'M',stock:4},{talla:'L',stock:2},{talla:'XL',stock:1},{talla:'XXL',stock:0}], destacado:true, nuevo:true, activo:true },
    { nombre:'Legging Sculpt Pro', descripcion:'Legging moldeador de alta compresión con bolsillo lateral y cintura alta. Tela sculpt push-up.', precio:34990, precioOriginal:0, categoria:'bottoms', imagen:'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=500&auto=format', tallas:[{talla:'XS',stock:4},{talla:'S',stock:6},{talla:'M',stock:5},{talla:'L',stock:3},{talla:'XL',stock:1},{talla:'XXL',stock:0}], destacado:false, nuevo:true, activo:true },
    { nombre:'Shorts Active Bicolor', descripcion:'Shorts deportivos bicolor con bolsillos laterales y cintura elástica ajustable.', precio:21990, precioOriginal:0, categoria:'bottoms', imagen:'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&auto=format', tallas:[{talla:'XS',stock:3},{talla:'S',stock:5},{talla:'M',stock:4},{talla:'L',stock:2},{talla:'XL',stock:1},{talla:'XXL',stock:0}], destacado:false, nuevo:true, activo:true },
    { nombre:'Bolso Gym Boutique', descripcion:'Bolso deportivo de lona resistente con compartimiento para calzado y bolsillo interior.', precio:29990, precioOriginal:39990, categoria:'accesorios', imagen:'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format', tallas:[{talla:'UNICA',stock:10}], destacado:false, nuevo:false, activo:true }
  ];

  const batch = db.batch();
  demo.forEach(p => {
    const ref = db.collection('productos').doc();
    batch.set(ref, { ...p, fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(), fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp() });
  });
  await batch.commit();
  showToast('¡Productos de demo agregados!');
}
