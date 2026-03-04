import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
from matplotlib.font_manager import FontProperties

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
    "sun": "#e7d9a6", "moon": "#c0bfb8", "mercury": "#b5b0a3",
    "venus": "#d4a87a", "mars": "#c88484", "jupiter": "#cdb278",
    "saturn": "#a89868", "uranus": "#7ba8b8", "neptune": "#6878a8",
    "pluto": "#8a7060"
}

BG_COLOR = "#141210"
RING_COLOR_1 = "#1e1c18"
RING_COLOR_2 = "#1a1816"
BORDER_COLOR = "#3a3630"
LABEL_COLOR = "#6e6861"
GLYPH_COLOR = "#e7d9a6"
ASPECT_COLORS = {
    "conjunction": "#6f9c9c",
    "sextile": "#8a9cb8",
    "square": "#a87373",
    "trine": "#7ba88c",
    "opposition": "#cdb278"
}


def ecliptic_longitude(sign, degree):
    index = SIGN_ORDER.index(sign)
    return index * 30 + degree


def deg_to_rad(deg):
    return np.radians(90 - deg)


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
    fig = plt.figure(figsize=(10, 10), facecolor="none")
    ax = fig.add_subplot(111, polar=True)
    ax.set_facecolor("none")

    ax.set_ylim(0, 1.15)
    ax.set_yticks([])
    ax.set_xticks([])
    ax.spines["polar"].set_visible(False)
    ax.grid(False)

    outer_r = 1.0
    sign_r_outer = 0.95
    sign_r_inner = 0.78
    planet_r = 0.65
    inner_r = 0.55
    aspect_r = 0.50

    theta_ring = np.linspace(0, 2 * np.pi, 360)
    ax.plot(theta_ring, [outer_r] * 360, color=BORDER_COLOR, linewidth=1.5, alpha=0.8)
    ax.plot(theta_ring, [sign_r_inner] * 360, color=BORDER_COLOR, linewidth=1.0, alpha=0.6)
    ax.plot(theta_ring, [inner_r] * 360, color=BORDER_COLOR, linewidth=0.5, alpha=0.4)

    for i in range(12):
        start_deg = i * 30
        end_deg = (i + 1) * 30
        theta_start = deg_to_rad(start_deg)
        theta_end = deg_to_rad(end_deg)

        thetas = np.linspace(theta_start, theta_end, 30)
        if theta_start > theta_end:
            thetas = np.linspace(theta_start, theta_end + 2 * np.pi, 30) % (2 * np.pi)
            if theta_end < 0:
                thetas = np.linspace(theta_start, theta_end, 30)

        fill_color = RING_COLOR_1 if i % 2 == 0 else RING_COLOR_2
        for k in range(len(thetas) - 1):
            ax.fill_between(
                [thetas[k], thetas[k + 1]],
                sign_r_inner, sign_r_outer,
                color=fill_color, alpha=0.6
            )

    for i in range(12):
        angle = deg_to_rad(i * 30)
        ax.plot([angle, angle], [sign_r_inner, outer_r],
                color=BORDER_COLOR, linewidth=0.8, alpha=0.5)

    for i, sign in enumerate(SIGN_ORDER):
        mid_deg = i * 30 + 15
        angle = deg_to_rad(mid_deg)
        glyph = SIGN_GLYPHS[sign]
        r_pos = (sign_r_inner + sign_r_outer) / 2
        ax.text(angle, r_pos, glyph, ha="center", va="center",
                fontsize=14, color=LABEL_COLOR, fontweight="normal")

    planet_positions = {}
    for name, data in planets.items():
        lon = ecliptic_longitude(data["sign"], data["degree"])
        planet_positions[name] = lon

    placed = {}
    sorted_planets = sorted(planet_positions.items(), key=lambda x: x[1])
    for name, lon in sorted_planets:
        angle = deg_to_rad(lon)
        r = planet_r
        for other_name, (other_angle, other_r) in placed.items():
            angular_diff = abs(angle - other_angle)
            if angular_diff > np.pi:
                angular_diff = 2 * np.pi - angular_diff
            if angular_diff < 0.15 and abs(r - other_r) < 0.08:
                r = other_r - 0.07
        placed[name] = (angle, r)

    for name, (angle, r) in placed.items():
        data = planets[name]
        glyph = PLANET_GLYPHS.get(name, name[0].upper())
        color = PLANET_COLORS.get(name, GLYPH_COLOR)

        ax.plot(angle, r, "o", color=color, markersize=5, alpha=0.7)
        ax.text(angle, r + 0.06, glyph, ha="center", va="center",
                fontsize=18, color=color, fontweight="bold")

        if data.get("retrograde", False):
            ax.text(angle, r - 0.05, "Rx", ha="center", va="center",
                    fontsize=7, color="#a87373", fontstyle="italic", alpha=0.8)

    aspects = calculate_aspects(planets)
    for p1_name, p2_name, aspect_type, orb in aspects:
        if p1_name in placed and p2_name in placed:
            a1, _ = placed[p1_name]
            a2, _ = placed[p2_name]

            color = ASPECT_COLORS.get(aspect_type, BORDER_COLOR)
            alpha = max(0.15, 0.5 - orb * 0.06)
            linewidth = 1.2 if aspect_type in ("conjunction", "opposition") else 0.8
            linestyle = "--" if aspect_type == "sextile" else "-"

            n_points = 50
            thetas = np.linspace(a1, a2, n_points)
            rs = np.full(n_points, aspect_r)
            mid = n_points // 2
            for k in range(n_points):
                dist_from_mid = abs(k - mid) / mid
                rs[k] = aspect_r * (0.3 + 0.7 * dist_from_mid)

            ax.plot(thetas, rs, color=color, linewidth=linewidth,
                    alpha=alpha, linestyle=linestyle)

    ax.text(0, -0.08, date, ha="center", va="center", fontsize=9,
            color=LABEL_COLOR, transform=ax.transAxes,
            fontfamily="monospace", alpha=0.6)

    plt.tight_layout(pad=0.5)

    filename = f"starmap_{date}.png"
    fig.savefig(filename, transparent=True, dpi=200,
                bbox_inches="tight", pad_inches=0.3)
    plt.close(fig)

    return filename
