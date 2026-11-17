# Regatas Bella Vista · M9 Camada 2017 — App de la división

App web (mobile-first) para el manager y los entrenadores de la M9: asistencia de miércoles y sábados, planificación, armado de equipos con entrenadores, estadísticas, plantel con bajas, premios de fin de año y la gira (lista de viaje, equipos y hospedaje).

Usuario y dueño del proyecto: Facundo (entrenador). Escribir siempre en **español rioplatense**, claro y sin tecnicismos.

## Estructura
- `index.html` — TODA la app (HTML + CSS + JS en un solo archivo). Se publica con **GitHub Pages** desde `main`: lo que se sube a `main` queda online en 1–2 minutos.
- `escudo.png` — escudo del club.
- `apps-script/Code.gs` — backend en Google Apps Script, pegado en el Google Sheet (Extensiones → Apps Script). **No se despliega desde GitHub**: después de cambiarlo, Facundo tiene que pegarlo y hacer *Implementar → Administrar implementaciones → ✏️ → Versión: Nueva versión → Implementar* (nunca "Nueva implementación", cambia la URL). Siempre avisarle cuando un cambio toca `Code.gs`.
- `docs/` — guías de instalación y actualización para Facundo.

## Reglas que no se rompen
- La URL del API es fija y tiene que seguir en `index.html`:
  `https://script.google.com/macros/s/AKfycbw3STeF0y6gLe6DfeLqwrk57_quHXv33JFRWevNE9wp4Vy0VzF5lkT0pE6w7vnGLs7w/exec`
- **El repo es público.** Nunca subir datos de los chicos (nombres, DNI, fechas, planillas .xlsx/.csv/.json). Los datos viven solo en el Google Sheet, detrás del PIN. Los PIN reales están en la hoja CONFIG, no en el código.
- Roles por PIN: `PIN_ADMIN` ve y edita niveles (calificaciones) y premios; `PIN_STAFF` no ve niveles en ningún lado (el servidor los borra con `sanitizar_`) y no accede a las hojas `SOLO_ADMIN` (PREMIOS, PREMIOS_ASIG). Esto se controla **en el servidor**, no solo en la UI.
- `armarEquipos(J,E,presJ,presE,modo,n)` existe **idéntica** en `index.html` y en `apps-script/Code.gs` (el servidor arma equipos para el staff, que no ve niveles). Si se cambia una, cambiar la otra igual.
- Escala de nivel (más bajo = más fuerte): Nivel 1 > Nivel 2 > Nivel 3 > Gloriosa 1.0 > 2.0 > 3.0. `nivelNum`: N1=1, N2=2, N3=3, Gloriosa = 3 + sub-nivel (4 a 6); Gloriosa sin sub-nivel cuenta 5.
- Hojas nuevas: agregarlas a `SHEETS` (con sus columnas) y a `WRITABLE` en `Code.gs`, y al `forEach` de `normalizar()` en `index.html`. `ensureHeaders_`/`getSheet_` las crean solas.
- No usar caracteres invisibles literales (BOM, etc.) en el código: GitHub rechaza el archivo. Usar escapes (`'﻿'`).

## Diseño
- Se usa sobre todo en el **celular**: nada de textos cortados, desbordes horizontales ni botones chicos. Probar en 320, 360 y 1280 px de ancho. Inputs a 16px (evita el zoom de iOS), botones ≥ 40px de alto.
- Reutilizar las piezas existentes: `.seg.full`, `.acts`, `.step`, `.kpi`, `.pill`, `tabla(...)` (tablas ordenables, primera columna fija), `abrirModal`, `guardar(ops, msg)` (con cola offline), `docCompartir(...)` (hoja blanca → PDF / imagen para WhatsApp / texto).
- Estética: oscura, moderna, consistente con lo existente. Práctico antes que lindo.

## Cómo probar
No hay build ni dependencias. Para probar sin tocar los datos reales, levantar un servidor estático y simular el API (interceptar `script.google.com` con Playwright y responder con un mock del `doGet`/`doPost`). Antes de dar algo por terminado: chequear sintaxis del `<script>`, recorrer las pantallas tocadas en 360 px y verificar que no haya errores en consola.

## Flujo de trabajo
- Cambios chicos y probados → commit directo a `main` (se publican solos). Mensajes de commit en español.
- Al terminar, contarle a Facundo en 2–3 líneas qué cambió y si tiene que actualizar el Apps Script.
