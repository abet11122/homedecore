"""Build the local Pexels photos used by selected posts.

Run with ``python scripts/refresh_post_images.py`` after installing the
packages in ``scripts/image-requirements.txt``. The source page for every
photo is recorded in IMAGE_SOURCES.md.
"""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
from io import BytesIO
from pathlib import Path

import requests
from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public" / "images" / "posts"

# Post slug: (Pexels photo ID, Pexels source page URL).
POSTS = {
    "cozy-winter-home-decor-ideas": (36363112, "https://www.pexels.com/photo/cozy-living-room-with-sofa-and-lamp-36363112/"),
    "small-boys-bedroom-ideas": (7031881, "https://www.pexels.com/photo/child-bedroom-interior-with-bed-and-shelves-7031881/"),
    "fall-living-room-decor-ideas": (34322226, "https://www.pexels.com/photo/cozy-autumn-living-room-with-minimalist-decor-34322226/"),
    "small-bathroom-organization-ideas": (11120438, "https://www.pexels.com/photo/various-towels-and-body-care-products-on-bathroom-shelves-11120438/"),
    "christmas-coffee-table-decor-ideas": (6400254, "https://www.pexels.com/photo/christmas-decoration-on-a-coffee-table-6400254/"),
    "christmas-entryway-ideas": (21701325, "https://www.pexels.com/photo/christmas-wreath-decorating-modern-interior-21701325/"),
    "cozy-christmas-bedroom-ideas": (35099201, "https://www.pexels.com/photo/cozy-christmas-bedroom-with-decorations-35099201/"),
    "cozy-christmas-living-room-ideas": (29637478, "https://www.pexels.com/photo/cozy-christmas-living-room-decor-with-tree-29637478/"),
    "small-space-christmas-decor-ideas": (35348739, "https://www.pexels.com/photo/minimalist-christmas-decor-with-small-tree-and-ornaments-35348739/"),
    "halloween-costume-ideas-for-guys": (18959365, "https://www.pexels.com/photo/portrait-of-man-in-halloween-costume-18959365/"),
    "halloween-gift-baskets": (29111982, "https://www.pexels.com/photo/halloween-candy-display-with-pumpkin-bucket-29111982/"),
    "halloween-yard-ideas": (9658497, "https://www.pexels.com/photo/house-and-yard-decorated-for-halloween-9658497/"),
    "modern-boys-bedroom-ideas": (7045855, "https://www.pexels.com/photo/modern-large-children-bedroom-with-shelves-and-cabinet-7045855/"),
    "neutral-bedroom-ideas": (33197282, "https://www.pexels.com/photo/modern-cozy-bedroom-with-neutral-decor-33197282/"),
    "small-apartment-organization-ideas": (4112601, "https://www.pexels.com/photo/photo-of-bookshelves-near-grey-couch-4112601/"),
    "small-apartment-storage-ideas": (7005019, "https://www.pexels.com/photo/a-wardrobe-in-an-apartment-7005019/"),
    "small-bathroom-decor-ideas": (35373100, "https://www.pexels.com/photo/cozy-bathroom-with-wooden-mirror-and-plants-decor-35373100/"),
    "small-bedroom-ideas-that-look-expensive": (18285943, "https://www.pexels.com/photo/elegant-interior-design-of-bedroom-18285943/"),
    "small-bedroom-makeover-ideas": (33197278, "https://www.pexels.com/photo/cozy-modern-bedroom-with-neutral-decor-33197278/"),
    "small-bedroom-storage-ideas": (7445045, "https://www.pexels.com/photo/shelves-above-a-bed-7445045/"),
    "small-kitchen-organization-ideas": (37067674, "https://www.pexels.com/photo/organized-kitchen-drawer-with-cooking-utensils-37067674/"),
    "small-kitchen-storage-ideas": (31871391, "https://www.pexels.com/photo/organized-kitchen-cabinet-with-dishes-and-glassware-31871391/"),
    "small-pantry-organization-ideas": (11672496, "https://www.pexels.com/photo/shelves-with-food-in-jars-11672496/"),
    "small-studio-apartment-ideas": (6681821, "https://www.pexels.com/photo/small-studio-apartment-with-couch-and-bed-placed-near-window-6681821/"),
    "teenage-boy-bedroom-ideas": (16648044, "https://www.pexels.com/photo/modern-bedroom-design-for-a-teenager-16648044/"),
    "toy-story-inside-out-group-halloween-costume-ideas": (13417917, "https://www.pexels.com/photo/cosplayers-in-a-character-costume-13417917/"),
    "under-sink-bathroom-organization-ideas": (7789648, "https://www.pexels.com/photo/a-bathroom-cabinet-with-built-in-sink-7789648/"),
    "y2k-apocalypse-halloween-party-decor-ideas": (14230676, "https://www.pexels.com/photo/a-room-with-halloween-decorations-14230676/"),
}

