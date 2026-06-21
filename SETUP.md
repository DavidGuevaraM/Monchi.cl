# GELYboutique — Guía de Configuración

## 1. Firebase

1. Ve a https://console.firebase.google.com y crea un proyecto nuevo.
2. Activa **Firestore Database** (modo producción).
3. Activa **Authentication** → Email/Password.
4. En Project Settings > General, copia el objeto `firebaseConfig`.
5. Pega los valores en `js/config.js` reemplazando los `TU_*`.
6. Crea tu usuario admin: Authentication → Add user.
7. Despliega las reglas: `firebase deploy --only firestore:rules,firestore:indexes`

## 2. EmailJS

1. Crea cuenta en https://emailjs.com (plan gratuito: 200 emails/mes).
2. Conecta tu servicio de email (Gmail recomendado).
3. Crea 3 templates con estas variables:

### Template 1: `template_confirmacion`
Asunto: `Pedido {{order_number}} confirmado — GELYboutique`
Variables: `to_name`, `to_email`, `order_number`, `items_list`,
           `subtotal`, `envio`, `total`, `direccion`, `whatsapp`

### Template 2: `template_estado_pedido`
Asunto: `Tu pedido {{order_number}} — {{nuevo_estado}}`
Variables: `to_name`, `to_email`, `order_number`, `nuevo_estado`,
           `mensaje`, `tracking_url`, `whatsapp`

### Template 3: `template_nuevo_pedido`
Asunto: `🛍️ Nuevo pedido {{order_number}} — {{total}}`
Variables: `order_number`, `customer_name`, `customer_email`,
           `customer_phone`, `total`, `items`, `direccion`, `fecha`

4. Copia Service ID, Public Key y anótalos.
5. Reemplaza en `js/config.js` los valores `EMAILJS_*`.

## 3. Firebase Hosting (despliegue)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # carpeta pública: gelyboutique
firebase deploy
```

## 4. Personalización

Edita `js/config.js` → objeto `TIENDA`:
- `nombre`: nombre de la tienda
- `email`: tu correo de admin
- `whatsapp`: tu número con código país (+56...)
- `instagram`: tu usuario
- `costoEnvio`: costo de envío en CLP
- `minimoEnvioGratis`: monto mínimo para envío gratis

## 5. Primeros pasos

1. Abre `admin.html` e inicia sesión con tu usuario Firebase.
2. Haz clic en "Cargar demo" para agregar 6 productos de ejemplo.
3. Personaliza los productos desde la tab "Productos".
4. ¡Tu tienda está lista! Comparte `index.html` con tus clientes.

## Páginas

| Página | Descripción |
|--------|-------------|
| `index.html` | Tienda principal + catálogo |
| `carrito.html` | Carrito de compras |
| `checkout.html` | Formulario de pedido |
| `pedido.html` | Rastreo de pedido |
| `admin.html` | Panel de administración |
