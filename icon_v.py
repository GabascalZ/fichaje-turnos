# Icono: fondo crema + cuatro pastillas con la paleta de la app. PNG a mano, sin PIL.
import zlib, struct, math, sys, base64, io
S = int(sys.argv[1]); SS = int(sys.argv[2])          # tamano final, supersampling
F = S / 180.0; W = S * SS
u = lambda v: v * F * SS

CREAM = (250, 243, 236)
COLS  = [(215,137,127), (249,185,92), (150,199,179), (99,152,169)]   # nectarine, peche, menthe, lagune

# cuatro pastillas verticales centradas
PAD, GAP = u(22), u(8)
BW = (u(180) - 2*PAD - 3*GAP) / 4.0
TOP, BOT = u(38), u(142)
RAD = BW / 2.0

def in_pill(x, y, x0):
    x1 = x0 + BW
    if x < x0 or x > x1: return False
    if TOP + RAD <= y <= BOT - RAD: return True
    cy = TOP + RAD if y < TOP + RAD else BOT - RAD
    return math.hypot(x - (x0 + BW/2.0), y - cy) <= RAD

acc = [[[0,0,0] for _ in range(S)] for _ in range(S)]
for yy in range(W):
    for xx in range(W):
        c = CREAM
        for k in range(4):
            if in_pill(xx, yy, PAD + k*(BW+GAP)):
                c = COLS[k]; break
        a = acc[yy//SS][xx//SS]
        a[0] += c[0]; a[1] += c[1]; a[2] += c[2]

n = SS*SS
raw = bytearray()
for row in acc:
    raw.append(0)
    for px in row:
        raw += bytes(px[i]//n for i in range(3))

def chunk(tag, data):
    return (struct.pack(">I", len(data)) + tag + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff))

png = (b"\x89PNG\r\n\x1a\n"
       + chunk(b"IHDR", struct.pack(">IIBBBBB", S, S, 8, 2, 0, 0, 0))
       + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
       + chunk(b"IEND", b""))
open(sys.argv[3], "wb").write(png)
if len(sys.argv) > 4:
    io.open(sys.argv[4], "w").write("data:image/png;base64," + base64.b64encode(png).decode())
print(sys.argv[3], S, len(png), "bytes")
