import asyncio
import os
import sys
import json
import random

base_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(base_dir, "backend"))

from app.extraction.relation_extractor import process_source

async def main():
    # Clear old test checkpoint
    cp_file = "data/extracted/.checkpoint_homer_odyssey.jsonl"
    if os.path.exists(cp_file):
        os.remove(cp_file)

    print("Running 100-passage extraction on Homer's Odyssey...")
    await process_source("homer_odyssey", limit=100)
    print("100-passage extraction completed!")

if __name__ == "__main__":
    asyncio.run(main())
