import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from app.services.gemini import analyze_civic_report

test_cases = [
    {
        "name": "Case 1 - Pothole / Damaged Road",
        "title": "Large pothole near residential road",
        "desc": "A large pothole has developed near the entrance of the residential road. Vehicles and two-wheelers are having difficulty passing through safely.",
        "expected_cat": "Roads & Infrastructure"
    },
    {
        "name": "Case 2 - Garbage Accumulation",
        "title": "Piles of uncollected garbage on corner",
        "desc": "Garbage bins have been overflowing for 4 days near the vegetable market attracting stray animals and creating foul odor.",
        "expected_cat": "Waste Management"
    },
    {
        "name": "Case 3 - Broken Streetlight",
        "title": "Streetlights not working on 5th cross",
        "desc": "Four consecutive streetlights on 5th Cross Road are completely dark for over a week causing safety concerns at night.",
        "expected_cat": "Electricity & Public Lighting"
    },
    {
        "name": "Case 4 - Water Leakage / Drainage",
        "title": "Underground water pipe bursting and flooding",
        "desc": "Drinking water pipeline ruptured under sidewalk, clean water flooding the street for the past 6 hours.",
        "expected_cat": "Water & Drainage"
    },
    {
        "name": "Case 5 - Ambiguous Description",
        "title": "Something looks bad here",
        "desc": "There is some strange thing on the sidewalk that looks messy.",
        "expected_cat": None
    }
]

async def run_suite():
    print("========================================")
    print("CIVICPULSE AI - GEMINI ENGINE TEST SUITE")
    print("========================================\n")
    
    passed_count = 0
    for tc in test_cases:
        print(f"--> Testing {tc['name']}")
        try:
            res = await analyze_civic_report(title=tc["title"], description=tc["desc"])
            a = res["analysis"]
            m = res["metrics"]
            
            print(f"    Category: {a['category']}")
            print(f"    Subcategory: {a['subcategory']}")
            print(f"    Severity: {a['severity']} | Urgency: {a['urgency']} | Public Impact: {a['public_impact']}")
            print(f"    Confidence: {a['evidence_confidence']} (Impact Score: {m['impact_score']}, Priority: {m['priority']})")
            print(f"    Department: {a['recommended_department']}")
            print(f"    Action: {a['recommended_action']}")
            print(f"    Summary: {a['summary']}")
            print(f"    Explanation: {a['explanation']}")
            
            if tc["expected_cat"]:
                assert a["category"] == tc["expected_cat"], f"Category mismatch: expected {tc['expected_cat']}, got {a['category']}"
            else:
                # Case 5 ambiguous: confidence should be lower
                assert a["evidence_confidence"] <= 0.7, f"Ambiguous case confidence should be low, got {a['evidence_confidence']}"
            
            print("    Status: PASS [OK]\n")
            passed_count += 1
        except Exception as e:
            print(f"    Status: FAIL [ERROR: {e}]\n")

    print("========================================")
    print(f"RESULTS: {passed_count}/{len(test_cases)} PASSED")
    print("========================================")

if __name__ == "__main__":
    asyncio.run(run_suite())
