import os
import requests
import urllib3
from starmap import generate_starmap

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

WIX_API_KEY = os.getenv("WIX_API_KEY")
WIX_SITE_ID = os.getenv("WIX_SITE_ID")
ORACLE_API_URL = os.getenv("ORACLE_API_URL")

COLLECTION_ID = "DailyOracle1"

HEADERS = {
    "Authorization": WIX_API_KEY,
    "wix-site-id": WIX_SITE_ID,
    "Content-Type": "application/json"
}

# ------------------------------------------------
# Fetch Oracle JSON from your API
# ------------------------------------------------


def fetch_oracle():

    response = requests.get(ORACLE_API_URL, verify=False)

    response.raise_for_status()

    return response.json()


# ------------------------------------------------
# Extract planet data for starmap generator
# ------------------------------------------------


def extract_planets(data):

    planets = {}

    for p in data["planetPositions"]:

        name = p["name"].lower()

        planets[name] = {
            "sign": p["sign"],
            "degree": p["degree"],
            "retrograde": p["retrograde"]
        }

    return planets


# ------------------------------------------------
# Upload generated PNG to Wix Media
# ------------------------------------------------


def upload_image(file_path):

    # Construct a public URL pointing to the file in Replit
    filename = os.path.basename(file_path)

    image_url = f"https://cosmic-vibes.replit.app/{filename}"

    return image_url


# ------------------------------------------------
# Find CMS item using slug
# ------------------------------------------------


def get_item_id(slug):

    url = "https://www.wixapis.com/wix-data/v2/items/query"

    payload = {
        "dataCollectionId": COLLECTION_ID,
        "query": {
            "filter": {
                "slug": slug
            },
            "limit": 1
        }
    }

    response = requests.post(url, headers=HEADERS, json=payload)

    if response.status_code != 200:
        print("Wix error response:", response.text)
        response.raise_for_status()

    data = response.json()

    items = data.get("dataItems", [])

    if not items:
        raise Exception(f"No CMS item found for slug: {slug}")

    return items[0]["id"]


# ------------------------------------------------
# Update starMapImage field
# ------------------------------------------------


def update_oracle_image(item_id, image_url):

    url = "https://www.wixapis.com/wix-data/v2/items/update"

    payload = {
        "dataCollectionId": COLLECTION_ID,
        "dataItem": {
            "_id": item_id,
            "data": {
                "starMapImage": image_url
            }
        }
    }

    response = requests.put(url, headers=HEADERS, json=payload)

    response.raise_for_status()


# ------------------------------------------------
# Main Pipeline
# ------------------------------------------------


def run():

    print("Fetching oracle data...")

    data = fetch_oracle()

    slug = f"oracle-{data['date']}"

    print("Extracting planet positions...")

    planets = extract_planets(data)

    print("Generating star map...")

    image_file = generate_starmap(planets, data["date"])

    print("Uploading star map to Wix...")

    image_url = upload_image(image_file)

    print("Finding CMS record...")

    item_id = get_item_id(slug)

    print("Updating CMS item...")

    update_oracle_image(item_id, image_url)

    print("✔ Star map successfully attached to oracle entry")


if __name__ == "__main__":
    run()
