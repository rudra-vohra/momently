import pytest

@pytest.mark.asyncio
async def test_can_create_and_cleanup_user():
    from app.models.user import User
    user = User(name="Smoke Test", email="smoketest@example.com", password_hash="x", role="admin")
    await user.insert()
    count = await User.find(User.email == "smoketest@example.com").count()
    assert count == 1