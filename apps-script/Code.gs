/**
 * Regatas Bella Vista · M9 Camada 2017 — Backend v2 (Google Apps Script)
 * Pegar completo en Extensiones > Apps Script. Ejecutar "setup" una vez (pide permisos de Drive).
 * Implementar > Administrar implementaciones > ✏️ > Nueva versión (así la URL /exec no cambia).
 *
 * Roles por PIN (hoja CONFIG):
 *   PIN_ADMIN  -> ve y modifica calificaciones (nivel) de los jugadores
 *   PIN_STAFF  -> todo lo demás, sin ver ni tocar calificaciones
 *
 * GET  ?action=ping
 * GET  ?action=all&pin=X                  -> base completa (+ role)
 * GET  ?action=file&id=ID&pin=X           -> archivo de planificación en base64
 * POST {pin, action:'ops', ops:[...]}     -> upsert / replace / remove
 * POST {pin, action:'upload', nombre, mime, b64}
 * POST {pin, action:'deleteFile', id}
 * POST {pin, action:'equipos', presJ:[], presE:[], modo, n}
 */

var SHEETS = {
  CONFIG:       ['clave', 'valor', 'descripcion'],
  JUGADORES:    ['id', 'nombre', 'nivel', 'nivel2', 'colegio', 'grado', 'dni', 'fecha_nac', 'activo', 'fecha_baja', 'motivo_baja', 'fecha_alta', 'observaciones'],
  ENTRENADORES: ['id', 'apodo', 'nombre', 'rol', 'hijo_id', 'asigna_equipos', 'activo', 'fecha_baja', 'motivo_baja', 'dni', 'fecha_nac', 'observaciones'],
  SESIONES:     ['id', 'fecha', 'tipo', 'detalle', 'notas', 'actualizado', 'hora', 'archivos'],
  ASISTENCIA:   ['sesion_id', 'fecha', 'tipo', 'persona_tipo', 'persona_id', 'nombre', 'estado', 'calif', 'comentario', 'motivo'],
  EQUIPOS:      ['grupo_id', 'fecha', 'contexto', 'equipo', 'persona_tipo', 'persona_id', 'nombre'],
  GIRA:         ['clave', 'persona_tipo', 'persona_id', 'nombre', 'va', 'rol_gira', 'autorizacion', 'ficha_medica', 'pago', 'observaciones'],
  PREMIOS:      ['id', 'anio', 'titulo', 'descripcion', 'orden'],
  PREMIOS_ASIG: ['clave', 'anio', 'jugador_id', 'premio_id', 'nombre'],
  HOSPEDAJE:    ['id', 'nombre', 'cap_j', 'cap_e', 'orden'],
  HOSPEDAJE_ASIG: ['clave', 'persona_tipo', 'persona_id', 'hosp_id', 'nombre']
};
var SOLO_ADMIN = ['PREMIOS', 'PREMIOS_ASIG']; // el staff no las ve ni las modifica
var WRITABLE = ['JUGADORES', 'ENTRENADORES', 'SESIONES', 'ASISTENCIA', 'EQUIPOS', 'GIRA', 'CONFIG', 'PREMIOS', 'PREMIOS_ASIG', 'HOSPEDAJE', 'HOSPEDAJE_ASIG'];
var CARPETA = 'Regatas M9 - Planificaciones';

