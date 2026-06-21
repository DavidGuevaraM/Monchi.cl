// ============================================================
// CONFIGURACIÓN GELYBOUTIQUE — Reemplaza los valores TU_*
// ============================================================

const firebaseConfig = {
  apiKey:            "AIzaSyBOkg9YfHr6ZU0j3vZGt9XMrXh-841nEEU",
  authDomain:        "gelyboutique-2747c.firebaseapp.com",
  projectId:         "gelyboutique-2747c",
  storageBucket:     "gelyboutique-2747c.firebasestorage.app",
  messagingSenderId: "732419572133",
  appId:             "1:732419572133:web:603d0e0122b4de772f684c"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// ── EmailJS ──────────────────────────────────────────────────
// Crear cuenta en https://emailjs.com y obtener estas claves
const EMAILJS_PUBLIC_KEY      = 'TU_EMAILJS_PUBLIC_KEY';
const EMAILJS_SERVICE_ID      = 'TU_EMAILJS_SERVICE_ID';
const EMAILJS_TPL_CONFIRMACION = 'template_confirmacion';   // pedido nuevo → cliente
const EMAILJS_TPL_ESTADO       = 'template_estado_pedido'; // cambio de estado → cliente
const EMAILJS_TPL_ADMIN        = 'template_nuevo_pedido';  // nuevo pedido → admin

emailjs.init(EMAILJS_PUBLIC_KEY);

// ── Parámetros de la tienda ───────────────────────────────────
const TIENDA = {
  nombre:           'GELYboutique',
  email:            'contacto@gelyboutique.cl',
  whatsapp:         '+56912345678',
  instagram:        '@gelyboutique',
  costoEnvio:       3990,
  minimoEnvioGratis: 50000
};

// ── Helpers de formato ─────────────────────────────────────────
function formatPrice(n) {
  return `$${Number(n).toLocaleString('es-CL')}`;
}

function getEstadoLabel(estado) {
  return {
    pendiente:  'Pendiente',
    confirmado: 'Confirmado',
    preparando: 'En Preparación',
    enviado:    'Enviado',
    entregado:  'Entregado',
    cancelado:  'Cancelado'
  }[estado] || estado;
}

function getEstadoClass(estado) {
  return {
    pendiente:  'status-pending',
    confirmado: 'status-confirmed',
    preparando: 'status-preparing',
    enviado:    'status-shipped',
    entregado:  'status-delivered',
    cancelado:  'status-cancelled'
  }[estado] || '';
}

function generarNumeroPedido() {
  const ts  = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `GEL-${ts}-${rnd}`;
}
