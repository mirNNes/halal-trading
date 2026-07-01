import base64
import os
from cryptography.fernet import Fernet


def get_fernet() -> Fernet:
    from app.core.config import settings
    key = settings.BROKER_ENCRYPTION_KEY
    if not key:
        raise RuntimeError("BROKER_ENCRYPTION_KEY not set")
    return Fernet(key.encode())


def encrypt(plaintext: str) -> str:
    return get_fernet().encrypt(plaintext.encode()).decode()


def decrypt(ciphertext: str) -> str:
    return get_fernet().decrypt(ciphertext.encode()).decode()


def generate_key() -> str:
    """Run once to generate a key for .env"""
    return Fernet.generate_key().decode()
