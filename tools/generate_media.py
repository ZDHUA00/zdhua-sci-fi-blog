from __future__ import annotations

import math
import struct
import wave
from pathlib import Path
from random import Random

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "assets"
MEDIA = ROOT / "public" / "media"
RNG = Random(20041208)


def font(size: int) -> ImageFont.ImageFont:
    candidates = [
        "C:/Windows/Fonts/msyh.ttc",
        "C:/Windows/Fonts/simhei.ttf",
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeui.ttf",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size=size)
    return ImageFont.load_default()


def lerp(a: int, b: int, t: float) -> int:
    return int(a + (b - a) * t)


def mix(c1: tuple[int, int, int], c2: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(lerp(a, b, t) for a, b in zip(c1, c2))


def save_png(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.convert("RGB").save(path, quality=94, optimize=True)
    print(path)


def background(size: tuple[int, int], palette: list[tuple[int, int, int]]) -> Image.Image:
    w, h = size
    img = Image.new("RGB", size)
    pix = img.load()
    for y in range(h):
        t = y / max(1, h - 1)
        if t < 0.5:
            c = mix(palette[0], palette[1], t * 2)
        else:
            c = mix(palette[1], palette[2], (t - 0.5) * 2)
        for x in range(w):
            wave_offset = int(10 * math.sin(x * 0.008 + y * 0.006))
            pix[x, y] = tuple(max(0, min(255, value + wave_offset)) for value in c)
    return img


def draw_stars(draw: ImageDraw.ImageDraw, w: int, h: int, count: int) -> None:
    for _ in range(count):
        x = RNG.randrange(w)
        y = RNG.randrange(h)
        s = RNG.choice([1, 1, 1, 2, 2, 3])
        tone = RNG.choice([(190, 239, 255), (255, 219, 150), (118, 255, 202)])
        alpha = RNG.randint(90, 220)
        draw.rectangle((x, y, x + s, y + s), fill=(*tone, alpha))


def orbital_cover(path: Path, title: str, code: str, accent: tuple[int, int, int], seed: int) -> None:
    rng = Random(seed)
    w, h = 1400, 880
    img = background((w, h), [(5, 7, 16), (13, 21, 32), (6, 9, 18)]).convert("RGBA")
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow, "RGBA")

    for _ in range(28):
        cx = rng.randint(-120, w + 120)
        cy = rng.randint(40, h - 40)
        rx = rng.randint(130, 420)
        ry = rng.randint(70, 260)
        color = rng.choice([(36, 216, 255), accent, (255, 189, 89), (146, 124, 255)])
        gd.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=(*color, rng.randint(16, 38)))
    glow = glow.filter(ImageFilter.GaussianBlur(46))
    img = Image.alpha_composite(img, glow)
    draw = ImageDraw.Draw(img, "RGBA")
    draw_stars(draw, w, h, 460)

    planet = (int(w * 0.72), int(h * 0.43))
    for r in range(180, 0, -2):
        t = r / 180
        color = mix(accent, (14, 23, 38), t)
        draw.ellipse((planet[0] - r, planet[1] - r, planet[0] + r, planet[1] + r), fill=(*color, 215))

    ring = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    rd = ImageDraw.Draw(ring, "RGBA")
    for i, alpha in enumerate([130, 82, 42]):
        rd.ellipse((planet[0] - 430 - i * 42, planet[1] - 92 - i * 10, planet[0] + 430 + i * 42, planet[1] + 92 + i * 10), outline=(*accent, alpha), width=4)
    ring = ring.rotate(-13, resample=Image.Resampling.BICUBIC, center=planet)
    img = Image.alpha_composite(img, ring)
    draw = ImageDraw.Draw(img, "RGBA")

    for offset in range(0, h, 44):
        draw.line((0, offset, w, offset), fill=(255, 255, 255, 13), width=1)
    for x in range(0, w, 70):
        draw.line((x, 0, x + 180, h), fill=(*accent, 12), width=1)

    draw.rounded_rectangle((72, 70, 418, 174), radius=8, outline=(*accent, 170), fill=(5, 9, 16, 150), width=2)
    draw.text((100, 88), code, font=font(34), fill=(*accent, 255))
    draw.text((100, 130), "ZDHUA.LOG / FIELD NOTE", font=font(18), fill=(212, 226, 238, 190))
    draw.text((72, h - 185), title, font=font(54), fill=(246, 250, 255, 255))
    draw.line((72, h - 98, 520, h - 98), fill=(*accent, 180), width=3)
    draw.text((72, h - 76), "Astro · GitHub Pages · Native JS/CSS", font=font(22), fill=(180, 196, 212, 230))
    save_png(img, path)


def gallery_asset(path: Path, title: str, accent: tuple[int, int, int], seed: int) -> None:
    rng = Random(seed)
    w, h = 1600, 1000
    img = background((w, h), [(4, 6, 13), (12, 18, 28), (6, 8, 18)]).convert("RGBA")
    fx = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    fd = ImageDraw.Draw(fx, "RGBA")
    for i in range(18):
        x = rng.randint(80, w - 460)
        y = rng.randint(80, h - 260)
        ww = rng.randint(210, 430)
        hh = rng.randint(110, 230)
        fd.rounded_rectangle((x, y, x + ww, y + hh), radius=10, outline=(*accent, rng.randint(70, 130)), fill=(10, 16, 26, rng.randint(70, 120)), width=2)
        for j in range(4):
            yy = y + 30 + j * 32
            fd.line((x + 28, yy, x + ww - 28, yy), fill=(220, 246, 255, rng.randint(28, 60)), width=2)
    fd.ellipse((w - 560, 110, w - 130, 540), outline=(*accent, 160), width=4)
    fd.arc((w - 640, 62, w - 50, 600), 194, 342, fill=(255, 189, 89, 130), width=4)
    fx = fx.filter(ImageFilter.GaussianBlur(0.2))
    img = Image.alpha_composite(img, fx)
    draw = ImageDraw.Draw(img, "RGBA")
    draw_stars(draw, w, h, 620)
    draw.text((84, h - 170), title, font=font(62), fill=(248, 252, 255, 255))
    draw.text((88, h - 96), "A private orbital interface for engineering notes.", font=font(28), fill=(181, 198, 213, 235))
    save_png(img, path)


def synth(path: Path, notes: list[int], bpm: int, seconds: int, seed: int) -> None:
    rng = Random(seed)
    sample_rate = 44100
    total = seconds * sample_rate
    beat = 60 / bpm
    frames = []
    pad_freqs = [55 * (2 ** (n / 12)) for n in notes]
    melody = [110 * (2 ** (n / 12)) for n in notes + notes[::-1]]

    for i in range(total):
        t = i / sample_rate
        value = 0.0
        env = min(1.0, i / (sample_rate * 2), (total - i) / (sample_rate * 2))
        for idx, freq in enumerate(pad_freqs):
            value += 0.12 * math.sin(2 * math.pi * freq * t + idx * 0.8)
            value += 0.035 * math.sin(2 * math.pi * freq * 2.01 * t)
        step = int(t / beat) % len(melody)
        pulse = (t / beat) % 1
        gate = max(0.0, 1 - pulse * 2.8)
        value += 0.18 * gate * math.sin(2 * math.pi * melody[step] * t)
        sweep = math.sin(2 * math.pi * (0.04 + rng.random() * 0.00001) * t)
        value += 0.04 * sweep * math.sin(2 * math.pi * 440 * t)
        value *= env * 0.55
        frames.append(struct.pack("<h", int(max(-1, min(1, value)) * 32767)))

    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(sample_rate)
        audio.writeframes(b"".join(frames))
    print(path)


def main() -> None:
    orbital_cover(ASSETS / "covers" / "deploy-orbit.png", "GitHub Pages 部署轨道", "DEP-026", (36, 216, 255), 2601)
    orbital_cover(ASSETS / "covers" / "server-map.png", "168 服务地图", "OPS-168", (109, 247, 163), 2602)
    orbital_cover(ASSETS / "covers" / "automation-core.png", "自动化状态机", "AUT-018", (255, 189, 89), 2603)
    orbital_cover(ASSETS / "covers" / "interface-density.png", "界面密度实验", "UX-010", (255, 83, 119), 2604)
    orbital_cover(ASSETS / "covers" / "ai-tooling.png", "AI 工具链日志", "AI-008", (143, 124, 255), 2605)
    gallery_asset(ASSETS / "gallery" / "orbital-console.png", "ORBITAL CONSOLE", (36, 216, 255), 2701)
    gallery_asset(ASSETS / "gallery" / "signal-archive.png", "SIGNAL ARCHIVE", (255, 189, 89), 2702)

    synth(MEDIA / "orbit-drift.wav", [-12, -5, 0, 3, 7], 78, 42, 3101)
    synth(MEDIA / "signal-cascade.wav", [-10, -3, 2, 5, 9], 92, 42, 3102)
    synth(MEDIA / "deep-relay.wav", [-14, -7, -2, 1, 6], 66, 42, 3103)


if __name__ == "__main__":
    main()
