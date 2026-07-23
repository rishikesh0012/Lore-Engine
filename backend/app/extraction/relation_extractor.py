import os
import json
import spacy
import asyncio
import re
import time
import hashlib
import random
import logging
from typing import List, Dict, Tuple, Set, Any
from app.llm.nemotron_client import call_nemotron, extract_json_from_response, extract_retry_after, get_usage_summary

logger = logging.getLogger(__name__)

SYSTEM_MESSAGE = (
    "You are a strict JSON-only relation extraction engine. "
    "Your response MUST be ONLY a single raw JSON array containing valid relationship objects. "
    "DO NOT include markdown block markers (such as ```json), thinking, analysis, intro, or concluding text."
)

PROMPT_TEMPLATE = """Passage: "{passage_text}"

Entity pairs to check: {pairs_list}

For each pair where a relationship exists, output an object with EXACTLY these fields:
{{"entity_a": "<exact entity text>", "relation_type": "<one of: PARENT_OF, SIBLING_OF, MARRIED_TO, ALLIES_WITH, OPPOSES, CAUSED_BY, LED_TO, LOCATED_AT>", "entity_b": "<exact entity text>", "confidence": <float 0.0-1.0>}}

Only use the exact relation_type values listed above. If no relationship is stated or clearly implied for a pair, omit it from the array entirely.
Output ONLY the JSON array."""

VALID_RELATION_TYPES = {
    "PARENT_OF", "SIBLING_OF", "MARRIED_TO", "ALLIES_WITH", 
    "OPPOSES", "CAUSED_BY", "LED_TO", "LOCATED_AT"
}

nlp = spacy.load("en_core_web_sm", disable=["ner", "tagger", "lemmatizer", "attribute_ruler"])
nlp.max_length = 2_000_000

INVALID_RELATION_TYPES = set()

INVALID_ENTITIES = {
    "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself", "yourselves",
    "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself", "they", "them", "their",
    "theirs", "themselves", "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are",
    "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an",
    "the", "and", "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", "for", "with", "about",
    "against", "between", "into", "through", "during", "before", "after", "above", "below", "to", "from", "up",
    "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when",
    "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no",
    "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don",
    "should", "now", "thou", "thee", "thy", "thine", "ye", "art", "dost", "doth", "hast", "hath", "wilt", "shalt",
    "one", "two", "three", "first", "second", "third"
}

def compute_passage_hash(p: dict) -> str:
    h_str = f"{p['passage_text']}::{json.dumps(sorted(p['pairs']))}"
    return hashlib.sha256(h_str.encode()).hexdigest()

def is_valid_entity(name: str) -> bool:
    if not name or not isinstance(name, str):
        return False
    cleaned = name.strip().strip(".,;:!?\"'()")
    if len(cleaned) <= 1:
        return False
    if cleaned.lower() in INVALID_ENTITIES:
        return False
    return True

def normalize_entity_name(name: str) -> str:
    if not is_valid_entity(name):
        return ""
    return name.strip().strip(".,;:!?\"'()")

def validate_and_normalize_relationships(raw_rels: List[dict], source: str, passage_location: int) -> List[dict]:
    valid_rels = []
    seen = set()

    if not isinstance(raw_rels, list):
        return valid_rels

    for rel in raw_rels:
        if not isinstance(rel, dict):
            continue

        ent_a = normalize_entity_name(rel.get("entity_a", ""))
        ent_b = normalize_entity_name(rel.get("entity_b", ""))
        r_type = str(rel.get("relation_type", "")).strip()

        # Validation rules:
        # 1. Non-empty entity names
        if not ent_a or not ent_b:
            continue

        # 2. Self-relations rejected
        if ent_a.lower() == ent_b.lower():
            continue

        # 3. Valid relation type
        if r_type not in VALID_RELATION_TYPES:
            continue

        # 4. Confidence bounds
        try:
            conf = float(rel.get("confidence", 1.0))
            conf = max(0.0, min(1.0, conf))
        except (ValueError, TypeError):
            conf = 1.0

        # Deduplication within same passage
        dedup_key = (ent_a.lower(), r_type, ent_b.lower())
        if dedup_key in seen:
            continue
        seen.add(dedup_key)

        valid_rels.append({
            "entity_a": ent_a,
            "relation_type": r_type,
            "entity_b": ent_b,
            "confidence": conf,
            "source_document": source,
            "source_location": passage_location
        })

    return valid_rels

