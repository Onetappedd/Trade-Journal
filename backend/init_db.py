import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from alembic.config import Config
from alembic import command

if __name__ == "__main__":
    try:
        load_dotenv()
        db_url = os.getenv("DATABASE_URL")
        if not db_url:
            print("DATABASE_URL not set in .env file.")
            sys.exit(1)
        # Test DB connection
        try:
            engine = create_engine(db_url)
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
        except Exception as e:
            print(f"Database connection failed: {e}")
            sys.exit(1)
        # Run Alembic migrations
        alembic_cfg = Config(os.path.join(os.path.dirname(__file__), "alembic.ini"))
        alembic_cfg.set_main_option("script_location", os.path.join(os.path.dirname(__file__), "migrations"))
        alembic_cfg.set_main_option("sqlalchemy.url", db_url)
        try:
            command.upgrade(alembic_cfg, "head")
            print("Database initialized and migrations applied successfully.")
        except Exception as e:
            print(f"Alembic migration failed: {e}")
            sys.exit(1)
    except Exception as e:
        print(f"Initialization failed: {e}")
        sys.exit(1)
