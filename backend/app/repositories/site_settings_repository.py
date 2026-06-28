from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone

from app.models.site_settings import SiteSettings


class SiteSettingsRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> List[SiteSettings]:
        result = await self.db.execute(select(SiteSettings).order_by(SiteSettings.key))
        return list(result.scalars().all())

    async def get(self, key: str) -> Optional[SiteSettings]:
        result = await self.db.execute(
            select(SiteSettings).where(SiteSettings.key == key)
        )
        return result.scalar_one_or_none()

    async def get_map(self) -> dict[str, str]:
        rows = await self.get_all()
        return {r.key: r.value for r in rows}

    async def set(self, key: str, value: str) -> SiteSettings:
        setting = await self.get(key)
        if setting:
            setting.value = value
            setting.updated_at = datetime.now(timezone.utc)
        else:
            setting = SiteSettings(key=key, value=value)
            self.db.add(setting)
        await self.db.flush()
        await self.db.refresh(setting)
        return setting

    async def set_many(self, updates: dict[str, str]) -> List[SiteSettings]:
        results = []
        for key, value in updates.items():
            results.append(await self.set(key, value))
        return results
