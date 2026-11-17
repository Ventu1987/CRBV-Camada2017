# Regatas M9 · Camada 2017 — Guía de instalación y prueba

Archivos del paquete:

| Archivo | Para qué es |
|---|---|
| `Rugby_M9_BASE.xlsx` | La base inicial. Se convierte en el Google Sheet |
| `Code.gs` | El "motor" que va dentro del Google Sheet (Apps Script) |
| `index.html` | La web app que se sube a GitHub |
| `escudo.png` | **Lo agregás vos**: el escudo de Regatas en PNG (fondo transparente ideal) |

---

## PASO 0 · Probar la app sin instalar nada (5 min)

1. Descargá `index.html` y abrilo con doble clic (Chrome).
2. Aparece "Bienvenido" → tocá **🧪 Probar en modo demo**.
3. Recorré las 6 pestañas con datos ficticios (44 jugadores inventados, 20 sesiones).
   El modo demo guarda solo en ese navegador; no toca ninguna planilla.

## PASO 1 · Crear el Google Sheet (5 min)

1. Entrá a https://drive.google.com → **Nuevo → Subir archivo** → `Rugby_M9_BASE.xlsx`.
2. Abrilo con doble clic → **Archivo → Guardar como Hojas de cálculo de Google**.
   (Se crea una copia nativa: trabajá siempre sobre esa, no sobre el .xlsx.)
3. Renombralo: `Regatas M9 2017 - BASE`.
4. Revisá las pestañas: CONFIG, JUGADORES, ENTRENADORES, SESIONES, ASISTENCIA, EQUIPOS, GIRA.
5. En **CONFIG** cambiá el **PIN** (viene `2017`) por el que quieras. Ese PIN se lo pasás a quienes usen la app.
   Si conocés las fechas de Tandil, cargalas en `GIRA_DESDE` / `GIRA_HASTA` como `2026-11-14` (o hacelo después desde la app).

## PASO 2 · Pegar el motor (Apps Script) (5 min)

1. En el Google Sheet: **Extensiones → Apps Script**.
2. Borrá todo lo que hay en `Código.gs` y pegá el contenido completo de `Code.gs`. Guardá (💾).
3. Arriba, en el desplegable de funciones elegí **setup** → **Ejecutar**.
4. Google pide permisos: **Revisar permisos** → tu cuenta → "Google no verificó esta app" → **Configuración avanzada → Ir a (nombre del proyecto)** → **Permitir**.
   Es tu propio script, es normal.
5. En "Registro de ejecución" tiene que decir `Jugadores cargados: 75`.

## PASO 3 · Publicarlo como Web App (3 min)

1. **Implementar → Nueva implementación**.
2. Engranaje ⚙️ → tipo **Aplicación web**.
3. Ejecutar como: **Yo** · Quién tiene acceso: **Cualquier usuario**.
4. **Implementar** → copiá la **URL de la aplicación web** (termina en `/exec`).
5. Prueba rápida: pegá en el navegador `TU_URL?action=ping` → tiene que responder `{"ok":true,...}`.
   Y `TU_URL?action=all&pin=TU_PIN` → muestra todo el JSON de la base.

> ⚠️ Si más adelante cambiás `Code.gs`: **Implementar → Administrar implementaciones → ✏️ → Versión: Nueva versión → Implementar**. Así la URL no cambia.

## PASO 4 · Poner la URL en la app (1 min)

Abrí `index.html` con un editor (Bloc de notas sirve) y buscá cerca del principio del script:

```js
const API_URL = '';
```

Pegá tu URL entre las comillas:

```js
const API_URL = 'https://script.google.com/macros/s/XXXXXXXX/exec';
```

Guardá. (Alternativa sin editar: en la app, ⚙️ → pegar URL + PIN → Conectar. Pero así cada celular lo tiene que hacer.)

## PASO 5 · Subir a GitHub Pages (5 min)

1. Entrá a GitHub con tu usuario (**Ventu1987**) → **New repository** → nombre `rugby-m9` → Public → Create.
2. **Add file → Upload files** → arrastrá `index.html` y `escudo.png` → **Commit changes**.
3. **Settings → Pages** → Source: *Deploy from a branch* → Branch **main** / **(root)** → Save.
4. En 1–2 minutos queda en: **https://ventu1987.github.io/rugby-m9/**
5. Abrila → pide PIN → entra con los datos reales.

