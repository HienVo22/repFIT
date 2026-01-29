"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
${imports if imports else ""}

# revision identifiers, used by Alembic.
revision: str = ${repr(up_revision)}
down_revision: Union[str, None] = ${repr(down_revision)}
branch_labels: Union[str, Sequence[str], None] = ${repr(branch_labels)}
depends_on: Union[str, Sequence[str], None] = ${repr(depends_on)}


def upgrade() -> None:
    """
    Upgrade database schema.
    
    🎓 INTERVIEW: Migrations should be idempotent when possible.
    Use "IF NOT EXISTS" for tables, handle existing data gracefully.
    """
    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    """
    Downgrade database schema.
    
    🎓 INTERVIEW: Always implement downgrade!
    If a deployment fails, you need to rollback.
    Some teams skip this in practice, but it's risky.
    """
    ${downgrades if downgrades else "pass"}
