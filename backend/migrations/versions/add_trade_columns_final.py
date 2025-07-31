"""
Add/fix type, ticker, expiration, strike, option_type columns to trades table
"""

revision = 'add_trade_columns_final'
down_revision = 'add_trade_type_and_option_fields'
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa

def upgrade():
    conn = op.get_bind()
    conn.execute(sa.text("ALTER TABLE trades ADD COLUMN IF NOT EXISTS type VARCHAR(50);"))
    conn.execute(sa.text("ALTER TABLE trades ADD COLUMN IF NOT EXISTS ticker VARCHAR(20);"))
    conn.execute(sa.text("ALTER TABLE trades ADD COLUMN IF NOT EXISTS expiration DATE;"))
    conn.execute(sa.text("ALTER TABLE trades ADD COLUMN IF NOT EXISTS strike FLOAT;"))
    conn.execute(sa.text("ALTER TABLE trades ADD COLUMN IF NOT EXISTS option_type VARCHAR(10);"))

def downgrade():
    conn = op.get_bind()
    conn.execute(sa.text("ALTER TABLE trades DROP COLUMN IF EXISTS option_type;"))
    conn.execute(sa.text("ALTER TABLE trades DROP COLUMN IF EXISTS strike;"))
    conn.execute(sa.text("ALTER TABLE trades DROP COLUMN IF EXISTS expiration;"))
    conn.execute(sa.text("ALTER TABLE trades DROP COLUMN IF EXISTS ticker;"))
    conn.execute(sa.text("ALTER TABLE trades DROP COLUMN IF EXISTS type;"))
