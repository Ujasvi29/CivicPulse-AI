import asyncio
import base64
import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from app.services.gemini import analyze_civic_report, calculate_civic_impact_score

# 1x1 valid transparent PNG base64 for synthetic image testing
SAMPLE_PNG_B64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

test_cases = [
    {
        "id": "TEST 1",
        "name": "Pothole Image + Road Damage Description",
        "title": "Large crater pothole on highway service lane",
        "desc": "A deep crater-like pothole has formed in the asphalt, causing vehicles to swerve dangerously.",
        "image": SAMPLE_PNG_B64,
        "expected_cat": "Roads & Infrastructure",
        "expect_image": True,
    },
    {
        "id": "TEST 2",
        "name": "Garbage Accumulation Image + Waste Description",
        "title": "Uncollected trash heaps blocking sidewalk",
        "desc": "Overflowing waste bins and piles of organic garbage creating health hazard near market.",
        "image": SAMPLE_PNG_B64,
        "expected_cat": "Waste Management",
        "expect_image": True,
    },
    {
        "id": "TEST 3",
        "name": "Broken Streetlight Image + Lighting Description",
        "title": "Broken street lamp post on avenue",
        "desc": "Streetlight fixture dangling with damaged lamp casing on 4th Main Road.",
        "image": SAMPLE_PNG_B64,
        "expected_cat": "Electricity & Public Lighting",
        "expect_image": True,
    },
    {
        "id": "TEST 4",
        "name": "Water / Drainage Image + Water Description",
        "title": "Ruptured water main flooding residential street",
        "desc": "Severe drinking water leakage flooding both lanes of the road for 5 hours.",
        "image": SAMPLE_PNG_B64,
        "expected_cat": "Water & Drainage",
        "expect_image": True,
    },
    {
        "id": "TEST 5",
        "name": "Text-Only Report (No Image)",
        "title": "Blocked drainage channel behind bus stop",
        "desc": "Open storm drain is clogged with leaves and plastic debris causing standing stagnant water.",
        "image": None,
        "expected_cat": "Water & Drainage",
        "expect_image": False,
    },
    {
        "id": "TEST 6",
        "name": "Ambiguous Report",
        "title": "Problem on the ground",
        "desc": "Something looks strange on the pavement.",
        "image": None,
        "expected_cat": None,
        "expect_image": False,
    },
    {
        "id": "TEST 7",
        "name": "Low-Severity Report",
        "title": "Small faded road marking near park",
        "desc": "White paint on zebra crossing is slightly faded but still legible.",
        "image": None,
        "expected_cat": "Roads & Infrastructure",
        "expect_image": False,
    },
    {
        "id": "TEST 8",
        "name": "High-Severity / Critical Emergency",
        "title": "Live high-voltage electrical cable fallen on school road",
        "desc": "High voltage wire snapped and sparking on flooded road right in front of primary school gate.",
        "image": SAMPLE_PNG_B64,
        "expected_cat": "Electricity & Public Lighting",
        "expect_image": True,
    },
]

async def run_suite():
    print("==================================================")
    print("CIVICPULSE AI — PHASE 9 & PHASE 10 TEST SUITE")
    print("Image Intelligence + Deterministic Civic Impact Engine")
    print("==================================================\n")

    passed_tests = 0

    for tc in test_cases:
        print(f"--> Executing {tc['id']}: {tc['name']}")
        try:
            res = await analyze_civic_report(
                title=tc["title"],
                description=tc["desc"],
                image_base64=tc["image"],
                image_mime_type="image/png" if tc["image"] else None
            )

            analysis = res["analysis"]
            metrics = res["metrics"]
            has_image = res["has_image"]

            print(f"    [AI Classification] Category: {analysis['category']} | Subcategory: {analysis['subcategory']}")
            print(f"    [Visual Evidence]   Findings: {analysis.get('visual_findings')}")
            print(f"    [Visual Severity]   {analysis.get('visual_severity')} (Confidence: {analysis.get('visual_confidence') or analysis.get('evidence_confidence')})")
            print(f"    [Impact Engine]     Score: {metrics['impact_score']}/100 | Level: {metrics['impact_level']} | Priority: {metrics['priority']}")
            print(f"    [Factors]           Sev: {metrics['severity_score']} ({metrics['severity_label']}), Urg: {metrics['urgency_score']} ({metrics['urgency_label']}), Pub: {metrics['public_impact_score']} ({metrics['public_impact_label']})")
            print(f"    [Action]            {analysis['recommended_action']}")

            # Assertions
            if tc["expected_cat"]:
                assert analysis["category"] == tc["expected_cat"], f"Category mismatch: expected {tc['expected_cat']}, got {analysis['category']}"

            if tc["id"] == "TEST 5":
                assert not has_image, "Test 5 should be text-only"
                assert "No photographic" in analysis.get("visual_findings", "") or analysis.get("visual_severity") == "N/A"

            if tc["id"] == "TEST 6":
                assert analysis["evidence_confidence"] <= 0.6, f"Ambiguous confidence should be low, got {analysis['evidence_confidence']}"

            if tc["id"] == "TEST 7":
                assert metrics["impact_score"] < 50, f"Low-severity impact score should be < 50, got {metrics['impact_score']}"

            if tc["id"] == "TEST 8":
                assert metrics["impact_score"] >= 75 or metrics["priority"] in ["critical", "high"], f"Critical report should have high impact, got {metrics['impact_score']}"

            print("    Status: PASS [OK]\n")
            passed_tests += 1
        except Exception as e:
            print(f"    Status: FAIL [ERROR: {e}]\n")

    print("==================================================")
    print(f"FINAL RESULT: {passed_tests}/{len(test_cases)} TESTS PASSED")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_suite())
