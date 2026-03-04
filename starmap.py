import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import Circle, Wedge

SIGN_ORDER = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio",
    "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]

SIGN_GLYPHS = {
    "Aries": "\u2648", "Taurus": "\u2649", "Gemini": "\u264A", "Cancer": "\u264B",
    "Leo": "\u264C", "Virgo": "\u264D", "Libra": "\u264E", "Scorpio": "\u264F",
    "Sagittarius": "\u2650", "Capricorn": "\u2651", "Aquarius": "\u2652", "Pisces": "\u2653"
}

PLANET_GLYPHS = {
    "sun": "\u2609", "moon": "\u263D", "mercury": "\u263F", "venus": "\u2640",
    "mars": "\u2642", "jupiter": "\u2643", "saturn": "\u2644",
    "uranus": "\u2645", "neptune": "\u2646", "pluto": "\u2647"
}

PLANET_COLORS = {
    "sun": "#f0e4a8", "moon": "#d4d0c8", "mercury": "#c8c0b0",
    "venus": "#e8b888", "mars": "#e09090", "jupiter": "#dcc080",
    "saturn": "#c0a870", "uranus": "#88c0d8", "neptune": "#7888c0",
    "pluto": "#a08070"
}

RING_STROKE = "#4a4438"
WEDGE_FILL_1 = (30/255, 28/255, 24/255, 0.35)
WEDGE_FILL_2 = (26/255, 24/255, 22/255, 0.35)
SIGN_COLOR = "#908878"
GLYPH_COLOR = "#f0e4a8"
TICK_COLOR = "#3a3630"
ASPECT_COLORS = {
    "conjunction": "#80b8b8",
    "sextile": "#98b0d0",
    "square": "#d09090",
    "trine": "#90c8a0",
    "opposition": "#e0c888"
}

OUTER_R = 4.2
SIGN_R_OUTER = 3.9
SIGN_R_INNER = 3.2
PLANET_R = 2.6
INNER_R = 2.1


def ecliptic_longitude(sign, degree):
    index = SIGN_ORDER.index(sign)
    return index * 30 + degree


def lon_to_angle(lon):
    return 90 - lon


def angle_xy(angle_deg, radius, cx=0, cy=0):
    rad = np.radians(angle_deg)
    return cx + radius * np.cos(rad), cy + radius * np.sin(rad)


def calculate_aspects(planets):
    aspects = []
    names = list(planets.keys())
    for i in range(len(names)):
        for j in range(i + 1, len(names)):
            p1 = planets[names[i]]
            p2 = planets[names[j]]
            lon1 = ecliptic_longitude(p1["sign"], p1["degree"])
            lon2 = ecliptic_longitude(p2["sign"], p2["degree"])
            diff = abs(lon1 - lon2)
            if diff > 180:
                diff = 360 - diff
            orb = 6
            if diff <= orb:
                aspects.append((names[i], names[j], "conjunction", diff))
            elif abs(diff - 60) <= orb:
                aspects.append((names[i], names[j], "sextile", abs(diff - 60)))
            elif abs(diff - 90) <= orb:
                aspects.append((names[i], names[j], "square", abs(diff - 90)))
            elif abs(diff - 120) <= orb:
                aspects.append((names[i], names[j], "trine", abs(diff - 120)))
            elif abs(diff - 180) <= orb:
                aspects.append((names[i], names[j], "opposition", abs(diff - 180)))
    return aspects


