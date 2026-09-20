import os

import pytest
from beanie import PydanticObjectId

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
            "name": f"Photo {role}",
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


async def create_event(client, token):
    return await client.post(
        "/events",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Photo Test Event", "description": "Photo test"},
    )


async def add_member(client, event_id, admin_token, email):
    return await client.post(
        f"/events/{event_id}/team-members",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"email": email},
    )


async def upload_photo(client, event_id, token, filename="test.jpg"):
    return await client.post(
        f"/photos/{event_id}",
        headers={"Authorization": f"Bearer {token}"},
        files={"files": (filename, load_test_image(), "image/jpeg")},
    )


async def create_photo(event_id, uploaded_by, index, selected=False):
    photo = Photo(
        event_id=PydanticObjectId(event_id),
        uploaded_by=PydanticObjectId(uploaded_by),
        filename=f"protected-{index}.jpg",
        url=f"https://example.com/protected-{index}.jpg",
        storage_key=f"photo_sharing/protected/{event_id}/{index}",
        file_size=10,
        selected_for_gallery=selected,
    )
    await photo.insert()
    return photo


async def create_gallery(event_id, published_photo_ids, is_published=True):
    gallery = Gallery(
        event_id=PydanticObjectId(event_id),
        slug=f"protected-gallery-{event_id}",
        pin_hash="hashed-pin",
        published_photo_ids=published_photo_ids,
        is_published=is_published,
    )
    await gallery.insert()
    return gallery


@pytest.mark.asyncio
async def test_admin_can_upload_photo(client):
    admin_token, _ = await register_and_login(client, "test_photos_admin_upload@example.com", "admin")
    event_id = (await create_event(client, admin_token)).json()["id"]

    response = await upload_photo(client, event_id, admin_token)

    assert response.status_code == 201
    assert len(response.json()["uploaded"]) == 1
    assert response.json()["failed"] == []


@pytest.mark.asyncio
async def test_assigned_team_member_can_upload(client):
    admin_token, _ = await register_and_login(client, "test_photos_assigned_admin@example.com", "admin")
    event_id = (await create_event(client, admin_token)).json()["id"]
    member_token, _ = await register_and_login(client, "test_photos_assigned_member@example.com", "team_member")
    add_response = await add_member(client, event_id, admin_token, "test_photos_assigned_member@example.com")
    assert add_response.status_code == 200

    response = await upload_photo(client, event_id, member_token)

    assert response.status_code == 201


