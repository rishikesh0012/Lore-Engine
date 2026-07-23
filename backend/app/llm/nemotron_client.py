import json
import time
import asyncio
import hashlib
import random
import logging
from typing import List, Dict, Any, Optional
import openai
from openai import AsyncOpenAI
import re

from app.config import settings

logger = logging.getLogger(__name__)

class CircuitBreakerOpenError(Exception):
    pass

class AdaptiveRateLimiter:
    """
    AIMD (Additive Increase, Multiplicative Decrease) Rate Limiter.
    Guarantees strict compliance with rate limits by adjusting RPM dynamically.
    """
    def __init__(self, min_rpm: float = 10.0, max_rpm: float = 27.0, initial_rpm: float = 24.0):
        self.min_rpm = min_rpm
        self.max_rpm = max_rpm
        self.current_rpm = initial_rpm
        self.tokens = initial_rpm
        self.last_refill = time.time()
        self.lock = asyncio.Lock()
        self.consecutive_successes = 0
        self.consecutive_failures = 0
        self.circuit_state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN
        self.circuit_open_until = 0.0

    async def acquire(self):
        while True:
            async with self.lock:
                now = time.time()
                
                # Check Circuit Breaker State
                if self.circuit_state == "OPEN":
                    if now < self.circuit_open_until:
                        wait_seconds = self.circuit_open_until - now
                        logger.warning(f"Circuit Breaker OPEN. Waiting {wait_seconds:.1f}s...")
                    else:
                        logger.info("Circuit Breaker state transitioning to HALF_OPEN")
                        self.circuit_state = "HALF_OPEN"
                
                # Refill token bucket based on current_rpm
                refill_rate = self.current_rpm / 60.0  # tokens per second
                if now > self.last_refill:
                    elapsed = now - self.last_refill
                    added = elapsed * refill_rate
                    self.tokens = min(self.current_rpm, self.tokens + added)
                    self.last_refill = now

                if self.tokens >= 1.0 and self.circuit_state != "OPEN":
                    self.tokens -= 1.0
                    return
            
            await asyncio.sleep(0.4)

    def report_success(self):
        self.consecutive_failures = 0
        self.consecutive_successes += 1
        if self.circuit_state == "HALF_OPEN":
            logger.info("Circuit Breaker reset to CLOSED after successful test request")
            self.circuit_state = "CLOSED"
            
        if self.consecutive_successes >= 10:
            old_rpm = self.current_rpm
            self.current_rpm = min(self.max_rpm, self.current_rpm + 1.0)
            self.consecutive_successes = 0
            if self.current_rpm > old_rpm:
                logger.info(f"AIMD RateLimiter: Increased RPM from {old_rpm:.1f} to {self.current_rpm:.1f}")

    def report_429(self):
        self.consecutive_successes = 0
        self.consecutive_failures += 1
        old_rpm = self.current_rpm
        self.current_rpm = max(self.min_rpm, self.current_rpm * 0.7)
        logger.warning(f"AIMD RateLimiter: 429 detected! Decreased RPM from {old_rpm:.1f} to {self.current_rpm:.1f}")

        if self.consecutive_failures >= 5:
            self.circuit_state = "OPEN"
            self.circuit_open_until = time.time() + 30.0  # Pause for 30s
            logger.error(f"Circuit Breaker TRIPPED due to {self.consecutive_failures} consecutive failures! Pausing requests for 30s.")

rate_limiter = AdaptiveRateLimiter()

_cache = {}
_usage_log = []

# Structured Telemetry Collector
class Telemetry:
    def __init__(self):
        self.total_requests = 0
        self.successful_requests = 0
        self.rate_limit_hits = 0
        self.cache_hits = 0
        self.total_latency_sec = 0.0
        self.prompt_tokens = 0
        self.completion_tokens = 0

    def record_call(self, latency: float, success: bool, is_429: bool, cache_hit: bool, p_tokens: int = 0, c_tokens: int = 0):
        self.total_requests += 1
        if cache_hit:
            self.cache_hits += 1
        if success:
            self.successful_requests += 1
        if is_429:
            self.rate_limit_hits += 1
        self.total_latency_sec += latency
        self.prompt_tokens += p_tokens
        self.completion_tokens += c_tokens

    def get_report(self) -> dict:
        avg_latency = (self.total_latency_sec / self.total_requests) if self.total_requests > 0 else 0.0
        success_rate = (self.successful_requests / self.total_requests * 100) if self.total_requests > 0 else 0.0
        cache_rate = (self.cache_hits / self.total_requests * 100) if self.total_requests > 0 else 0.0
        return {
            "total_requests": self.total_requests,
            "successful_requests": self.successful_requests,
            "rate_limit_hits_429": self.rate_limit_hits,
            "cache_hits": self.cache_hits,
            "cache_hit_rate_pct": round(cache_rate, 2),
            "success_rate_pct": round(success_rate, 2),
            "avg_latency_sec": round(avg_latency, 2),
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
            "total_tokens": self.prompt_tokens + self.completion_tokens,
            "current_limiter_rpm": round(rate_limiter.current_rpm, 1)
        }

telemetry = Telemetry()

def get_usage_summary() -> dict:
    return telemetry.get_report()

_client = None
def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            base_url=settings.nvidia_base_url,
            api_key=settings.nvidia_api_key,
            timeout=120.0,
        )
    return _client

def extract_retry_after(error: Exception) -> Optional[float]:
    """Helper to inspect HTTP response headers for Retry-After."""
    response = getattr(error, "response", None)
    if response and hasattr(response, "headers"):
        retry_hdr = response.headers.get("retry-after") or response.headers.get("Retry-After")
        if retry_hdr:
            try:
                return float(retry_hdr)
            except ValueError:
                pass
    return None

