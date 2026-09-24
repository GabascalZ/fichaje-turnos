/* Comprueba que el motor reproduce una hoja de control horario real.
   Extrae las funciones de calculo del propio src/p3.html (no las copia)
   y las corre contra los datos reales de MAYO 2026.
   Uso:  node test_motor.js                                            */
const fs = require("fs");
const path = require("path");
/* Los marcadores que rellena build.py se sustituyen aquí igual, si no el código
   extraído no compila. El sueldo base de las pruebas es el de ejemplo. */
const SRC = fs.readFileSync(path.join(__dirname, "src", "p3.html"), "utf8")
  .replace(/__BASE__/g, "1000")
  .replace(/__FOTO__|__FOTO_DE__/g, "");

/* --- saca un `function nombre(...){...}` completo, casando llaves --- */
function saca(nombre) {
  const i = SRC.indexOf("function " + nombre + "(");
  if (i < 0) throw new Error("no encuentro function " + nombre);
  let j = SRC.indexOf("{", i), d = 0;
  for (let k = j; k < SRC.length; k++) {
    if (SRC[k] === "{") d++;
    else if (SRC[k] === "}" && --d === 0) return SRC.slice(i, k + 1);
  }
  throw new Error("llaves sin cerrar en " + nombre);
}
function sacaVar(nombre) {
  const re = new RegExp("var " + nombre + "\\s*=\\s*", "g");
  const m = re.exec(SRC);
  if (!m) throw new Error("no encuentro var " + nombre);
  let j = SRC.indexOf(m[0]) + m[0].length, d = 0, ini = j;
  for (let k = j; k < SRC.length; k++) {
    if ("{[".includes(SRC[k])) d++;
    else if ("}]".includes(SRC[k])) { if (--d === 0) return "var " + nombre + " = " + SRC.slice(ini, k + 1) + ";"; }
  }
  throw new Error("no cierra var " + nombre);
}

const FNS = ["clone", "pad", "dkey", "parseDk", "prevMk", "m2n", "durMin", "nocMin", "aNum",
             "soloDigitos", "vistaHora", "hhmm",
             "pascua", "masDias", "festivosDe", "esFestivoNac", "fesEfectivo",
             "lunesDe", "diasEntre", "turnoCiclo", "balanceCub",
             "calcDia", "calcMes", "calcPago"];
const codigo = [sacaVar("DEF_RATES"), sacaVar("DEF_BASE"), sacaVar("FEST_FIJOS"), sacaVar("FEST_CV_FIJOS"), sacaVar("cacheFest"), sacaVar("CICLO")]
  .concat(FNS.map(saca))
  .concat([
    "var DB = { modo:'NATURAL', meses:{}, ajustes:{ rates: DEF_RATES, base: DEF_BASE } };",
    "function cfgDe(mk){ var M=DB.meses[mk]; if(M&&M.cfg) return M.cfg; return {rates:DB.ajustes.rates, base:DB.ajustes.base}; }",
    "module.exports = { get DB(){return DB}, set DB(v){DB=v}, calcDia, calcMes, calcPago,"
    + " durMin, nocMin, aNum, vistaHora, hhmm, lunesDe, turnoCiclo, balanceCub, CICLO, festivosDe, esFestivoNac, fesEfectivo, DEF_RATES, DEF_BASE };"
  ]).join("\n");

const M = { exports: {} };
new Function("module", "exports", codigo)(M, M.exports);
const A = M.exports;

