import os
import json
from datetime import datetime

sources = ["hesiod_theogony", "homer_iliad", "homer_odyssey", "ovid_metamorphoses"]
print("\n" + "="*50)
print("1. EXTRACTION PIPELINE STATUS")
print("="*50)

for s in sources:
    path = f"data/extracted/{s}_relationships.json"
    if os.path.exists(path):
        stat = os.stat(path)
        size = stat.st_size
        mtime = datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d %H:%M:%S')
        with open(path, 'r') as f:
            data = json.load(f)
        total = len(data)
        counts = {}
        for r in data:
            rt = r.get("relation_type", "UNKNOWN")
            counts[rt] = counts.get(rt, 0) + 1
        print(f"{s}: exists=True, size={size}B, modified={mtime}, total={total}")
        for rt, c in counts.items():
            print(f"  {rt}: {c}")
    else:
        print(f"{s}: exists=False")