@pytest.mark.asyncio
async def test_unrelated_user_cannot_upload(client):
    admin_token, _ = await register_and_login(client, "test_photos_unrelated_admin@example.com", "admin")
    event_id = (await create_event(client, admin_token)).json()["id"]
    unrelated_token, _ = await register_and_login(client, "test_photos_unrelated_member@example.com", "team_member")

    response = await upload_photo(client, event_id, unrelated_token)

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_admin_can_list_photos(client):
    admin_token, _ = await register_and_login(client, "test_photos_list_admin@example.com", "admin")
    event_id = (await create_event(client, admin_token)).json()["id"]
    upload_response = await upload_photo(client, event_id, admin_token)
    assert upload_response.status_code == 201

    response = await client.get(
        f"/photos/{event_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert response.status_code == 200
    assert len(response.json()) == 1


@pytest.mark.asyncio
async def test_only_admin_can_select_photos(client):
    admin_token, _ = await register_and_login(client, "test_photos_select_member_admin@example.com", "admin")
    event_id = (await create_event(client, admin_token)).json()["id"]
    member_token, _ = await register_and_login(client, "test_photos_select_member@example.com", "team_member")
    await add_member(client, event_id, admin_token, "test_photos_select_member@example.com")
    upload_response = await upload_photo(client, event_id, member_token)
    photo_id = upload_response.json()["uploaded"][0]["id"]

    response = await client.patch(
        f"/photos/{event_id}/select",
        headers={"Authorization": f"Bearer {member_token}"},
        json={"photo_ids": [photo_id], "selected": True},
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_admin_can_select_photos(client):
    admin_token, _ = await register_and_login(client, "test_photos_select_admin@example.com", "admin")
    event_id = (await create_event(client, admin_token)).json()["id"]
    upload_response = await upload_photo(client, event_id, admin_token)
    photo_id = upload_response.json()["uploaded"][0]["id"]

    response = await client.patch(
        f"/photos/{event_id}/select",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"photo_ids": [photo_id], "selected": True},
    )

    assert response.status_code == 200
    assert response.json()["modified"] == 1


@pytest.mark.asyncio
async def test_uploader_can_delete_own_photo(client):
    admin_token, _ = await register_and_login(client, "test_photos_delete_admin@example.com", "admin")
    event_id = (await create_event(client, admin_token)).json()["id"]
    member_token, _ = await register_and_login(client, "test_photos_delete_member@example.com", "team_member")
    await add_member(client, event_id, admin_token, "test_photos_delete_member@example.com")
    upload_response = await upload_photo(client, event_id, member_token)
    photo_id = upload_response.json()["uploaded"][0]["id"]

    response = await client.delete(
        f"/photos/{photo_id}",
        headers={"Authorization": f"Bearer {member_token}"},
    )

    assert response.status_code == 204


@pytest.mark.asyncio
async def test_unrelated_user_cannot_delete_others_photo(client):
    admin_token, _ = await register_and_login(client, "test_photos_delete_unrelated_admin@example.com", "admin")
    event_id = (await create_event(client, admin_token)).json()["id"]
    upload_response = await upload_photo(client, event_id, admin_token)
    photo_id = upload_response.json()["uploaded"][0]["id"]
    unrelated_token, _ = await register_and_login(client, "test_photos_delete_unrelated_member@example.com", "team_member")

    response = await client.delete(
        f"/photos/{photo_id}",
        headers={"Authorization": f"Bearer {unrelated_token}"},
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_published_photo_cannot_be_deleted(client):
    admin_token, admin_id = await register_and_login(client, "test_photos_locked_delete@example.com", "admin")
    event_id = (await create_event(client, admin_token)).json()["id"]
    photo = await create_photo(event_id, admin_id, 1)
    await create_gallery(event_id, [photo.id])

    response = await client.delete(
        f"/photos/{photo.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert response.status_code == 409
    assert await Photo.get(photo.id) is not None


@pytest.mark.asyncio
async def test_unpublished_gallery_unlocks_published_photo_for_deletion(client):
    admin_token, admin_id = await register_and_login(client, "test_photos_unpublish_delete@example.com", "admin")
    event_id = (await create_event(client, admin_token)).json()["id"]
    photo = await create_photo(event_id, admin_id, 1)
    await create_gallery(event_id, [photo.id])

    unpublish_response = await client.patch(
        f"/galleries/events/{event_id}/unpublish",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert unpublish_response.status_code == 200

    response = await client.delete(
        f"/photos/{photo.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert response.status_code == 204
    assert await Photo.get(photo.id) is None


@pytest.mark.asyncio
async def test_unpublished_snapshot_photo_can_be_selected_and_deleted(client):
    admin_token, admin_id = await register_and_login(client, "test_photos_new_while_published@example.com", "admin")
    event_id = (await create_event(client, admin_token)).json()["id"]
    published_photo = await create_photo(event_id, admin_id, 1)
    new_photo = await create_photo(event_id, admin_id, 2)
    await create_gallery(event_id, [published_photo.id])

    select_response = await client.patch(
        f"/photos/{event_id}/select",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"photo_ids": [str(new_photo.id)], "selected": True},
    )
    assert select_response.status_code == 200
    assert (await Photo.get(new_photo.id)).selected_for_gallery is True

    delete_response = await client.delete(
        f"/photos/{new_photo.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert delete_response.status_code == 204


@pytest.mark.asyncio
async def test_selection_request_with_published_photo_is_atomic(client):
    admin_token, admin_id = await register_and_login(client, "test_photos_locked_selection_atomic@example.com", "admin")
    event_id = (await create_event(client, admin_token)).json()["id"]
    published_photo = await create_photo(event_id, admin_id, 1, selected=True)
    editable_photo = await create_photo(event_id, admin_id, 2, selected=False)
    await create_gallery(event_id, [published_photo.id])

    response = await client.patch(
        f"/photos/{event_id}/select",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"photo_ids": [str(published_photo.id), str(editable_photo.id)], "selected": True},
    )

    assert response.status_code == 409
    assert (await Photo.get(published_photo.id)).selected_for_gallery is True
    assert (await Photo.get(editable_photo.id)).selected_for_gallery is False


@pytest.mark.asyncio
async def test_bulk_selection_rejects_published_photo_without_partial_update(client):
    admin_token, admin_id = await register_and_login(client, "test_photos_locked_bulk_selection@example.com", "admin")
    event_id = (await create_event(client, admin_token)).json()["id"]
    published_photo = await create_photo(event_id, admin_id, 1, selected=False)
    editable_photo = await create_photo(event_id, admin_id, 2, selected=False)
    await create_gallery(event_id, [published_photo.id])

    response = await client.patch(
        f"/photos/event/{event_id}/selection",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"select": [str(editable_photo.id), str(published_photo.id)]},
    )

    assert response.status_code == 409
    assert (await Photo.get(published_photo.id)).selected_for_gallery is False
    assert (await Photo.get(editable_photo.id)).selected_for_gallery is False

@pytest.mark.asyncio
async def test_debug_id_consistency(client):
    admin_token, _ = await register_and_login(client, "test_debug_id@example.com", "admin")
    event_id = (await create_event(client, admin_token)).json()["id"]

    upload_response = await upload_photo(client, event_id, admin_token)
    print(f"\nFull upload response: {upload_response.json()}")

    list_response = await client.get(
        f"/photos/{event_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    print(f"Full list response ({len(list_response.json())} photos): {list_response.json()}")