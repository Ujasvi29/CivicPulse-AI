import os
import json
import base64
import logging
from pathlib import Path
from typing import Optional, Literal, Dict, Any
from pydantic import BaseModel, Field, field_validator, ValidationInfo
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
    """
    Strict Pydantic model validating all 10 core Gemini Civic Intelligence output fields.
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


def calculate_metrics(severity_label: str, urgency_label: str, impact_label: str, evidence_confidence: float) -> Dict[str, Any]:
    """
    Transparent deterministic priority & impact formula:
    Impact Score (0-100) = (Severity * 0.35) + (Urgency * 0.35) + (Public Impact * 0.20) + (Evidence Confidence * 0.10)
    Priority Rank:
      - Critical: Score >= 80
      - High: Score >= 60
      - Moderate: Score >= 35
      - Low: Score < 35
    """
    severity_val = SEVERITY_MAP.get(severity_label, 50)
    urgency_val = URGENCY_MAP.get(urgency_label, 50)
    public_impact_val = PUBLIC_IMPACT_MAP.get(impact_label, 50)
    confidence_val = max(0, min(100, int(evidence_confidence * 100)))

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


SYSTEM_INSTRUCTION = """You are CivicPulse AI, an intelligent civic issue analysis system.
Your mission is to objectively analyze citizen-reported municipal complaints and images, and produce structured civic intelligence.

RULES:
1. Focus strictly on the reported civic issue and visible physical municipal infrastructure.
2. Use the description as primary context.
3. Use the image as supporting visual evidence when available (multimodal analysis).
4. Do NOT invent facts that are not supported by the input.
5. Do NOT identify private individuals in images or infer sensitive personal characteristics.
6. Distinguish observed evidence from inference.
7. If visual evidence is unclear or description is vague/ambiguous, reduce evidence_confidence (0.1 to 0.5) and state this in the explanation.
8. If description is detailed and/or image clearly supports the issue, set higher evidence_confidence (0.7 to 0.95).
9. Recommend the most appropriate municipal department from the allowed list:
   - "Roads & Infrastructure"
   - "Waste Management"
   - "Water & Drainage"
   - "Electricity & Public Lighting"
   - "Public Safety"
   - "Sanitation"
   - "General Civic Services"
10. If the citizen suggested a category that contradicts actual evidence, independently choose the correct objective category.
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
  "explanation": "<1-2 sentences explaining why this severity, urgency, and category were assessed, referencing specific evidence>"
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
    image_mime_type: Optional[str] = "image/jpeg"
) -> dict:
    """
    Main Phase 8 Gemini Civic Intelligence Engine:
    - Multimodal support: Text-only and Text+Image
    - Candidate model cascade with controlled retry
    - Strict Pydantic validation of 10 diagnostic fields
    - Deterministic impact scoring & priority ranking
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

    user_text_parts = [
        f"Title: {title}",
        f"Description: {description}"
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
    if image_base64:
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

    # Compute impact scores and priority rank
    metrics = calculate_metrics(
        analysis.severity,
        analysis.urgency,
        analysis.public_impact,
        analysis.evidence_confidence
    )

    # Check if citizen selected a category and if AI disagreed
    citizen_category_disagreement = False
    if category_hint and category_hint != "Let AI determine category":
        if category_hint.strip().lower() != analysis.category.strip().lower():
            citizen_category_disagreement = True

    return {
        "analysis": analysis.model_dump(),
        "metrics": metrics,
        "raw_response": raw_response,
        "model_name": used_model,
        "citizen_category_disagreement": citizen_category_disagreement,
        "citizen_suggested_category": category_hint if citizen_category_disagreement else None
    }


# Alias for backward compatibility
analyze_civic_issue = analyze_civic_report
