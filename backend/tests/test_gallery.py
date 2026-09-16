import os

import pytest

TEST_PASSWORD = "TestPassword123!"
FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")


def load_test_image(filename="test_photo_1.jpg") -> bytes:
    with open(os.path.join(FIXTURES_DIR, filename), "rb") as f:
        return f.read()


async def register_and_login(client, email, role):
    register_response = await client.post(
        "/auth/register",
        json={
            "name": f"Gallery {role}",
            "email": email,
            "password": TEST_PASSWORD,
            "role": role,
        },
    )
    assert register_response.status_code == 201
    user_id = register_response.json()["id"]
    login_response = await client.post(
        "/auth/login",
        json={"email": email, "password": TEST_PASSWORD},
    )
    assert login_response.status_code == 200
    return login_response.json()["access_token"], user_id


async def setup_published_gallery(client, admin_token, pin="123456"):
    event_response = await client.post(
        "/events",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"name": "Gallery Test Event", "description": "Gallery test"},
    )
    assert event_response.status_code == 201
    event_id = event_response.json()["id"]

    upload_response = await client.post(
        f"/photos/{event_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        files={"files": ("test.jpg", load_test_image(), "image/jpeg")},
    )
    assert upload_response.status_code == 201
    photo_id = upload_response.json()["uploaded"][0]["id"]

    select_response = await client.patch(
        f"/photos/{event_id}/select",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"photo_ids": [photo_id], "selected": True},
    )
    assert select_response.status_code == 200

    publish_response = await client.post(
        f"/galleries/events/{event_id}/publish",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"pin": pin},
    )
    assert publish_response.status_code == 200
    return event_id, publish_response.json()["slug"]


@pytest.mark.asyncio
async def test_cannot_publish_with_no_photos_selected(client):
    admin_token, _ = await register_and_login(client, "test_gallery_no_photos@example.com", "admin")
    event_response = await client.post(
        "/events",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"name": "Empty Gallery Event", "description": "No photos"},
    )
    event_id = event_response.json()["id"]

    response = await client.post(
        f"/galleries/events/{event_id}/publish",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"pin": "123456"},
    )

    assert response.status_code == 400


@pytest.mark.asyncio
async def test_publish_requires_pin_on_first_publish(client):
    admin_token, _ = await register_and_login(client, "test_gallery_requires_pin@example.com", "admin")
    event_response = await client.post(
        "/events",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"name": "PIN Gallery Event", "description": "PIN required"},
    )
    event_id = event_response.json()["id"]
    upload_response = await client.post(
        f"/photos/{event_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        files={"files": ("test.jpg", load_test_image(), "image/jpeg")},
    )
    photo_id = upload_response.json()["uploaded"][0]["id"]
    await client.patch(
        f"/photos/{event_id}/select",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"photo_ids": [photo_id], "selected": True},
    )

    response = await client.post(
        f"/galleries/events/{event_id}/publish",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={},
    )

    assert response.status_code == 400


@pytest.mark.asyncio
async def test_successful_publish(client):
    admin_token, _ = await register_and_login(client, "test_gallery_success@example.com", "admin")
    event_id, _ = await setup_published_gallery(client, admin_token)

    response = await client.get(
        f"/galleries/events/{event_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert response.status_code == 200
    assert response.json()["is_published"] is True
    assert response.json()["photo_count"] == 1


@pytest.mark.asyncio
async def test_public_info_does_not_require_auth_and_hides_photos(client):
    admin_token, _ = await register_and_login(client, "test_gallery_public_info@example.com", "admin")
    _, slug = await setup_published_gallery(client, admin_token)

    response = await client.get(f"/galleries/public/{slug}")

    assert response.status_code == 200
    assert "photos" not in response.json()


@pytest.mark.asyncio
async def test_public_access_with_correct_pin(client):
    admin_token, _ = await register_and_login(client, "test_gallery_correct_pin@example.com", "admin")
    _, slug = await setup_published_gallery(client, admin_token, pin="654321")

    response = await client.post(
        f"/galleries/public/{slug}/access",
        json={"pin": "654321"},
    )

    assert response.status_code == 200
    assert len(response.json()["photos"]) == 1
    assert "access_token" in response.json()


@pytest.mark.asyncio
async def test_public_access_with_wrong_pin(client):
    admin_token, _ = await register_and_login(client, "test_gallery_wrong_pin@example.com", "admin")
    _, slug = await setup_published_gallery(client, admin_token)

    response = await client.post(
        f"/galleries/public/{slug}/access",
        json={"pin": "000000"},
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_unpublished_gallery_returns_404_on_public_info(client):
    admin_token, _ = await register_and_login(client, "test_gallery_unpublish_info@example.com", "admin")
    event_id, slug = await setup_published_gallery(client, admin_token)
    unpublish_response = await client.patch(
        f"/galleries/events/{event_id}/unpublish",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert unpublish_response.status_code == 200

    response = await client.get(f"/galleries/public/{slug}")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_unpublished_gallery_blocks_public_access(client):
    admin_token, _ = await register_and_login(client, "test_gallery_unpublish_access@example.com", "admin")
    event_id, slug = await setup_published_gallery(client, admin_token)
    await client.patch(
        f"/galleries/events/{event_id}/unpublish",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    response = await client.post(
        f"/galleries/public/{slug}/access",
        json={"pin": "123456"},
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_nonexistent_slug_returns_404(client):
    response = await client.get("/galleries/public/this-slug-does-not-exist")

    assert response.status_code == 404