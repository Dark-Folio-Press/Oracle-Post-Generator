import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import Ellipse, Circle

SIGN_ORDER = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio",
    "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]

ORBIT_ORDER = ["moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"]

ORBIT_RADII = {
    "moon": 1.2,
    "mercury": 2.0,
    "venus": 2.8,
    "mars": 3.8,
    "jupiter": 5.2,
    "saturn": 6.6,
    "uranus": 8.0,
    "neptune": 9.2,
    "pluto": 10.2
}

PLANET_SIZES = {
    "moon": 5, "mercury": 5, "venus": 7, "mars": 7,
    "jupiter": 12, "saturn": 10, "uranus": 8, "neptune": 8, "pluto": 4
}

PLANET_COLORS = {
    "moon": "#c8c8c8",
    "mercury": "#b8a898",
    "venus": "#e8c878",
    "mars": "#d85040",
    "jupiter": "#d8a850",
    "saturn": "#d8c870",
    "uranus": "#68c8d8",
    "neptune": "#4868d0",
    "pluto": "#a89088"
}

PLANET_LABELS = {
    "moon": "Moon", "mercury": "Mercury", "venus": "Venus", "mars": "Mars",
    "jupiter": "Jupiter", "saturn": "Saturn", "uranus": "Uranus",
    "neptune": "Neptune", "pluto": "Pluto"
}

BG_COLOR = "#080810"
STAR_COLOR = "#ffffff"
ORBIT_COLOR = "#383840"
SUN_COLOR = "#f0c830"
SUN_GLOW_COLOR = "#f0c830"
LABEL_COLOR = "#b0a898"
TILT = 0.35


def ecliptic_longitude(sign, degree):
    index = SIGN_ORDER.index(sign)
    return index * 30 + degree


def lon_to_xy(lon_deg, radius):
    rad = np.radians(lon_deg)
    x = radius * np.cos(rad)
    y = radius * np.sin(rad) * TILT
    return x, y


def generate_orrery(planets, date):
    fig_w, fig_h = 16, 7
    fig, ax = plt.subplots(1, 1, figsize=(fig_w, fig_h), facecolor=BG_COLOR)
    ax.set_facecolor(BG_COLOR)

    x_range = 12.5
    y_range = x_range * (fig_h / fig_w)
    ax.set_xlim(-x_range, x_range)
    ax.set_ylim(-y_range, y_range)
    ax.set_aspect("equal")
    ax.axis("off")

    rng = np.random.RandomState(42)
    n_stars = 600
    star_x = rng.uniform(-x_range, x_range, n_stars)
    star_y = rng.uniform(-y_range, y_range, n_stars)
    star_sizes = rng.uniform(0.1, 1.5, n_stars)
    star_alphas = rng.uniform(0.3, 0.9, n_stars)
    for sx, sy, ss, sa in zip(star_x, star_y, star_sizes, star_alphas):
        ax.plot(sx, sy, "o", color=STAR_COLOR, markersize=ss, alpha=sa, zorder=0)

    for glow_r, glow_a in [(0.9, 0.03), (0.7, 0.06), (0.5, 0.10), (0.35, 0.18), (0.2, 0.30)]:
        glow = Circle((0, 0), glow_r, facecolor=SUN_GLOW_COLOR,
                       edgecolor="none", alpha=glow_a, zorder=1)
        ax.add_patch(glow)

    sun = Circle((0, 0), 0.35, facecolor=SUN_COLOR, edgecolor="none", zorder=2)
    ax.add_patch(sun)
    sun_highlight = Circle((-0.06, 0.06), 0.15, facecolor="#fff8e0",
                            edgecolor="none", alpha=0.4, zorder=3)
    ax.add_patch(sun_highlight)

    for name in ORBIT_ORDER:
        r = ORBIT_RADII[name]
        orbit = Ellipse((0, 0), width=r * 2, height=r * 2 * TILT,
                         fill=False, edgecolor=ORBIT_COLOR,
                         linewidth=0.7, alpha=0.5, zorder=1)
        ax.add_patch(orbit)

    for name in ORBIT_ORDER:
        if name not in planets:
            continue
        data = planets[name]
        lon = ecliptic_longitude(data["sign"], data["degree"])
        r = ORBIT_RADII[name]
        x, y = lon_to_xy(lon, r)

        color = PLANET_COLORS[name]
        size = PLANET_SIZES[name]

        glow_circle = Circle((x, y), size * 0.018, facecolor=color,
                              edgecolor="none", alpha=0.15, zorder=4)
        ax.add_patch(glow_circle)

        ax.plot(x, y, "o", color=color, markersize=size,
                markeredgecolor="none", zorder=5)

        label = PLANET_LABELS[name]
        label_offset_x = size * 0.025 + 0.15
        label_offset_y = size * 0.02 + 0.1

        if lon > 90 and lon < 270:
            label_offset_x = -label_offset_x
            ha = "right"
        else:
            ha = "left"

        ax.text(x + label_offset_x, y + label_offset_y, label,
                fontsize=8, color=LABEL_COLOR, ha=ha, va="bottom",
                fontfamily="monospace", fontweight="normal", alpha=0.85, zorder=6)

        if data.get("retrograde", False):
            rx_offset_x = label_offset_x
            rx_offset_y = label_offset_y - 0.25
            ax.text(x + rx_offset_x, y + rx_offset_y, "℞",
                    fontsize=7, color="#d85040", ha=ha, va="top",
                    fontweight="bold", alpha=0.9, zorder=6)

    ax.text(0, -y_range + 0.3, date, ha="center", va="bottom", fontsize=8,
            color=LABEL_COLOR, fontfamily="monospace", alpha=0.4, zorder=6)

    plt.tight_layout(pad=0)

    filename = f"orrery_{date}.png"
    fig.savefig(filename, facecolor=BG_COLOR, dpi=300,
                bbox_inches="tight", pad_inches=0.15)
    plt.close(fig)

    return filename
