import os
import json
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

    filename = os.path.basename(file_path)
    file_size = os.path.getsize(file_path)

    upload_url_endpoint = "https://www.wixapis.com/site-media/v1/files/generate-upload-url"
    payload = {
        "mimeType": "image/png",
        "fileName": filename
    }

    r1 = requests.post(upload_url_endpoint, headers=HEADERS, json=payload)
    if r1.status_code != 200:
        print("Wix upload URL error:", r1.text)
        r1.raise_for_status()

    result = r1.json()
    upload_url = result["uploadUrl"]

    with open(file_path, "rb") as f:
        file_data = f.read()

    r2 = requests.put(upload_url, data=file_data, headers={"Content-Type": "image/png"})
    if r2.status_code not in (200, 201, 204):
        print("Wix file upload error:", r2.text)
        r2.raise_for_status()

    upload_result = r2.json()
    file_info = upload_result.get("file", {})
    file_id = file_info.get("id", "")
    file_display_name = file_info.get("displayName", filename)

    if not file_id:
        print("Upload response:", json.dumps(upload_result, indent=2))
        raise Exception("No file ID returned from Wix upload")

    wix_image_url = f"wix:image://v1/{file_id}/{file_display_name}#originWidth=1200&originHeight=300"

    print(f"  Uploaded to Wix Media: {wix_image_url}")

    return wix_image_url


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

    get_url = f"https://www.wixapis.com/wix-data/v2/items/{item_id}?dataCollectionId={COLLECTION_ID}"
    r = requests.get(get_url, headers=HEADERS)
    if r.status_code != 200:
        print("Wix fetch error:", r.text)
        r.raise_for_status()

    item = r.json()["dataItem"]
    item["data"]["starMapImage"] = image_url

    put_url = f"https://www.wixapis.com/wix-data/v2/items/{item_id}"
    payload = {
        "dataCollectionId": COLLECTION_ID,
        "dataItem": item
    }

    response = requests.put(put_url, headers=HEADERS, json=payload)

    if response.status_code != 200:
        print("Wix update error:", response.text)

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
