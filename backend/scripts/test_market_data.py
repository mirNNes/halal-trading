import asyncio
from app.market_data.factory import get_market_data_provider

async def main():
    provider = get_market_data_provider()
    bars = await provider.get_history("AAPL", days=10)

    print("Provider:", provider.name)
    print("Bars:", len(bars))

    for bar in bars[-3:]:
        print(bar)

asyncio.run(main())
