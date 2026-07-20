"""Renders the intro/outro title cards for the cinematic README demo.

Matches the app's actual dark theme (src/app/globals.css: --color-background
#08090c, accent #3b82f6, secondary #a855f7) instead of a generic template so
the cards feel like part of the product, not a stock video intro.
"""
import math
import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1920, 1080
BG = (8, 9, 12)
FG = (244, 245, 247)
MUTED = (144, 150, 168)
ACCENT = (59, 130, 246)
SECONDARY = (168, 85, 247)

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "docs", "demo", "work")
os.makedirs(OUT_DIR, exist_ok=True)

FONT_DIR = r"C:\Windows\Fonts"


def font(path, size):
    return ImageFont.truetype(os.path.join(FONT_DIR, path), size)


def base_background():
    img = Image.new("RGB", (W, H), BG)

    def glow(cx, cy, radius, color, max_alpha):
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        draw = ImageDraw.Draw(layer)
        for r in range(radius, 0, -3):
            alpha = int(max_alpha * (r / radius) ** 2)
            draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(*color, alpha))
        return layer.filter(ImageFilter.GaussianBlur(radius / 6))

    img = img.convert("RGBA")
    img = Image.alpha_composite(img, glow(int(W * 0.22), int(H * 0.28), 520, ACCENT, 46))
    img = Image.alpha_composite(img, glow(int(W * 0.82), int(H * 0.75), 560, SECONDARY, 34))

    # Faint grain, echoing the app's own .grain-overlay utility.
    noise = Image.effect_noise((W, H), 22).convert("L")
    grain = Image.merge("RGBA", (noise, noise, noise, Image.new("L", (W, H), 10)))
    img = Image.alpha_composite(img, grain)
    return img.convert("RGB")


def draw_wordmark(img, cx, cy, size):
    """Draws the AXON wordmark with a soft glow onto `img` in place and
    returns (img, text_width, text_height) since text glow needs to be
    composited before the crisp text layer is drawn on top."""
    f = font("segoeuib.ttf", size)
    probe = ImageDraw.Draw(img)
    text = "AXON"
    bbox = probe.textbbox((0, 0), text, font=f)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    pos = (cx - tw / 2, cy - th / 2 - bbox[1])

    glow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(glow_layer).text(pos, text, font=f, fill=(*ACCENT, 130))
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(18))
    img = Image.alpha_composite(img.convert("RGBA"), glow_layer).convert("RGB")

    ImageDraw.Draw(img).text(pos, text, font=f, fill=FG)
    return img, tw, th


def make_intro():
    img = base_background()
    img, tw, th = draw_wordmark(img, W / 2, H / 2 - 26, 168)
    draw = ImageDraw.Draw(img)

    tagline = "Study smarter. Stay consistent."
    tf = font("segoeui.ttf", 34)
    tbbox = draw.textbbox((0, 0), tagline, font=tf)
    ttw = tbbox[2] - tbbox[0]
    draw.text((W / 2 - ttw / 2, H / 2 + th / 2 + 6), tagline, font=tf, fill=MUTED)

    # A single accent tick under the wordmark, matching the app's blue accent.
    tick_w = 64
    draw.rounded_rectangle(
        [W / 2 - tick_w / 2, H / 2 - th / 2 - 34, W / 2 + tick_w / 2, H / 2 - th / 2 - 28],
        radius=3,
        fill=ACCENT,
    )
    img.save(os.path.join(OUT_DIR, "intro.png"))


def make_outro():
    img = base_background()
    img, tw, th = draw_wordmark(img, W / 2, H / 2 - 60, 120)
    draw = ImageDraw.Draw(img)

    tagline = "Study smarter. Stay consistent."
    tf = font("segoeui.ttf", 40)
    tbbox = draw.textbbox((0, 0), tagline, font=tf)
    ttw = tbbox[2] - tbbox[0]
    draw.text((W / 2 - ttw / 2, H / 2 + th / 2 + 18), tagline, font=tf, fill=FG)

    features = "Kanban  ·  Calendar  ·  Pomodoro  ·  Flashcards  ·  Analytics  ·  Goals"
    ff = font("segoeuisl.ttf" if os.path.exists(os.path.join(FONT_DIR, "segoeuisl.ttf")) else "segoeui.ttf", 26)
    fbbox = draw.textbbox((0, 0), features, font=ff)
    ftw = fbbox[2] - fbbox[0]
    draw.text((W / 2 - ftw / 2, H / 2 + th / 2 + 74), features, font=ff, fill=MUTED)

    cta = "Local-first · Free · github.com"
    cf = font("segoeui.ttf", 24)
    cbbox = draw.textbbox((0, 0), cta, font=cf)
    ctw = cbbox[2] - cbbox[0]
    draw.text((W / 2 - ctw / 2, H - 96), cta, font=cf, fill=(*MUTED,))
    img.save(os.path.join(OUT_DIR, "outro.png"))


if __name__ == "__main__":
    make_intro()
    make_outro()
    print("wrote intro.png and outro.png to", OUT_DIR)
