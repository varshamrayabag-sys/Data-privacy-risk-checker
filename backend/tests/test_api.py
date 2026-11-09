import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "database" in data


@pytest.mark.asyncio
async def test_scan_text_api():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "text": "Hello, my phone is +91 9876543210 and my email is test.user@privacy.org."
        }
        response = await ac.post("/api/v1/scan/text", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["scan_id"].startswith("SCAN-")
        assert data["total_entities_detected"] >= 2
        assert data["risk_assessment"]["score"] > 0
        assert len(data["recommendations"]) > 0
        assert "original_text" in data
        assert "masked_text" in data


@pytest.mark.asyncio
async def test_dashboard_summary_api():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/dashboard/summary")
        assert response.status_code == 200
        data = response.json()
        assert "total_scans" in data
        assert "average_risk_score" in data
        assert "sensitivity_distribution" in data


@pytest.mark.asyncio
async def test_history_list_api():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/history")
        assert response.status_code == 200
        assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_empty_text_error():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/api/v1/scan/text", json={"text": "   "})
        assert response.status_code == 400