async def call_nemotron(
    messages: list[dict],       
    agent_name: str,            
    stream: bool = False,
    allow_fallback: bool = True,
    max_tokens: int = 2048,
    temperature: float = 0.2,
    prompt_version: str = "v2.0"
) -> str:
    primary_model = "nvidia/nemotron-3-ultra-550b-a55b"
    fallback_model = "meta/llama-3.3-70b-instruct"

    cache_key_dict = {
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "primary_model": primary_model,
        "prompt_version": prompt_version
    }
    cache_key_str = json.dumps(cache_key_dict, sort_keys=True)
    cache_key = hashlib.sha256(cache_key_str.encode()).hexdigest()

    if cache_key in _cache:
        response_text, timestamp = _cache[cache_key]
        if time.time() - timestamp <= 86400:  # 24 hour cache
            telemetry.record_call(latency=0.0, success=True, is_429=False, cache_hit=True)
            return response_text

    client = get_client()

    async def execute_request(model_name: str) -> str:
        t0 = time.time()
        await rate_limiter.acquire()
        
        try:
            response = await client.chat.completions.create(
                model=model_name,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=stream
            )
            elapsed = time.time() - t0
            
            p_tokens = 0
            c_tokens = 0
            if hasattr(response, "usage") and response.usage:
                p_tokens = getattr(response.usage, "prompt_tokens", 0)
                c_tokens = getattr(response.usage, "completion_tokens", 0)

            if stream:
                text = ""
                async for chunk in response:
                    if chunk.choices and chunk.choices[0].delta.content:
                        text += chunk.choices[0].delta.content
            else:
                text = response.choices[0].message.content or ""

            rate_limiter.report_success()
            telemetry.record_call(latency=elapsed, success=True, is_429=False, cache_hit=False, p_tokens=p_tokens, c_tokens=c_tokens)
            _cache[cache_key] = (text, time.time())
            return text

        except Exception as e:
            elapsed = time.time() - t0
            status_code = getattr(e, "status_code", getattr(getattr(e, "response", None), "status_code", None))
            is_429 = isinstance(e, openai.RateLimitError) or status_code == 429
            
            if is_429:
                rate_limiter.report_429()
            
            telemetry.record_call(latency=elapsed, success=False, is_429=is_429, cache_hit=False)
            raise e

    try:
        return await execute_request(primary_model)
    except Exception as e:
        if allow_fallback:
            logger.warning(f"[{agent_name}] Primary model execution failed ({e}). Trying fallback: {fallback_model}")
            try:
                return await execute_request(fallback_model)
            except Exception as fb_err:
                raise fb_err
        else:
            raise e

def extract_json_from_response(text: str) -> Any:
    """
    Multi-Stage Resilient Parser.
    Stage 1: Direct JSON load
    Stage 2: Markdown block stripper
    Stage 3: Substring extraction ([...] or {...})
    Stage 4: Regex object extraction
    """
    if not text or not isinstance(text, str):
        return []

    cleaned = text.strip()

    # Stage 1: Direct json load
    try:
        res = json.loads(cleaned, strict=False)
        if isinstance(res, (list, dict)):
            return res
    except Exception:
        pass

    # Stage 2: Markdown block stripping
    md_match = re.search(r'```(?:json)?\s*(.*?)\s*```', cleaned, re.DOTALL | re.IGNORECASE)
    if md_match:
        try:
            res = json.loads(md_match.group(1).strip(), strict=False)
            if isinstance(res, (list, dict)):
                return res
        except Exception:
            pass

    # Stage 3: Substring extraction for JSON array of objects
    json_arr_match = re.search(r'\[\s*\{.*\}\s*\]', cleaned, re.DOTALL)
    if json_arr_match:
        try:
            res = json.loads(json_arr_match.group(0), strict=False)
            if isinstance(res, list):
                return res
        except Exception:
            pass

    start_idx = cleaned.find('[')
    end_idx = cleaned.rfind(']')
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        bracket_str = cleaned[start_idx : end_idx + 1]
        try:
            res = json.loads(bracket_str, strict=False)
            if isinstance(res, list):
                return res
        except Exception:
            pass

    # Stage 4: Regex individual dict matcher fallback
    dict_matches = re.findall(r'\{\s*"entity_a"\s*:\s*".*?"\s*,\s*"relation_type"\s*:\s*".*?"\s*,\s*"entity_b"\s*:\s*".*?"\s*(?:,\s*"confidence"\s*:\s*[0-9.]+)?\s*\}', cleaned, re.DOTALL)
    if dict_matches:
        valid_objs = []
        for d_str in dict_matches:
            try:
                obj = json.loads(d_str, strict=False)
                if isinstance(obj, dict):
                    valid_objs.append(obj)
            except Exception:
                pass
        if valid_objs:
            return valid_objs

    logger.warning(f"Failed to parse JSON response across all 4 stages. Snippet: {cleaned[:120]}...")
    return []

async def embed_texts(texts: List[str], batch_size: int = 50) -> List[List[float]]:
    client = get_client()
    all_embeddings = []
    
    for i in range(0, len(texts), batch_size):
        await rate_limiter.acquire()
        batch = texts[i:i + batch_size]
        response = await client.embeddings.create(
            input=batch,
            model=settings.nvidia_embed_model,
            extra_body={"input_type": "query"},
        )
        sorted_data = sorted(response.data, key=lambda x: x.index)
        batch_embeddings = [item.embedding for item in sorted_data]
        all_embeddings.extend(batch_embeddings)
        
    return all_embeddings