/* ---------- HTTP ---------- */
function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    if (p.action === 'ping') return json_({ ok: true, ts: new Date().toISOString() });
    var role = roleDe_(p.pin);
    if (p.action === 'file') return json_({ ok: true, file: leerArchivo_(p.id) });
    return json_({ ok: true, role: role, data: readAll_(role) });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var role = roleDe_(body.pin);
    var action = body.action || 'ops';
    if (action === 'upload') return json_({ ok: true, file: subirArchivo_(body) });
    if (action === 'deleteFile') { borrarArchivo_(body.id); return json_({ ok: true }); }
    if (action === 'equipos') return json_({ ok: true, equipos: equiposServidor_(body) });

    lock.waitLock(25000);
    var ops = (body.ops || []).map(function (op) { return sanitizar_(op, role); });
    ops.forEach(function (op) {
      if (WRITABLE.indexOf(op.sheet) < 0) throw new Error('Hoja no permitida: ' + op.sheet);
      if (['upsert', 'replace', 'remove'].indexOf(op.op) < 0) throw new Error('Operación desconocida: ' + op.op);
    });
    var results = ops.map(applyOp_);
    SpreadsheetApp.flush();
    return json_({ ok: true, results: results });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

/* ---------- Seguridad / roles ---------- */
function roleDe_(pin) {
  var cfg = readConfig_();
  var p = String(pin || '').trim();
  var admins = [cfg.PIN_ADMIN, cfg.PIN].map(function (x) { return String(x || '').trim(); }).filter(String);
  var staff = String(cfg.PIN_STAFF || '').trim();
  if (p && admins.indexOf(p) >= 0) return 'admin';
  if (p && staff && p === staff) return 'staff';
  throw new Error('PIN incorrecto');
}

// el staff no puede ver ni escribir calificaciones; nadie escribe PINs desde la app
function sanitizar_(op, role) {
  if (role !== 'admin' && SOLO_ADMIN.indexOf(op.sheet) >= 0) throw new Error('Solo administradores');
  if (op.sheet === 'CONFIG') {
    op.rows = (op.rows || []).filter(function (r) {
      var k = String(r.clave || '');
      if (/^PIN/i.test(k)) return false;
      return role === 'admin' || /^GIRA_/.test(k);
    });
  }
  if (role !== 'admin' && op.sheet === 'JUGADORES' && op.rows) {
    op.rows = op.rows.map(function (r) { var o = {}; for (var k in r) if (k !== 'nivel' && k !== 'nivel2') o[k] = r[k]; return o; });
  }
  return op;
}

/* ---------- Lectura ---------- */
function readAll_(role) {
  var out = {};
  Object.keys(SHEETS).forEach(function (name) {
    if (name === 'CONFIG' || (role !== 'admin' && SOLO_ADMIN.indexOf(name) >= 0)) return;
    out[name] = readSheet_(name);
  });
  if (role !== 'admin') out.JUGADORES.forEach(function (j) { delete j.nivel; delete j.nivel2; });
  var cfg = readConfig_();
  Object.keys(cfg).forEach(function (k) { if (/^PIN/i.test(k)) delete cfg[k]; });
  out.CONFIG = cfg;
  return out;
}

function readConfig_() {
  var cfg = {};
  readSheet_('CONFIG').forEach(function (r) { if (r.clave) cfg[String(r.clave).trim()] = r.valor; });
  return cfg;
}

function readSheet_(name) {
  var sh = getSheet_(name);
  var lr = sh.getLastRow(), lc = sh.getLastColumn();
  if (lr < 2 || lc < 1) return [];
  var values = sh.getRange(1, 1, lr, lc).getValues();
  var headers = values[0].map(function (h) { return String(h).trim(); });
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (row.join('') === '') continue;
    var o = {};
    headers.forEach(function (h, j) { if (h) o[h] = norm_(row[j]); });
    rows.push(o);
  }
  return rows;
}

function norm_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone() || 'America/Argentina/Buenos_Aires', 'yyyy-MM-dd');
  return v;
}

