from datetime import timedelta
import pytest
from app.auth.jwt import hash_password, verify_password, create_access_token, decode_access_token

def test_password_hashing():
    pwd = "superSecretPassword123!"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("wrongPassword", hashed) is False

def test_jwt_generation_and_decoding():
    payload = {"sub": "user-uuid-1234", "email": "ranger@darukaa.earth"}
    token = create_access_token(payload, expires_delta=timedelta(minutes=30))
    assert isinstance(token, str)

    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == "user-uuid-1234"
    assert decoded["email"] == "ranger@darukaa.earth"

def test_jwt_invalid_token():
    assert decode_access_token("invalid.jwt.token") is None
