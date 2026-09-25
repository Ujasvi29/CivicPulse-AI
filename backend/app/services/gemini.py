import os
import json
import base64
import logging
from pathlib import Path
from typing import Optional, Literal, Dict, Any
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

# Explicit factor point mappings for deterministic Phase 10 Civic Impact Engine
SEVERITY_MAP = {"Low": 25, "Moderate": 50, "High": 75, "Critical": 100}
URGENCY_MAP = {"Low": 25, "Medium": 50, "High": 75, "Immediate": 100}
PUBLIC_IMPACT_MAP = {"Low": 25, "Moderate": 50, "High": 75, "Critical": 100}


class CivicAIAnalysis(BaseModel):
    """
    Strict Pydantic model validating all Phase 8 & Phase 9 Gemini Civic Intelligence output fields.
    """
    category: str = Field(..., description="Civic category matching official department domains")
    subcategory: str = Field(..., description="Specific sub-issue type e.g. Pothole, Streetlight, Garbage")
    summary: str = Field(..., description="Concise 1-2 sentence citizen-friendly problem summary")
    severity: Literal["Low", "Moderate", "High", "Critical"] = Field("Moderate", description="Physical & safety severity")
    urgency: Literal["Low", "Medium", "High", "Immediate"] = Field("Medium", description="Response urgency")
    public_impact: Literal["Low", "Moderate", "High", "Critical"] = Field("Moderate", description="Scale of public disruption")
    evidence_confidence: float = Field(0.8, ge=0.0, le=1.0, description="Confidence in provided textual/visual evidence")
    recommended_department: str = Field(..., description="Exact responsible municipal department")
    recommended_action: str = Field(..., description="Actionable recommended municipal next step")
    explanation: str = Field(..., description="Objective reasoning distinguishing observed evidence from inference")
    visual_findings: Optional[str] = Field("No photographic evidence provided. Diagnostic based on citizen description.", description="Specific physical defects visible in uploaded photograph")
    visual_severity: Optional[str] = Field("N/A", description="AI-estimated visual severity from photograph")
    visual_confidence: Optional[float] = Field(None, description="Visual evidence confidence score (0.0 to 1.0)")

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

    @field_validator("severity", mode="before")
    @classmethod
    def normalize_severity(cls, v: Any) -> str:
        if isinstance(v, str):
            v_title = v.capitalize()
            if v_title in SEVERITY_LEVELS:
                return v_title
        return "Moderate"

    @field_validator("urgency", mode="before")
    @classmethod
    def normalize_urgency(cls, v: Any) -> str:
        if isinstance(v, str):
            v_title = v.capitalize()
            if v_title in URGENCY_LEVELS:
                return v_title
            if v_title == "Moderate":
                return "Medium"
        return "Medium"

    @field_validator("public_impact", mode="before")
    @classmethod
    def normalize_impact(cls, v: Any) -> str:
        if isinstance(v, str):
            v_title = v.capitalize()
            if v_title in PUBLIC_IMPACT_LEVELS:
                return v_title
        return "Moderate"

    @field_validator("evidence_confidence", mode="before")
    @classmethod
    def normalize_confidence(cls, v: Any) -> float:
        try:
            val = float(v)
            if val > 1.0 and val <= 100.0:
                val = val / 100.0
            return max(0.0, min(1.0, val))
        except (ValueError, TypeError):
            return 0.7


