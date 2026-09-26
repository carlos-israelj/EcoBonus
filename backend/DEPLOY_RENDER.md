# Despliegue en Render - EcoBonus Backend

## 📋 Pre-requisitos

1. Cuenta en [Render](https://render.com) (gratis)
2. Repositorio GitHub con el código
3. Variables de entorno de `.env` listas

---

## 🚀 Pasos para Desplegar

### Opción 1: Despliegue Automático con render.yaml

1. **Conectar Repositorio**
   - Ve a https://dashboard.render.com
   - Click en "New +"
   - Selecciona "Blueprint"
   - Conecta tu repositorio GitHub
   - Render detectará automáticamente `render.yaml`

2. **Configurar Variables de Entorno**
   
   En el dashboard de Render, agrega estas variables secretas:

   ```bash
   # Contratos Stellar
   MISSION_CONTRACT_ID=CAIFF4NMRTSM3C25NXBX35EULVWTHKLEIC5C2GHC35IJBFQC5JZIR47V
   REWARD_CONTRACT_ID=CBUPDKPRICZO67L5H6EPHRUV6QPX6PZ5QMTKPALKZJRSHMWEUWSLG6PO
   CERTIFICATE_NFT_CONTRACT_ID=CCM2NUS74BODRZNCVPVRCXML4M6P4FXR2BUW726Z6URQZDFX7UN7B5LS
   
   # Admin Wallet
   ADMIN_PUBLIC_KEY=GDEODUGRGDLD6HSIINDJ52YXBORIST5PYGEPC33CPFVVAA6G5WK6MAHN
   ADMIN_SECRET_KEY=SBW7UX5G3SMGFR6UGTK5OHCCNUMV6SEJK2H7MJJDGDWCJALREJUB5IV7
   
   # Supabase
   SUPABASE_URL=https://rjeerpnshosuljapunyo.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   
   # Privy
   PRIVY_APP_ID=cmug2qj1b01t90bjj0erfq3py
   PRIVY_APP_SECRET=privy_app_secret_4xiVbRW2227viiWNPfv24B7R5JSBAcZZ68C6P5AVna24Ki48fcDQXmtP5dbrnD92aMsqWfxtkm9hsZDYt1PHkuRH
   
   # Trustless Work
   TRUSTLESS_WORK_API_KEY=CqNH7unN0mIVhvzNBR4DAw.98b875b1e696d784efdc826ba482c4310503189ecbca70f1cf6d61fe3e8542bb
   ```

3. **Desplegar**
   - Click en "Apply"
   - Render comenzará a construir y desplegar
   - Espera 3-5 minutos

4. **Verificar Despliegue**
   ```bash
   curl https://ecobonus-backend.onrender.com/api/health
   ```

---

### Opción 2: Despliegue Manual

1. **Crear Web Service**
   - Dashboard → New + → Web Service
   - Conectar repositorio
   - Configurar:
     - **Name:** ecobonus-backend
     - **Region:** Oregon (US West)
     - **Branch:** main (o master)
     - **Root Directory:** backend
     - **Environment:** Node
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`

2. **Agregar Variables de Entorno**
   - En la pestaña "Environment"
   - Agregar todas las variables listadas arriba

3. **Desplegar**
   - Click "Create Web Service"

---

## 🔧 Configuración Post-Despliegue

### 1. Verificar Health Check
```bash
curl https://ecobonus-backend.onrender.com/api/health

# Debe retornar:
{
  "success": true,
  "service": "EcoBonus API",
  "status": "healthy",
  "features": {
    "auth": "dual (Privy + Stellar)",
    "database": "Supabase",
    "gps": "enabled (PostGIS)",
    "photoValidation": "enabled (EXIF + perceptual hash)"
  }
}
```

### 2. Probar GPS Endpoint
```bash
curl "https://ecobonus-backend.onrender.com/api/missions/nearby?lat=-12.116373&lon=-77.031105&radius=1000"
```

### 3. Probar Vouchers
```bash
curl https://ecobonus-backend.onrender.com/api/vouchers/catalog
```

---

## 📊 Características del Plan Free

- ✅ 750 horas/mes gratis
- ✅ Auto-deploy desde GitHub
- ✅ HTTPS automático
- ✅ Variables de entorno
- ⚠️ Se duerme después de 15 min de inactividad (tarda ~30s en despertar)
- ⚠️ 512 MB RAM

---

## 🔄 Auto-Deploy

Render automáticamente despliega cuando haces push a la rama configurada:

```bash
git add .
git commit -m "Update backend"
git push origin main
# Render detecta el push y redespliega automáticamente
```

---

## 🐛 Troubleshooting

### Build falla
```bash
# Verificar que package.json tiene "type": "module"
# Verificar que todas las dependencias están en package.json
```

### App crashea al iniciar
```bash
# Ver logs en Render Dashboard → Logs
# Verificar que todas las env vars están configuradas
```

### CORS errors
```bash
# Agregar variable CORS_ORIGIN con el dominio de tu frontend
CORS_ORIGIN=https://tu-frontend.vercel.app
```

### Timeout al despertar
```bash
# Primera request puede tardar ~30s (plan free)
# Requests subsecuentes son rápidas
```

---

## 🚀 Upgrade a Plan Pagado (Opcional)

Si necesitas:
- ✅ Siempre activo (sin sleep)
- ✅ Más RAM (1GB+)
- ✅ Deploy más rápidos
- ✅ Soporte prioritario

**Costo:** $7/mes (Starter) o $25/mes (Standard)

---

## 🔗 URLs Útiles

- **Dashboard Render:** https://dashboard.render.com
- **Docs Render:** https://render.com/docs
- **Status Page:** https://status.render.com

---

## ✅ Checklist Post-Despliegue

- [ ] Health check responde correctamente
- [ ] GPS endpoint funciona
- [ ] Vouchers endpoint funciona
- [ ] Leaderboard endpoint funciona
- [ ] Logs no muestran errores
- [ ] URL guardada para frontend
- [ ] Variables de entorno verificadas

---

**Generado:** 2026-09-26
**Versión:** 1.0.0
