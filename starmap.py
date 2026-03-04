import matplotlib.pyplot as plt

SIGN_ORDER = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio",
    "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]

PLANET_GLYPHS = {
    "sun": "☉",
    "moon": "☽",
    "mercury": "☿",
    "venus": "♀",
    "mars": "♂",
    "jupiter": "♃",
    "saturn": "♄",
    "uranus": "♅",
    "neptune": "♆",
    "pluto": "♇"
}


def ecliptic_longitude(sign, degree):
    """Convert zodiac sign + degree to 0–360 longitude."""
    index = SIGN_ORDER.index(sign)
    return index * 30 + degree


def generate_starmap(planets, date):

    fig, ax = plt.subplots(figsize=(12, 3))

    ax.set_xlim(0, 360)
    ax.set_ylim(-1, 1)

    ax.axis("off")

    # draw ecliptic line
    ax.plot([0, 360], [0, 0], linewidth=1)

    # draw zodiac boundaries
    for i in range(12):
        ax.axvline(i * 30, alpha=0.25)

    # plot planets
    for name, data in planets.items():

        lon = ecliptic_longitude(data["sign"], data["degree"])

        glyph = PLANET_GLYPHS.get(name, name)

        ax.text(lon, 0, glyph, fontsize=22, ha="center", va="center")

        if data["retrograde"]:
            ax.text(lon, -0.25, "℞", fontsize=10, ha="center")

    filename = f"starmap_{date}.png"

    plt.savefig(filename, transparent=True, bbox_inches="tight")

    plt.close()

    return filename
