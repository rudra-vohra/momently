import pytest
from beanie import PydanticObjectId

from app.models.event import Event
from app.models.gallery import Gallery
from app.models.photo import Photo
from app.models.user import User


TEST_PASSWORD = "TestPassword123!"


async def register_and_login(client, email, role):
    register_response = await client.post(
        "/auth/register",
        json={
            "name": f"Test {role}",
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


async def create_event(client, token, name="Test Event"):
    return await client.post(
        "/events",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": name, "description": "Test event description"},
    )


@pytest.mark.asyncio
async def test_admin_can_create_event(client):
    token, _ = await register_and_login(client, "test_events_create@example.com", "admin")
    response = await create_event(client, token)

    assert response.status_code == 201
    assert response.json()["team_member_ids"] == []


@pytest.mark.asyncio
async def test_team_member_cannot_create_event(client):
    token, _ = await register_and_login(client, "test_events_member_create@example.com", "team_member")
    response = await create_event(client, token)

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_admin_can_add_team_member_by_email(client):
    admin_token, _ = await register_and_login(client, "test_events_add@example.com", "admin")
    event_response = await create_event(client, admin_token)
    event_id = event_response.json()["id"]
    _, member_id = await register_and_login(client, "test_events_add_member@example.com", "team_member")

    response = await client.post(
        f"/events/{event_id}/team-members",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"email": "test_events_add_member@example.com"},
    )

    assert response.status_code == 200
    assert member_id in response.json()["team_member_ids"]


@pytest.mark.asyncio
async def test_cannot_add_same_team_member_twice(client):
    admin_token, _ = await register_and_login(client, "test_events_twice@example.com", "admin")
    event_id = (await create_event(client, admin_token)).json()["id"]
    await register_and_login(client, "test_events_twice_member@example.com", "team_member")
    url = f"/events/{event_id}/team-members"
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {"email": "test_events_twice_member@example.com"}

    first_response = await client.post(url, headers=headers, json=payload)
    second_response = await client.post(url, headers=headers, json=payload)

    assert first_response.status_code == 200
    assert second_response.status_code == 409


@pytest.mark.asyncio
async def test_adding_nonexistent_email_fails(client):
    admin_token, _ = await register_and_login(client, "test_events_missing@example.com", "admin")
    event_id = (await create_event(client, admin_token)).json()["id"]

    response = await client.post(
        f"/events/{event_id}/team-members",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"email": "test_events_never_registered@example.com"},
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_adding_an_admin_role_user_fails(client):
    admin_token, _ = await register_and_login(client, "test_events_admin_owner@example.com", "admin")
    event_id = (await create_event(client, admin_token)).json()["id"]
    await register_and_login(client, "test_events_second_admin@example.com", "admin")

    response = await client.post(
        f"/events/{event_id}/team-members",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"email": "test_events_second_admin@example.com"},
    )

    assert response.status_code == 400


@pytest.mark.asyncio
async def test_team_member_sees_only_assigned_events(client):
    admin_token, _ = await register_and_login(client, "test_events_list_admin@example.com", "admin")
    event_a = (await create_event(client, admin_token, "Event A")).json()
    event_b = (await create_event(client, admin_token, "Event B")).json()
    member_token, _ = await register_and_login(client, "test_events_list_member@example.com", "team_member")
    await client.post(
        f"/events/{event_a['id']}/team-members",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"email": "test_events_list_member@example.com"},
    )

    response = await client.get(
        "/events",
        headers={"Authorization": f"Bearer {member_token}"},
    )
    event_ids = [event["id"] for event in response.json()]

    assert response.status_code == 200
    assert event_a["id"] in event_ids
    assert event_b["id"] not in event_ids


