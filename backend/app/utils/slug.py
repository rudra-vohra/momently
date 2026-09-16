import re
import secrets

from app.models.gallery import Gallery


def slugify(text: str) -> str:
    text = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return text[:40] or "gallery"


async def generate_unique_slug(event_name: str) -> str:
    """Build a URL-safe slug from the event name, with a random suffix for uniqueness."""
    base = slugify(event_name)
    for _ in range(5):
        candidate = f"{base}-{secrets.token_hex(3)}"
        if not await Gallery.find_one(Gallery.slug == candidate):
            return candidate
    return f"{base}-{secrets.token_hex(8)}"