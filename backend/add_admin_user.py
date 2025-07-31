import asyncio
from models import User, Base
from db import engine, AsyncSessionLocal
from passlib.context import CryptContext
from sqlalchemy.future import select

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def add_admin():
    async with AsyncSessionLocal() as session:
        # Check if Admin user already exists
        q = select(User).where(User.username == "Admin")
        result = await session.execute(q)
        if result.scalars().first():
            print("Admin user already exists.")
            return
        hashed_pw = pwd_context.hash("Admin")
        user = User(username="Admin", email="admin@example.com", hashed_password=hashed_pw)
        session.add(user)
        await session.commit()
        print("Admin user created: username=Admin, password=Admin")

if __name__ == "__main__":
    asyncio.run(add_admin())
