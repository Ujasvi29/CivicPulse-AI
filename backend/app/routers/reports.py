import os
import re
import uuid
import base64
import logging
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Header, HTTPException, status, Depends
from pydantic import BaseModel, Field

from app.services.supabase import get_supabase_client
from app.services.gemini import analyze_civic_issue, ALLOWED_CATEGORIES

logger = logging.getLogger("civicpulse.reports")

router = APIRouter(prefix="/api/reports", tags=["Reports"])


class ReportCreateRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=200, description="Brief summary of the civic issue")
    description: str = Field(..., min_length=5, max_length=2000, description="Detailed description")
    category: Optional[str] = Field("Let AI determine category", description="Category preference or hint")
    latitude: Optional[float] = Field(None, description="GPS Latitude")
    longitude: Optional[float] = Field(None, description="GPS Longitude")
    address: Optional[str] = Field(None, description="Location text or address")
    image_base64: Optional[str] = Field(None, description="Base64 encoded image string")
    image_mime_type: Optional[str] = Field("image/jpeg", description="Image MIME type")
    user_id: Optional[str] = Field(None, description="Optional user UUID")


def get_current_user_id(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """
    Extracts authenticated user UUID from Supabase Bearer JWT if provided.
    """
    if not authorization:
        return None
    try:
        token = authorization.replace("Bearer ", "").strip()
        client = get_supabase_client()
        user_response = client.auth.get_user(token)
        if user_response and user_response.user:
            return user_response.user.id
    except Exception as e:
        logger.warning(f"Could not verify auth bearer token: {e}")
    return None


def generate_case_number() -> str:
    """
    Generates an authoritative Civic Case ID format: CP-YYYY-XXXXXX
    Queries existing count for current year.
    """
    client = get_supabase_client()
    current_year = datetime.now().year
    prefix = f"CP-{current_year}-"
    try:
        res = client.table("reports").select("case_number", count="exact").ilike("case_number", f"{prefix}%").execute()
        count = (res.count or 0) + 1
        return f"{prefix}{count:06d}"
    except Exception as e:
        logger.warning(f"Case number count query failed, using timestamp fallback: {e}")
        random_suffix = str(uuid.uuid4().int)[:6]
        return f"{prefix}{random_suffix}"


def upload_report_image(image_base64: str, mime_type: str = "image/jpeg") -> Optional[str]:
    """
    Uploads base64 image data to Supabase Storage 'report-images' bucket.
    Returns public URL.
    """
    if not image_base64:
        return None

    try:
        clean_base64 = image_base64
        if "," in clean_base64:
            clean_base64 = clean_base64.split(",", 1)[1]

        image_bytes = base64.b64decode(clean_base64)
        ext = "jpg"
        if "png" in mime_type:
            ext = "png"
        elif "webp" in mime_type:
            ext = "webp"

        filename = f"report_{uuid.uuid4().hex[:12]}.{ext}"
        client = get_supabase_client()

        # Ensure bucket exists
        try:
            client.storage.from_("report-images").upload(
                file=image_bytes,
                path=filename,
                file_options={"content-type": mime_type, "upsert": "true"}
            )
        except Exception as upload_err:
            logger.warning(f"Storage upload error: {upload_err}")
            # Try creating bucket if not exists
            try:
                client.storage.create_bucket("report-images", options={"public": True})
                client.storage.from_("report-images").upload(
                    file=image_bytes,
                    path=filename,
                    file_options={"content-type": mime_type, "upsert": "true"}
                )
            except Exception as b_err:
                logger.error(f"Bucket creation and upload retry failed: {b_err}")
                return None

        public_url = client.storage.from_("report-images").get_public_url(filename)
        return public_url
    except Exception as e:
        logger.error(f"Failed to process and upload report image: {e}")
        return None


@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/analyze", status_code=status.HTTP_201_CREATED)
async def create_and_analyze_report(
    payload: ReportCreateRequest,
    authorization: Optional[str] = Header(None)
):
    """
    Main Phase 7 Intelligent Civic Reporting Workflow:
    1. Validates citizen input
    2. Executes Gemini AI multimodal analysis
    3. Deterministically computes priority and impact score
    4. Matches civic department
    5. Saves to Supabase (reports, ai_analysis, report_updates)
    6. Returns structured civic case and diagnostic assessment
    """
    # 1. Determine user ID
    auth_user_id = get_current_user_id(authorization) or payload.user_id

    # 2. Execute Gemini AI Analysis
    try:
        ai_result = await analyze_civic_issue(
            title=payload.title,
            description=payload.description,
            location_address=payload.address,
            category_hint=payload.category,
            image_base64=payload.image_base64,
            image_mime_type=payload.image_mime_type
        )
    except Exception as ai_err:
        logger.error(f"AI Analysis error: {ai_err}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI diagnostic processing failed: {str(ai_err)}"
        )

    analysis_data = ai_result["analysis"]
    metrics_data = ai_result["metrics"]
    raw_response = ai_result.get("raw_response")
    model_name = ai_result.get("model_name", "gemini-3.5-flash-lite")

    client = get_supabase_client()

    # 3. Match Department ID
    department_id = None
    try:
        dept_name = analysis_data.get("recommended_department", "General Civic Services")
        dept_res = client.table("departments").select("id, name").ilike("name", f"%{dept_name}%").limit(1).execute()
        if dept_res.data:
            department_id = dept_res.data[0]["id"]
        else:
            # Fallback to any department
            all_depts = client.table("departments").select("id").limit(1).execute()
            if all_depts.data:
                department_id = all_depts.data[0]["id"]
    except Exception as e:
        logger.warning(f"Department matching query error: {e}")

    # 4. Upload Image if present
    image_url = None
    if payload.image_base64:
        image_url = upload_report_image(payload.image_base64, payload.image_mime_type or "image/jpeg")

    # 5. Generate authoritative Case Number
    case_number = generate_case_number()

    # 6. Insert Report into Supabase
    report_record = {
        "case_number": case_number,
        "user_id": auth_user_id,
        "title": payload.title.strip(),
        "description": payload.description.strip(),
        "category": analysis_data.get("category", "General Civic Services"),
        "subcategory": analysis_data.get("subcategory", "General Issue"),
        "status": "submitted",
        "severity": metrics_data["severity_score"],
        "urgency": metrics_data["urgency_score"],
        "public_impact": metrics_data["public_impact_score"],
        "evidence_confidence": metrics_data["confidence_score"],
        "impact_score": metrics_data["impact_score"],
        "priority": metrics_data["priority"],
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "address": payload.address,
        "image_url": image_url,
        "recommended_department_id": department_id
    }

    try:
        report_insert_res = client.table("reports").insert(report_record).execute()
        if not report_insert_res.data:
            raise HTTPException(status_code=500, detail="Failed to persist civic report")
        created_report = report_insert_res.data[0]
        report_id = created_report["id"]
    except Exception as e:
        logger.error(f"Error inserting report: {e}")
        raise HTTPException(status_code=500, detail=f"Database error while saving report: {str(e)}")

    # 7. Insert AI Analysis into Supabase
    ai_analysis_record = {
        "report_id": report_id,
        "category": analysis_data.get("category"),
        "subcategory": analysis_data.get("subcategory"),
        "summary": analysis_data.get("summary"),
        "severity": metrics_data["severity_score"],
        "urgency": metrics_data["urgency_score"],
        "public_impact": metrics_data["public_impact_score"],
        "evidence_confidence": metrics_data["confidence_score"],
        "recommended_department_id": department_id,
        "recommended_action": analysis_data.get("recommended_action"),
        "explanation": analysis_data.get("explanation"),
        "raw_response": raw_response,
        "model_name": model_name
    }

    try:
        ai_res = client.table("ai_analysis").insert(ai_analysis_record).execute()
        created_ai_analysis = ai_res.data[0] if ai_res.data else ai_analysis_record
    except Exception as e:
        logger.warning(f"Error inserting ai_analysis record: {e}")
        created_ai_analysis = ai_analysis_record

    # 8. Insert Submitted Timeline Entry
    try:
        client.table("report_updates").insert({
            "report_id": report_id,
            "status": "Submitted",
            "message": "Your civic report was submitted successfully. CivicPulse AI is analyzing the issue.",
            "actor_id": auth_user_id,
        }).execute()
    except Exception as e:
        logger.warning(f"Error inserting submitted report_update: {e}")

    # 9. Insert AI Analyzed Timeline Entry (since Gemini analysis succeeded to get here)
    try:
        client.table("report_updates").insert({
            "report_id": report_id,
            "status": "AI Analyzed",
            "message": "CivicPulse AI completed multimodal diagnostic analysis, visual inspection, and civic impact scoring.",
            "actor_id": None,
        }).execute()
    except Exception as e:
        logger.warning(f"Error inserting ai_analyzed report_update: {e}")

    return {
        "success": True,
        "message": "Civic issue successfully analyzed and submitted",
        "case_number": case_number,
        "report": created_report,
        "ai_analysis": {
            **created_ai_analysis,
            "severity_label": analysis_data.get("severity"),
            "urgency_label": analysis_data.get("urgency"),
            "public_impact_label": analysis_data.get("public_impact"),
            "evidence_confidence_percent": f"{metrics_data['confidence_score']}%",
            "visual_findings": analysis_data.get("visual_findings"),
            "visual_severity": analysis_data.get("visual_severity"),
            "visual_confidence": analysis_data.get("visual_confidence"),
            "citizen_category_disagreement": ai_result.get("citizen_category_disagreement", False),
            "citizen_suggested_category": ai_result.get("citizen_suggested_category")
        },
        "metrics": metrics_data
    }


@router.get("")
async def list_reports(
    user_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50
):
    """
    List civic reports with real database query and filters.
    """
    client = get_supabase_client()
    query = client.table("reports").select("*, departments(name)").order("created_at", desc=True).limit(limit)

    if user_id:
        query = query.eq("user_id", user_id)
    if status_filter and status_filter.lower() != "all":
        query = query.eq("status", status_filter.lower())
    if category and category.lower() != "all":
        query = query.eq("category", category)
    if search:
        query = query.or_(f"title.ilike.%{search}%,case_number.ilike.%{search}%,address.ilike.%{search}%")

    res = query.execute()
    return {"success": True, "count": len(res.data), "reports": res.data}


@router.get("/{report_id}")
async def get_report_details(report_id: str):
    """
    Fetch comprehensive report details including AI analysis, department, and timeline updates.
    """
    client = get_supabase_client()
    try:
        report_res = client.table("reports").select("*, departments(name, description)").eq("id", report_id).execute()
        if not report_res.data:
            raise HTTPException(status_code=404, detail="Civic report not found")

        report = report_res.data[0]

        # Fetch AI analysis
        ai_res = client.table("ai_analysis").select("*, departments(name)").eq("report_id", report_id).execute()
        ai_analysis = ai_res.data[0] if ai_res.data else None

        # Fetch Updates
        updates_res = client.table("report_updates").select("*").eq("report_id", report_id).order("created_at", desc=False).execute()
        updates = updates_res.data if updates_res.data else []

        return {
            "success": True,
            "report": report,
            "ai_analysis": ai_analysis,
            "timeline": updates
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching report details: {e}")
        raise HTTPException(status_code=500, detail="Database query error")


# Valid status transitions for civic case lifecycle
VALID_STATUSES = ["submitted", "ai_analyzed", "assigned", "in_progress", "resolved"]

STATUS_DISPLAY = {
    "submitted": "Submitted",
    "ai_analyzed": "AI Analyzed",
    "assigned": "Department Assigned",
    "in_progress": "In Progress",
    "resolved": "Resolved",
}


class StatusUpdateRequest(BaseModel):
    status: str = Field(..., description="New status for the civic case")
    message: Optional[str] = Field(None, description="Optional update message for citizens")


@router.patch("/{report_id}/status", status_code=status.HTTP_200_OK)
async def update_report_status(
    report_id: str,
    payload: StatusUpdateRequest,
    authorization: Optional[str] = Header(None)
):
    """
    Phase 12: Update civic case status and append a lifecycle timeline entry.
    Validates status values strictly. Inserts into report_updates table.
    """
    new_status = payload.status.lower().strip()
    if new_status not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid status '{payload.status}'. Must be one of: {', '.join(VALID_STATUSES)}"
        )

    auth_user_id = get_current_user_id(authorization)
    client = get_supabase_client()

    # Verify report exists
    try:
        report_res = client.table("reports").select("id, case_number, status").eq("id", report_id).execute()
        if not report_res.data:
            raise HTTPException(status_code=404, detail="Civic report not found")
        report = report_res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Status update: report lookup failed: {e}")
        raise HTTPException(status_code=500, detail="Database error")

    # Update report status
    try:
        client.table("reports").update({"status": new_status}).eq("id", report_id).execute()
    except Exception as e:
        logger.error(f"Status update: report update failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to update report status")

    # Append timeline update record
    display_status = STATUS_DISPLAY.get(new_status, new_status.replace("_", " ").title())
    update_message = payload.message or f"Case status updated to: {display_status}."

    try:
        update_record = {
            "report_id": report_id,
            "status": display_status,
            "message": update_message,
            "actor_id": auth_user_id,
        }
        client.table("report_updates").insert(update_record).execute()
    except Exception as e:
        logger.warning(f"Status update: timeline insert failed: {e}")

    return {
        "success": True,
        "report_id": report_id,
        "case_number": report.get("case_number"),
        "previous_status": report.get("status"),
        "new_status": new_status,
        "display_status": display_status,
        "message": update_message,
    }


class DepartmentAssignRequest(BaseModel):
    department_id: str = Field(..., description="UUID of the department to assign")


@router.patch("/{report_id}/department", status_code=status.HTTP_200_OK)
async def assign_report_department(
    report_id: str,
    payload: DepartmentAssignRequest,
    authorization: Optional[str] = Header(None),
):
    """
    Phase 13: Admin assigns a civic department to a report.
    Updates reports.assigned_department_id and appends a timeline entry.
    """
    auth_user_id = get_current_user_id(authorization)
    client = get_supabase_client()

    # Verify report exists
    try:
        report_res = client.table("reports").select("id, case_number, status").eq("id", report_id).execute()
        if not report_res.data:
            raise HTTPException(status_code=404, detail="Civic report not found")
        report = report_res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Department assign: report lookup failed: {e}")
        raise HTTPException(status_code=500, detail="Database error")

    # Verify department exists
    try:
        dept_res = client.table("departments").select("id, name").eq("id", payload.department_id).execute()
        if not dept_res.data:
            raise HTTPException(status_code=404, detail="Department not found")
        dept_name = dept_res.data[0]["name"]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Department assign: dept lookup failed: {e}")
        raise HTTPException(status_code=500, detail="Database error")

    # Update report with assigned department
    try:
        client.table("reports").update({"recommended_department_id": payload.department_id}).eq("id", report_id).execute()
    except Exception as e:
        logger.error(f"Department assign: update failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to assign department")

    # Append timeline event
    try:
        client.table("report_updates").insert({
            "report_id": report_id,
            "status": "Department Assigned",
            "message": f"Case assigned to {dept_name} for resolution.",
            "actor_id": auth_user_id,
        }).execute()
    except Exception as e:
        logger.warning(f"Department assign: timeline insert failed: {e}")

    return {
        "success": True,
        "report_id": report_id,
        "case_number": report.get("case_number"),
        "assigned_department_id": payload.department_id,
        "assigned_department_name": dept_name,
    }
