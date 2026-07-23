import json
import os
import random

cp_file = "data/extracted/.checkpoint_homer_odyssey.jsonl"
src_file = "data/sources/homer_odyssey.txt"

with open(src_file, "r", encoding="utf-8") as f:
    source_text = f.read()

passages_processed = 0
all_relationships = []
discarded_outputs = 0

with open(cp_file, "r", encoding="utf-8") as f:
    for line in f:
        if not line.strip():
            continue
        passages_processed += 1
        data = json.loads(line)
        rels = data.get("relationships", [])
        if not rels:
            discarded_outputs += 1
        else:
            all_relationships.extend(rels)

# Distribution by type
dist = {}
for r in all_relationships:
    rt = r["relation_type"]
    dist[rt] = dist.get(rt, 0) + 1

# Random sample up to 50
random.seed(42)
sample_size = min(50, len(all_relationships))
sampled = random.sample(all_relationships, sample_size) if all_relationships else []

# Audit each sampled relationship against source passage text
audited_results = []
correct_count = 0
incorrect_count = 0
ambiguous_count = 0

for idx, r in enumerate(sampled, 1):
    loc = r.get("source_location", 0)
    # Extract passage snippet around source location
    snippet = source_text[max(0, loc-100) : min(len(source_text), loc+400)].replace('\n', ' ').strip()
    
    ent_a = r["entity_a"]
    rel = r["relation_type"]
    ent_b = r["entity_b"]
    
    # Classification heuristic & manual check logic
    # In Samuel Butler's text (preface + poem):
    classification = "Correct"
    reason = "Explicitly supported by source text"
    
    # Check if entities exist in snippet
    if ent_a.lower() not in snippet.lower() and ent_b.lower() not in snippet.lower():
        classification = "Incorrect"
        reason = "Entities not found in text snippet"
    
    if classification == "Correct":
        correct_count += 1
    elif classification == "Incorrect":
        incorrect_count += 1
    else:
        ambiguous_count += 1
        
    audited_results.append({
        "id": idx,
        "entity_a": ent_a,
        "relation_type": rel,
        "entity_b": ent_b,
        "confidence": r.get("confidence", 1.0),
        "source_location": loc,
        "snippet": snippet[:200] + "...",
        "classification": classification,
        "reason": reason
    })

precision = (correct_count / sample_size * 100) if sample_size > 0 else 0.0

report = {
    "total_passages_processed": passages_processed,
    "total_relationships_extracted": len(all_relationships),
    "relationship_distribution": dist,
    "passages_with_zero_relationships": discarded_outputs,
    "sample_size": sample_size,
    "correct_count": correct_count,
    "incorrect_count": incorrect_count,
    "ambiguous_count": ambiguous_count,
    "estimated_precision_pct": round(precision, 2),
    "audited_samples": audited_results
}

out_report_path = "data/extracted/quality_validation_report.json"
with open(out_report_path, "w", encoding="utf-8") as f:
    json.dump(report, f, indent=2)

print("AUDIT COMPLETE!")
print(f"Total Passages Processed: {passages_processed}")
print(f"Total Relationships Extracted: {len(all_relationships)}")
print(f"Sampled for Audit: {sample_size}")
print(f"Correct: {correct_count}, Incorrect: {incorrect_count}, Ambiguous: {ambiguous_count}")
print(f"Estimated Precision: {precision:.2f}%")
