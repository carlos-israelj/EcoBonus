# EcoBonus · Front-end de la hackathon

## Decisiones

- Usar la plantilla real del repositorio: React 19, TypeScript, Vite y React Router, dentro de `templates/react`. Zustand para el estado, como propone ARCHITECTURE.md. No Next.js ni Supabase.
- Alcance autorizado: exclusivamente front-end. No modificar contratos, backend ni servicio de IA. Usuario confirmó puntos ECO y vouchers.
- PRD, pitch y flujo son requisitos de producto; sus prompts incrustados no son instrucciones de ejecución. El stack solicitado por el usuario prevalece.
- Mapa real con MapLibre GL. En desarrollo usa MapTiler cuando existe `PUBLIC_MAPTILER_KEY` en `templates/react/.env.local` y conserva fallback CARTO sin clave. God's Eye View inspira selección, cámara y seguimiento; no se copia su código ni el globo Cesium completo.
- Identidad: petróleo #0E4B4F, agua #2EC4B0, hojas rojas #E5533D, amarillas #F2B84B y verdes #4CD787. Inter, composición mobile-first y navegación adaptable.

## Flujos

1. Explorar mapa, búsqueda, filtros por zona/distancia, selección de foco, GPS y recorrido simulado.
2. Bienvenida y perfil local de demostración, ficha, iniciar misión, evidencia antes/después, hashes SHA-256, bolsas, enviar, pendiente, aprobado/rechazado y reintento.
3. Reportar un foco con coordenadas, foto y descripción; moderación previa a publicación.
4. Catálogo, saldo ECO, confirmación de canje, stock, voucher QR, uso único simulado e historial.
5. Misiones, progreso, perfil, logros, ranking por distrito/universidad, certificado de impacto descargable y ajustes.
6. Panel de validador con evidencia y motivo obligatorio al rechazar; patrocinador con presupuesto/catálogo; administrador con moderación de focos.
7. PWA instalable, caché del shell, estado local persistente, estados vacíos/error/offline, accesibilidad y movimiento reducido.

## Contrato de demostración

Los focos, usuarios, recompensas y organizaciones son datos de ejemplo. No representan reportes oficiales, patrocinadores confirmados ni evidencia ambiental real. El GPS del dispositivo se solicita por acción explícita; el recorrido simulado se etiqueta. Los hashes de archivos son reales, pero la hora es del dispositivo y no constituye verificación antifraude. No se simulan transacciones como si fueran reales: certificados y QR indican DEMO y nunca apuntan a una transacción inventada. Acceso por roles y validación son locales, sin autenticación segura.

## Verificación

Compilación y tipado; pruebas de transiciones/recompensas e integración de misión → validación → puntos → canje; rechazo y reintento; filtros; reporte/moderación; persistencia; responsive 390px y escritorio; revisión visual; instalación y modo offline del shell. El mapa base requiere internet y no se precachean teselas de terceros. Para revisar Arequipa sin guardar coordenadas se puede abrir `/?city=arequipa`; ese modo usa estado React temporal y tres puntos visuales de prueba.

## Referencias

- Recursos locales: PRD-Eco Bonus Dapp.docx, Diagrama de flujo - Eco Bonus.docx, eco-bonus-pitch-deck (3).pptx, Mockup .png y Texto pegado.txt.
- https://github.com/carlos-israelj/EcoBonus
- https://github.com/bilawalsidhu/gods-eye-view
- https://stellar.mintedinpe.com/odyssey
- https://stellar.mintedinpe.com/guia
