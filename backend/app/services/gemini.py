import os
import json
import base64
import logging
from pathlib import Path
from typing import Optional, Literal
from pydantic import BaseModel, Field, field_validator
import httpx
from dotenv import load_dotenv

# Ensure environment variables are loaded from root or backend directory
env_path = Path(__file__).resolve().parent.parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

logger = logging.getLogger("civicpulse.gemini")

ALLOWED_CATEGORIES = [
    "Roads & Infrastructure",
    "Waste Management",
    "Water & Drainage",
    "Electricity & Public Lighting",
    "Public Safety",
    "Sanitation",
    "General Civic Services"
]

SEVERITY_LEVELS = ["Low", "Moderate", "High", "Critical"]
URGENCY_LEVELS = ["Low", "Medium", "High", "Immediate"]
PUBLIC_IMPACT_LEVELS = ["Low", "Moderate", "High", "Critical"]

SEVERITY_MAP = {"Low": 25, "Moderate": 50, "High": 75, "Critical": 95}
URGENCY_MAP = {"Low": 25, "Medium": 50, "High": 75, "Immediate": 95}
PUBLIC_IMPACT_MAP = {"Low": 25, "Moderate": 50, "High": 75, "Critical": 95}


class CivicAIAnalysis(BaseModel):
    category: str = Field(..., description="Civic category")
    subcategory: str = Field(..., description="Specific sub-issue type")
    summary: str = Field(..., description="Concise citizen-facing problem summary")
    severity: Literal["Low", "Moderate", "High", "Critical"] = "Moderate"
    urgency: Literal["Low", "Medium", "High", "Immediate"] = "Medium"
    public_impact: Literal["Low", "Moderate", "High", "Critical"] = "Moderate"
    evidence_confidence: float = Field(0.8, ge=0.0, le=1.0, description="Evidence confidence score")
    recommended_department: str = Field(..., description="Department name responsible for resolution")
    recommended_action: str = Field(..., description="Concise suggested municipal action")
    explanation: str = Field(..., description="Reasoning for assessment and severity")

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        for cat in ALLOWED_CATEGORIES:
            if cat.lower() in v.lower() or v.lower() in cat.lower():
                return cat
        return "General Civic Services"

    @field_validator("recommended_department")
    @classmethod
    def validate_department(cls, v: str) -> str:
        for cat in ALLOWED_CATEGORIES:
            if cat.lower() in v.lower() or v.lower() in cat.lower():
                return cat
        return "General Civic Services"


def calculate_metrics(severity_label: str, urgency_label: str, impact_label: str, evidence_confidence: float):
    """
    Deterministically computes integer scores (0-100), overall impact score, and priority rank.
    """
    severity_val = SEVERITY_MAP.get(severity_label, 50)
    urgency_val = URGENCY_MAP.get(urgency_label, 50)
    public_impact_val = PUBLIC_IMPACT_MAP.get(impact_label, 50)
    confidence_val = max(0, min(100, int(evidence_confidence * 100)))

    # Transparent weighted impact score formula
    # Severity: 35%, Urgency: 35%, Public Impact: 20%, Evidence Confidence: 10%
    impact_score = round(
        (severity_val * 0.35) +
        (urgency_val * 0.35) +
        (public_impact_val * 0.20) +
        (confidence_val * 0.10)
    )
    impact_score = max(5, min(100, impact_score))

    if impact_score >= 80:
        priority = "critical"
    elif impact_score >= 60:
        priority = "high"
    elif impact_score >= 35:
        priority = "moderate"
    else:
        priority = "low"

    return {
        "severity_score": severity_val,
        "urgency_score": urgency_val,
        "public_impact_score": public_impact_val,
        "confidence_score": confidence_val,
        "impact_score": impact_score,
        "priority": priority
    }


