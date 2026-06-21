// ─────────────────────────────────────────────────────────────
//  Carrito de compras — persistencia en localStorage
// ─────────────────────────────────────────────────────────────
const CART_KEY = 'gely_cart';

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateAllBadges();
}

function addToCart(product, talla, cantidad = 1) {
  const cart = getCart();
  const idx  = cart.findIndex(i => i.productId === product.id && i.talla === talla);

  if (idx >= 0) {
    cart[idx].cantidad += cantidad;
  } else {
    cart.push({
      productId: product.id,
      nombre:    product.nombre,
      precio:    product.precio,
      imagen:    product.imagen || '',
      categoria: product.categoria || '',
      talla,
      cantidad
    });
  }

  saveCart(cart);
  showToast(`✓ ${product.nombre} (${talla}) agregado al carrito`);
  return cart;
}

function removeFromCart(productId, talla) {
  const cart = getCart().filter(i => !(i.productId === productId && i.talla === talla));
  saveCart(cart);
  return cart;
}

function updateQuantity(productId, talla, cantidad) {
  const cart = getCart();
  const idx  = cart.findIndex(i => i.productId === productId && i.talla === talla);
  if (idx < 0) return cart;
  if (cantidad <= 0) { cart.splice(idx, 1); }
  else               { cart[idx].cantidad = cantidad; }
  saveCart(cart);
  return cart;
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateAllBadges();
}

function getCartCount()  { return getCart().reduce((s, i) => s + i.cantidad, 0); }
function getCartSubtotal(){ return getCart().reduce((s, i) => s + i.precio * i.cantidad, 0); }
function getShipping(subtotal) {
  return subtotal >= TIENDA.minimoEnvioGratis ? 0 : TIENDA.costoEnvio;
}
function getCartTotal()  {
  const sub = getCartSubtotal();
  return sub + getShipping(sub);
}

// ── UI ────────────────────────────────────────────────────────
function updateAllBadges() {
  const count = getCartCount();
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

function showToast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 400);
  }, 3000);
}

document.addEventListener('DOMContentLoaded', function () {
  updateAllBadges();

  // Hide header on scroll-down, reveal on scroll-up
  const header = document.querySelector('.site-header');
  if (!header) return;
  let lastY = 0;
  let ticking = false;

  function handleHeaderScroll() {
    ticking = false;
    const y = window.scrollY;
    if (y < 80) {
      header.classList.remove('header-hidden');
    } else if (y - lastY > 4) {
      header.classList.add('header-hidden');
    } else if (lastY - y > 4) {
      header.classList.remove('header-hidden');
    }
    lastY = y;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(handleHeaderScroll); }
  }, { passive: true });
});
