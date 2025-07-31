"""
Add type, ticker, expiration, strike, option_type columns to trades table
"""

revision = 'add_trade_type_and_option_fields'
down_revision = '52e11ac5893a'
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa

def upgrade():
    op.add_column('trades', sa.Column('type', sa.String(), nullable=True))
    op.add_column('trades', sa.Column('ticker', sa.String(), nullable=True))
    op.add_column('trades', sa.Column('expiration', sa.String(), nullable=True))
    op.add_column('trades', sa.Column('strike', sa.Float(), nullable=True))
    op.add_column('trades', sa.Column('option_type', sa.String(), nullable=True))

def downgrade():
    op.drop_column('trades', 'option_type')
    op.drop_column('trades', 'strike')
    op.drop_column('trades', 'expiration')
    op.drop_column('trades', 'ticker')
    op.drop_column('trades', 'type')
