from app.brokers.base import BrokerClient
from app.brokers.alpaca import AlpacaClient
from app.brokers.crypto import decrypt


def get_broker_client(broker: str, api_key_enc: str, api_secret_enc: str, paper: bool) -> BrokerClient:
    api_key = decrypt(api_key_enc)
    api_secret = decrypt(api_secret_enc)

    if broker == "alpaca":
        return AlpacaClient(api_key, api_secret, paper=paper)

    raise ValueError(f"Unsupported broker: {broker}")
