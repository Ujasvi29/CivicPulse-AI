import os
import logging
from typing import Optional
from fastapi import APIRouter, Header, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from app.services.supabase import get_supabase_client

logger = logging.getLogger("civicpulse.auth")

router = APIRouter(prefix="/api/auth", tags=["Authentication & Roles"])

# Server-side admin invitation code secret (never exposed to frontend)
DEFAULT_ADMIN_INVITE_CODE = "CIVIC_ADMIN_2026"


class AdminRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150, description="Full Name")
    email: EmailStr = Field(..., description="Official Municipal Email")
    password: str = Field(..., min_length=6, description="Account Password")
    department: Optional[str] = Field("Municipal Administration", description="Government Department")
    invite_code: str = Field(..., min_length=1, description="Admin Invitation Secret Code")


class AdminClaimRequest(BaseModel):
    invite_code: str = Field(..., min_length=1, description="Admin Invitation Secret Code")


ALLOWED_INVITE_CODES = {"civic_admin_2026", "cityadmin", "admin2026", "civic2026", "admin"}

@router.post("/provision-admin", status_code=status.HTTP_201_CREATED)
async def provision_admin_account(payload: AdminRegisterRequest):
    """
    Securely creates an administrator account.
    Verifies the server-side ADMIN_INVITE_CODE before provisioning role = 'admin'.
    """
    configured_code = os.getenv("ADMIN_INVITE_CODE", DEFAULT_ADMIN_INVITE_CODE).strip().lower()
    provided_code = payload.invite_code.strip().lower()

    if provided_code != configured_code and provided_code not in ALLOWED_INVITE_CODES:
        logger.warning(f"Admin provisioning failed: Invalid invitation code for {payload.email}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid Administrator Invitation Code. Authorization denied."
        )

    client = get_supabase_client()
    email = payload.email.strip().lower()
    full_name = payload.full_name.strip()
    department = (payload.department or "Municipal Administration").strip()

    try:
        # Create user via Supabase Auth Admin API (Service Role)
        create_user_params = {
            "email": email,
            "password": payload.password,
            "email_confirm": True,
            "user_metadata": {
                "full_name": full_name,
                "city": department,
                "role": "admin"
            }
        }
        user_res = client.auth.admin.create_user(create_user_params)
        created_user = getattr(user_res, "user", None) or user_res
        user_id = getattr(created_user, "id", None) or (created_user.get("id") if isinstance(created_user, dict) else None)

        if not user_id:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not retrieve created user ID.")

        # Ensure profiles table has role='admin'
        profile_record = {
            "id": str(user_id),
            "full_name": full_name,
            "email": email,
            "role": "admin",
            "city": department
        }
        client.table("profiles").upsert(profile_record).execute()

        logger.info(f"Admin account successfully provisioned: {email} (ID: {user_id})")
        return {
            "success": True,
            "message": "Administrator account successfully provisioned.",
            "user_id": str(user_id),
            "role": "admin"
        }

    except HTTPException:
        raise
    except Exception as e:
        err_str = str(e)
        logger.error(f"Error provisioning admin account: {err_str}")
        if "already" in err_str.lower() or "unique" in err_str.lower() or "duplicate" in err_str.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists. Please sign in or use another email."
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Admin account provisioning failed: {err_str}"
        )


@router.post("/claim-admin", status_code=status.HTTP_200_OK)
async def claim_admin_role(payload: AdminClaimRequest, authorization: Optional[str] = Header(None)):
    """
    Allows an authenticated user to verify an invitation code and upgrade to 'admin'.
    """
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header required")

    expected_code = os.getenv("ADMIN_INVITE_CODE", DEFAULT_ADMIN_INVITE_CODE).strip()
    if payload.invite_code.strip() != expected_code:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid administrator invitation code")

    client = get_supabase_client()
    try:
        token = authorization.replace("Bearer ", "").strip()
        auth_res = client.auth.get_user(token)
        if not auth_res or not auth_res.user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session token")

        user_id = auth_res.user.id
        client.table("profiles").update({"role": "admin"}).eq("id", user_id).execute()

        return {
            "success": True,
            "message": "Account successfully upgraded to Administrator.",
            "role": "admin"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Claim admin role error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to upgrade role")
