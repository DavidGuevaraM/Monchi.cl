// ─────────────────────────────────────────────────────────────
//  Catálogo de productos
// ─────────────────────────────────────────────────────────────
let allProducts    = [];
let activeFilters  = { categoria: 'todos', ordenar: 'destacado', busqueda: '' };

const TALLAS_STD  = [{talla:'XS',stock:4},{talla:'S',stock:6},{talla:'M',stock:5},{talla:'L',stock:3},{talla:'XL',stock:1},{talla:'XXL',stock:0}];
const FALLBACK_PRODUCTS = [
  { id:'f1', nombre:'Conjunto Vino & Crema', descripcion:'Set halter top + shorts sculpt en vinotinto y crema. Tela de alto rendimiento con compresión media.', precio:54990, precioOriginal:69990, categoria:'conjuntos', imagen:'img/producto-1.jpg', tallas:TALLAS_STD, destacado:true, nuevo:true, activo:true },
  { id:'f2', nombre:'Top Espalda Abierta', descripcion:'Top manga larga con espalda abierta, disponible en marrón y negro. Tejido técnico suave de secado rápido.', precio:28990, precioOriginal:0, categoria:'tops', imagen:'img/producto-2.jpg', tallas:TALLAS_STD, destacado:true, nuevo:true, activo:true },
  { id:'f3', nombre:'Sport Bra Halter', descripcion:'Bra deportivo halter con fruncido frontal, disponible en plateado, negro y crema.', precio:24990, precioOriginal:32990, categoria:'tops', imagen:'img/producto-3.jpg', tallas:TALLAS_STD, destacado:true, nuevo:false, activo:true },
  { id:'f4', nombre:'Conjunto Khaki Active', descripcion:'Top manga larga espalda abierta + shorts coordinados en color khaki. Tela sculpt ultrasuave.', precio:49990, precioOriginal:0, categoria:'conjuntos', imagen:'img/producto-4.jpg', tallas:TALLAS_STD, destacado:true, nuevo:true, activo:true },
  { id:'f5', nombre:'Shorts Sculpt Vinotinto', descripcion:'Shorts de cintura alta con doble capa sculpt. Combina con el top halter del mismo conjunto.', precio:29990, precioOriginal:0, categoria:'bottoms', imagen:'img/producto-1.jpg', tallas:TALLAS_STD, destacado:false, nuevo:true, activo:true },
  { id:'f6', nombre:'Top Halter Crema', descripcion:'Top halter en crema suave, parte del conjunto bicolor. Tela sculpt de alto rendimiento.', precio:27990, precioOriginal:34990, categoria:'tops', imagen:'img/producto-1.jpg', tallas:TALLAS_STD, destacado:false, nuevo:false, activo:true }
];

const CAT_LABELS = {
  tops:       'Tops & Bras',
  bottoms:    'Bottoms & Leggings',
  calzado:    'Calzado',
  accesorios: 'Accesorios',
  conjuntos:  'Conjuntos'
};

async function loadProducts() {
  showSkeletons();
  try {
    const snap = await db.collection('productos').where('activo', '==', true).get();
    allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (allProducts.length === 0) allProducts = FALLBACK_PRODUCTS;
    applyFilters();
  } catch(e) {
    console.error(e);
    allProducts = FALLBACK_PRODUCTS;
    applyFilters();
  }
}

function applyFilters() {
  let list = [...allProducts];

  if (activeFilters.categoria !== 'todos')
    list = list.filter(p => p.categoria === activeFilters.categoria);

  if (activeFilters.busqueda.length > 1) {
    const q = activeFilters.busqueda.toLowerCase();
    list = list.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      (p.descripcion || '').toLowerCase().includes(q)
    );
  }

  const sorts = {
    destacado:   (a, b) => (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0),
    'precio-asc': (a, b) => a.precio - b.precio,
    'precio-desc':(a, b) => b.precio - a.precio,
    nuevo:       (a, b) => (b.fechaCreacion?.seconds||0) - (a.fechaCreacion?.seconds||0)
  };
  list.sort(sorts[activeFilters.ordenar] || sorts.destacado);

  renderProducts(list);
}

