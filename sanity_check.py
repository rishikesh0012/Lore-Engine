import asyncio
from app.retrieval.ingest_vectors import embedder # just to make sure imports work
import os, json, spacy, re
from app.llm.nemotron_client import call_nemotron, extract_json_from_response
from app.extraction.relation_extractor import PROMPT_TEMPLATE, VALID_RELATION_TYPES

nlp = spacy.load("en_core_web_sm", disable=["ner", "tagger", "lemmatizer", "attribute_ruler"])
nlp.max_length = 2_000_000

async def main():
    source = "homer_iliad"
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
                ent_a, ent_b = E_i[a_idx]["entity_text"], E_i[b_idx]["entity_text"]
                if ent_a != ent_b: pairs_to_check.add(tuple(sorted([ent_a, ent_b])))
        for a in E_i:
            for b in E_next:
                ent_a, ent_b = a["entity_text"], b["entity_text"]
                if ent_a != ent_b: pairs_to_check.add(tuple(sorted([ent_a, ent_b])))
        if pairs_to_check:
            passage_text = sents[i].text.strip()
            if E_next: passage_text += " " + sents[i+1].text.strip()
            passages.append({
                "text": passage_text.replace('\n', ' '),
                "pairs": list(pairs_to_check)
            })

    passages = passages[:20]
    produced = []
    did_not = []
    
    for p in passages:
        pairs_list_str = json.dumps([list(pair) for pair in p["pairs"]])
        prompt = PROMPT_TEMPLATE.replace("{passage_text}", p["text"]).replace("{pairs_list}", pairs_list_str)
        messages = [{"role": "user", "content": prompt}]
        
        response_text = await call_nemotron(messages, agent_name="relation_extractor")
        extracted = extract_json_from_response(response_text)
        
        if not isinstance(extracted, list):
            start = response_text.find('[')
            end = response_text.rfind(']')
            if start != -1 and end != -1 and end > start:
                try: extracted = json.loads(response_text[start:end+1], strict=False)
                except:
                    match = re.search(r'\[\s*\{.*?\}\s*\]', response_text, re.DOTALL)
                    if match:
                        try: extracted = json.loads(match.group(0), strict=False)
                        except: pass
            if not isinstance(extracted, list) and '[]' in response_text:
                extracted = []
                
        valid_rels = []
        if isinstance(extracted, list):
            for rel in extracted:
                if isinstance(rel, dict) and rel.get("relation_type") in VALID_RELATION_TYPES:
                    valid_rels.append(rel)
                    
        if valid_rels:
            produced.append((p["text"], valid_rels))
        else:
            did_not.append((p["text"], extracted if isinstance(extracted, list) else "failed"))
            
    print(f"\n--- 5 PASSAGES THAT PRODUCED A RELATIONSHIP ---")
    for text, rels in produced[:5]:
        print(f"PASSAGE: {text}\nRELS: {rels}\n")
        
    print(f"\n--- 5 PASSAGES THAT DID NOT PRODUCE A RELATIONSHIP ---")
    for text, res in did_not[:5]:
        print(f"PASSAGE: {text}\nOUTPUT: {res}\n")

if __name__ == "__main__":
    asyncio.run(main())
