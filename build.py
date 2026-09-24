# Genera la app de fichaje a partir de src/p1..p3.
# Salida: index.html (PWA para Vercel) y ../fichaje.html (suelto, un solo archivo).
import io, os, subprocess

APP  = os.path.dirname(os.path.abspath(__file__))
SUEL = os.path.join(os.path.dirname(APP), "fichaje.html")

def rd(p): return io.open(os.path.join(APP, p), encoding="utf-8").read()
def wr(p, s): io.open(p, "w", encoding="utf-8", newline="\n").write(s)
b = lambda n: rd(n + ".b64").strip()

face = lambda fam, w, d: (
    "@font-face{font-family:'%s';font-style:normal;font-weight:%s;font-display:swap;"
    "src:url(data:font/woff2;base64,%s) format('woff2')}\n" % (fam, w, d))

fonts = (face("Poppins",  "400", b("pop4"))
       + face("Poppins",  "600", b("pop6"))
       + face("Poppins",  "700", b("pop7"))
       + face("Fraunces", "600", b("fra6")))

src = rd("src/p1.html") + rd("src/p2.html") + "\n" + rd("src/p3.html")
wr(os.path.join(APP, "app.src.html"), src)

# La foto de perfil por defecto es opcional y NO va al repositorio: se pone
# dejando `foto.b64` (un data-URI) y `foto.txt` (el nombre de quien sale en
# ella) en esta carpeta. Sin ellos la app arranca sin foto y enseña la inicial.
def opcional(nombre, limpia=True):
    ruta = os.path.join(APP, nombre)
    if not os.path.exists(ruta):
        return ""
    v = rd(nombre)
    return v.strip() if limpia else v

foto    = opcional("foto.b64")
foto_de = opcional("foto.txt")
print("foto por defecto: %s" % ("%s (%d KB)" % (foto_de or "sin nombre", len(foto) // 1024)
                                if foto else "ninguna"))

# Lo mismo con el sueldo base: en el repositorio va un valor de ejemplo y el de
# verdad se pone en un config.json local que tampoco se sube. De todas formas es
# editable desde Ajustes, esto solo decide con qué arranca una instalación nueva.
BASE_EJEMPLO = 1000
base = BASE_EJEMPLO
cfg = opcional("config.json", limpia=False)
if cfg:
    import json
    try:
        base = json.loads(cfg).get("base", BASE_EJEMPLO)
    except ValueError:
        raise SystemExit("*** config.json no es JSON válido ***")
print("sueldo base de arranque: %s €%s" % (base, "" if cfg else "  (ejemplo, no hay config.json)"))

src = (src.replace("__FONTS__", fonts)
          .replace("__FOTO__", foto)
          .replace("__FOTO_DE__", foto_de)
          .replace("__BASE__", str(base)))

# El JS pasa por `node --check` antes de empaquetar, ya con los marcadores
# sustituidos. Un error de sintaxis rompe la app entera sin que se note: la
# pagina se pinta igual, pero no se engancha ningun boton. Mejor que reviente
# aqui.
_js = src.split("<script>", 1)[1].rsplit("</script>", 1)[0]
_chk = os.path.join(APP, ".chk.js")
wr(_chk, _js)
_fallo = subprocess.call(["node", "--check", _chk], shell=(os.name == "nt"))
os.remove(_chk)
if _fallo:
    raise SystemExit("\n*** El JavaScript no compila. Arreglalo antes de construir. ***")

# 1) suelto: un archivo, icono incrustado, se abre desde Archivos sin nada mas
icon = b("iconv")
wr(SUEL, src.replace("__HEADEXTRA__",
    '<link rel="apple-touch-icon" href="%s">\n<link rel="icon" href="%s">' % (icon, icon))
   .replace('navigator.serviceWorker.register("sw.js")', 'Promise.resolve()'))

# 2) PWA instalable: manifest + iconos reales + service worker
wr(os.path.join(APP, "index.html"), src.replace("__HEADEXTRA__",
    '<link rel="manifest" href="manifest.json">\n'
    '<link rel="apple-touch-icon" href="apple-touch-icon.png">\n'
    '<link rel="icon" type="image/png" sizes="192x192" href="icon-192.png">'))

print("index.html  %6d bytes" % os.path.getsize(os.path.join(APP, "index.html")))
print("suelto      %6d bytes  ->  %s" % (os.path.getsize(SUEL), SUEL))