function renderProducts(list) {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  const count = document.getElementById('product-count');
  if (count) count.textContent = `${list.length} producto${list.length !== 1 ? 's' : ''}`;

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="var(--rose)" stroke-width="1.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
        <p>No encontramos productos con ese filtro.</p>
        <button class="btn-secondary" onclick="resetFilters()">Ver todos</button>
      </div>`;
    return;
  }

  grid.innerHTML = list.map(productCard).join('');

  // size selector
  grid.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      this.closest('.sizes').querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // add-to-cart
  grid.querySelectorAll('.btn-add-cart').forEach(btn => {
    btn.addEventListener('click', function() {
      const card       = this.closest('.product-card');
      const activeSize = card.querySelector('.size-btn.active');
      if (!activeSize) {
        card.querySelector('.sizes').classList.add('shake');
        showToast('Selecciona una talla primero', 'warning');
        setTimeout(() => card.querySelector('.sizes').classList.remove('shake'), 600);
        return;
      }
      const product = allProducts.find(p => p.id === this.dataset.pid);
      if (product) addToCart(product, activeSize.dataset.size);
    });
  });
}

function productCard(p) {
  const hasDisco   = p.precioOriginal > 0 && p.precioOriginal > p.precio;
  const discoPct   = hasDisco ? Math.round((1 - p.precio / p.precioOriginal) * 100) : 0;
  const sizes      = (p.tallas || []);
  const inStock    = sizes.some(t => t.stock > 0);

  return `
<div class="product-card" data-id="${p.id}">
  <div class="product-img-wrap">
    <img src="${p.imagen || 'img/no-image.jpg'}" alt="${p.nombre}" loading="lazy" onerror="this.src='img/no-image.jpg'">
    <div class="product-badges">
      ${p.nuevo      ? '<span class="badge new">Nuevo</span>' : ''}
      ${hasDisco     ? `<span class="badge sale">-${discoPct}%</span>` : ''}
      ${!inStock     ? '<span class="badge sold">Agotado</span>' : ''}
    </div>
  </div>
  <div class="product-body">
    <p class="product-cat">${CAT_LABELS[p.categoria] || p.categoria}</p>
    <h3 class="product-name">${p.nombre}</h3>
    <div class="product-price">
      <span class="price-now">${formatPrice(p.precio)}</span>
      ${hasDisco ? `<span class="price-was">${formatPrice(p.precioOriginal)}</span>` : ''}
    </div>
    ${inStock ? `
    <div class="sizes">
      ${sizes.map(t => `
        <button class="size-btn${t.stock === 0 ? ' unavailable' : ''}"
                data-size="${t.talla}"
                ${t.stock === 0 ? 'disabled title="Sin stock"' : ''}>${t.talla}</button>
      `).join('')}
    </div>
    <button class="btn-add-cart" data-pid="${p.id}">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
      Agregar al carrito
    </button>
    ` : `<p class="sold-out-note">Agotado — ¡Vuelve pronto!</p>`}
  </div>
</div>`;
}

function showSkeletons() {
  const grid = document.getElementById('products-grid');
  if (grid) grid.innerHTML = Array(8).fill('<div class="product-card skeleton"></div>').join('');
}

function resetFilters() {
  activeFilters = { categoria: 'todos', ordenar: 'destacado', busqueda: '' };
  document.querySelectorAll('[data-cat-filter]').forEach(b => b.classList.toggle('active', b.dataset.catFilter === 'todos'));
  const s = document.getElementById('sort-select');
  if (s) s.value = 'destacado';
  const q = document.getElementById('search-input');
  if (q) q.value = '';
  applyFilters();
}

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();

  document.querySelectorAll('[data-cat-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-cat-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilters.categoria = btn.dataset.catFilter;
      applyFilters();
    });
  });

  const sortSel = document.getElementById('sort-select');
  if (sortSel) sortSel.addEventListener('change', () => {
    activeFilters.ordenar = sortSel.value;
    applyFilters();
  });

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    let timer;
    searchInput.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        activeFilters.busqueda = searchInput.value.trim();
        applyFilters();
      }, 350);
    });
  }
});
