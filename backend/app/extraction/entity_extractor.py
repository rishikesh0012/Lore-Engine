import os
import json
import spacy
from spacy.pipeline import EntityRuler
from app.extraction.deity_aliases import get_canonical_id
from collections import defaultdict

# Ensure en_core_web_sm is loaded; it was verified installed in PROMPT 0 checks.
nlp = spacy.load("en_core_web_sm")
nlp.max_length = 2_000_000

ruler = nlp.add_pipe("entity_ruler", before="ner")
patterns = [
    {"label": "CHARACTER", "pattern": name} for name in [
        "Zeus", "Jupiter", "Jove", "Hera", "Juno", "Poseidon", "Neptune",
        "Aphrodite", "Venus", "Ares", "Mars", "Hermes", "Mercury",
        "Hades", "Pluto", "Dis", "Athena", "Athene", "Minerva",
        "Artemis", "Diana", "Demeter", "Ceres", "Cronus", "Cronos", "Saturn",
        "Rhea", "Ops", "Prometheus", "Typhoeus", "Typhon", "Gaia", "Gaea",
        "Uranus", "Achilles", "Odysseus", "Ulysses", "Penelope", "Hector",
        "Agamemnon", "Helen", "Paris", "Priam", "Daphne", "Apollo", "Phoebus",
        "Persephone", "Proserpina", "Dionysus", "Bacchus", "Hephaestus",
        "Vulcan", "Hestia", "Vesta", "Iapetus", "Atlas", "Oceanus"
    ]
]
ruler.add_patterns(patterns)
ENTITY_REGEXES = []

def extract_entities(text: str, source_document: str) -> list[dict]:
    # returns list of:
    # {"entity_text": str, "entity_type": "CHARACTER"|"LOCATION",
    #  "source_document": str, "char_offset": int, "sentence": str}
    doc = nlp(text)
    extracted = []
    
    for ent in doc.ents:
        if ent.label_ in ("PERSON", "CHARACTER"):
            norm_label = "CHARACTER"
        elif ent.label_ in ("GPE", "LOC"):
            norm_label = "LOCATION"
        else:
            continue
            
        ent_text = ent.text.strip().replace('\n', ' ')
        sentence = ent.sent.text.strip().replace('\n', ' ')
        canonical_id = get_canonical_id(ent_text)
        
        extracted.append({
            "entity_text": ent_text,
            "entity_type": norm_label,
            "source_document": source_document,
            "char_offset": ent.start_char,
            "sentence": sentence,
            "canonical_id": canonical_id
        })
        
    return extracted

def main():
    sources = [
        "hesiod_theogony",
        "homer_iliad",
        "homer_odyssey",
        "ovid_metamorphoses"
    ]
    
    # We output to data/extracted/ as specified
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    output_dir = os.path.join(base_dir, "data", "extracted")
    sources_dir = os.path.join(base_dir, "data", "sources")
    
    os.makedirs(output_dir, exist_ok=True)
    
    canonical_groups = defaultdict(set)
    
    for source in sources:
        filepath = os.path.join(sources_dir, f"{source}.txt")
        if not os.path.exists(filepath):
            print(f"Skipping {source}, file not found at {filepath}.")
            continue
            
        with open(filepath, "r", encoding="utf-8") as f:
            text = f.read()
            
        print(f"Processing {source} (Length: {len(text)} chars)...")
        entities = extract_entities(text, source)
        
        outpath = os.path.join(output_dir, f"{source}_entities.json")
        with open(outpath, "w", encoding="utf-8") as f:
            json.dump(entities, f, indent=2, ensure_ascii=False)
            
        for ent in entities:
            if ent.get("canonical_id"):
                canonical_groups[ent["canonical_id"]].add(ent["entity_text"])
                
        print(f"Total entities found in {source}: {len(entities)}")
        
        if source == "ovid_metamorphoses":
            # Verify Jupiter
            jupiter_ents = [e for e in entities if e["entity_text"] == "Jupiter"]
            if jupiter_ents:
                print(f"VERIFICATION for 'Jupiter' in ovid_metamorphoses.txt:")
                print(f"  First match: Extracted type is {jupiter_ents[0]['entity_type']} (from context: '{jupiter_ents[0]['sentence'][:60]}...')")
            else:
                print(f"VERIFICATION WARNING: 'Jupiter' not found in ovid_metamorphoses extraction.")
        print("-" * 50)
        
    print("\n--- VERIFICATION: Canonical ID Groups ---")
    for can_id, surface_forms in sorted(canonical_groups.items()):
        print(f"{can_id}: {', '.join(sorted(surface_forms))}")

if __name__ == "__main__":
    main()
