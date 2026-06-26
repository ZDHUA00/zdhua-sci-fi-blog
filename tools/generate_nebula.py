from math import cos, sin, tau
from pathlib import Path
from random import Random

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "assets" / "nebula-field.png"
W, H = 2200, 1400
RNG = Random(41208)


def mix(a, b, t):
    return int(a + (b - a) * t)


def color_lerp(c1, c2, t):
    return tuple(mix(a, b, t) for a, b in zip(c1, c2))


img = Image.new("RGB", (W, H))
pix = img.load()

top = (5, 7, 17)
mid = (20, 24, 34)
bottom = (8, 10, 15)
for y in range(H):
    t = y / (H - 1)
    base = color_lerp(top, mid, min(t * 1.6, 1)) if t < 0.62 else color_lerp(mid, bottom, (t - 0.62) / 0.38)
    for x in range(W):
        orbital = int(10 * sin((x / W) * tau * 1.15 + (y / H) * 2.8))
        pix[x, y] = (max(0, base[0] + orbital), max(0, base[1] + orbital), max(0, base[2] + orbital))

nebula = Image.new("RGBA", (W, H), (0, 0, 0, 0))
draw = ImageDraw.Draw(nebula, "RGBA")

for _ in range(70):
    cx = RNG.randint(-200, W + 200)
    cy = RNG.randint(80, H - 120)
    rx = RNG.randint(130, 520)
    ry = RNG.randint(90, 330)
    palette = RNG.choice(
        [
            (36, 216, 255, 34),
            (109, 247, 163, 28),
            (255, 189, 89, 30),
            (255, 83, 119, 24),
            (143, 124, 255, 22),
        ]
    )
    draw.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=palette)

nebula = nebula.filter(ImageFilter.GaussianBlur(58))
img = Image.alpha_composite(img.convert("RGBA"), nebula)
draw = ImageDraw.Draw(img, "RGBA")

planet_center = (int(W * 0.73), int(H * 0.48))
planet_radius = 185
for r in range(planet_radius, 0, -1):
    t = r / planet_radius
    color = (
        mix(255, 56, t),
        mix(189, 70, t),
        mix(89, 105, t),
        235,
    )
    draw.ellipse(
        (
            planet_center[0] - r,
            planet_center[1] - r,
            planet_center[0] + r,
            planet_center[1] + r,
        ),
        fill=color,
    )

ring = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ring_draw = ImageDraw.Draw(ring, "RGBA")
for i, alpha in enumerate((62, 42, 24)):
    pad_x = 460 + i * 46
    pad_y = 100 + i * 16
    ring_draw.ellipse(
        (
            planet_center[0] - pad_x,
            planet_center[1] - pad_y,
            planet_center[0] + pad_x,
            planet_center[1] + pad_y,
        ),
        outline=(36, 216, 255, alpha),
        width=5 - i,
    )
ring = ring.rotate(-12, resample=Image.Resampling.BICUBIC, center=planet_center)
img = Image.alpha_composite(img, ring)
draw = ImageDraw.Draw(img, "RGBA")

for _ in range(900):
    x = RNG.randrange(W)
    y = RNG.randrange(H)
    size = RNG.choice([1, 1, 1, 2, 2, 3])
    alpha = RNG.randint(90, 240)
    if RNG.random() > 0.92:
        color = (255, 216, 142, alpha)
    else:
        color = (190, 239, 255, alpha)
    draw.rectangle((x, y, x + size, y + size), fill=color)

for _ in range(44):
    x = RNG.randrange(80, W - 80)
    y = RNG.randrange(80, H - 80)
    length = RNG.randint(60, 170)
    draw.line((x, y, x + length, y - int(length * 0.28)), fill=(109, 247, 163, 55), width=1)

for y in range(0, H, 34):
    draw.line((0, y, W, y), fill=(36, 216, 255, 16), width=1)

OUT.parent.mkdir(parents=True, exist_ok=True)
img.convert("RGB").save(OUT, quality=94, optimize=True)
print(OUT)