SYSTEM_INSTRUCTION = """You are CivicPulse AI, an intelligent civic infrastructure diagnostic system.
Your mission is to objectively analyze citizen-reported municipal complaints and images.

Focus strictly on visible physical infrastructure, public hazards, sanitation, utilities, and municipal service issues.
Do NOT identify private individuals or facial features.
Output MUST be a single, valid JSON object with EXACTLY the following structure:
{
  "category": "Roads & Infrastructure" | "Waste Management" | "Water & Drainage" | "Electricity & Public Lighting" | "Public Safety" | "Sanitation" | "General Civic Services",
  "subcategory": "<Short subcategory, e.g. Pothole / Streetlight Outage / Drainage Clog / Illegal Dump>",
  "summary": "<1-2 sentence citizen-friendly summary of the problem>",
  "severity": "Low" | "Moderate" | "High" | "Critical",
  "urgency": "Low" | "Medium" | "High" | "Immediate",
  "public_impact": "Low" | "Moderate" | "High" | "Critical",
  "evidence_confidence": <number between 0.1 and 1.0 representing confidence in photographic and descriptive evidence>,
  "recommended_department": "<Must match the exact category name>",
  "recommended_action": "<1 sentence actionable recommendation for the municipality>",
  "explanation": "<1-2 sentences explaining why this severity, urgency, and category were assessed>"
}
"""


async def analyze_civic_issue(
    title: str,
    description: str,
    location_address: Optional[str] = None,
    category_hint: Optional[str] = None,
    image_base64: Optional[str] = None,
    image_mime_type: Optional[str] = "image/jpeg"
) -> dict:
    """
    Calls Google Gemini AI to analyze civic issue details and visual evidence.
    Returns validated structured analysis along with calculated scores.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.error("GEMINI_API_KEY is not configured")
        raise ValueError("AI analysis service is temporarily unavailable (Missing API configuration)")

    candidate_models = [
        os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite"),
        "gemini-3.8-flash",
        "gemini-3.1-flash-image",
        "gemini-flash-latest",
        "gemini-pro-latest"
    ]

    user_text_parts = [
        f"Title: {title}",
        f"Description: {description}"
    ]
    if location_address:
        user_text_parts.append(f"Location / Address: {location_address}")
    if category_hint and category_hint != "Let AI determine category":
        user_text_parts.append(f"Citizen Suggested Category: {category_hint}")

    prompt_text = "\n".join(user_text_parts)

    parts = [{"text": prompt_text}]

    # Multimodal image attachment
    if image_base64:
        # Strip header if present (e.g., data:image/png;base64,...)
        clean_base64 = image_base64
        if "," in clean_base64:
            clean_base64 = clean_base64.split(",", 1)[1]
        
        parts.append({
            "inline_data": {
                "mime_type": image_mime_type or "image/jpeg",
                "data": clean_base64
            }
        })

    payload = {
        "contents": [
            {
                "parts": parts
            }
        ],
        "systemInstruction": {
            "parts": [{"text": SYSTEM_INSTRUCTION}]
        },
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.2
        }
    }

    raw_response = None
    response_json = None
    used_model = candidate_models[0]

    async with httpx.AsyncClient(timeout=25.0) as client:
        last_error = None
        for model in candidate_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            try:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    raw_response = resp.json()
                    candidates = raw_response.get("candidates", [])
                    if candidates:
                        text_content = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        text_content = text_content.strip()
                        if text_content.startswith("```"):
                            lines = text_content.splitlines()
                            if lines[0].startswith("```"):
                                lines = lines[1:]
                            if lines and lines[-1].startswith("```"):
                                lines = lines[:-1]
                            text_content = "\n".join(lines).strip()

                        response_json = json.loads(text_content)
                        used_model = model
                        break
                else:
                    logger.warning(f"Model {model} returned status {resp.status_code}")
                    last_error = f"Model {model} status {resp.status_code}"
            except Exception as e:
                logger.warning(f"Model {model} failed: {e}")
                last_error = str(e)

        if not response_json:
            raise ValueError(f"AI analysis could not complete: {last_error or 'No response from AI service'}")

    # Validate with Pydantic
    analysis = CivicAIAnalysis(**response_json)

    # Compute impact scores and priority rank
    metrics = calculate_metrics(
        analysis.severity,
        analysis.urgency,
        analysis.public_impact,
        analysis.evidence_confidence
    )

    return {
        "analysis": analysis.model_dump(),
        "metrics": metrics,
        "raw_response": raw_response,
        "model_name": used_model
    }
