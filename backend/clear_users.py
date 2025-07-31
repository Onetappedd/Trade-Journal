import asyncio
from db import AsyncSessionLocal
from models import User
from sqlalchemy import text
import os

async def clear_users():
    async with AsyncSessionLocal() as session:
        # Delete all users
        result = await session.execute(text("DELETE FROM users"))
        await session.commit()
        print(f"Deleted all users. Rows affected: {result.rowcount}")
        # Reset auto-incrementing primary key (PostgreSQL only)
        if os.getenv("DATABASE_URL", "").startswith("postgresql"):
            await session.execute(text("ALTER SEQUENCE users_id_seq RESTART WITH 1;"))
            await session.commit()
            print("Reset users_id_seq to 1.")

if __name__ == "__main__":
    asyncio.run(clear_users())
