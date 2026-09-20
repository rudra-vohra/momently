import os

import pytest
from beanie import PydanticObjectId

from app.core.security import hash_password, verify_password
from app.models.gallery import Gallery
from app.models.photo import Photo

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


async def setup_published_gallery(client, admin_token, pin="1234"):
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


async def create_gallery_for_event(client, admin_token, pin="1234", is_published=True):
    event_response = await client.post(
        "/events",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"name": "PIN Test Event", "description": "PIN test"},
    )
    assert event_response.status_code == 201
    event_id = PydanticObjectId(event_response.json()["id"])
    gallery = Gallery(
        event_id=event_id,
        slug=f"pin-test-{event_id}",
        pin_hash=hash_password(pin),
        published_photo_ids=[],
        is_published=is_published,
    )
    await gallery.insert()
    return event_id, gallery


async def create_snapshot_photo(event_id, uploaded_by, index, selected):
    photo = Photo(
        event_id=event_id,
        uploaded_by=PydanticObjectId(uploaded_by),
        filename=f"snapshot-{index}.jpg",
        url=f"https://example.com/snapshot-{index}.jpg",
        storage_key=f"photo_sharing/snapshot/{event_id}/{index}",
        file_size=10,
        selected_for_gallery=selected,
    )
    await photo.insert()
    return photo


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
        json={"pin": "1234"},
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
    _, slug = await setup_published_gallery(client, admin_token, pin="6543")

    response = await client.post(
        f"/galleries/public/{slug}/access",
        json={"pin": "6543"},
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
        json={"pin": "0000"},
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
        json={"pin": "1234"},
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_nonexistent_slug_returns_404(client):
    response = await client.get("/galleries/public/this-slug-does-not-exist")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_published_gallery_photos_use_snapshot_order_and_event_filter(client):
    admin_token, admin_id = await register_and_login(
        client, "test_gallery_snapshot_photos_admin@example.com", "admin"
    )
    event_id, gallery = await create_gallery_for_event(
        client, admin_token, is_published=False
    )
    first_photo = await create_snapshot_photo(event_id, admin_id, 1, selected=False)
    second_photo = await create_snapshot_photo(event_id, admin_id, 2, selected=True)
    foreign_event_id, foreign_gallery = await create_gallery_for_event(client, admin_token)
    foreign_photo = await create_snapshot_photo(foreign_event_id, admin_id, 3, selected=True)
    missing_photo_id = PydanticObjectId()
    gallery.published_photo_ids = [
        second_photo.id,
        missing_photo_id,
        foreign_photo.id,
        first_photo.id,
    ]
    await gallery.save()

    response = await client.get(
        f"/galleries/events/{event_id}/photos",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert response.status_code == 200
    assert [photo["id"] for photo in response.json()] == [
        str(second_photo.id),
        str(first_photo.id),
    ]
    assert all(photo["event_id"] == str(event_id) for photo in response.json())
    stored_gallery = await Gallery.get(gallery.id)
    assert stored_gallery.published_photo_ids == [
        second_photo.id,
        missing_photo_id,
        foreign_photo.id,
        first_photo.id,
    ]
    assert foreign_gallery.is_published is True


@pytest.mark.asyncio
async def test_team_member_cannot_read_published_gallery_photos(client):
    admin_token, _ = await register_and_login(
        client, "test_gallery_snapshot_member_admin@example.com", "admin"
    )
    event_id, _ = await create_gallery_for_event(client, admin_token)
    member_token, _ = await register_and_login(
        client, "test_gallery_snapshot_member@example.com", "team_member"
    )

    response = await client.get(
        f"/galleries/events/{event_id}/photos",
        headers={"Authorization": f"Bearer {member_token}"},
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_other_admin_cannot_read_published_gallery_photos(client):
    owner_token, _ = await register_and_login(
        client, "test_gallery_snapshot_owner_admin@example.com", "admin"
    )
    event_id, _ = await create_gallery_for_event(client, owner_token)
    other_admin_token, _ = await register_and_login(
        client, "test_gallery_snapshot_other_admin@example.com", "admin"
    )

    response = await client.get(
        f"/galleries/events/{event_id}/photos",
        headers={"Authorization": f"Bearer {other_admin_token}"},
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_published_gallery_photos_requires_existing_event_and_gallery(client):
    admin_token, _ = await register_and_login(
        client, "test_gallery_snapshot_missing_admin@example.com", "admin"
    )
    missing_event_response = await client.get(
        "/galleries/events/000000000000000000000000/photos",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert missing_event_response.status_code == 404

    event_response = await client.post(
        "/events",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"name": "Snapshot Without Gallery", "description": "No gallery"},
    )
    event_id = event_response.json()["id"]
    missing_gallery_response = await client.get(
        f"/galleries/events/{event_id}/photos",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert missing_gallery_response.status_code == 404


@pytest.mark.asyncio
async def test_published_gallery_photos_requires_authentication(client):
    admin_token, _ = await register_and_login(
        client, "test_gallery_snapshot_auth_admin@example.com", "admin"
    )
    event_id, _ = await create_gallery_for_event(client, admin_token)

    response = await client.get(f"/galleries/events/{event_id}/photos")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_snapshot_adds_selected_photos_in_order_without_duplicates(client):
    admin_token, admin_id = await register_and_login(
        client, "test_gallery_update_snapshot_admin@example.com", "admin"
    )
    event_id, gallery = await create_gallery_for_event(client, admin_token)
    photo_c = await create_snapshot_photo(event_id, admin_id, 1, selected=False)
    photo_a = await create_snapshot_photo(event_id, admin_id, 2, selected=True)
    photo_d = await create_snapshot_photo(event_id, admin_id, 3, selected=True)
    photo_b = await create_snapshot_photo(event_id, admin_id, 4, selected=True)
    photo_e = await create_snapshot_photo(event_id, admin_id, 5, selected=True)
    gallery.published_photo_ids = [photo_c.id, photo_a.id, photo_d.id]
    await gallery.save()

    response = await client.patch(
        f"/galleries/events/{event_id}/snapshot",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert response.status_code == 200
    updated_gallery = await Gallery.get(gallery.id)
    assert updated_gallery.published_photo_ids == [
        photo_c.id,
        photo_a.id,
        photo_d.id,
        photo_b.id,
        photo_e.id,
    ]
    assert response.json()["photo_count"] == 5

    second_response = await client.patch(
        f"/galleries/events/{event_id}/snapshot",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert second_response.status_code == 200
    updated_again = await Gallery.get(gallery.id)
    assert updated_again.published_photo_ids == updated_gallery.published_photo_ids


@pytest.mark.asyncio
async def test_update_snapshot_ignores_selected_photo_from_another_event(client):
    admin_token, admin_id = await register_and_login(
        client, "test_gallery_update_snapshot_filter_admin@example.com", "admin"
    )
    event_id, gallery = await create_gallery_for_event(client, admin_token)
    own_photo = await create_snapshot_photo(event_id, admin_id, 1, selected=True)
    other_event_id, _ = await create_gallery_for_event(client, admin_token)
    foreign_photo = await create_snapshot_photo(other_event_id, admin_id, 2, selected=True)
    gallery.published_photo_ids = []
    await gallery.save()

    response = await client.patch(
        f"/galleries/events/{event_id}/snapshot",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert response.status_code == 200
    updated_gallery = await Gallery.get(gallery.id)
    assert updated_gallery.published_photo_ids == [own_photo.id]
    assert foreign_photo.id not in updated_gallery.published_photo_ids


@pytest.mark.asyncio
async def test_update_snapshot_rejects_unpublished_or_missing_gallery(client):
    admin_token, _ = await register_and_login(
        client, "test_gallery_update_snapshot_errors_admin@example.com", "admin"
    )
    unpublished_event_id, _ = await create_gallery_for_event(
        client, admin_token, is_published=False
    )
    unpublished_response = await client.patch(
        f"/galleries/events/{unpublished_event_id}/snapshot",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert unpublished_response.status_code == 400

    event_response = await client.post(
        "/events",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"name": "Snapshot Missing Gallery", "description": "No gallery"},
    )
    missing_gallery_response = await client.patch(
        f"/galleries/events/{event_response.json()['id']}/snapshot",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert missing_gallery_response.status_code == 404


@pytest.mark.asyncio
async def test_only_event_owner_admin_can_update_snapshot(client):
    owner_token, _ = await register_and_login(
        client, "test_gallery_update_snapshot_owner@example.com", "admin"
    )
    event_id, _ = await create_gallery_for_event(client, owner_token)
    other_admin_token, _ = await register_and_login(
        client, "test_gallery_update_snapshot_other_admin@example.com", "admin"
    )
    member_token, _ = await register_and_login(
        client, "test_gallery_update_snapshot_member@example.com", "team_member"
    )

    other_admin_response = await client.patch(
        f"/galleries/events/{event_id}/snapshot",
        headers={"Authorization": f"Bearer {other_admin_token}"},
    )
    member_response = await client.patch(
        f"/galleries/events/{event_id}/snapshot",
        headers={"Authorization": f"Bearer {member_token}"},
    )

    assert other_admin_response.status_code == 403
    assert member_response.status_code == 403


@pytest.mark.asyncio
async def test_admin_can_change_gallery_pin_without_changing_gallery_state(client):
    admin_token, _ = await register_and_login(client, "test_gallery_change_pin_admin@example.com", "admin")
    event_id, gallery = await create_gallery_for_event(client, admin_token)
    original_values = (
        gallery.slug,
        gallery.published_photo_ids.copy(),
        gallery.is_published,
        gallery.created_at,
    )

    response = await client.patch(
        f"/galleries/events/{event_id}/pin",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"pin": "4920"},
    )

    assert response.status_code == 200
    assert response.json() == {"message": "Gallery PIN updated successfully"}
    updated_gallery = await Gallery.find_one(Gallery.event_id == event_id)
    assert updated_gallery is not None
    assert verify_password("4920", updated_gallery.pin_hash)
    assert not verify_password("1234", updated_gallery.pin_hash)
    assert updated_gallery.slug == original_values[0]
    assert updated_gallery.published_photo_ids == original_values[1]
    assert updated_gallery.is_published == original_values[2]
    expected_created_at = original_values[3].replace(
        microsecond=original_values[3].microsecond // 1000 * 1000
    )
    assert updated_gallery.created_at.replace(tzinfo=expected_created_at.tzinfo) == expected_created_at


@pytest.mark.asyncio
async def test_changed_pin_controls_public_gallery_access(client):
    admin_token, _ = await register_and_login(client, "test_gallery_change_pin_access@example.com", "admin")
    event_id, gallery = await create_gallery_for_event(client, admin_token, pin="1234")

    update_response = await client.patch(
        f"/galleries/events/{event_id}/pin",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"pin": "4920"},
    )
    assert update_response.status_code == 200

    old_pin_response = await client.post(
        f"/galleries/public/{gallery.slug}/access",
        json={"pin": "1234"},
    )
    new_pin_response = await client.post(
        f"/galleries/public/{gallery.slug}/access",
        json={"pin": "4920"},
    )
    assert old_pin_response.status_code == 401
    assert new_pin_response.status_code == 200


@pytest.mark.asyncio
async def test_team_member_cannot_change_gallery_pin(client):
    admin_token, _ = await register_and_login(client, "test_gallery_change_pin_member_admin@example.com", "admin")
    event_id, _ = await create_gallery_for_event(client, admin_token)
    member_token, _ = await register_and_login(client, "test_gallery_change_pin_member@example.com", "team_member")

    response = await client.patch(
        f"/galleries/events/{event_id}/pin",
        headers={"Authorization": f"Bearer {member_token}"},
        json={"pin": "4920"},
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_other_admin_cannot_change_gallery_pin(client):
    owner_token, _ = await register_and_login(client, "test_gallery_change_pin_owner@example.com", "admin")
    event_id, _ = await create_gallery_for_event(client, owner_token)
    other_admin_token, _ = await register_and_login(client, "test_gallery_change_pin_other@example.com", "admin")

    response = await client.patch(
        f"/galleries/events/{event_id}/pin",
        headers={"Authorization": f"Bearer {other_admin_token}"},
        json={"pin": "4920"},
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_change_gallery_pin_handles_missing_event_and_gallery(client):
    admin_token, _ = await register_and_login(client, "test_gallery_change_pin_missing@example.com", "admin")

    missing_event_response = await client.patch(
        "/galleries/events/000000000000000000000000/pin",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"pin": "4920"},
    )
    assert missing_event_response.status_code == 404

    event_response = await client.post(
        "/events",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"name": "No Gallery Event", "description": "No gallery"},
    )
    event_id = event_response.json()["id"]
    missing_gallery_response = await client.patch(
        f"/galleries/events/{event_id}/pin",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"pin": "4920"},
    )
    assert missing_gallery_response.status_code == 404


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("pin", "case_name"),
    [("", "empty"), ("123", "short"), ("12345", "long"), ("12ab", "alpha"), ("abcd", "letters"), ("12 4", "space")],
)
async def test_change_gallery_pin_rejects_invalid_pin(client, pin, case_name):
    admin_token, _ = await register_and_login(
        client, f"test_gallery_change_pin_invalid_{case_name}@example.com", "admin"
    )
    event_id, _ = await create_gallery_for_event(client, admin_token)

    response = await client.patch(
        f"/galleries/events/{event_id}/pin",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"pin": pin},
    )

    assert response.status_code == 422