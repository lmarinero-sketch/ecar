# ECAR Logística — App Móvil de Seguimiento GPS (Android APK & iOS TestFlight)

Esta aplicación móvil proporciona un **canal secundario independiente** para la transmisión de coordenadas GPS en segundo plano. Mantiene el proceso activo incluso cuando la pantalla del teléfono está bloqueada o cuando el conductor utiliza otras aplicaciones (Google Maps, Waze, WhatsApp, llamadas).

---

## 🚀 Arquitectura y Funcionamiento

* **Origen de Datos (`source`)**: Transmite con la etiqueta `'mobile_app'`, permitiendo que la Central de Monitoreo (`FleetTrackingMap.tsx`) muestre automáticamente la insignia verde **📱 App Móvil**.
* **Android Foreground Service**: Mantiene una notificación persistente en la barra de estado para evitar la suspensión por ahorro de batería (Doze mode).
* **iOS Background Location**: Utiliza el permiso *"Permitir siempre"* (*Always Allow*) y la capacidad nativa `Location updates`.
* **Buffer Offline**: Si el dispositivo pierde cobertura en ruta, guarda los puntos GPS localmente y los sincroniza automáticamente al recuperar señal celular.

---

## 🛠️ Guía de Compilación

### 1. Compilación para Android (Generación de APK)

Para generar el archivo ejecutable `.apk` instalable directamente en los celulares de los choferes:

```bash
# 1. Instalar dependencias móviles
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor-community/background-geolocation

# 2. Inicializar plataforma Android
npx cap add android

# 3. Compilar los assets web y sincronizar con Android
npm run build
npx cap sync android

# 4. Abrir en Android Studio para generar el APK firmado o de prueba
npx cap open android
```
> En Android Studio, ve a **Build -> Build Bundle(s) / APK(s) -> Build APK(s)**. El ejecutable `.apk` generado se encuentra en `android/app/build/outputs/apk/debug/app-debug.apk`.

---

### 2. Compilación para iOS (Distribución por TestFlight)

Para subir la app a **Apple TestFlight** sin necesidad de publicación pública en la App Store:

```bash
# 1. Agregar plataforma iOS
npx cap add ios

# 2. Sincronizar cambios
npx cap sync ios

# 3. Abrir en Xcode (en una Mac)
npx cap open ios
```
> En Xcode:
> 1. Configurar la capacidad **Signing & Capabilities -> Background Modes -> Location updates**.
> 2. Seleccionar **Product -> Archive**.
> 3. Hacer clic en **Distribute App -> TestFlight & App Store** para subir la build a App Store Connect / TestFlight.

---

## 📡 Integración con Supabase Realtime y BD

La app emite los siguientes eventos en tiempo real:
- **Evento Broadcast**: `location_update` con payload `{ vehicle_id, driver_name, source: 'mobile_app', lat, lng, speed, heading, timestamp }`.
- **Persistencia en BD**: Actualiza `vehicle_tracking_sessions` con `source = 'mobile_app'` e inserta en `vehicle_tracking_points`.
