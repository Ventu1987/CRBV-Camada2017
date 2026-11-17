# Regatas M9 — Cómo pasar a la versión 2 (10 minutos)

## 1 · Reemplazar el motor (Apps Script)
1. Abrí el Google Sheet → **Extensiones → Apps Script**.
2. Borrá todo el código y pegá el nuevo `Code.gs` completo → 💾 Guardar.
3. Elegí la función **setup** → **Ejecutar**.
   - Google vuelve a pedir permisos (ahora también **Google Drive**, para guardar las fotos y PDF de las planificaciones): Revisar permisos → tu cuenta → Configuración avanzada → Ir a … → **Permitir**.
   - En el registro tiene que aparecer "OK. Carpeta de planificaciones…".
4. **Implementar → Administrar implementaciones → ✏️ (lápiz) → Versión: "Nueva versión" → Implementar**.
   ⚠️ No uses "Nueva implementación": cambiaría la URL.

## 2 · Revisar los PIN
En la hoja **CONFIG** ahora hay dos filas:
- `PIN_ADMIN`: el que ya usabas (2017, salvo que lo hayas cambiado). Ve y edita las **calificaciones (niveles)**.
- `PIN_STAFF`: viene en **1234**. **Cambialo** y pasáselo al resto de los entrenadores. No ve niveles en ningún lado (ni en la planilla que baja a su celu).

Cambiar un PIN en la hoja tiene efecto inmediato: a quien tenía el viejo, la app le vuelve a pedir el PIN.

## 3 · Subir la app nueva
GitHub → repo `rugby-m9` → abrí `index.html` → ✏️ o "Add file → Upload files" → subí el nuevo `index.html` (reemplaza al anterior) → Commit.
En 1–2 minutos ya está online. Si el celu muestra la versión vieja, recargá la página.

## 4 · Prueba rápida
- [ ] Entrar con el PIN admin → arriba dice **ADMIN**. Plantel muestra la columna Nivel.
- [ ] Entrar desde otro celu con el PIN staff → dice **STAFF**, no hay niveles en ningún lado, "Mezclar de nuevo" igual arma equipos parejos.
- [ ] Asistencia: todos aparecen **Presentes**; tocá a 2 → Ausente → elegí el motivo (Sin aviso / Avisó / Lesionado / Enfermo) → Guardar.
- [ ] Planificación: escribí algo y tocá 📎 **Foto o PDF** → sacá una foto del pizarrón o elegí un PDF. Queda en tu Drive, en la carpeta "Regatas M9 - Planificaciones" (privada).
- [ ] Armar equipos → **Guardar / confirmar** → **📄 Ficha del entrenamiento** → probá **PDF** e **Imagen (WhatsApp)**.
- [ ] Tocá los títulos de las tablas (Plantel, Gira, Estadísticas, Historial) → ordenan ↑/↓.
- [ ] Modo avión → marcá algo en Gira → sale "1 cambio sin subir" → sacá el modo avión → se sube solo.
