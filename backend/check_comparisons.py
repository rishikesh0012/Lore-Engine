import os
import sys
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(base_dir, "backend"))
from app.graph.comparison_rules import GraphComparison
import json

comp = GraphComparison()

print("\n--- OVERLAP ---")
overlap = comp.get_overlap()
print(f"Total overlap pairs found: {len(overlap)}")
for r in overlap:
    print(r)

print("\n--- CONFLICTS ---")
conflicts = comp.get_conflicts()
print(f"Total conflicts found: {len(conflicts)}")
for c in conflicts:
    print(c)

comp.close()
