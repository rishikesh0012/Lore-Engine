import os
import sys
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(base_dir, "backend"))
from app.graph.comparison_rules import GraphComparison
import json

comp = GraphComparison()

out_path = "/Users/irishe/.gemini/antigravity/brain/fec286d5-c402-4259-b377-5ebaf6adb97d/verification_results.md"

with open(out_path, "w") as f:
    f.write("# Verification Results\n\n")
    
    # 1. Total counts
    with comp.driver.session() as session:
        f.write("## 1. Relationship Counts\n")
        f.write("```cypher\nMATCH ()-[r]->() RETURN type(r), count(*) ORDER BY count(*) DESC\n```\n\n")
        q1 = "MATCH ()-[r]->() RETURN type(r) AS rel_type, count(*) AS c ORDER BY c DESC"
        result1 = session.run(q1)
        for record in result1:
            f.write(f"- **{record['rel_type']}**: {record['c']}\n")
            
    f.write("\n## 2. Conflicts\n")
    conflicts = comp.get_conflicts()
    f.write(f"**Total conflicts found:** {len(conflicts)}\n\n")
    f.write("| Entity | Relation | Source A | Target A | Source B | Target B |\n")
    f.write("|---|---|---|---|---|---|\n")
    for c in conflicts:
        f.write(f"| {c['entity']} | {c['relation']} | {c['source_a']} | {c['claim_a_target']} | {c['source_b']} | {c['claim_b_target']} |\n")

    f.write("\n## 3. Overlap\n")
    overlap = comp.get_overlap()
    f.write(f"**Total overlaps found:** {len(overlap)}\n\n")
    f.write("| Entity | Relation | Target | Source A | Source B |\n")
    f.write("|---|---|---|---|---|\n")
    for o in overlap:
        f.write(f"| {o['entity']} | {o['relation']} | {o['target']} | {o['source_a']} | {o['source_b']} |\n")

comp.close()
print("Artifact generated.")
