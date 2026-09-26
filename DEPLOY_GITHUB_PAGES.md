# Deploy Frontend a GitHub Pages

**Fecha:** 2026-09-26
**Frontend URL:** https://carlos-israelj.github.io/EcoBonus/
**Backend URL:** https://ecobonus-backend.onrender.com

---

## 📋 Configuración Realizada

### 1. Vite Configuration

Actualizado `templates/react/vite.config.ts`:

```typescript
export default defineConfig({
  base: '/EcoBonus/', // GitHub Pages base path
  // ... resto de configuración
})
```

### 2. GitHub Actions Workflow

Creado `.github/workflows/deploy-frontend.yml`:

- **Trigger:** Push a `master` con cambios en `templates/react/`
- **Build:** `npm ci && npm run build`
- **Deploy:** GitHub Pages automatic deployment
- **Environment Variables:**
  - `PUBLIC_BACKEND_URL=https://ecobonus-backend.onrender.com`
  - `PUBLIC_STELLAR_NETWORK=TESTNET`
  - `PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org`
  - `PUBLIC_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org`

---

## 🚀 Pasos para Activar GitHub Pages

### Paso 1: Push del Código

```bash
git add .
git commit -m "Add GitHub Pages deployment configuration"
git push origin master
```

### Paso 2: Habilitar GitHub Pages en el Repositorio

1. Ve a tu repositorio en GitHub: https://github.com/carlos-israelj/EcoBonus
2. Click en **Settings** (⚙️)
3. En el menú izquierdo, click en **Pages**
4. En "Build and deployment":
   - **Source:** Selecciona "GitHub Actions"
5. Guarda los cambios

### Paso 3: Verificar el Deployment

1. Ve a la pestaña **Actions** en GitHub
2. Deberías ver el workflow "Deploy Frontend to GitHub Pages" ejecutándose
3. Espera a que termine (2-3 minutos)
4. Ve a **Settings → Pages** para ver la URL desplegada

---

## 🌐 URLs del Proyecto

| Servicio | URL |
|----------|-----|
| **Frontend** | https://carlos-israelj.github.io/EcoBonus/ |
| **Backend** | https://ecobonus-backend.onrender.com |
| **Repo GitHub** | https://github.com/carlos-israelj/EcoBonus |

---

## 🔧 Actualizar CORS en Backend

Después de que el frontend esté desplegado, actualiza CORS en Render:

1. Ve a Render Dashboard: https://dashboard.render.com
2. Selecciona: `ecobonus-backend`
3. Click en "Environment" tab
4. Edita la variable `CORS_ORIGIN`:
   ```
   CORS_ORIGIN=https://carlos-israelj.github.io
   ```
5. Save Changes → Render hará redeploy automático

---

## 📦 Build Local (Opcional)

Para probar el build localmente antes de desplegar:

```bash
cd templates/react

# Build con configuración de GitHub Pages
npm run build

# Preview del build
npm run preview
# Abre: http://localhost:4173/EcoBonus/
```

---

## 🔄 Auto-Deploy

El frontend se desplegará automáticamente cuando:

1. Hagas push a `master`
2. Haya cambios en `templates/react/`
3. O manualmente desde la pestaña Actions en GitHub

---

## 🧪 Testing del Frontend Desplegado

Una vez desplegado, verifica:

```bash
# 1. Health check del backend
curl https://ecobonus-backend.onrender.com/api/health

# 2. Abre el frontend
open https://carlos-israelj.github.io/EcoBonus/

# 3. Verifica en DevTools Console que:
# - No hay errores de CORS
# - API calls funcionan
# - MapLibre GL carga correctamente
```

---

## 🐛 Troubleshooting

### Error: 404 al recargar página

**Solución:** GitHub Pages no soporta client-side routing por defecto.

Opción 1 - Usar Hash Router (rápido):

```typescript
// En src/main.tsx
import { HashRouter } from 'react-router-dom'

// Cambiar BrowserRouter por HashRouter
<HashRouter>
  <App />
</HashRouter>
```

Opción 2 - 404.html redirect (recomendado):

Crear `templates/react/public/404.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script>
    sessionStorage.redirect = location.href;
  </script>
  <meta http-equiv="refresh" content="0;URL='/EcoBonus/'">
</head>
</html>
```

Y en `index.html` antes del `<body>`:

```html
<script>
  (function() {
    var redirect = sessionStorage.redirect;
    delete sessionStorage.redirect;
    if (redirect && redirect !== location.href) {
      history.replaceState(null, null, redirect);
    }
  })();
</script>
```

### Error: CORS al llamar backend

**Síntoma:** `Access-Control-Allow-Origin` error en console

**Solución:** Actualiza `CORS_ORIGIN` en Render (ver sección arriba)

### Error: Mapa no carga

**Causa:** Falta `PUBLIC_MAPTILER_KEY` o problemas con tiles

**Solución:** El mapa usa CARTO tiles por defecto (no requiere API key)

---

## 📊 Performance

### Optimizaciones Incluidas

- ✅ Vite build optimization (minify, tree-shaking)
- ✅ PWA service worker (offline shell)
- ✅ Map tiles cache (7 días)
- ✅ Code splitting
- ✅ Asset compression

### Bundle Size

Esperado después del build:

```
dist/index.html              ~2 KB
dist/assets/index-[hash].js  ~400 KB (gzipped: ~120 KB)
dist/assets/index-[hash].css ~80 KB (gzipped: ~15 KB)
```

---

## 🎯 Próximos Pasos Después del Deploy

1. [ ] Verificar que el frontend cargue en GitHub Pages
2. [ ] Actualizar CORS en backend
3. [ ] Probar GPS missions desde frontend
4. [ ] Probar vouchers catalog
5. [ ] Probar leaderboard
6. [ ] Verificar photo upload (requiere auth)
7. [ ] Testing en mobile devices
8. [ ] Testing PWA install

---

## 📝 Notas

- **GitHub Pages es gratis** para repos públicos
- **HTTPS automático** incluido
- **Auto-deploy** en cada push a master
- **Custom domain** opcional (si tienes uno)
- **Límite:** 1 GB storage, 100 GB bandwidth/mes

---

**Generado:** 2026-09-26
**Backend:** Render (deployed)
**Frontend:** GitHub Pages (ready to deploy)
