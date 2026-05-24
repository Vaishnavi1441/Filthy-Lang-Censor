set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT/backend"

if [[ ! -d .venv ]]; then
  python -m venv .venv
  .venv/bin/pip install -r requirements.txt
fi

if [[ ! -f "$ROOT/.env" ]]; then
  echo "Missing $ROOT/.env - copy .env.example and add your ASSEMBLYAI_API_KEY"
  exit 1
fi

echo "Starting backend on http://127.0.0.1:8000"
exec .venv/bin/uvicorn main:app --reload --host 127.0.0.1 --port 8000