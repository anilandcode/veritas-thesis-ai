# ==========================================
# STAGE 1: Builder (Install dependencies)
# ==========================================
FROM ghcr.io/astral-sh/uv:python3.10-alpine AS builder

# Set working directory inside builder
WORKDIR /app

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1

# Copy project specifications first (Leverage layer caching)
COPY pyproject.toml ./

# Install dependencies using uv into the virtual env (.venv)
RUN uv sync --no-dev --no-install-project

# ==========================================
# STAGE 2: Runtime (Ultra-lightweight final image)
# ==========================================
FROM python:3.10-slim AS runtime

# Set environment variables for safety & optimization
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/app/.venv/bin:$PATH"

# Set working directory inside runtime container
WORKDIR /app

# Copy the pre-built virtual env from builder stage
COPY --from=builder /app/.venv /app/.venv

# Copy only the application source code files
COPY app /app/app
COPY .env* /app/

# Expose FastAPI default port
EXPOSE 8000

# Run uvicorn pointing to the main app module
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