def calculate_civic_impact_score(
    severity_label: str,
    urgency_label: str,
    impact_label: str,
    evidence_confidence: float,
    duration_days: int = 1
) -> Dict[str, Any]:
    """
    Phase 10: Deterministic, Explainable Civic Impact Engine.
    Formula:
      - Severity Factor (30% weight): Low=25, Moderate=50, High=75, Critical=100
      - Urgency Factor (30% weight): Low=25, Medium=50, High=75, Immediate=100
      - Public Impact Factor (25% weight): Low=25, Moderate=50, High=75, Critical=100
      - Duration Factor (5% weight): Base 10 for new reports, escalates up to 100 for older reports
      - Evidence Confidence Factor (10% weight): 0 to 100 based on AI evidence confidence

    Impact Levels:
      - CRITICAL: 75–100 -> priority: 'critical'
      - HIGH: 50–74 -> priority: 'high'
      - MODERATE: 25–49 -> priority: 'moderate'
      - LOW: 0–24 -> priority: 'low'
    """
    sev_score = SEVERITY_MAP.get(severity_label, 50)
    urg_score = URGENCY_MAP.get(urgency_label, 50)
    pub_score = PUBLIC_IMPACT_MAP.get(impact_label, 50)
    conf_score = max(0, min(100, int(evidence_confidence * 100)))

    # Duration factor calculation (minimal/neutral for new reports)
    dur_days = max(1, duration_days or 1)
    dur_score = min(100, 10 + (dur_days - 1) * 10)
    dur_label = "Newly reported (1 day)" if dur_days <= 1 else f"Unresolved ({dur_days} days)"

    # Weighted calculation
    raw_impact = (
        (sev_score * 0.30) +
        (urg_score * 0.30) +
        (pub_score * 0.25) +
        (dur_score * 0.05) +
        (conf_score * 0.10)
    )
    final_impact_score = max(0, min(100, round(raw_impact)))

    # Determine Impact Level & Priority
    if final_impact_score >= 75:
        impact_level = "CRITICAL"
        priority = "critical"
    elif final_impact_score >= 50:
        impact_level = "HIGH"
        priority = "high"
    elif final_impact_score >= 25:
        impact_level = "MODERATE"
        priority = "moderate"
    else:
        impact_level = "LOW"
        priority = "low"

    return {
        "impact_score": final_impact_score,
        "impact_level": impact_level,
        "priority": priority,
        "severity_score": sev_score,
        "severity_label": severity_label,
        "urgency_score": urg_score,
        "urgency_label": urgency_label,
        "public_impact_score": pub_score,
        "public_impact_label": impact_label,
        "duration_score": dur_score,
        "duration_label": dur_label,
        "confidence_score": conf_score,
        "confidence_label": f"{conf_score}% Confidence",
        "formula_explanation": "CivicPulse AI combines issue severity (30%), urgency (30%), public impact (25%), duration (5%), and evidence confidence (10%) to deterministically estimate civic impact."
    }


SYSTEM_INSTRUCTION = """You are CivicPulse AI, an intelligent civic issue analysis system.
Your mission is to objectively analyze citizen-reported municipal complaints and images, and produce structured civic intelligence.

RULES:
1. Focus strictly on the reported civic issue and visible physical municipal infrastructure.
2. Use the description as primary context.
3. Use the image as supporting visual evidence when available (multimodal analysis).
4. When an image is provided:
   - Identify visible infrastructure defects (potholes, cracks, waste piles, broken lamps, pipe bursts, waterlogging, etc.)
   - Set "visual_findings" to a clear description of what is physically visible in the photo.
   - Set "visual_severity" to "Low" | "Moderate" | "High" | "Critical".
   - Set "visual_confidence" to a float between 0.1 and 1.0.
   - If the photo is blurry, unrelated, or inconclusive, set visual_findings to "Visual evidence is inconclusive.", reduce visual_confidence (0.1-0.4), and explain why.
5. When NO image is provided:
   - Set "visual_findings" to "No photographic evidence provided. Diagnostic based on citizen description."
   - Set "visual_severity" to "N/A"
   - Set "visual_confidence" to null.
6. Do NOT invent facts that are not supported by the input.
7. Do NOT identify private individuals in images or infer sensitive personal characteristics.
8. Distinguish observed physical evidence from inference.
9. If description is vague/ambiguous, reduce evidence_confidence (0.1 to 0.5) and state this in the explanation.
10. Recommend the most appropriate municipal department from the allowed list:
   - "Roads & Infrastructure"
   - "Waste Management"
   - "Water & Drainage"
   - "Electricity & Public Lighting"
   - "Public Safety"
   - "Sanitation"
   - "General Civic Services"
11. Return ONLY a single, valid JSON object matching the schema. No markdown code blocks, no extra conversational text.

OUTPUT SCHEMA:
{
  "category": "Roads & Infrastructure" | "Waste Management" | "Water & Drainage" | "Electricity & Public Lighting" | "Public Safety" | "Sanitation" | "General Civic Services",
  "subcategory": "<Specific sub-issue type, e.g. Pothole / Streetlight Outage / Drainage Clog / Illegal Dump / Water Leakage>",
  "summary": "<Concise 1-2 sentence citizen-friendly problem summary>",
  "severity": "Low" | "Moderate" | "High" | "Critical",
  "urgency": "Low" | "Medium" | "High" | "Immediate",
  "public_impact": "Low" | "Moderate" | "High" | "Critical",
  "evidence_confidence": <number between 0.1 and 1.0>,
  "recommended_department": "<Must match the exact category name>",
  "recommended_action": "<1 concise actionable recommendation for municipal authorities>",
  "explanation": "<1-2 sentences explaining why this severity, urgency, and category were assessed, referencing specific evidence>",
  "visual_findings": "<Specific physical defects visible in photograph, or 'No photographic evidence provided.' or 'Visual evidence is inconclusive.'>",
  "visual_severity": "Low" | "Moderate" | "High" | "Critical" | "N/A",
  "visual_confidence": <float 0.1 to 1.0 or null>
}
"""