async def process_source(source: str, limit: int = None):
    print(f"\n==================================================")
    print(f" PROCESSING SOURCE: {source}")
    print(f"==================================================")

    src_file = f"data/sources/{source}.txt"
    ent_file = f"data/extracted/{source}_entities.json"
    checkpoint_file = f"data/extracted/.checkpoint_{source}.jsonl"
    dead_letter_file = f"data/extracted/.dead_letters_{source}.jsonl"
    out_file = f"data/extracted/{source}_relationships.json"

    if not os.path.exists(src_file) or not os.path.exists(ent_file):
        print(f"Skipping {source}: missing source or entity file.")
        return

    with open(src_file, "r", encoding="utf-8") as f:
        text = f.read()

    with open(ent_file, "r", encoding="utf-8") as f:
        entities = json.load(f)

    doc = nlp(text)
    sents = list(doc.sents)

    sent_idx = 0
    entities.sort(key=lambda x: x["char_offset"])
    sent_entities = [[] for _ in sents]

    for ent in entities:
        while sent_idx < len(sents) and ent["char_offset"] >= sents[sent_idx].end_char:
            sent_idx += 1
        if sent_idx < len(sents):
            sent_entities[sent_idx].append(ent)

    passages = []
    seen_prompts = set()
    total_deduped = 0

    for i in range(len(sents)):
        E_i = sent_entities[i]
        E_next = sent_entities[i+1] if i+1 < len(sents) else []

        pairs_to_check = set()

        # pairs in E_i
        for a_idx in range(len(E_i)):
            for b_idx in range(a_idx + 1, len(E_i)):
                ent_a = E_i[a_idx]["entity_text"]
                ent_b = E_i[b_idx]["entity_text"]
                if is_valid_entity(ent_a) and is_valid_entity(ent_b) and ent_a.lower() != ent_b.lower():
                    pairs_to_check.add(tuple(sorted([ent_a, ent_b])))

        # pairs between E_i and E_next
        for a in E_i:
            for b in E_next:
                ent_a = a["entity_text"]
                ent_b = b["entity_text"]
                if is_valid_entity(ent_a) and is_valid_entity(ent_b) and ent_a.lower() != ent_b.lower():
                    pairs_to_check.add(tuple(sorted([ent_a, ent_b])))

        # Requirement: Avoid sending passages with < 2 distinct entities or 0 pairs
        if len(pairs_to_check) >= 1:
            p_text = sents[i].text.strip()
            if E_next:
                p_text += " " + sents[i+1].text.strip()

            p_obj = {
                "passage_text": p_text.strip().replace('\n', ' '),
                "source_location": sents[i].start_char,
                "pairs": list(pairs_to_check)
            }
            p_hash = compute_passage_hash(p_obj)
            p_obj["hash"] = p_hash

            if p_hash in seen_prompts:
                total_deduped += 1
                continue
            seen_prompts.add(p_hash)
            passages.append(p_obj)

    # Apply testing limit if specified
    if limit is not None and limit > 0:
        passages = passages[:limit]

    # Load existing checkpoint state
    processed_hashes = set()
    checkpoint_relationships = []

    if os.path.exists(checkpoint_file):
        with open(checkpoint_file, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                try:
                    c_obj = json.loads(line)
                    processed_hashes.add(c_obj["passage_hash"])
                    checkpoint_relationships.extend(c_obj.get("relationships", []))
                except Exception:
                    pass
        print(f"Loaded checkpoint: {len(processed_hashes)} passages already processed.")

    remaining_passages = [p for p in passages if p["hash"] not in processed_hashes]

    print(f"Passage Stats for {source}:")
    print(f"  - Total Generated Passages: {len(passages)}")
    print(f"  - Deduplicated Passages: {total_deduped}")
    print(f"  - Already Checkpointed: {len(processed_hashes)}")
    print(f"  - Passages to Process: {len(remaining_passages)}")

    if not remaining_passages:
        print(f"All passages for {source} are fully processed!")
        # Consolidate checkpoint
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(checkpoint_relationships, f, indent=2, ensure_ascii=False)
        return

    # Work Queue and Delayed Retry Queue Setup
    work_queue = asyncio.Queue()
    for p in remaining_passages:
        work_queue.put_nowait((p, 0))  # (passage_data, attempt_count)

    delayed_queue: List[Tuple[float, dict, int]] = []
    checkpoint_lock = asyncio.Lock()
    all_extracted_rels = list(checkpoint_relationships)

    total_llm_attempts = 0
    parse_failures = 0
    dead_letters = 0
    processed_count = 0
    run_start_time = time.time()
    last_report_time = run_start_time

    # Background Dispatcher for Delayed Retries
    async def delayed_dispatcher():
        while not work_queue.empty() or delayed_queue:
            now = time.time()
            to_move = [item for item in delayed_queue if item[0] <= now]
            for item in to_move:
                delayed_queue.remove(item)
                _, p, attempt = item
                await work_queue.put((p, attempt))
            await asyncio.sleep(0.5)

    dispatcher_task = asyncio.create_task(delayed_dispatcher())

    # Worker Execution Loop (3 Concurrent Workers)
    async def worker(worker_id: int):
        nonlocal total_llm_attempts, parse_failures, dead_letters, processed_count, last_report_time

        while True:
            try:
                p, attempt = work_queue.get_nowait()
            except asyncio.QueueEmpty:
                if not delayed_queue:
                    break  # Done
                await asyncio.sleep(0.5)
                continue

            pairs_list_str = json.dumps([list(pair) for pair in p["pairs"]])
            prompt = PROMPT_TEMPLATE.replace("{passage_text}", p["passage_text"]).replace("{pairs_list}", pairs_list_str)
            messages = [
                {"role": "system", "content": SYSTEM_MESSAGE},
                {"role": "user", "content": prompt}
            ]

            total_llm_attempts += 1
            t_start = time.time()

            try:
                response_text = await call_nemotron(messages, agent_name="relation_extractor")
                raw_extracted = extract_json_from_response(response_text)

                if not raw_extracted and "[]" not in response_text:
                    parse_failures += 1

                valid_rels = validate_and_normalize_relationships(raw_extracted, source, p["source_location"])

                # Write Checkpoint Granularly
                async with checkpoint_lock:
                    all_extracted_rels.extend(valid_rels)
                    processed_count += 1
                    with open(checkpoint_file, "a", encoding="utf-8") as f:
                        f.write(json.dumps({
                            "passage_hash": p["hash"],
                            "relationships": valid_rels,
                            "timestamp": time.time()
                        }) + "\n")

                    now = time.time()
                    if (processed_count % 100 == 0) or (now - last_report_time >= 300.0):
                        last_report_time = now
                        elapsed = now - run_start_time
                        passages_per_sec = (processed_count / elapsed) if elapsed > 0 else 0.001
                        rem_passages = total_passages - (len(processed_hashes) + processed_count)
                        eta_sec = rem_passages / passages_per_sec if passages_per_sec > 0 else 0
                        eta_min = int(eta_sec // 60)
                        eta_rem_sec = int(eta_sec % 60)

                        usage = get_usage_summary()
                        print(f"\n--------------------------------------------------")
                        print(f" PROGRESS REPORT: {source}")
                        print(f"  - Passages Processed: {len(processed_hashes) + processed_count} / {total_passages} ({(len(processed_hashes) + processed_count)/total_passages*100:.1f}%)")
                        print(f"  - Extracted Relationships: {len(all_extracted_rels)}")
                        print(f"  - API Success Rate: {usage.get('success_rate_pct', 100.0)}%")
                        print(f"  - 429 Error Count: {usage.get('rate_limit_hits_429', 0)}")
                        print(f"  - Parse Failure Count: {parse_failures}")
                        print(f"  - Dead-Letter Count: {dead_letters}")
                        print(f"  - Adaptive RPM: {usage.get('current_limiter_rpm', 25.0):.1f}")
                        print(f"  - Avg Latency: {usage.get('avg_latency_sec', 0.0):.2f}s")
                        print(f"  - ETA to Completion: {eta_min}m {eta_rem_sec}s")
                        print(f"--------------------------------------------------\n")

                work_queue.task_done()

            except Exception as e:
                # Failure handling: NO WORKER SLEEPING!
                retry_after = extract_retry_after(e)
                if retry_after is None:
                    backoff = min(60.0, (2.0 ** attempt) + random.uniform(0.1, 1.5))
                else:
                    backoff = max(1.0, retry_after)

                if attempt + 1 < 3:
                    # Re-enqueue in delayed queue immediately
                    retry_at = time.time() + backoff
                    delayed_queue.append((retry_at, p, attempt + 1))
                    logger.warning(f"Worker {worker_id}: Request failed ({e}). Scheduled retry {attempt + 1}/3 in {backoff:.1f}s.")
                else:
                    dead_letters += 1
                    logger.error(f"Worker {worker_id}: Passage {p['hash'][:8]} failed max retries. Logging to dead letters.")
                    async with checkpoint_lock:
                        with open(dead_letter_file, "a", encoding="utf-8") as f:
                            f.write(json.dumps({"passage": p, "error": str(e), "timestamp": time.time()}) + "\n")

                work_queue.task_done()

    # Launch 3 Workers
    num_workers = 3
    workers = [asyncio.create_task(worker(i)) for i in range(num_workers)]
    await asyncio.gather(*workers)

    dispatcher_task.cancel()

    # Save Final Consolidated JSON File
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(all_extracted_rels, f, indent=2, ensure_ascii=False)

    # Comprehensive Telemetry & Verification Report
    usage = get_usage_summary()
    print(f"\n--- TELEMETRY REPORT FOR {source} ---")
    print(f"  - Total Relationships Extracted: {len(all_extracted_rels)}")
    print(f"  - Total LLM Attempted Calls: {total_llm_attempts}")
    print(f"  - Unparseable Responses: {parse_failures}")
    print(f"  - Dead Letter Passages: {dead_letters}")
    print(f"  - API Success Rate: {usage.get('success_rate_pct', 0)}%")
    print(f"  - Cache Hit Rate: {usage.get('cache_hit_rate_pct', 0)}%")
    print(f"  - 429 Rate Limit Hits: {usage.get('rate_limit_hits_429', 0)}")
    print(f"  - Final Rate Limiter RPM: {usage.get('current_limiter_rpm', 0)}")
    print(f"  - Total Tokens Consumed: {usage.get('total_tokens', 0)}")
    print(f"Consolidated relationships written to: {out_file}\n")

async def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    os.chdir(base_dir)
    os.makedirs("data/extracted", exist_ok=True)
    sources = [
        "hesiod_theogony",
        "homer_iliad",
        "homer_odyssey",
        "ovid_metamorphoses"
    ]
    for src in sources:
        await process_source(src)

if __name__ == "__main__":
    asyncio.run(main())