/* ═════════ un mes real de turnos, para contrastar ═════════ */
const MAYO = {
  "2026-05-01": { t: [{ i: "05:00", o: "13:00" }], turno: "MANANA", per: 0.5 },
  "2026-05-02": { t: [{ i: "05:00", o: "13:00" }], turno: "MANANA", per: 1 },
  "2026-05-03": { t: [{ i: "04:00", o: "13:00" }], turno: "MANANA", per: 1 },
  "2026-05-04": { t: [{ i: "05:00", o: "13:00" }], turno: "MANANA" },
  "2026-05-05": { t: [{ i: "05:00", o: "13:00" }], turno: "MANANA" },
  "2026-05-06": { t: [{ i: "05:00", o: "13:00" }], turno: "MANANA" },
  "2026-05-11": { t: [{ i: "23:00", o: "06:00" }], turno: "NOCHES" },
  "2026-05-12": { t: [{ i: "23:00", o: "06:00" }], turno: "NOCHES" },
  "2026-05-13": { t: [{ i: "22:00", o: "06:00" }], turno: "NOCHES" },
  "2026-05-14": { t: [{ i: "22:00", o: "06:00" }], turno: "NOCHES" },
  "2026-05-15": { t: [{ i: "23:00", o: "06:00" }], turno: "NOCHES" },
  "2026-05-16": { t: [{ i: "23:00", o: "06:00" }], turno: "NOCHES" },
  "2026-05-17": { t: [{ i: "23:00", o: "06:00" }], turno: "NOCHES" },
  "2026-05-21": { t: [{ i: "04:00", o: "07:00" }, { i: "08:00", o: "13:00" }], turno: "MANANA" },
  "2026-05-22": { t: [{ i: "07:00", o: "15:00" }], turno: "MANANA" },
  "2026-05-23": { t: [{ i: "04:00", o: "07:00" }, { i: "08:00", o: "13:00" }], turno: "MANANA" },
  "2026-05-24": { t: [{ i: "08:00", o: "16:00" }], turno: "MANANA" },
  "2026-05-25": { t: [{ i: "08:00", o: "15:00" }], turno: "MANANA" },
  "2026-05-26": { t: [{ i: "08:00", o: "15:00" }], turno: "MANANA" },
  "2026-05-27": { t: [{ i: "04:00", o: "07:00" }], turno: "MANANA" },
  "2026-05-28": { t: [{ i: "08:00", o: "13:00" }], turno: "MANANA" }
};
/* JUNIO 2026, tal cual esta apuntado */
const JUNIO = {};
["01", "02", "03", "04", "05", "06", "07"].forEach(d => JUNIO["2026-06-" + d] = { t: [{ i: "16:00", o: "23:00" }], turno: "NOCHES" });
JUNIO["2026-06-11"] = { t: [{ i: "05:00", o: "13:00" }], turno: "MANANA" };
JUNIO["2026-06-12"] = { t: [{ i: "04:00", o: "12:00" }], turno: "MANANA" };
JUNIO["2026-06-13"] = { t: [{ i: "05:00", o: "13:00" }], turno: "MANANA", per: 1 };
JUNIO["2026-06-14"] = { t: [{ i: "04:00", o: "13:00" }], turno: "MANANA", per: 1 };

A.DB = {
  modo: "NATURAL",
  ajustes: { rates: A.DEF_RATES, base: A.DEF_BASE },
  meses: { "2026-05": { dias: MAYO }, "2026-06": { dias: JUNIO } }
};

/* ═════════ comprobaciones ═════════ */
let ok = 0, ko = 0;
const r2 = n => Math.round(n * 100) / 100;
function eq(que, got, exp) {
  const bien = r2(got) === r2(exp);
  console.log((bien ? "  OK  " : "  FALLA") + "  " + que.padEnd(42) + String(r2(got)).padStart(9) + (bien ? "" : "   esperaba " + r2(exp)));
  bien ? ok++ : ko++;
}

console.log("\n=== Tramos sueltos (nocturnidad entre 22:00 y 06:00) ===");
eq("16:00-23:00  horas", A.durMin({ i: "16:00", o: "23:00" }) / 60, 7);
eq("16:00-23:00  nocturnidad", A.nocMin({ i: "16:00", o: "23:00" }) / 60, 1);
eq("23:00-06:00  horas", A.durMin({ i: "23:00", o: "06:00" }) / 60, 7);
eq("23:00-06:00  nocturnidad", A.nocMin({ i: "23:00", o: "06:00" }) / 60, 7);
eq("22:00-06:00  nocturnidad", A.nocMin({ i: "22:00", o: "06:00" }) / 60, 8);
eq("05:00-13:00  nocturnidad", A.nocMin({ i: "05:00", o: "13:00" }) / 60, 1);
eq("08:00-15:00  nocturnidad", A.nocMin({ i: "08:00", o: "15:00" }) / 60, 0);
eq("21:00-01:00  nocturnidad", A.nocMin({ i: "21:00", o: "01:00" }) / 60, 3);

console.log("\n=== MAYO 2026 contra los totales del Excel (fila 79) ===");
const m = A.calcMes("2026-05");
eq("horas del mes            [Excel 154]", m.horas, 154);
eq("nocturnidad              [Excel  51]", m.noc, 51);
eq("perentorias              [Excel 2,5]", m.per, 2.5);
eq("dias trabajados", m.dias, 21);
eq("turnos partidos", m.frac, 2);
eq("domingos trabajados", m.dom, 3);
eq("horas complementarias (154-151)", m.compl, 3);

