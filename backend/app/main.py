import os
from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.services.supabase import check_db_connection, get_supabase_client
from app.routers.reports import router as reports_router

load_dotenv()

app = FastAPI(
    title="CivicPulse AI API",
    description="AI-powered civic intelligence platform API",
    version="0.1.0"
)

# CORS setup for frontend communication
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(reports_router)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "CivicPulse AI API"
    }

@app.get("/health/db")
async def db_health_check(response: Response):
    db_result = check_db_connection()
    if not db_result.get("success"):
        if db_result.get("status") == "needs_migration":
            # 200 OK with migration notice
            return {
                "status": "needs_migration",
                "database": "connected",
                "message": db_result.get("message")
            }
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": db_result.get("error", "Database connection error")
        }
    
    return {
        "status": "healthy",
        "database": "connected"
    }

@app.get("/api/departments")
async def get_departments():
    """
    Returns list of all civic departments.
    """
    try:
        client = get_supabase_client()
        res = client.table("departments").select("*").order("name").execute()
        return {"success": True, "departments": res.data or []}
    except Exception as e:
        return {"success": False, "departments": [], "error": str(e)}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