/* ---------- Escritura ---------- */
function applyOp_(op) {
  var sh = getSheet_(op.sheet);
  ensureHeaders_(sh, op.sheet);
  var lr = sh.getLastRow(), lc = Math.max(sh.getLastColumn(), 1);
  var values = lr >= 1 ? sh.getRange(1, 1, lr, lc).getValues() : [[]];
  var headers = values[0].map(function (h) { return String(h).trim(); });
  var data = values.slice(1);
  var toRow = function (obj, base) {
    return headers.map(function (h, j) {
      if (obj.hasOwnProperty(h)) return obj[h] === null || obj[h] === undefined ? '' : obj[h];
      return base ? base[j] : '';
    });
  };
  var n = 0;
  if (op.op === 'upsert') {
    var k = headers.indexOf(op.key);
    if (k < 0) throw new Error('Columna clave inexistente: ' + op.key);
    (op.rows || []).forEach(function (obj) {
      var idx = -1;
      for (var i = 0; i < data.length; i++) if (String(data[i][k]) === String(obj[op.key])) { idx = i; break; }
      if (idx >= 0) data[idx] = toRow(obj, data[idx]); else data.push(toRow(obj, null));
      n++;
    });
  } else {
    var f = headers.indexOf(op.field);
    if (f < 0) throw new Error('Columna inexistente: ' + op.field);
    var before = data.length;
    data = data.filter(function (r) { return String(norm_(r[f])) !== String(op.value); });
    n = before - data.length;
    if (op.op === 'replace') { (op.rows || []).forEach(function (obj) { data.push(toRow(obj, null)); }); n = (op.rows || []).length; }
  }
  if (lr > 1) sh.getRange(2, 1, lr - 1, headers.length).clearContent();
  if (data.length) {
    sh.getRange(2, 1, data.length, headers.length).setNumberFormat('@').setValues(data.map(function (r) {
      return r.map(function (v) { return v instanceof Date ? norm_(v) : v; });
    }));
  }
  return { sheet: op.sheet, op: op.op, n: n };
}

// agrega al final las columnas nuevas que falten (migración automática)
function ensureHeaders_(sh, name) {
  var want = SHEETS[name]; if (!want) return;
  var lc = Math.max(sh.getLastColumn(), 1);
  var have = sh.getRange(1, 1, 1, lc).getValues()[0].map(function (h) { return String(h).trim(); });
  var faltan = want.filter(function (h) { return have.indexOf(h) < 0; });
  if (!faltan.length) return;
  var start = have.filter(String).length + 1;
  sh.getRange(1, start, 1, faltan.length).setValues([faltan]);
}

/* ---------- Archivos de planificación (Drive privado) ---------- */
function carpeta_() {
  var cfg = readConfig_();
  if (cfg.CARPETA_ID) { try { return DriveApp.getFolderById(cfg.CARPETA_ID); } catch (e) {} }
  var it = DriveApp.getFoldersByName(CARPETA);
  var f = it.hasNext() ? it.next() : DriveApp.createFolder(CARPETA);
  applyOp_({ op: 'upsert', sheet: 'CONFIG', key: 'clave', rows: [{ clave: 'CARPETA_ID', valor: f.getId(), descripcion: 'Carpeta de Drive con las planificaciones (no tocar)' }] });
  return f;
}
function subirArchivo_(b) {
  if (!b.b64) throw new Error('Archivo vacío');
  var mime = String(b.mime || 'application/octet-stream');
  if (!/^image\/|^application\/pdf$/.test(mime)) throw new Error('Solo fotos o PDF');
  var blob = Utilities.newBlob(Utilities.base64Decode(b.b64), mime, String(b.nombre || 'planificacion'));
  var file = carpeta_().createFile(blob);
  return { id: file.getId(), nombre: file.getName(), mime: mime };
}
function archivoNuestro_(id) {
  var f = DriveApp.getFileById(id), car = carpeta_().getId(), ps = f.getParents();
  while (ps.hasNext()) if (ps.next().getId() === car) return f;
  throw new Error('Archivo no autorizado');
}
function leerArchivo_(id) {
  var f = archivoNuestro_(id), blob = f.getBlob();
  return { id: id, nombre: f.getName(), mime: blob.getContentType(), b64: Utilities.base64Encode(blob.getBytes()) };
}
function borrarArchivo_(id) { archivoNuestro_(id).setTrashed(true); }

