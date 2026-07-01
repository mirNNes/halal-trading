from AlgorithmImports import *


class ZoyaHalalData(PythonData):
    """
    Custom data source that reads halal universe from our backend CSV.
    In backtest mode: downloads the full history in one request.
    In live mode: fetches only today's universe.
    """

    _base_url = None  # set by algorithm via class attribute before AddUniverse

    def get_source(self, config, date, is_live):
        base = ZoyaHalalData._base_url or "https://your-app.com"
        if is_live:
            date_str = date.strftime("%Y-%m-%d")
            url = f"{base}/api/universe/halal.csv?start_date={date_str}&end_date={date_str}"
        else:
            url = f"{base}/api/universe/halal.csv"
        return SubscriptionDataSource(url, SubscriptionTransportMedium.REMOTE_FILE)

    def reader(self, config, line, date, is_live):
        line = line.strip()
        if not line or line.startswith("date") or line.startswith("#"):
            return None

        parts = line.split(",")
        if len(parts) < 2:
            return None

        try:
            data = ZoyaHalalData()
            data.symbol = Symbol.create(parts[1].strip(), SecurityType.EQUITY, Market.USA)
            data.time = datetime.strptime(parts[0].strip(), "%Y-%m-%d")
            data.value = 1
            return data
        except Exception:
            return None
