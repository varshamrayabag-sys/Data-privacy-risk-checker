import os
import json
import logging
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime
from app.database.connection import db_manager
from app.core.config import settings
from app.schemas.scan import ScanHistoryItem, DashboardSummary

logger = logging.getLogger(__name__)

# Fallback persistence file path
DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
FALLBACK_FILE = DATA_DIR / "scan_history.json"


class ScanRepository:
    def __init__(self):
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        if not FALLBACK_FILE.exists():
            with open(FALLBACK_FILE, "w", encoding="utf-8") as f:
                json.dump([], f)

    def _read_fallback(self) -> List[dict]:
        try:
            with open(FALLBACK_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error reading fallback scan history: {e}")
            return []

    def _write_fallback(self, scans: List[dict]):
        try:
            with open(FALLBACK_FILE, "w", encoding="utf-8") as f:
                json.dump(scans, f, indent=2)
        except Exception as e:
            logger.error(f"Error writing fallback scan history: {e}")

    async def save_scan(self, scan_data: dict) -> str:
        """
        Saves scan metadata (never raw text) to MongoDB, falling back to local persistent store.
        """
        scan_id = scan_data["scan_id"]
        # Ensure raw text is never stored in DB
        sanitized_doc = {k: v for k, v in scan_data.items() if k != "original_text"}

        if db_manager.is_connected and db_manager.db is not None:
            try:
                collection = db_manager.db[settings.COLLECTION_SCANS]
                await collection.update_one(
                    {"scan_id": scan_id},
                    {"$set": sanitized_doc},
                    upsert=True
                )
                logger.info(f"Scan {scan_id} saved to MongoDB collection '{settings.COLLECTION_SCANS}'")
                return scan_id
            except Exception as e:
                logger.warning(f"Failed to save to MongoDB ({e}); saving to local persistence.")

        # Fallback persistence
        scans = self._read_fallback()
        # Remove any existing scan with the same ID
        scans = [s for s in scans if s.get("scan_id") != scan_id]
        scans.insert(0, sanitized_doc)
        self._write_fallback(scans)
        return scan_id

    async def get_scan(self, scan_id: str) -> Optional[dict]:
        """
        Fetches scan details by scan_id.
        """
        if db_manager.is_connected and db_manager.db is not None:
            try:
                collection = db_manager.db[settings.COLLECTION_SCANS]
                doc = await collection.find_one({"scan_id": scan_id}, {"_id": 0})
                if doc:
                    return doc
            except Exception as e:
                logger.warning(f"MongoDB fetch failed ({e}); checking local persistence.")

        scans = self._read_fallback()
        for s in scans:
            if s.get("scan_id") == scan_id:
                return s
        return None

    async def list_scans(self, limit: int = 50, skip: int = 0) -> List[ScanHistoryItem]:
        """
        Lists previous scans with pagination.
        """
        scans_raw = []
        if db_manager.is_connected and db_manager.db is not None:
            try:
                collection = db_manager.db[settings.COLLECTION_SCANS]
                cursor = collection.find({}, {"_id": 0}).sort("timestamp", -1).skip(skip).limit(limit)
                scans_raw = await cursor.to_list(length=limit)
            except Exception as e:
                logger.warning(f"MongoDB list failed ({e}); reading local persistence.")

        if not scans_raw:
            all_scans = self._read_fallback()
            scans_raw = all_scans[skip:skip + limit]

        items = []
        for s in scans_raw:
            try:
                # Entity types summary
                ent_summary = {}
                for ent in s.get("detected_entities", []):
                    etype = ent.get("entity_type", "UNKNOWN")
                    ent_summary[etype] = ent_summary.get(etype, 0) + 1

                items.append(
                    ScanHistoryItem(
                        scan_id=s["scan_id"],
                        timestamp=s["timestamp"],
                        input_type=s.get("input_type", "text"),
                        document_name=s.get("document_name"),
                        risk_score=s.get("risk_assessment", {}).get("score", 0),
                        risk_category=s.get("risk_assessment", {}).get("category", "LOW"),
                        total_entities=s.get("total_entities_detected", 0),
                        high_count=s.get("high_sensitivity_count", 0),
                        medium_count=s.get("medium_sensitivity_count", 0),
                        low_count=s.get("low_sensitivity_count", 0),
                        entity_types_summary=ent_summary,
                        character_count=s.get("character_count", 0),
                        processing_time_ms=s.get("processing_time_ms", 0.0)
                    )
                )
            except Exception as err:
                logger.error(f"Error parsing scan history item: {err}")
                continue

        return items

    async def delete_scan(self, scan_id: str) -> bool:
        """
        Deletes a scan record by scan_id.
        """
        deleted = False
        if db_manager.is_connected and db_manager.db is not None:
            try:
                collection = db_manager.db[settings.COLLECTION_SCANS]
                res = await collection.delete_one({"scan_id": scan_id})
                if res.deleted_count > 0:
                    deleted = True
            except Exception as e:
                logger.warning(f"MongoDB delete failed ({e})")

        scans = self._read_fallback()
        orig_len = len(scans)
        scans = [s for s in scans if s.get("scan_id") != scan_id]
        if len(scans) < orig_len:
            self._write_fallback(scans)
            deleted = True

        return deleted

    async def clear_all(self) -> int:
        count = 0
        if db_manager.is_connected and db_manager.db is not None:
            try:
                collection = db_manager.db[settings.COLLECTION_SCANS]
                res = await collection.delete_many({})
                count = res.deleted_count
            except Exception as e:
                logger.warning(f"MongoDB clear failed: {e}")

        scans = self._read_fallback()
        count = max(count, len(scans))
        self._write_fallback([])
        return count

    async def get_dashboard_summary(self) -> DashboardSummary:
        """
        Calculates real aggregated statistics from actual historical scans.
        """
        all_scans = await self.list_scans(limit=500, skip=0)
        
        if not all_scans:
            return DashboardSummary(
                total_scans=0,
                average_risk_score=0.0,
                high_risk_scans=0,
                medium_risk_scans=0,
                low_risk_scans=0,
                total_pii_detected=0,
                entity_distribution={},
                sensitivity_distribution={
                    "HIGH": 0,
                    "MEDIUM": 0,
                    "LOW": 0
                },
                recent_scans=[]
            )

        total_scans = len(all_scans)
        total_score = sum(s.risk_score for s in all_scans)
        avg_score = round(total_score / total_scans, 1) if total_scans > 0 else 0.0

        high_scans = sum(1 for s in all_scans if s.risk_category == "HIGH")
        med_scans = sum(1 for s in all_scans if s.risk_category == "MEDIUM")
        low_scans = sum(1 for s in all_scans if s.risk_category == "LOW")

        total_pii = sum(s.total_entities for s in all_scans)

        entity_dist: Dict[str, int] = {}
        total_high_entities = sum(s.high_count for s in all_scans)
        total_med_entities = sum(s.medium_count for s in all_scans)
        total_low_entities = sum(s.low_count for s in all_scans)

        for s in all_scans:
            for etype, count in s.entity_types_summary.items():
                entity_dist[etype] = entity_dist.get(etype, 0) + count

        return DashboardSummary(
            total_scans=total_scans,
            average_risk_score=avg_score,
            high_risk_scans=high_scans,
            medium_risk_scans=med_scans,
            low_risk_scans=low_scans,
            total_pii_detected=total_pii,
            entity_distribution=entity_dist,
            sensitivity_distribution={
                "HIGH": total_high_entities,
                "MEDIUM": total_med_entities,
                "LOW": total_low_entities
            },
            recent_scans=all_scans[:10]
        )


scan_repository = ScanRepository()
