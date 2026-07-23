import asyncio
import os
import sys

base_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(base_dir, "backend"))

from app.llm.nemotron_client import extract_json_from_response, rate_limiter, telemetry

def test_parser():
    print("Testing 4-Stage Parser...")
    
    # Test 1: Direct JSON
    raw1 = '[{"entity_a": "Zeus", "relation_type": "PARENT_OF", "entity_b": "Apollo"}]'
    res1 = extract_json_from_response(raw1)
    assert len(res1) == 1 and res1[0]["entity_a"] == "Zeus"
    print("  Stage 1 (Direct JSON): PASSED")

    # Test 2: Markdown block
    raw2 = '```json\n[{"entity_a": "Hera", "relation_type": "MARRIED_TO", "entity_b": "Zeus"}]\n```'
    res2 = extract_json_from_response(raw2)
    assert len(res2) == 1 and res2[0]["entity_a"] == "Hera"
    print("  Stage 2 (Markdown block): PASSED")

    # Test 3: Substring extraction with CoT preamble/postscript
    raw3 = 'Here is the analysis of the passage:\n\nBased on the text, we find:\n[{"entity_a": "Ares", "relation_type": "OPPOSES", "entity_b": "Athena"}]\nHope this helps!'
    res3 = extract_json_from_response(raw3)
    assert len(res3) == 1 and res3[0]["entity_a"] == "Ares"
    print("  Stage 3 (Substring extraction): PASSED")

    # Test 4: Regex individual dict matcher fallback
    raw4 = 'Thought 1: Ares opposes Athena {"entity_a": "Ares", "relation_type": "OPPOSES", "entity_b": "Athena"} and also Zeus parent {"entity_a": "Zeus", "relation_type": "PARENT_OF", "entity_b": "Hermes"}'
    res4 = extract_json_from_response(raw4)
    assert len(res4) == 2 and res4[1]["entity_b"] == "Hermes"
    print("  Stage 4 (Regex matcher fallback): PASSED")

    print("All Parser Tests PASSED!\n")

if __name__ == "__main__":
    test_parser()
