# Fichaje de turnos

App para llevar las horas de un trabajo a turnos y estimar lo que se va a cobrar ese mes.
Nace de una hoja de cálculo real de control horario de un servicio de handling de aeropuerto,
con su convenio y sus pluses.

PWA que funciona **sin conexión**: un solo archivo HTML, datos en `localStorage`, fuentes
incrustadas en base64, **cero peticiones por red**.

Se mete la hora de entrada y la de salida. Todo lo demás sale solo.

## Qué calcula

| Concepto | Regla |
|---|---|
| Horas | suma de los tramos del día; si la salida es menor que la entrada, cruza medianoche |
| Nocturnidad | minutos entre las 22:00 y las 06:00 |
| Madrugue | 1 por día si algún tramo entra entre las 04:00 y las 06:55 |
| Turno partido | el día tiene 2 tramos o más |
| Domingo | es domingo y hay horas |
| Manutención | el día pasa de 6 h |
| Transporte | 1 por cada día con horas |
| Complementarias | horas del mes por encima del umbral del contrato |

A mano quedan solo **festivo** y **perentorias**, que no se pueden deducir del horario.

**Madrugue y nocturnidad se pisan** en la franja 04:00–06:00: por defecto un día con madrugue
no cobra además la nocturnidad de esas horas. Hay interruptor en Ajustes por si el convenio
dice otra cosa.

### Mes vencido

En muchos convenios los pluses y las horas de más **se cobran el mes siguiente**. La app trae
los dos modos, con un pop-up que explica cada uno:

- **A mes vencido** (por defecto): base del mes en curso + pluses del mes anterior. Es el
  dinero que entra en el banco.
- **Mes natural**: todo dentro del mismo mes. Sirve para ver lo que vale el trabajo que se
  está haciendo ahora.

### Valores por mes

Las tarifas quedan **congeladas en cada mes** (`meses[mk].cfg`), igual que la tabla de valores
que la hoja de origen repetía en cada bloque. Si sube el convenio, los meses ya cerrados no se
recalculan. Hay un «aplicar a todos los meses» en Ajustes.

**Impuestos**: dos modos, un fijo en euros o un porcentaje (Seguridad Social + IRPF sobre el
bruto), que es como funciona de verdad. El fijo falla justo en los meses cargados, así que la
app enseña a cuánto por ciento equivale ese fijo en el mes que se esté mirando.

**Nómina real**: se apunta lo que se cobró de verdad y la app enseña la desviación. Si falla
lo mismo varios meses seguidos, hay un valor mal puesto.

## El cuadrante

Turno rotativo de 21 días anclado a lunes, así que cae siempre en el mismo día de la semana:

| Semana | L | M | X | J | V | S | D |
|---|---|---|---|---|---|---|---|
| 1 | Tarde | Tarde | Tarde | Tarde | Tarde | Tarde | Tarde |
| 2 | Libre | Libre | Libre | Mañana | Mañana | Mañana | Mañana |
| 3 | Mañana | Mañana | Mañana | Libre | Libre | Libre | Libre |

7 días de tardes → 3 de fiesta → 7 de mañanas (de jueves a miércoles) → 4 de fiesta. Está en
`CICLO`. La app **solo pregunta en qué semana de las tres estás ahora**: de ahí saca el ancla y
`turnoCiclo(dk)` resuelve cualquier fecha con módulo 21, hacia delante y hacia atrás.

`aplicaCuadrante()` rellena turno y horas, pero **solo en días vacíos o puestos por el propio
cuadrante** (`d.auto`). En cuanto se toca un día a mano, `mio()` le quita la marca y no se
sobrescribe nunca más; en el calendario los automáticos salen más flojitos. Y se puede apagar
del todo con «Prefiero ponerlo yo a mano».

## Festivos

Se marcan solos los 9 nacionales fijos + Viernes Santo, y opcionalmente los de la **Comunitat
Valenciana** (San José, 9 d'Octubre, Lunes de Pascua y Sant Vicent Ferrer, los dos últimos
calculados desde la Pascua). El **Jueves Santo no va**: en la Comunitat Valenciana no es
festivo, se cambia por el Lunes de Pascua. Los locales del municipio se marcan a mano.

El interruptor de cada día tiene tres estados: automático, forzado a sí y forzado a no.

## Turnos cubiertos

Entre compañeras se cubren turnos. Cada día admite `cub = {tipo:"ME"|"YO", quien}`:

- **ME** (te cubren): ese día no trabajas, se pone en libre y se quitan las horas.
- **YO** (cubres tú): trabajas un día que te tocaba libre, las horas van normales.

`balanceCub()` saca el saldo de toda la vida, por persona y en total.

## Construir

Se edita `src/p1.html` (estilos), `src/p2.html` (maquetado) y `src/p3.html` (lógica):

```bash
python build.py
```

Genera `index.html` (la PWA) y `../fichaje.html` (un archivo suelto, con el icono incrustado,
para abrir desde Archivos sin servidor). Ambos están ignorados por git: son generados.

**`build.py` pasa el JavaScript por `node --check` antes de empaquetar.** Un error de sintaxis
rompe la app de una forma traicionera: la página se pinta igual, pero no se engancha ni un
botón. Por eso el guardia.

### Personalización local

Tres archivos opcionales que **no van al repositorio** (están en `.gitignore`):

| Archivo | Para qué | Si no está |
|---|---|---|
| `foto.b64` | foto de perfil por defecto, como data-URI | se enseña la inicial del nombre |
| `foto.txt` | el nombre de quien sale en esa foto | la foto no se asigna a nadie |
| `config.json` | `{"base": 1234}`, sueldo base de arranque | se usa 1000 € de ejemplo |

La foto solo se enseña si quien usa la app se ha identificado con ese nombre. Todo es editable
desde Ajustes de todas formas; esto solo decide con qué arranca una instalación nueva.

### Desplegar

```bash
vercel deploy --prod --yes
```

**Hay que subir el número de `CACHE` en `sw.js`** (`fichaje-vicky-vN`) o los móviles ya
instalados siguen viendo la versión vieja. El service worker va **a red primero** para la
navegación (2,5 s de espera antes de tirar de caché), así que al abrirla se ve la versión
nueva, y sin cobertura sigue funcionando con la guardada.

## Comprobar que las cuentas cuadran

```bash
node test_motor.js
```

**127 comprobaciones.** Saca las funciones de cálculo del propio `src/p3.html` (no las copia,
las extrae casando llaves) y las corre contra dos meses reales de turnos, los bordes que de
verdad se dan (entrar a las 03:59 vs 04:00, salir a las 06:55 vs 06:56, 6 h clavadas vs 6 h y
1 minuto, sábado noche que acaba en domingo), el ciclo del cuadrante día a día, los festivos
móviles y los números escritos con coma o con punto de miles.

`window.__hoy = '2026-10-02'` finge otra fecha para probar el cambio de mes sin esperar.

## Cosas que costaron encontrar

Por si alguien toca esto, incluido yo dentro de seis meses.

**La hora se escribe, no se elige.** Con `<input type="time">`, la rueda nativa de iOS lanza un
`change` **en cada giro**, y el handler repintaba la fila, **destruyendo el propio campo** y
cerrando la rueda al levantar el dedo. Ahora los tramos son campos de texto con
`inputmode="numeric"`: tragan `5`, `05`, `530`, `0530`, `5:30` y `17:16`, ponen los dos puntos
solos mientras se teclea y normalizan a `HH:MM` al salir.

**La regla que hay que respetar:** el handler de un campo **no puede repintar el campo**. Por
eso existe `refresca()`, que actualiza solo lo derivado (duraciones, chips, el resumen de
arriba) sin tocar los inputs.

**Restaurar una copia de seguridad no hacía nada.** `cargar()` releía `localStorage` justo
después de asignar el objeto importado y lo machacaba. Ahora `normaliza()` (rellena lo que
falte sobre el objeto que sea) está separado de `cargar()` (lee y luego normaliza). Era la red
de seguridad entera si se pierde el móvil.

**`normaliza()` rellena también los ajustes de cada mes guardado**, no solo los generales: si
no, una copia vieja se restaura sin los ajustes nuevos y cambian las cuentas sin que se note.

**Exportar usa `navigator.share` primero**: en una PWA instalada en el iPhone el `<a download>`
no hace nada, así que la copia de seguridad no se podía guardar.

**Cuenta días, no filas.** La hoja de origen contaba las filas que pasaban de 6 h para el plus
de manutención, pero un turno partido ocupa dos filas (3 h + 5 h) y ninguna pasa de 6 h: ese
día perdía el plus. Aquí se suman los tramos del día.