@pytest.mark.asyncio
async def test_user_cannot_access_unrelated_event(client):
    admin_token, _ = await register_and_login(client, "test_events_unrelated_owner@example.com", "admin")
    event_id = (await create_event(client, admin_token)).json()["id"]
    member_token, _ = await register_and_login(client, "test_events_unrelated_member@example.com", "team_member")

    response = await client.get(
        f"/events/{event_id}",
        headers={"Authorization": f"Bearer {member_token}"},
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_admin_cannot_manage_another_admins_event(client):
    first_admin_token, _ = await register_and_login(client, "test_events_first_admin@example.com", "admin")
    event_id = (await create_event(client, first_admin_token)).json()["id"]
    second_admin_token, _ = await register_and_login(client, "test_events_second_owner@example.com", "admin")
    await register_and_login(client, "test_events_managed_member@example.com", "team_member")

    response = await client.post(
        f"/events/{event_id}/team-members",
        headers={"Authorization": f"Bearer {second_admin_token}"},
        json={"email": "test_events_managed_member@example.com"},
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_admin_can_remove_team_member_and_clear_user_event_reference(client):
    admin_token, _ = await register_and_login(client, "test_events_remove_admin@example.com", "admin")
    event_id = (await create_event(client, admin_token)).json()["id"]
    _, member_id = await register_and_login(
        client, "test_events_remove_member@example.com", "team_member"
    )
    add_response = await client.post(
        f"/events/{event_id}/team-members",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"email": "test_events_remove_member@example.com"},
    )
    assert add_response.status_code == 200

    other_event_id = (await create_event(client, admin_token, "Other Event")).json()["id"]
    member = await User.get(PydanticObjectId(member_id))
    member.event_ids.append(PydanticObjectId(other_event_id))
    await member.save()

    response = await client.delete(
        f"/events/{event_id}/members/{member_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert response.status_code == 204
    updated_event = await Event.get(PydanticObjectId(event_id))
    updated_member = await User.get(PydanticObjectId(member_id))
    assert PydanticObjectId(member_id) not in updated_event.team_member_ids
    assert PydanticObjectId(event_id) not in updated_member.event_ids
    assert PydanticObjectId(other_event_id) in updated_member.event_ids


@pytest.mark.asyncio
async def test_admin_can_delete_own_event(client):
    admin_token, _ = await register_and_login(client, "test_events_delete_owner@example.com", "admin")
    event_id = (await create_event(client, admin_token)).json()["id"]

    response = await client.delete(
        f"/events/{event_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert response.status_code == 200
    assert response.json() == {"message": "Event deleted successfully"}
    assert await Event.get(PydanticObjectId(event_id)) is None


@pytest.mark.asyncio
async def test_deleting_nonexistent_event_returns_404(client):
    admin_token, _ = await register_and_login(client, "test_events_delete_missing@example.com", "admin")

    response = await client.delete(
        "/events/000000000000000000000000",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_event_list_includes_dashboard_summary(client):
    admin_token, admin_id = await register_and_login(
        client, "test_events_summary_admin@example.com", "admin"
    )
    event_id = PydanticObjectId((await create_event(client, admin_token)).json()["id"])
    photos = []
    for index in range(4):
        photo = Photo(
            event_id=event_id,
            uploaded_by=PydanticObjectId(admin_id),
            filename=f"photo-{index}.jpg",
            url=f"https://example.com/photo-{index}.jpg",
            storage_key=f"photo_sharing/summary/{index}",
            file_size=10,
            selected_for_gallery=index < 3,
        )
        await photo.insert()
        photos.append(photo)

    gallery = Gallery(
        event_id=event_id,
        slug="summary-gallery",
        pin_hash="hashed-pin",
        published_photo_ids=[photos[0].id, photos[1].id],
        is_published=True,
    )
    await gallery.insert()

    response = await client.get(
        "/events",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert response.status_code == 200
    summary = next(item for item in response.json() if item["id"] == str(event_id))
    assert summary["photo_count"] == 4
    assert summary["selected_photo_count"] == 3
    assert summary["published_photo_count"] == 2
    assert summary["gallery_status"] == "published"
    assert summary["has_unpublished_changes"] is True


@pytest.mark.asyncio
async def test_event_list_detects_same_count_with_different_photo_ids(client):
    admin_token, admin_id = await register_and_login(
        client, "test_events_summary_ids_admin@example.com", "admin"
    )
    event_id = PydanticObjectId((await create_event(client, admin_token)).json()["id"])
    photos = []
    for index in range(3):
        photo = Photo(
            event_id=event_id,
            uploaded_by=PydanticObjectId(admin_id),
            filename=f"photo-{index}.jpg",
            url=f"https://example.com/photo-{index}.jpg",
            storage_key=f"photo_sharing/summary-ids/{index}",
            file_size=10,
            selected_for_gallery=True,
        )
        await photo.insert()
        photos.append(photo)

    gallery = Gallery(
        event_id=event_id,
        slug="summary-ids-gallery",
        pin_hash="hashed-pin",
        published_photo_ids=[photos[0].id, photos[1].id, PydanticObjectId()],
        is_published=True,
    )
    await gallery.insert()

    response = await client.get(
        "/events",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    summary = next(item for item in response.json() if item["id"] == str(event_id))
    assert summary["selected_photo_count"] == 3
    assert summary["published_photo_count"] == 3
    assert summary["has_unpublished_changes"] is True


@pytest.mark.asyncio
async def test_team_member_gets_dashboard_summary_for_assigned_event(client):
    admin_token, admin_id = await register_and_login(
        client, "test_events_summary_member_admin@example.com", "admin"
    )
    event_id = PydanticObjectId((await create_event(client, admin_token)).json()["id"])
    member_token, member_id = await register_and_login(
        client, "test_events_summary_member@example.com", "team_member"
    )
    add_response = await client.post(
        f"/events/{event_id}/team-members",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"email": "test_events_summary_member@example.com"},
    )
    assert add_response.status_code == 200

    photo = Photo(
        event_id=event_id,
        uploaded_by=PydanticObjectId(admin_id),
        filename="member-summary.jpg",
        url="https://example.com/member-summary.jpg",
        storage_key="photo_sharing/member-summary/photo",
        file_size=10,
    )
    await photo.insert()

    response = await client.get(
        "/events",
        headers={"Authorization": f"Bearer {member_token}"},
    )

    assert response.status_code == 200
    assert response.json() == [
        {
            **response.json()[0],
            "id": str(event_id),
            "admin_id": admin_id,
            "team_member_ids": [member_id],
            "photo_count": 1,
            "selected_photo_count": 0,
            "published_photo_count": 0,
            "gallery_status": "draft",
            "has_unpublished_changes": False,
        }
    ]


@pytest.mark.asyncio
async def test_team_member_cannot_delete_event(client):
    admin_token, _ = await register_and_login(client, "test_events_delete_member_admin@example.com", "admin")
    event_id = (await create_event(client, admin_token)).json()["id"]
    member_token, _ = await register_and_login(client, "test_events_delete_member@example.com", "team_member")

    response = await client.delete(
        f"/events/{event_id}",
        headers={"Authorization": f"Bearer {member_token}"},
    )

    assert response.status_code == 403
    assert await Event.get(PydanticObjectId(event_id)) is not None


@pytest.mark.asyncio
async def test_admin_cannot_delete_another_admins_event(client):
    owner_token, _ = await register_and_login(client, "test_events_delete_first_admin@example.com", "admin")
    event_id = (await create_event(client, owner_token)).json()["id"]
    other_admin_token, _ = await register_and_login(client, "test_events_delete_second_admin@example.com", "admin")

    response = await client.delete(
        f"/events/{event_id}",
        headers={"Authorization": f"Bearer {other_admin_token}"},
    )

    assert response.status_code == 403
    assert await Event.get(PydanticObjectId(event_id)) is not None


@pytest.mark.asyncio
async def test_delete_event_cleans_team_member_references(client):
    admin_token, _ = await register_and_login(client, "test_events_delete_members_admin@example.com", "admin")
    event_id = (await create_event(client, admin_token)).json()["id"]
    _, member_one_id = await register_and_login(
        client, "test_events_delete_member_one@example.com", "team_member"
    )
    _, member_two_id = await register_and_login(
        client, "test_events_delete_member_two@example.com", "team_member"
    )

    for email in ("test_events_delete_member_one@example.com", "test_events_delete_member_two@example.com"):
        response = await client.post(
            f"/events/{event_id}/team-members",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"email": email},
        )
        assert response.status_code == 200

    other_event_id = (await create_event(client, admin_token, "Other Event")).json()["id"]
    member_one = await User.get(PydanticObjectId(member_one_id))
    member_two = await User.get(PydanticObjectId(member_two_id))
    member_one.event_ids.append(PydanticObjectId(other_event_id))
    member_two.event_ids.append(PydanticObjectId(other_event_id))
    await member_one.save()
    await member_two.save()

    response = await client.delete(
        f"/events/{event_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert response.status_code == 200
    assert [PydanticObjectId(other_event_id)] == (await User.get(PydanticObjectId(member_one_id))).event_ids
    assert [PydanticObjectId(other_event_id)] == (await User.get(PydanticObjectId(member_two_id))).event_ids


@pytest.mark.asyncio
async def test_delete_event_cleans_photos_and_gallery(client, monkeypatch):
    admin_token, _ = await register_and_login(client, "test_events_delete_related_admin@example.com", "admin")
    event_response = await create_event(client, admin_token)
    event_id = PydanticObjectId(event_response.json()["id"])
    deleted_storage_keys = []

    async def fake_delete_photo(storage_key: str) -> None:
        deleted_storage_keys.append(storage_key)

    monkeypatch.setattr(
        "app.routers.event_router.delete_photo_from_cloudinary",
        fake_delete_photo,
    )
    photo = Photo(
        event_id=event_id,
        uploaded_by=event_id,
        filename="photo.jpg",
        url="https://example.com/photo.jpg",
        storage_key="photo_sharing/test/photo",
        file_size=10,
    )
    await photo.insert()
    gallery = Gallery(
        event_id=event_id,
        slug="test-delete-related-gallery",
        pin_hash="hashed-pin",
    )
    await gallery.insert()

    response = await client.delete(
        f"/events/{event_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert response.status_code == 200
    assert deleted_storage_keys == ["photo_sharing/test/photo"]
    assert await Photo.find(Photo.event_id == event_id).count() == 0
    assert await Gallery.find_one(Gallery.event_id == event_id) is None