async def analyze_civic_report(
    title: str,
    description: str,
    location_address: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    category_hint: Optional[str] = None,
    image_base64: Optional[str] = None,
    image_mime_type: Optional[str] = "image/jpeg",
    duration_days: int = 1
) -> dict:
    """
    Main Civic Intelligence Engine (Phase 8, Phase 9, Phase 10):
    - Multimodal support: Text-only and Text+Image
    - Candidate model cascade with controlled retry
    - Strict Pydantic validation of diagnostic & visual fields
    - Deterministic Civic Impact Engine calculation
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.error("GEMINI_API_KEY is not configured")
        raise ValueError("AI analysis service is temporarily unavailable (Missing API configuration)")

    candidate_models = [
        os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite"),
        "gemini-flash-lite-latest",
        "gemini-3.1-flash-lite",
        "gemini-3.8-flash"
    ]

    has_image = bool(image_base64)
    user_text_parts = [
        f"Title: {title}",
        f"Description: {description}",
        f"Visual Evidence Attached: {'Yes (analyze uploaded image for physical damage/hazards)' if has_image else 'No (text description only)'}"
    ]
    if location_address:
        user_text_parts.append(f"Location / Address: {location_address}")
    if latitude is not None and longitude is not None:
        user_text_parts.append(f"Coordinates: Latitude {latitude}, Longitude {longitude}")
    if category_hint and category_hint != "Let AI determine category":
        user_text_parts.append(f"Citizen Suggested Category: {category_hint}")

    prompt_text = "\n".join(user_text_parts)
    parts = [{"text": prompt_text}]

    # Multimodal image attachment
    if has_image:
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
            for retry in range(2): # 1 initial + 1 controlled retry
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
                    elif resp.status_code == 429:
                        logger.warning(f"Rate limited on {model}, attempting next model/retry")
                        last_error = f"Rate limited (429) on {model}"
                        break
                    else:
                        logger.warning(f"Model {model} returned status {resp.status_code}")
                        last_error = f"Model {model} status {resp.status_code}"
                except Exception as e:
                    logger.warning(f"Model {model} attempt {retry+1} error: {e}")
                    last_error = str(e)

            if response_json:
                break

        if not response_json:
            raise ValueError(f"AI analysis could not complete: {last_error or 'No response from AI service'}")

    # Validate with Pydantic
    analysis = CivicAIAnalysis(**response_json)

    # Phase 10: Deterministic Civic Impact Calculation
    impact_metrics = calculate_civic_impact_score(
        severity_label=analysis.severity,
        urgency_label=analysis.urgency,
        impact_label=analysis.public_impact,
        evidence_confidence=analysis.evidence_confidence,
        duration_days=duration_days
    )

    # Check if citizen selected a category and if AI disagreed
    citizen_category_disagreement = False
    if category_hint and category_hint != "Let AI determine category":
        if category_hint.strip().lower() != analysis.category.strip().lower():
            citizen_category_disagreement = True

    return {
        "analysis": analysis.model_dump(),
        "metrics": impact_metrics,
        "has_image": has_image,
        "raw_response": raw_response,
        "model_name": used_model,
        "citizen_category_disagreement": citizen_category_disagreement,
        "citizen_suggested_category": category_hint if citizen_category_disagreement else None
    }


# Alias for backward compatibility
analyze_civic_issue = analyze_civic_report