console.log("\n=== Donde la app corrige al Excel (a favor de ella) ===");
eq("manutencion  [Excel 17, cuenta filas]", m.manut, 19);
eq("madrugue     [Excel  8, uno sin marcar]", m.mad, 9);

console.log("\n=== JUNIO 2026 contra los totales del Excel (fila 39) ===");
const j = A.calcMes("2026-06");
eq("horas del mes             [Excel 82]", j.horas, 82);
eq("nocturnidad               [Excel  7]", j.noc, 7);
eq("madrugue                  [Excel  4]", j.mad, 4);
eq("perentorias               [Excel  2]", j.per, 2);
eq("manutencion (dias >6 h)   [Excel 11]", j.manut, 11);
eq("domingos trabajados", j.dom, 2);

console.log("\n=== Nomina de JUNIO a mes vencido (pluses de mayo) ===");
A.DB.modo = "VENCIDO";
const P = A.calcPago("2026-06");
eq("nocturnidad   51 h x 1,61", P.ad.noc, 82.11);
eq("domingos       3   x 2,80", P.ad.dom, 8.40);
eq("fraccionada    2   x 11,34", P.ad.frac, 22.68);
eq("manutencion   19   x 6,24", P.ad.manut, 118.56);
eq("madrugue       9   x 6,43", P.ad.mad, 57.87);
eq("TFD                  fijo", P.ad.tfd, 90);
eq("complementarias 3 h x 10,25", P.complEur, 30.75);
eq("total base 1000 + 30,75", P.totalBase, 1030.75);

console.log("\n=== Festivos nacionales que se marcan solos ===");
eq("festivos solo nacionales 2026", Object.keys(A.festivosDe(2026, false)).length, 10);
eq("con Comunitat Valenciana 2026", Object.keys(A.festivosDe(2026, true)).length, 14);
// Pascua 2026 = 5 abril -> Viernes Santo 3, Lunes de Pascua 6, Sant Vicent 13
[["2026-04-06", "Lunes de Pascua"], ["2026-04-13", "Sant Vicent Ferrer"],
 ["2026-03-19", "San José"], ["2026-10-09", "9 d Octubre"]].forEach(([d, n]) => {
  const got = !!A.festivosDe(2026, true)[d];
  console.log((got ? "  OK  " : "  FALLA") + "  " + (d + "  " + n).padEnd(42) + String(got).padStart(9));
  got ? ok++ : ko++;
});
console.log("  (Jueves Santo fuera: en la Comunitat Valenciana no es festivo)");
[["2026-01-01", true], ["2026-01-06", true], ["2026-04-03", true], ["2026-05-01", true],
 ["2026-08-15", true], ["2026-10-12", true], ["2026-12-25", true],
 ["2026-04-02", false], ["2026-06-15", false]].forEach(([d, esp]) => {
  const got = A.esFestivoNac(d);
  const bien = got === esp;
  console.log((bien ? "  OK  " : "  FALLA") + "  " + (d + (esp ? " es festivo" : " no es festivo")).padEnd(42) + String(got).padStart(9));
  bien ? ok++ : ko++;
});
console.log("  (Viernes Santo 2026 = 3 de abril; el Jueves Santo queda fuera a propósito)");

console.log("\n=== Impuestos en porcentaje ===");
A.DB.meses["2026-06"].cfg = JSON.parse(JSON.stringify({ rates: A.DEF_RATES, base: A.DEF_BASE }));
A.DB.meses["2026-06"].cfg.base.impModo = "PORC";
A.DB.meses["2026-06"].cfg.base.impSS = 6.47;
A.DB.meses["2026-06"].cfg.base.impIRPF = 2.5;
const Pp = A.calcPago("2026-06");
eq("bruto = base + adicionales", Pp.bruto, r2(Pp.totalBase + Pp.totalAd));
eq("Seguridad Social 6,47 %", Pp.ss, r2(Pp.bruto * 0.0647));
eq("IRPF 2,5 %", Pp.irpf, r2(Pp.bruto * 0.025));
eq("a cobrar = bruto - impuestos", Pp.aCobrar, r2(Pp.bruto - Pp.ss - Pp.irpf));
A.DB.meses["2026-06"].cfg.base.impModo = "FIJO";

