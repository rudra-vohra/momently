import pytest


@pytest.mark.asyncio
async def test_register_success(client):
    payload = {
        "name": "Auth Admin",
        "email": "test_auth_register@example.com",
        "password": "TestPassword123!",
        "role": "admin",
    }

    response = await client.post("/auth/register", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert "id" in body
    assert body["email"] == payload["email"]
    assert "password" not in body
    assert "password_hash" not in body


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    payload = {
        "name": "Duplicate User",
        "email": "test_auth_duplicate@example.com",
        "password": "TestPassword123!",
        "role": "admin",
    }

    first_response = await client.post("/auth/register", json=payload)
    second_response = await client.post("/auth/register", json=payload)

    assert first_response.status_code == 201
    assert second_response.status_code == 409


@pytest.mark.asyncio
async def test_login_success(client):
    payload = {
        "name": "Login User",
        "email": "test_auth_login@example.com",
        "password": "TestPassword123!",
        "role": "admin",
    }
    await client.post("/auth/register", json=payload)

    response = await client.post(
        "/auth/login",
        json={"email": payload["email"], "password": payload["password"]},
    )

    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    payload = {
        "name": "Wrong Password User",
        "email": "test_auth_wrong_password@example.com",
        "password": "TestPassword123!",
        "role": "admin",
    }
    await client.post("/auth/register", json=payload)

    response = await client.post(
        "/auth/login",
        json={"email": payload["email"], "password": "WrongPassword123!"},
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_email(client):
    response = await client.post(
        "/auth/login",
        json={
            "email": "test_auth_nonexistent@example.com",
            "password": "TestPassword123!",
        },
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_me_with_valid_token(client):
    payload = {
        "name": "Me User",
        "email": "test_auth_me_valid@example.com",
        "password": "TestPassword123!",
        "role": "admin",
    }
    await client.post("/auth/register", json=payload)
    login_response = await client.post(
        "/auth/login",
        json={"email": payload["email"], "password": payload["password"]},
    )
    token = login_response.json()["access_token"]

    response = await client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["email"] == payload["email"]


@pytest.mark.asyncio
async def test_me_with_invalid_token(client):
    response = await client.get(
        "/auth/me",
        headers={"Authorization": "Bearer invalidtoken123"},
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_me_without_token(client):
    response = await client.get("/auth/me")

    assert response.status_code == 401