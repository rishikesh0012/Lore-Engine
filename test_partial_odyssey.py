import asyncio
import os
import sys

base_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(base_dir, "backend"))

from app.extraction.relation_extractor import validate_and_normalize_relationships, process_source

def test_validation():
    print("Testing Validation and Normalization...")
    raw = [
        {"entity_a": " Zeus ", "relation_type": "PARENT_OF", "entity_b": " Apollo ", "confidence": 0.95},
        {"entity_a": "Zeus", "relation_type": "PARENT_OF", "entity_b": "zeus", "confidence": 0.9}, # Self-relation (should be rejected)
        {"entity_a": "Hera", "relation_type": "INVALID_REL", "entity_b": "Zeus"}, # Invalid type (should be rejected)
        {"entity_a": "Zeus", "relation_type": "PARENT_OF", "entity_b": "Apollo"}, # Duplicate (should be deduplicated)
    ]
    res = validate_and_normalize_relationships(raw, "test_doc", 100)
    assert len(res) == 1
    assert res[0]["entity_a"] == "Zeus"
    assert res[0]["entity_b"] == "Apollo"
    assert res[0]["relation_type"] == "PARENT_OF"
    print("Validation and Normalization Tests PASSED!\n")

async def test_partial_run():
    print("Running Partial Extraction Test on homer_odyssey (10 passages)...")
    await process_source("homer_odyssey", limit=10)
    print("Partial Extraction Test Finished!\n")

if __name__ == "__main__":
    test_validation()
    asyncio.run(test_partial_run())
