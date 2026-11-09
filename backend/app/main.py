import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.database.connection import db_manager
from app.api.scan import router as scan_router
from app.api.analysis import router as analysis_router
from app.api.dashboard import router as dashboard_router
from app.api.history import router as history_router
from app.api.reports import router as reports_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info(f"Initializing {settings.PROJECT_NAME} v{settings.VERSION}...")
    await db_manager.connect()
    yield
    # Shutdown
    logger.info("Shutting down application...")
    await db_manager.close()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Production-quality Data Privacy Risk Checker API. "
        "Detects Personally Identifiable Information (PII) including specialized Indian identifiers, "
        "evaluates explainable privacy risk scores (0-100), classifies sensitivity, "
        "provides actionable security recommendations, and produces cryptographic-style PDF audit reports."
    ),
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler for uncaught exceptions
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error on {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred during request processing. Please try again or check logs.",
            "path": request.url.path
        }
    )

# Include Routers under API_V1_STR (/api/v1)
app.include_router(scan_router, prefix=settings.API_V1_STR)
app.include_router(analysis_router, prefix=settings.API_V1_STR)
app.include_router(dashboard_router, prefix=settings.API_V1_STR)
app.include_router(history_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "online",
        "mode": "localhost",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "storage_engine": db_manager.storage_engine_name
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "mode": "localhost",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": {
            "engine": db_manager.storage_engine_name,
            "connected": db_manager.is_connected
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)

