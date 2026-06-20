// ─────────────────────────────────────────────────────────────
//  Gestión de notificaciones por correo (EmailJS)
// ─────────────────────────────────────────────────────────────

async function enviarConfirmacionPedido(pedido) {
  const itemsList = pedido.items
    .map(i => `• ${i.nombre} (Talla ${i.talla}) x${i.cantidad} — ${formatPrice(i.precio * i.cantidad)}`)
    .join('\n');

  const params = {
    to_email:      pedido.cliente.email,
    to_name:       pedido.cliente.nombre,
    order_number:  pedido.numero,
    items_list:    itemsList,
    subtotal:      formatPrice(pedido.subtotal),
    envio:         pedido.envio === 0 ? 'GRATIS 🎉' : formatPrice(pedido.envio),
    total:         formatPrice(pedido.total),
    direccion:     `${pedido.direccion.calle}, ${pedido.direccion.ciudad}, ${pedido.direccion.region}`,
    telefono:      pedido.cliente.telefono,
    whatsapp:      TIENDA.whatsapp,
    instagram:     TIENDA.instagram
  };

  return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TPL_CONFIRMACION, params);
}

async function enviarActualizacionEstado(pedido) {
  const mensajes = {
    confirmado: '¡Tu pedido fue confirmado! Estamos preparando todo con cuidado.',
    preparando: '¡Estamos preparando tu pedido! Pronto estará listo para despacho.',
    enviado:    `¡Tu pedido está en camino! ${pedido.trackingUrl ? 'Rastrea tu envío aquí: ' + pedido.trackingUrl : 'Te notificaremos cuando llegue.'}`,
    entregado:  '¡Tu pedido fue entregado! Esperamos que ames tu compra. ¡Actívate con estilo! 💪',
    cancelado:  'Tu pedido fue cancelado. Si tienes dudas, contáctanos por WhatsApp o Instagram.'
  };

  const params = {
    to_email:      pedido.cliente.email,
    to_name:       pedido.cliente.nombre,
    order_number:  pedido.numero,
    nuevo_estado:  getEstadoLabel(pedido.estado),
    mensaje:       mensajes[pedido.estado] || '',
    tracking_url:  pedido.trackingUrl || '',
    whatsapp:      TIENDA.whatsapp,
    instagram:     TIENDA.instagram
  };

  return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TPL_ESTADO, params);
}

async function notificarAdminNuevoPedido(pedido) {
  const itemsList = pedido.items
    .map(i => `${i.nombre} (${i.talla}) x${i.cantidad}`)
    .join(', ');

  const params = {
    to_email:       TIENDA.email,
    order_number:   pedido.numero,
    customer_name:  pedido.cliente.nombre,
    customer_email: pedido.cliente.email,
    customer_phone: pedido.cliente.telefono,
    total:          formatPrice(pedido.total),
    items:          itemsList,
    direccion:      `${pedido.direccion.calle}, ${pedido.direccion.ciudad}, ${pedido.direccion.region}`,
    fecha:          new Date().toLocaleString('es-CL')
  };

  return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TPL_ADMIN, params);
}
