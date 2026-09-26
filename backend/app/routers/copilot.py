import os
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from app.services.supabase import get_supabase_client
from app.services.gemini import analyze_civic_report
from app.context import get_current_user  # Assuming you have a dependency to get auth user

logger = logging.getLogger("civicpulse.copilot")

router = APIRouter(prefix="/api/copilot", tags=["Copilot"])

class CopilotMessageRequest(BaseModel):
    message: str = Field(..., description="Natural language description of the civic issue")
    latitude: float | None = Field(None, description="Optional latitude of issue location")
    longitude: float | None = Field(None, description="Optional longitude of issue location")
    address: str | None = Field(None, description="Optional address or landmark")
    category_hint: str | None = Field(None, description="Optional citizen suggested category")

@router.post("/message", status_code=status.HTTP_200_OK)
async def process_copilot_message(
    payload: CopilotMessageRequest,
    user=Depends(get_current_user),
):
    """Process a free‑form citizen message through Gemini and return AI suggestions.

    The endpoint re‑uses the existing `analyze_civic_report` service with a placeholder
    title (the first 30 characters of the message) and no image. It returns the same
    structure that the normal report submission API provides, allowing the front‑end
    to display category, severity, urgency, department, and a concise summary.
    """
    try:
        title = payload.message[:30] or "User described issue"
        result = await analyze_civic_report(
            title=title,
            description=payload.message,
            location_address=payload.address,
            latitude=payload.latitude,
            longitude=payload.longitude,
            category_hint=payload.category_hint,
            image_base64=None,
        )
        # The result already contains AI analysis and metrics.
        return {
            "success": True,
            "analysis": result["analysis"],
            "metrics": result["metrics"],
            "citizen_category_disagreement": result.get("citizen_category_disagreement", False),
            "citizen_suggested_category": result.get("citizen_suggested_category"),
        }
    except Exception as e:
        logger.error(f"Copilot processing failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to contact AI service. Please try again.",
        )
