import sys
import os
import json
import spacy

base_dir = "/Users/irishe/Lore Engine"
os.chdir(base_dir)

nlp = spacy.load("en_core_web_sm", disable=["ner", "tagger", "lemmatizer", "attribute_ruler"])
nlp.max_length = 2_000_000

sources = ["hesiod_theogony", "homer_iliad", "homer_odyssey", "ovid_metamorphoses"]

passages_with = []
passages_without = []

for source in sources:
    with open(f"data/sources/{source}.txt", "r", encoding="utf-8") as f:
        text = f.read()
    
    doc = nlp(text)
    sents = list(doc.sents)
    
    with open(f"data/extracted/{source}_entities.json", "r", encoding="utf-8") as f:
        entities = json.load(f)
        
    sent_idx = 0
    entities.sort(key=lambda x: x["char_offset"])
    sent_entities = [[] for _ in sents]
    for ent in entities:
        while sent_idx < len(sents) and ent["char_offset"] >= sents[sent_idx].end_char:
            sent_idx += 1
        if sent_idx < len(sents):
            sent_entities[sent_idx].append(ent)
            
    passages = []
    for i in range(len(sents)):
        E_i = sent_entities[i]
        E_next = sent_entities[i+1] if i+1 < len(sents) else []
        pairs_to_check = set()
        for a_idx in range(len(E_i)):
            for b_idx in range(a_idx + 1, len(E_i)):
                if E_i[a_idx]["entity_text"] != E_i[b_idx]["entity_text"]:
                    pairs_to_check.add(tuple(sorted([E_i[a_idx]["entity_text"], E_i[b_idx]["entity_text"]])))
        for a in E_i:
            for b in E_next:
                if a["entity_text"] != b["entity_text"]:
                    pairs_to_check.add(tuple(sorted([a["entity_text"], b["entity_text"]])))
        if pairs_to_check:
            passage_text = sents[i].text.strip()
            if E_next:
                passage_text += " " + sents[i+1].text.strip()
            passages.append({
                "passage_text": passage_text.strip().replace('\n', ' '),
                "source_location": sents[i].start_char,
                "pairs": list(pairs_to_check)
            })

    # The original script limited it to 10 passages per source
    passages = passages[:10]
    
    # Check which passages have relationships
    rels_path = f"data/extracted/{source}_relationships.json"
    if os.path.exists(rels_path):
        with open(rels_path, "r", encoding="utf-8") as f:
            try:
                rels = json.load(f)
            except:
                rels = []
    else:
        rels = []
        
    rel_locations = set(r["source_location"] for r in rels)
    
    for p in passages:
        if p["source_location"] in rel_locations:
            rels_for_this = [r for r in rels if r["source_location"] == p["source_location"]]
            passages_with.append((p["passage_text"], rels_for_this, p["pairs"]))
        else:
            passages_without.append((p["passage_text"], p["pairs"]))

print("\n--- 5 PASSAGES THAT DID PRODUCE RELATIONSHIPS ---")
for pw in passages_with[:5]:
    print(f"PASSAGE: {pw[0]}")
    print(f"PAIRS ASKED: {pw[2]}")
    print(f"RELATIONSHIPS EXTRACTED:")
    for r in pw[1]:
        print(f"  {r['entity_a']} -[{r['relation_type']}]-> {r['entity_b']} (conf: {r['confidence']})")
    print("-" * 40)

print("\n--- 5 PASSAGES THAT DID NOT PRODUCE RELATIONSHIPS ---")
for pwo in passages_without[:5]:
    print(f"PASSAGE: {pwo[0]}")
    print(f"PAIRS ASKED: {pwo[1]}")
    print("-" * 40)
