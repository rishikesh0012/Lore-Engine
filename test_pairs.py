import json, spacy

nlp = spacy.load("en_core_web_sm", disable=["ner", "tagger", "lemmatizer", "attribute_ruler"])
nlp.max_length = 2_000_000

for source in ["hesiod_theogony", "homer_iliad", "homer_odyssey", "ovid_metamorphoses"]:
    text = open(f"data/sources/{source}.txt").read()
    doc = nlp(text)
    sents = list(doc.sents)
    
    entities = json.load(open(f"data/extracted/{source}_entities.json"))
    
    # map entities to sentences
    sent_idx = 0
    ent_to_sent = []
    
    # sort entities by char_offset
    entities.sort(key=lambda x: x["char_offset"])
    
    e_idx = 0
    sent_entities = [set() for _ in sents]
    for ent in entities:
        while sent_idx < len(sents) and ent["char_offset"] >= sents[sent_idx].end_char:
            sent_idx += 1
        if sent_idx < len(sents):
            sent_entities[sent_idx].add(ent["entity_text"])
            
    total_pairs = 0
    total_passages = 0
    for i in range(len(sents)):
        E_i = list(sent_entities[i])
        E_next = list(sent_entities[i+1]) if i+1 < len(sents) else []
        
        pairs = []
        for a_idx in range(len(E_i)):
            for b_idx in range(a_idx + 1, len(E_i)):
                pairs.append((E_i[a_idx], E_i[b_idx]))
                
        for a in E_i:
            for b in E_next:
                if a != b:
                    pairs.append((a, b))
                    
        if pairs:
            total_pairs += len(pairs)
            total_passages += 1
            
    print(f"{source}: {total_passages} passages, {total_pairs} pairs")

