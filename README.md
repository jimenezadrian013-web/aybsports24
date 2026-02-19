# A&B Sports — Generar APK para Android

## Contenido del paquete
```
ab-sports-apk/
├── index.html        ← App principal
├── manifest.json     ← Manifiesto PWA
├── sw.js             ← Service Worker (funciona offline)
├── icons/
│   ├── icon-48.png
│   ├── icon-72.png
│   ├── icon-96.png
│   ├── icon-144.png
│   ├── icon-192.png  ← Logo AB fondo negro
│   └── icon-512.png  ← Logo AB fondo negro HD
└── README.md         ← Este archivo
```

## Método 1: PWABuilder (Más fácil — sin código)

1. **Sube la app a un hosting** (Netlify, Vercel, GitHub Pages, etc.):
   - Sube toda la carpeta `ab-sports-apk/` como un sitio web
   - Ejemplo con Netlify: arrastra la carpeta a netlify.com/drop

2. **Ve a https://www.pwabuilder.com**

3. **Pega la URL** de tu sitio desplegado

4. **Haz clic en "Package for stores"** → Android

5. **Descarga el APK** generado

## Método 2: Bubblewrap (Línea de comandos)

```bash
# Instalar Bubblewrap
npm install -g @anthropic-anthropic/anthropic
npm install -g @nicolo-ribaudo/chokidar-3
npm install -g @nicolo-ribaudo/bubblewrap
npx @nicolo-ribaudo/bubblewrap@latest init --manifest https://TU-SITIO.com/manifest.json
npx @nicolo-ribaudo/bubblewrap@latest build
```

Esto genera un archivo `app-release-signed.apk` listo para instalar.

## Método 3: Android Studio (Avanzado)

1. Crea un proyecto TWA (Trusted Web Activity)
2. Configura el `build.gradle` con la URL de tu PWA
3. Importa los iconos en `res/mipmap-*`
4. Compila el APK con `./gradlew assembleRelease`

## Instalar directamente como PWA (sin APK)

En cualquier Android con Chrome:
1. Abre la app en Chrome
2. Toca el menú ⋮ → "Añadir a pantalla de inicio"
3. ¡Listo! Se instala como app nativa con el icono AB

---

**Nota:** Para publicar en Google Play Store necesitas una cuenta de desarrollador ($25 USD una sola vez).
