FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Note: We rely on standard requirements.txt or we can just copy and run pip install
# Since we don't have a requirements.txt explicitly tracked, we'll install known deps:
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    openai \
    tenacity \
    qdrant-client \
    neo4j \
    spacy \
    tiktoken \
    python-dotenv \
    pydantic-settings

# Install the spacy models used by the entity extractor
RUN python -m spacy download en_core_web_sm
RUN python -m spacy download en_core_web_lg

# Copy project source
COPY . /app

# Set the pythonpath so backend absolute imports work
ENV PYTHONPATH=/app/backend

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
