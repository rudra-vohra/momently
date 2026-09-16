import pytest


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