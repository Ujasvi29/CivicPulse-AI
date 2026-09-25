import os
import logging
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("civicpulse.supabase")

_supabase_client: Client | None = None

def get_supabase_client() -> Client:
    """
    Returns an initialized Supabase Client using backend service-role credentials.
    Reuses cached client instance.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables")

    try:
        _supabase_client = create_client(supabase_url, supabase_key)
        return _supabase_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        raise

def check_db_connection() -> dict:
    """
    Verifies database connectivity and table readiness.
    Returns status without exposing credentials or internal secrets.
    """
    try:
        client = get_supabase_client()
        # Query departments table to verify schema migration readiness
        response = client.table("departments").select("id, name").limit(1).execute()
        return {
            "success": True,
            "status": "healthy",
            "database": "connected",
            "table_status": "ready",
            "department_count": len(response.data) if response.data else 0
        }
    except Exception as e:
        err_msg = str(e)
        logger.warning(f"Database query status: {err_msg}")
        
        # Check if error is specifically missing table schema (migration needed)
        if "PGRST205" in err_msg or "public.departments" in err_msg:
            return {
                "success": False,
                "status": "needs_migration",
                "database": "connected",
                "table_status": "schema_missing",
                "message": "Database connected successfully. Please execute database/001_initial_schema.sql in Supabase SQL Editor to create tables."
            }
        
        return {
            "success": False,
            "status": "unhealthy",
            "database": "disconnected",
            "error": "Database service unavailable"
        }