console.log("\n=== El cuadrante: ciclo de 3 semanas ===");
eq("el ciclo dura 21 días", A.CICLO.length, 21);
eq("días de tarde en el ciclo", A.CICLO.filter(t => t === "TARDE").length, 7);
eq("días de mañana en el ciclo", A.CICLO.filter(t => t === "MANANA").length, 7);
eq("días libres en el ciclo", A.CICLO.filter(t => t === "LIBRE").length, 7);
// 2026-08-31 es lunes: lo tomamos como día 0 del ciclo
A.DB.cuadrante = { ancla: "2026-08-31", auto: 1 };
const DL = ["do", "lu", "ma", "mi", "ju", "vi", "sa"];
const esperado = [
  // semana 1: lunes 31 ago a domingo 6 sep, todo tardes
  ["2026-08-31", "TARDE"], ["2026-09-06", "TARDE"],
  // semana 2: lunes 7, martes 8, miércoles 9 libres; jueves 10 a domingo 13 mañanas
  ["2026-09-07", "LIBRE"], ["2026-09-09", "LIBRE"], ["2026-09-10", "MANANA"], ["2026-09-13", "MANANA"],
  // semana 3: lunes 14 a miércoles 16 mañanas; jueves 17 a domingo 20 libres
  ["2026-09-14", "MANANA"], ["2026-09-16", "MANANA"], ["2026-09-17", "LIBRE"], ["2026-09-20", "LIBRE"],
  // y vuelta a empezar el lunes 21
  ["2026-09-21", "TARDE"], ["2026-09-27", "TARDE"], ["2026-09-28", "LIBRE"]
];
esperado.forEach(([dk, esp]) => {
  const got = A.turnoCiclo(dk);
  const bien = got === esp;
  const dia = DL[new Date(+dk.slice(0, 4), +dk.slice(5, 7) - 1, +dk.slice(8)).getDay()];
  console.log((bien ? "  OK  " : "  FALLA") + "  " + (dk + " (" + dia + ")").padEnd(42) + got.padStart(9) + (bien ? "" : "   esperaba " + esp));
  bien ? ok++ : ko++;
});
// hacia atrás también, que el ciclo no empieza el día que ella lo configura
eq("una semana antes del ancla es libre (domingo)", A.turnoCiclo("2026-08-30") === "LIBRE" ? 1 : 0, 1);
eq("el ciclo se repite a los 21 días", A.turnoCiclo("2026-08-31") === A.turnoCiclo("2026-09-21") ? 1 : 0, 1);
A.DB.cuadrante = null;
eq("sin cuadrante no propone nada", A.turnoCiclo("2026-09-01") === "" ? 1 : 0, 1);

console.log("\n=== Turnos cubiertos (sin nombres fijos) ===");
A.DB.meses["2026-11"] = { dias: {
  "2026-11-02": { t: [], turno: "LIBRE", cub: { tipo: "ME", quien: "Ana" } },
  "2026-11-03": { t: [], turno: "LIBRE", cub: { tipo: "ME", quien: "Ana" } },
  "2026-11-09": { t: [{ i: "16:00", o: "23:00" }], turno: "TARDE", cub: { tipo: "YO", quien: "Ana" } },
  "2026-11-10": { t: [{ i: "16:00", o: "23:00" }], turno: "TARDE", cub: { tipo: "YO", quien: "Sara" } }
} };
const B = A.balanceCub();
eq("veces que la cubrieron", B.me, 2);
eq("veces que cubrió ella", B.yo, 2);
eq("saldo global (0 = en paz)", B.saldo, 0);
eq("con Ana: la cubrió 2", B.gente["Ana"].me, 2);
eq("con Ana: cubrió 1  -> le deben 1", B.gente["Ana"].me - B.gente["Ana"].yo, 1);
eq("con Sara: cubrió 1 -> ella debe 1", B.gente["Sara"].me - B.gente["Sara"].yo, -1);
// un día cubierto por otra persona no cuenta como trabajado
const nov = A.calcMes("2026-11");
eq("días trabajados en noviembre", nov.dias, 2);
eq("horas de noviembre", nov.horas, 14);
delete A.DB.meses["2026-11"];