/* ---------- Armado de equipos en el servidor (para el staff, que no ve niveles) ---------- */
function equiposServidor_(b) {
  var J = readSheet_('JUGADORES').filter(function (j) { return String(j.activo || 'SI').toUpperCase() !== 'NO'; }).map(function (j) { return { id: String(j.id), nivel: String(j.nivel || '2').toUpperCase(), nivel2: j.nivel2 === '' ? null : Number(j.nivel2), colegio: String(j.colegio || ''), grado: String(j.grado || '') }; });
  var E = readSheet_('ENTRENADORES').map(function (e) { return { id: String(e.id), hijo_id: String(e.hijo_id || ''), asigna_equipos: String(e.asigna_equipos || 'SI').toUpperCase() }; });
  return armarEquipos(J, E, b.presJ || [], b.presE || [], b.modo || 'mixtos', Number(b.n) || 6);
}

// MISMA función que usa la app (index.html). Si se cambia una, cambiar la otra.
function armarEquipos(J, E, presJ, presE, modo, n) {
  var pj = {}; presJ.forEach(function (x) { pj[String(x)] = 1; });
  var pe = {}; presE.forEach(function (x) { pe[String(x)] = 1; });
  var pres = J.filter(function (j) { return pj[j.id]; });
  if (!pres.length) return [];
  var shuffle = function (a) { for (var i = a.length - 1; i > 0; i--) { var k = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[k]; a[k] = t; } return a; };
  // de mejor a peor: Nivel 1 > Nivel 2 > Nivel 3 > Gloriosa 1 > Gloriosa 2 > Gloriosa 3
  var ord = { '1': 1, '2': 2, '3': 3, G: 4 };
  var nk = function (j) { return j.nivel === 'G' ? 'G' + Number(j.nivel2 || 2).toFixed(1) : (j.nivel || '2'); };
  var porNivel = function (arr) {
    var g = {};
    arr.forEach(function (j) { var k = nk(j); (g[k] = g[k] || []).push(j); });
    return Object.keys(g).sort(function (a, b) { return ((ord[a[0]] || 2) - (ord[b[0]] || 2)) || (a < b ? -1 : a > b ? 1 : 0); })
      .reduce(function (acc, k) { return acc.concat(shuffle(g[k])); }, []);
  };
  var snake = function (lista, eqs) { var i = 0, dir = 1; lista.forEach(function (j) { eqs[i].jugadores.push(j); i += dir; if (i === eqs.length) { i = eqs.length - 1; dir = -1; } else if (i < 0) { i = 0; dir = 1; } }); };
  // compañeros = mismo colegio y mismo grado: se separan para que no queden más de 2 juntos
  var grp = function (j) { var c = String(j.colegio || '').trim(); return !c || c === 'N/A' ? '' : c.toLowerCase() + '|' + String(j.grado || ''); };
  var separar = function (eqs) {
    if (eqs.length < 2) return;
    var tot = {}; eqs.forEach(function (e) { e.jugadores.forEach(function (j) { var g = grp(j); if (g) tot[g] = (tot[g] || 0) + 1; }); });
    var lim = function (g) { return Math.max(2, Math.ceil(tot[g] / eqs.length)); };
    var cnt = function (e, g) { var c = 0; e.jugadores.forEach(function (x) { if (grp(x) === g) c++; }); return c; };
    [nk, function (j) { return j.nivel || '2'; }].forEach(function (key) {
      for (var it = 0; it < 400; it++) {
        var hecho = false;
        for (var a = 0; a < eqs.length && !hecho; a++) {
          var A = eqs[a];
          for (var pi = 0; pi < A.jugadores.length && !hecho; pi++) {
            var p = A.jugadores[pi], g = grp(p);
            if (!g || cnt(A, g) <= lim(g)) continue;
            for (var b = 0; b < eqs.length && !hecho; b++) {
              var B = eqs[b]; if (b === a || cnt(B, g) >= lim(g)) continue;
              for (var qi = 0; qi < B.jugadores.length; qi++) {
                var q = B.jugadores[qi], h = grp(q);
                if (key(q) !== key(p) || h === g || (h && cnt(A, h) >= lim(h))) continue;
                A.jugadores[pi] = q; B.jugadores[qi] = p; hecho = true; break;
              }
            }
          }
        }
        if (!hecho) break;
      }
    });
  };
  var equipos = [], i;
  var hayG = pres.some(function (j) { return j.nivel === 'G'; });
  if (modo === 'por-nivel' && hayG) {
    n = Math.max(n, 3);
    equipos.push({ id: 1, nombre: 'Gloriosa A', jugadores: [], entrenadores: [] }, { id: 2, nombre: 'Gloriosa B', jugadores: [], entrenadores: [] });
    snake(porNivel(pres.filter(function (j) { return j.nivel === 'G'; })), equipos.slice(0, 2));
    var resto = [];
    for (i = 0; i < n - 2; i++) resto.push({ id: i + 3, nombre: 'Equipo ' + (i + 3), jugadores: [], entrenadores: [] });
    snake(porNivel(pres.filter(function (j) { return j.nivel !== 'G'; })), resto);
    separar(equipos.slice(0, 2)); separar(resto);
    equipos = equipos.concat(resto);
  } else {
    for (i = 0; i < n; i++) equipos.push({ id: i + 1, nombre: 'Equipo ' + (i + 1), jugadores: [], entrenadores: [] });
    snake(porNivel(pres), equipos);
    separar(equipos);
  }
  var ents = shuffle(E.filter(function (e) { return e.asigna_equipos !== 'NO' && pe[e.id]; }));
  var sinHijo = [];
  ents.forEach(function (e) {
    var eq = null;
    if (e.hijo_id) equipos.forEach(function (q) { if (!eq && q.jugadores.some(function (j) { return j.id === e.hijo_id; })) eq = q; });
    if (eq && eq.entrenadores.length < 2) eq.entrenadores.push(e.id); else sinHijo.push(e);
  });
  sinHijo.forEach(function (e) { var eq = equipos.slice().sort(function (a, b) { return a.entrenadores.length - b.entrenadores.length; })[0]; eq.entrenadores.push(e.id); });
  equipos.forEach(function (e) { e.jugadores = e.jugadores.map(function (j) { return j.id; }); });
  return equipos;
}

