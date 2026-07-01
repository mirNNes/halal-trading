from sqlalchemy import (
    Column, Integer, String, Boolean, Numeric, Date, DateTime,
    ForeignKey, Text, UniqueConstraint, func
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base

class SubscriptionTier(Base):
    __tablename__ = "subscription_tiers"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)        # free / starter / pro
    backtest_quota = Column(Integer, nullable=False)           # -1 = unlimited
    live_signals_enabled = Column(Boolean, default=False)
    price_monthly_cents = Column(Integer, nullable=False)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    stripe_customer_id = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    email_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
    subscription = relationship("Subscription", back_populates="user", uselist=False)
    backtest_runs = relationship("BacktestRun", back_populates="user")

class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    tier_id = Column(Integer, ForeignKey("subscription_tiers.id"))
    status = Column(String, default="active")                 # active / cancelled / past_due
    valid_until = Column(DateTime, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)
    user = relationship("User", back_populates="subscription")
    tier = relationship("SubscriptionTier")

class Strategy(Base):
    __tablename__ = "strategies"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    risk_profile = Column(String)                              # low / medium / high
    qc_project_id = Column(String, nullable=True)
    compile_id = Column(String, nullable=True)
    code_hash = Column(String, nullable=True)
    compiled_at = Column(DateTime, nullable=True)
    is_live = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

class ComplianceSnapshot(Base):
    __tablename__ = "compliance_snapshots"
    __table_args__ = (UniqueConstraint("date", "ticker", "provider"),)
    id = Column(Integer, primary_key=True)
    date = Column(Date, nullable=False)
    ticker = Column(String, nullable=False)
    provider = Column(String, nullable=False)
    status = Column(String, nullable=False)                    # halal / haram / doubtful
    raw_response = Column(JSONB)

class HalalUniverse(Base):
    __tablename__ = "halal_universe"
    id = Column(Integer, primary_key=True)
    date = Column(Date, nullable=False)
    ticker = Column(String, nullable=False)
    __table_args__ = (UniqueConstraint("date", "ticker"),)

class Signal(Base):
    __tablename__ = "signals"
    id = Column(Integer, primary_key=True)
    strategy_id = Column(Integer, ForeignKey("strategies.id"))
    ticker = Column(String, nullable=False)
    action = Column(String, nullable=False)                    # BUY / SELL / HOLD / WATCH
    reason = Column(Text)
    emitted_at = Column(DateTime, nullable=False)
    strategy = relationship("Strategy")

class BacktestRun(Base):
    __tablename__ = "backtest_runs"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    strategy_id = Column(Integer, ForeignKey("strategies.id"))
    status = Column(String, default="pending")                 # pending/running/completed/failed
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    starting_cash = Column(Integer, nullable=False)
    qc_backtest_id = Column(String, nullable=True)
    result_json = Column(JSONB, nullable=True)
    error_message = Column(Text, nullable=True)
    total_return = Column(Numeric, nullable=True)
    sharpe_ratio = Column(Numeric, nullable=True)
    max_drawdown = Column(Numeric, nullable=True)
    annual_return = Column(Numeric, nullable=True)
    win_rate = Column(Numeric, nullable=True)
    num_trades = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    completed_at = Column(DateTime, nullable=True)
    user = relationship("User", back_populates="backtest_runs")
    strategy = relationship("Strategy")

class BacktestQuotaUsage(Base):
    __tablename__ = "backtest_quota_usage"
    __table_args__ = (UniqueConstraint("user_id", "period_start"),)
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    period_start = Column(Date, nullable=False)
    count = Column(Integer, default=0)

class BrokerConnection(Base):
    __tablename__ = "broker_connections"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    broker = Column(String, nullable=False, default="alpaca")
    api_key_encrypted = Column(Text, nullable=False)
    api_secret_encrypted = Column(Text, nullable=False)
    paper = Column(Boolean, default=True)
    allocation_usd = Column(Numeric, nullable=False)
    execution_mode = Column(String, default="rebalance")
    auto_execute = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    user = relationship("User")

class ExecutionOrder(Base):
    __tablename__ = "execution_orders"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    signal_id = Column(Integer, ForeignKey("signals.id"), nullable=True)
    rebalance_strategy_id = Column(Integer, ForeignKey("strategies.id"), nullable=True)
    broker = Column(String, nullable=False)
    ticker = Column(String, nullable=False)
    action = Column(String, nullable=False)
    notional_usd = Column(Numeric, nullable=True)
    broker_order_id = Column(String, nullable=True)
    status = Column(String, nullable=False)
    filled_qty = Column(Numeric, nullable=True)
    filled_price = Column(Numeric, nullable=True)
    error_message = Column(Text, nullable=True)
    submitted_at = Column(DateTime, nullable=False)
    filled_at = Column(DateTime, nullable=True)
    user = relationship("User")