> 🔒 En GitHub **no** quedan datos de los chicos: ni nombres, ni niveles, ni DNI. Todo vive en el Google Sheet y solo se ve con PIN.
> No subas nunca el `.xlsx` al repo.

## PASO 6 · Checklist de prueba (15 min, con datos reales)

Hacelo en el celular, que es donde se va a usar:

- [ ] **Inicio**: se ve el escudo, "Camada 2017 · M9 2026", plantel 75, gira 52 jugadores + 13 adultos.
- [ ] **Asistencia**: elegí la fecha del último miércoles → "Todos presentes" → marcá 3 ausentes con ✗ → a uno ponele ▲ y un comentario → **Guardar**.
      Abrí el Sheet, pestaña ASISTENCIA: tienen que aparecer ~89 filas con esa fecha.
- [ ] Volvé a elegir esa fecha → dice "Sesión guardada · editando" y trae las marcas.
- [ ] Tocá **Armar equipos con estos presentes** → elegí 6 equipos, Mixtos / Por nivel → mové un jugador (celu: tocalo y "Mover acá"; compu: arrastrar).
- [ ] **Guardar en planilla** → mirá la pestaña EQUIPOS. **Copiar (WhatsApp)** y pegalo en un chat. **Imprimir/PDF** → sale sin niveles.
- [ ] **Plantel** → ➕ Jugador de prueba → editalo → "No viene más" → aparece en la solapa "No vienen más" → "Vuelve".
- [ ] **Gira** → pasá a alguien a "No viaja" y devolvelo → marcá Aut./Ficha/Pago → Listado de pasajeros (PDF).
- [ ] **Stats** → ranking, gráficos, destacados (aparece el ▲ que cargaste), ficha del jugador al tocarlo, Exportar CSV.
- [ ] Abrí la app en OTRO celular con el mismo PIN → tiene que ver lo mismo.
- [ ] Borrá la sesión y el jugador de prueba (en la app: Asistencia → Borrar sesión).

## Uso diario sugerido

- **Miércoles**: el manager toma asistencia (2 minutos: "Todos presentes" + tocar ausentes) y marca ▲/▼ si pasó algo.
- **Sábados**: asistencia → "Armar equipos con estos presentes" → ajustar → Guardar → Copiar al grupo de entrenadores.
- **Gira**: la pestaña Gira es la lista oficial; cualquier cambio de quién va se hace ahí.
- **Fin de año**: Stats → Destacados (filtro ▲) + ranking de asistencia + Exportar CSV.

## Si algo falla

| Síntoma | Solución |
|---|---|
| "PIN incorrecto" | Revisá CONFIG → PIN en el Sheet (sin espacios) |
| "No se pudo leer la planilla" | La URL no termina en `/exec`, o la implementación no está en "Cualquier usuario" |
| Cambié Code.gs y no toma | Falta "Nueva versión" en Administrar implementaciones |
| No aparece el escudo | El archivo en GitHub se tiene que llamar exactamente `escudo.png` (minúsculas) |
| Punto rojo "Sin guardar" | Sin señal en la cancha: esperá conexión y volvé a tocar Guardar |

## Estructura de la planilla (por si querés hacer tablas dinámicas)

- **JUGADORES**: id, nombre, nivel (G/1/2/3), nivel2 (sub-nivel Gloriosa), colegio, grado, dni, fecha_nac, activo (SI/NO), fecha_baja, motivo_baja, fecha_alta, observaciones
- **ENTRENADORES**: id, apodo, nombre, rol, hijo_id (va al mismo equipo que el hijo), asigna_equipos (los managers en NO), activo, …
- **SESIONES**: una fila por entrenamiento/partido (id = fecha_tipo, ej `2026-10-07_MIE`)
- **ASISTENCIA**: una fila por persona por sesión — estado P/A, calif 1/0/-1 (▲/nada/▼), comentario
- **EQUIPOS**: los equipos guardados (por sesión, gira o libres)
- **GIRA**: va SI/NO, rol en la gira, autorizacion / ficha_medica / pago (SI/NO), observaciones