def generate_starmap(planets, date):
    fig, ax = plt.subplots(1, 1, figsize=(12, 12), facecolor="none")
    ax.set_facecolor("none")
    ax.set_xlim(-5.2, 5.2)
    ax.set_ylim(-5.2, 5.2)
    ax.set_aspect("equal")
    ax.axis("off")

    outer_circle = Circle((0, 0), OUTER_R, fill=False,
                           edgecolor=RING_STROKE, linewidth=2.0, alpha=0.9)
    inner_sign_circle = Circle((0, 0), SIGN_R_INNER, fill=False,
                                edgecolor=RING_STROKE, linewidth=1.5, alpha=0.7)
    inner_circle = Circle((0, 0), INNER_R, fill=False,
                           edgecolor=RING_STROKE, linewidth=1.0, alpha=0.5)
    ax.add_patch(outer_circle)
    ax.add_patch(inner_sign_circle)
    ax.add_patch(inner_circle)

    for i in range(12):
        start_angle = lon_to_angle(i * 30)
        wedge_color = WEDGE_FILL_1 if i % 2 == 0 else WEDGE_FILL_2
        wedge = Wedge((0, 0), SIGN_R_OUTER, start_angle - 30, start_angle,
                       width=SIGN_R_OUTER - SIGN_R_INNER,
                       facecolor=wedge_color, edgecolor="none")
        ax.add_patch(wedge)

    for i in range(12):
        angle = lon_to_angle(i * 30)
        x1, y1 = angle_xy(angle, SIGN_R_INNER)
        x2, y2 = angle_xy(angle, OUTER_R)
        ax.plot([x1, x2], [y1, y2], color=RING_STROKE, linewidth=1.0, alpha=0.6)

    for i in range(360):
        angle = lon_to_angle(i)
        if i % 30 == 0:
            continue
        if i % 10 == 0:
            r1, r2 = SIGN_R_OUTER, OUTER_R
            lw = 0.6
        elif i % 5 == 0:
            r1 = SIGN_R_OUTER + (OUTER_R - SIGN_R_OUTER) * 0.5
            r2 = OUTER_R
            lw = 0.4
        else:
            continue
        x1, y1 = angle_xy(angle, r1)
        x2, y2 = angle_xy(angle, r2)
        ax.plot([x1, x2], [y1, y2], color=TICK_COLOR, linewidth=lw, alpha=0.4)

    for i, sign in enumerate(SIGN_ORDER):
        mid_lon = i * 30 + 15
        angle = lon_to_angle(mid_lon)
        r_pos = (SIGN_R_INNER + SIGN_R_OUTER) / 2
        x, y = angle_xy(angle, r_pos)
        ax.text(x, y, SIGN_GLYPHS[sign], ha="center", va="center",
                fontsize=20, color=SIGN_COLOR, fontweight="normal", alpha=0.85)

    planet_positions = {}
    for name, data in planets.items():
        lon = ecliptic_longitude(data["sign"], data["degree"])
        planet_positions[name] = lon

    placed = {}
    sorted_planets = sorted(planet_positions.items(), key=lambda x: x[1])
    for name, lon in sorted_planets:
        angle = lon_to_angle(lon)
        r = PLANET_R
        for other_name, (other_angle, other_r, _) in placed.items():
            ang_diff = abs(angle - other_angle) % 360
            if ang_diff > 180:
                ang_diff = 360 - ang_diff
            if ang_diff < 8 and abs(r - other_r) < 0.35:
                r = other_r - 0.32
        placed[name] = (angle, r, lon)

    for name, (angle, r, lon) in placed.items():
        data = planets[name]
        glyph = PLANET_GLYPHS.get(name, name[0].upper())
        color = PLANET_COLORS.get(name, GLYPH_COLOR)
        x, y = angle_xy(angle, r)

        ax.plot(x, y, "o", color=color, markersize=6, alpha=0.6, zorder=3)

        ax.text(x, y + 0.28, glyph, ha="center", va="center",
                fontsize=28, color=color, fontweight="bold", alpha=0.2, zorder=4)
        ax.text(x, y + 0.28, glyph, ha="center", va="center",
                fontsize=24, color=color, fontweight="bold", alpha=0.95, zorder=5)

        tick_angle = lon_to_angle(lon)
        tx1, ty1 = angle_xy(tick_angle, SIGN_R_INNER)
        tx2, ty2 = angle_xy(tick_angle, SIGN_R_INNER - 0.15)
        ax.plot([tx1, tx2], [ty1, ty2], color=color, linewidth=1.2, alpha=0.5)

        if data.get("retrograde", False):
            ax.text(x, y - 0.22, "Rx", ha="center", va="center",
                    fontsize=9, color="#e09090", fontstyle="italic", alpha=0.85, zorder=5)

    aspects = calculate_aspects(planets)
    for p1_name, p2_name, aspect_type, orb in aspects:
        if p1_name in placed and p2_name in placed:
            a1, r1, _ = placed[p1_name]
            a2, r2, _ = placed[p2_name]
            x1, y1 = angle_xy(a1, min(r1, INNER_R))
            x2, y2 = angle_xy(a2, min(r2, INNER_R))

            color = ASPECT_COLORS.get(aspect_type, RING_STROKE)
            alpha = max(0.2, 0.55 - orb * 0.06)
            linewidth = 1.5 if aspect_type in ("conjunction", "opposition") else 1.0
            linestyle = (0, (5, 5)) if aspect_type == "sextile" else "-"

            ax.plot([x1, x2], [y1, y2], color=color, linewidth=linewidth,
                    alpha=alpha, linestyle=linestyle, zorder=2)

    ax.text(0, -4.8, date, ha="center", va="center", fontsize=10,
            color=SIGN_COLOR, fontfamily="monospace", alpha=0.5)

    ax.text(0, 4.8, "D A I L Y   P L A N E T A R Y   O R A C L E",
            ha="center", va="center", fontsize=7, color=SIGN_COLOR,
            fontfamily="monospace", alpha=0.3)

    plt.tight_layout(pad=0)

    filename = f"starmap_{date}.png"
    fig.savefig(filename, transparent=True, dpi=300,
                bbox_inches="tight", pad_inches=0.2)
    plt.close(fig)

    return filename
