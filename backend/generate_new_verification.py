import os
import sys
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(base_dir, "backend"))
from app.graph.comparison_rules import GraphComparison
import json

comp = GraphComparison()

out_path = "/Users/irishe/.gemini/antigravity/brain/fec286d5-c402-4259-b377-5ebaf6adb97d/new_verification_results.md"

with open(out_path, "w") as f:
    f.write("# Updated Conflicts Verification Results\n\n")
    
    conflicts = comp.get_conflicts()
    f.write(f"**Total conflicts found:** {len(conflicts)}\n\n")
    
    f.write("| Entity | Relation | Confidence | Conflict Type | Source A | Target A | Source B | Target B |\n")
    f.write("|---|---|---|---|---|---|---|---|\n")
    for c in conflicts:
        f.write(f"| {c['entity']} | {c['relation']} | {c.get('confidence', 'N/A')} | {c['conflict_type']} | {c['source_a']} | {c['claim_a_target']} | {c['source_b']} | {c['claim_b_target']} |\n")

comp.close()
print(f"Artifact generated with {len(conflicts)} conflicts.")