/* ---------- Utilidades ---------- */
function getSheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.getRange(1, 1, 1, SHEETS[name].length).setValues([SHEETS[name]]); }
  return sh;
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/** Ejecutar UNA vez desde el editor tras pegar esta versión: migra columnas, crea PINs y la carpeta de Drive. */
function setup() {
  Object.keys(SHEETS).forEach(function (name) { ensureHeaders_(getSheet_(name), name); });
  var cfg = readConfig_(), rows = [];
  if (!cfg.PIN_ADMIN) rows.push({ clave: 'PIN_ADMIN', valor: String(cfg.PIN || '2017'), descripcion: 'PIN administradores: ven y editan calificaciones' });
  if (!cfg.PIN_STAFF) rows.push({ clave: 'PIN_STAFF', valor: '1234', descripcion: 'PIN entrenadores/staff: sin calificaciones (cambialo)' });
  if (rows.length) applyOp_({ op: 'upsert', sheet: 'CONFIG', key: 'clave', rows: rows });
  if (cfg.PIN && !cfg.PIN_ADMIN) applyOp_({ op: 'remove', sheet: 'CONFIG', field: 'clave', value: 'PIN' });
  var f = carpeta_();
  Logger.log('OK. Carpeta de planificaciones: ' + f.getUrl());
  Logger.log('PINs: revisá PIN_ADMIN y PIN_STAFF en la hoja CONFIG.');
}
