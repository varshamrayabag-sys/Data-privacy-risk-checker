import logging
import asyncio
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

logger = logging.getLogger(__name__)


class DatabaseManager:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None
    is_connected: bool = False

    async def connect(self):
        try:
            logger.info(f"Attempting connection to MongoDB at: {settings.MONGODB_URI}")
            self.client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=2000,
                connectTimeoutMS=2000
            )
            # Test ping
            await self.client.admin.command("ping")
            self.db = self.client[settings.DATABASE_NAME]
            self.is_connected = True
            logger.info(f"Successfully connected to MongoDB database '{settings.DATABASE_NAME}'")
        except Exception as e:
            logger.warning(
                f"MongoDB connection to '{settings.MONGODB_URI}' not active ({e}). "
                "Engaging resilient in-memory/file metadata persistence fallback. "
                "To connect to MongoDB Atlas, set MONGODB_URI in .env."
            )
            self.is_connected = False
            self.client = None
            self.db = None

    async def close(self):
        if self.client:
            self.client.close()
            self.is_connected = False
            logger.info("MongoDB connection closed.")


db_manager = DatabaseManager()
