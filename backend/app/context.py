# backend/app/context.py
"""Application context utilities.
Provides a FastAPI dependency to retrieve the current authenticated user via Supabase.
Used by authenticated endpoints.
"""

import logging
import re
from typing import Optional

from fastapi import Header, HTTPException, status
from app.services.supabase import get_supabase_client

logger = logging.getLogger("civicpulse.context")


def get_current_user(authorization: Optional[str] = Header(None)):
    """Extract the Supabase user from the Authorization header.
    Returns the user object on success, otherwise raises 401.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing",
        )

    # Clean bearer token prefix
    token = re.sub(r"^Bearer\s+", "", authorization, flags=re.IGNORECASE).strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token missing in Authorization header",
        )

    client = get_supabase_client()
    try:
        auth_res = client.auth.get_user(token)
        if not auth_res or not getattr(auth_res, "user", None):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
            )
        return auth_res.user
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning(f"Token validation failed in get_current_user: {exc}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed or token expired",
        )