console.log("\n=== Cosas que le van a pasar de verdad ===");
const dia = (dk, d) => A.calcDia(dk, d);
// se deja la hora de salida sin poner
const medias = dia("2026-06-16", { t: [{ i: "05:00", o: "" }], turno: "MANANA" });
eq("tramo a medias: horas", medias.horas, 0);
eq("tramo a medias: avisa", medias.incompleto, 1);
const entero = dia("2026-06-16", { t: [{ i: "05:00", o: "13:00" }], turno: "MANANA" });
eq("tramo entero: no avisa", entero.incompleto, 0);
// noche de sabado que acaba el domingo: cuenta en el dia que empieza, como su Excel
eq("sábado 23:00-06:00 no es domingo", dia("2026-06-06", { t: [{ i: "23:00", o: "06:00" }] }).dom, 0);
eq("domingo 23:00-06:00 sí es domingo", dia("2026-06-07", { t: [{ i: "23:00", o: "06:00" }] }).dom, 1);
// turno partido con hueco largo
const part = dia("2026-06-16", { t: [{ i: "04:00", o: "07:00" }, { i: "16:00", o: "20:00" }] });
eq("partido 3h + 4h = 7h", part.horas, 7);
eq("partido cuenta como fraccionada", part.frac, 1);
eq("partido con entrada a las 04:00 = madrugue", part.mad, 1);
// justo en los bordes del madrugue
eq("entra 03:59 no es madrugue", dia("2026-06-16", { t: [{ i: "03:59", o: "12:00" }] }).mad, 0);
eq("entra 04:00 sí es madrugue", dia("2026-06-16", { t: [{ i: "04:00", o: "12:00" }] }).mad, 1);
eq("entra 06:55 sí es madrugue", dia("2026-06-16", { t: [{ i: "06:55", o: "12:00" }] }).mad, 1);
eq("entra 06:56 no es madrugue", dia("2026-06-16", { t: [{ i: "06:56", o: "12:00" }] }).mad, 0);
// justo en el borde de la manutencion
eq("6 h clavadas no dan manutención", dia("2026-06-16", { t: [{ i: "08:00", o: "14:00" }] }).manut, 0);
eq("6 h y 1 min sí dan manutención", dia("2026-06-16", { t: [{ i: "08:00", o: "14:01" }] }).manut, 1);

console.log("\n=== Escribir la hora a mano (lo que pidió su hermana) ===");
// lo que se ve mientras teclea
[["5", "5"], ["17", "17"], ["171", "17:1"], ["1716", "17:16"],
 ["5", "5"], ["53", "5:3"], ["530", "5:30"], ["", ""]].forEach(([d, esp]) => {
  const got = A.vistaHora(d);
  const bien = got === esp;
  console.log((bien ? "  OK  " : "  FALLA") + "  " + ("mientras teclea " + JSON.stringify(d)).padEnd(42) + String(got).padStart(9) + (bien ? "" : "   esperaba " + esp));
  bien ? ok++ : ko++;
});
// como queda al salir del campo
[["5", "05:00"], ["05", "05:00"], ["17", "17:00"], ["530", "05:30"], ["0530", "05:30"],
 ["5:30", "05:30"], ["1716", "17:16"], ["17:16", "17:16"], ["23:59", "23:59"],
 ["0", "00:00"], ["", ""], ["2575", null], ["99", null]].forEach(([t, esp]) => {
  const got = A.hhmm(t);
  const bien = got === esp;
  console.log((bien ? "  OK  " : "  FALLA") + "  " + ("al salir " + JSON.stringify(t)).padEnd(42) + String(got).padStart(9) + (bien ? "" : "   esperaba " + esp));
  bien ? ok++ : ko++;
});

console.log("\n=== Números tal y como los va a escribir en el móvil ===");
[["1480,25", 1480.25], ["1.480,25", 1480.25], ["1480.25", 1480.25], ["1.480", 1480],
 ["10,25", 10.25], ["10.25", 10.25], ["2,5", 2.5], ["151", 151], ["1000", 1000],
 ["0,5", 0.5], ["1.234.567,89", 1234567.89], ["  12,30 €", 12.3],
 ["hola", null], ["", null]].forEach(([t, esp]) => {
  const got = A.aNum(t);
  const bien = got === esp;
  console.log((bien ? "  OK  " : "  FALLA") + "  " + JSON.stringify(t).padEnd(20) + String(got).padStart(12) + (bien ? "" : "   esperaba " + esp));
  bien ? ok++ : ko++;
});

console.log("\n=== Diferencia con lo que muestra su Excel para junio ===");
console.log("  Excel  ......... 1506,48 EUR");
console.log("  App    ......... " + r2(P.aCobrar) + " EUR");
console.log("  Sale a favor ... " + r2(P.aCobrar - 1506.48) + " EUR");
console.log("  (manutencion +12,48 por los 2 turnos partidos, madrugue +6,43 del 27/5,");
console.log("   transporte por dias reales en vez del 21 fijo, y complementarias de mayo)");

console.log("\n" + (ko ? "  " + ko + " FALLOS, " + ok + " bien\n" : "  Todo correcto (" + ok + " comprobaciones)\n"));
process.exit(ko ? 1 : 0);
