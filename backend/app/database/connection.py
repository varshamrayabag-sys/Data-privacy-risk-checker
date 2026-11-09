import logging
import asyncio
from typing import Optional, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

# Safe optional import of motor so app never crashes if motor is missing
try:
    from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
    HAS_MOTOR = True
except ImportError:
    AsyncIOMotorClient = Any  # type: ignore
    AsyncIOMotorDatabase = Any  # type: ignore
    HAS_MOTOR = False


class DatabaseManager:
    client: Optional[Any] = None
    db: Optional[Any] = None
    is_connected: bool = False

    @property
    def storage_engine_name(self) -> str:
        return "MongoDB" if self.is_connected else "Local JSON Store (backend/data/scan_history.json)"

    async def connect(self):
        # Default local host mode does not block on external databases
        if not getattr(settings, "ENABLE_MONGODB", False):
            logger.info(
                "Local host mode active: Using zero-dependency local JSON database (backend/data/scan_history.json). "
                "Instant startup without external network or MongoDB dependency."
            )
            self.is_connected = False
            return

        if not HAS_MOTOR:
            logger.info("Motor library is not installed in the active Python environment. Using local file persistence.")
            self.is_connected = False
            return

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
                "Engaging resilient local metadata persistence fallback."
            )
            self.is_connected = False
            self.client = None
            self.db = None

    async def close(self):
        if self.client and HAS_MOTOR:
            try:
                self.client.close()
            except Exception:
                pass
            self.is_connected = False
            logger.info("MongoDB connection closed.")


db_manager = DatabaseManager()