# (Post slug, file stem): (Pexels ID, source URL, full width, full height).
INLINE = {
    ("fall-living-room-decor-ideas", "autumn-details"): (28886157, "https://www.pexels.com/photo/cozy-autumn-arrangement-with-pumpkins-and-leaves-28886157/", 1000, 667),
    ("fall-living-room-decor-ideas", "woven-blanket-basket"): (10880520, "https://www.pexels.com/photo/soft-blankets-in-a-wicker-basket-10880520/", 1000, 667),
    ("fall-living-room-decor-ideas", "warm-reading-corner"): (31224329, "https://www.pexels.com/photo/cozy-reading-nook-with-armchair-and-lamp-31224329/", 1000, 1500),
    ("small-bathroom-organization-ideas", "storage-baskets"): (31390644, "https://www.pexels.com/photo/minimalist-bathroom-storage-with-wicker-baskets-31390644/", 1440, 2160),
    ("small-bathroom-organization-ideas", "counter-tray"): (17054484, "https://www.pexels.com/photo/potted-plant-on-a-bathroom-sink-17054484/", 1440, 2160),
    ("small-bathroom-organization-ideas", "rolled-towels"): (20523089, "https://www.pexels.com/photo/view-of-shelves-with-rolled-towels-20523089/", 1440, 960),
    ("small-boys-bedroom-ideas", "study-corner"): (34992953, "https://www.pexels.com/photo/cozy-children-s-bedroom-with-desk-and-teddy-bear-34992953/", 1200, 801),
    ("small-boys-bedroom-ideas", "toy-storage"): (3661240, "https://www.pexels.com/photo/brown-wicker-basket-near-colorful-blocks-3661240/", 1200, 1800),
    ("small-boys-bedroom-ideas", "reading-corner"): (5008397, "https://www.pexels.com/photo/children-bedroom-with-bunk-beds-5008397/", 1440, 960),
}


def fetch(photo_id: int) -> Image.Image:
    base = f"https://images.pexels.com/photos/{photo_id}/pexels-photo-{photo_id}"
    for extension in ("jpeg", "png"):
        response = requests.get(f"{base}.{extension}", params={"auto": "compress", "w": 2000}, timeout=35)
        if response.status_code == 200:
            break
    response.raise_for_status()
    if not response.headers.get("Content-Type", "").startswith("image/"):
        raise ValueError(f"Pexels {photo_id} did not return an image")
    return Image.open(BytesIO(response.content)).convert("RGB")


def write_crop(image: Image.Image, target: Path, width: int, height: int) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    crop = ImageOps.fit(image, (width, height), method=Image.Resampling.LANCZOS)
    crop.save(target, "WEBP", quality=80, method=6)


def build_post(slug: str, photo_id: int) -> None:
    photo = fetch(photo_id)
    folder = PUBLIC / slug
    write_crop(photo, folder / "hero.webp", 1440, 960)
    write_crop(photo, folder / "pin.webp", 1000, 1500)
    print(f"post {slug}: {photo_id}", flush=True)


def build_inline(slug: str, name: str, photo_id: int, width: int, height: int) -> None:
    photo = fetch(photo_id)
    folder = PUBLIC / slug
    for w in (480, 960, width):
        h = round(height * w / width)
        suffix = "" if w == width else f"-{w}"
        write_crop(photo, folder / f"{name}{suffix}.webp", w, h)
    print(f"inline {slug}/{name}: {photo_id}", flush=True)


def main() -> None:
    jobs = []
    with ThreadPoolExecutor(max_workers=5) as pool:
        for slug, (photo_id, _) in POSTS.items():
            jobs.append(pool.submit(build_post, slug, photo_id))
        for (slug, name), (photo_id, _, width, height) in INLINE.items():
            jobs.append(pool.submit(build_inline, slug, name, photo_id, width, height))
        for job in as_completed(jobs):
            job.result()

    lines = [
        "# Image sources",
        "",
        "Local post images are cropped from these [Pexels](https://www.pexels.com/license/) photos. The Pexels license permits use and modification on websites and blogs.",
        "",
        "To rebuild the WebP files, install `scripts/image-requirements.txt` and run `python scripts/refresh_post_images.py` from the project root.",
        "",
        "| Post | Hero and Pinterest source |",
        "| --- | --- |",
    ]
    for slug, (_, url) in sorted(POSTS.items()):
        lines.append(f"| {slug} | [Pexels photo]({url}) |")
    lines.extend(["", "| Post / inline image | Source |", "| --- | --- |"])
    for (slug, name), (_, url, _, _) in sorted(INLINE.items()):
        lines.append(f"| {slug} / {name} | [Pexels photo]({url}) |")
    lines.append("")
    (ROOT / "IMAGE_SOURCES.md").write_text("\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
    main()
