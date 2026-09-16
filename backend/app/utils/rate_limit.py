import time
from collections import defaultdict
from typing import Dict, List

from fastapi import HTTPException, Request, status

# In-memory store: "ip:slug" -> list of failure timestamps.
# Suits a single-instance deployment; Redis would be the multi-instance upgrade.
_attempts: Dict[str, List[float]] = defaultdict(list)

MAX_ATTEMPTS = 8
WINDOW_SECONDS = 300  # 5 minutes


def check_pin_attempts(request: Request, slug: str) -> str:
    """
    Allow MAX_ATTEMPTS failed PIN tries per IP per gallery per sliding window.

    Raises 429 when the caller is over the limit. Returns the attempt key so
    the caller can record a failure or clear the record on success.
    """
    ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip() or (
        request.client.host if request.client else "unknown"
    )
    key = f"{ip}:{slug}"

    now = time.time()
    recent = [t for t in _attempts[key] if now - t < WINDOW_SECONDS]
    _attempts[key] = recent

    if len(recent) >= MAX_ATTEMPTS:
        retry_in = int(WINDOW_SECONDS - (now - recent[0])) + 1
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            f"Too many incorrect PIN attempts. Try again in {retry_in} seconds.",
            headers={"Retry-After": str(retry_in)},
        )
    return key


def record_failure(key: str) -> None:
    """Stamp a failed attempt."""
    _attempts[key].append(time.time())


def clear_attempts(key: str) -> None:
    """Wipe one caller's record after a successful PIN entry."""
    _attempts.pop(key, None)


def clear_attempts_for_slug(slug: str) -> None:
    """Wipe every caller's record for a gallery (used when the PIN is rotated)."""
    for key in [k for k in _attempts if k.endswith(f":{slug}")]:
        _attempts.pop(key, None)