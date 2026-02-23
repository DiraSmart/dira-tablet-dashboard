# Dira Dashboard

Dashboard de tablet para Home Assistant con diseño glassmorphism, optimizado para tablets montadas en pared.

Auto-descubre áreas y entidades de tu Home Assistant. Soporta luces, clima, cortinas, cámaras, cerraduras y sensores.

## Instalación

Hay 3 formas de instalar Dira:

### Opción 1: Add-on de Home Assistant (recomendado)

Requiere Home Assistant OS o Supervised.

1. En tu Home Assistant, andá a **Settings → Add-ons → Add-on Store**
2. Hacé click en el menú (⋮) arriba a la derecha → **Repositories**
3. Agregá la URL del repo:
   ```
   https://github.com/DiraSmart/dira-tablet-dashboard
   ```
4. Buscá **Dira Dashboard** en el store y hacé click en **Install**
5. Una vez instalado, activá **Show in sidebar**
6. Hacé click en **Start**
7. Abrí Dira desde el sidebar de HA

El add-on usa ingress, así que la autenticación es automática con tu sesión de HA.

### Opción 2: Docker standalone

Para cualquier instalación de HA (Core, Container, OS) o como web app independiente.

```bash
docker-compose up -d
```

O manualmente:

```bash
docker build -t dira-dashboard .
docker run -d -p 3000:3000 -v dira-data:/data dira-dashboard
```

Abrí http://tu-ip:3000 en la tablet. Te va a pedir la URL de HA y un token.

### Opción 3: Desarrollo local (npm)

Requiere Node.js 18+.

```bash
npm install
npm run dev
```

Abrí http://localhost:5173 en el navegador.

## Configuración inicial

La primera vez que abrís Dira, vas a ver la pantalla de setup:

1. **URL de Home Assistant**: La IP o dominio de tu HA (ej: `http://192.168.1.100:8123`)
2. **Token de acceso**: Un Long-Lived Access Token

Para generar el token: en HA andá a tu **Perfil** (abajo a la izquierda) → **Tokens de acceso de larga duración** → **Crear token**.

Dira va a auto-descubrir todas tus áreas y entidades y generar el dashboard automáticamente.

## Funcionalidades

- **Auto-discovery**: Detecta áreas, luces, clima, cortinas, cámaras, cerraduras y sensores
- **Sidebar**: Navegación con conteo de entidades activas en tiempo real
- **Cards interactivas**: Toggle luces + brillo, temperatura + modos HVAC, posición de cortinas, lock/unlock
- **Cámaras**: Snapshots con lazy loading (solo carga cuando es visible)
- **Multi-idioma**: Español e Inglés (cambiable desde Settings o setup)
- **Config portable**: Export/import de configuración en JSON
- **Optimizado para tablets**: Bundle de ~92KB gzip, touch targets de 48px, sin animaciones pesadas

## Para tus trabajadores / instaladores

En un sitio de cliente:

1. Instalar el add-on o el Docker
2. Abrir Dira en la tablet
3. Ingresar la URL del HA del cliente + token
4. Dira auto-descubre todo
5. Si hay que ajustar algo: Settings → Export config, editar, Import

Para mover una config de un cliente a otro con setup similar: exportar el JSON e importar en la nueva instalación.

## Estructura del proyecto

```
src/                  → Frontend React (TypeScript + Tailwind)
  api/                → Conexión WebSocket a Home Assistant
  components/         → Componentes UI (cards, layout, controles)
  views/              → Vistas principales (Home, Lights, Climate, etc.)
  store/              → Estado global (Zustand)
  i18n/               → Traducciones (Español / English)

server/               → Backend Express (API de config)
addon/                → Packaging de HA Add-on
data/                 → Config persistente (config.json)
```

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Desarrollo (frontend + backend con hot reload) |
| `npm run build` | Build de producción |
| `npm start` | Correr servidor de producción |
| `npm run typecheck` | Verificar tipos TypeScript |

## Tech stack

- React 18 + TypeScript + Vite
- Tailwind CSS (dark theme, glassmorphism)
- Zustand (state management con selectores por entidad)
- home-assistant-js-websocket (conexión directa a HA)
- Express (backend para config)
- i18next (internacionalización)
