<div align="center">

<h1>
  <img src="public/echoscribe-logo.svg" alt="EchoScribe logo" width="28" />
  EchoScribe
</h1>

Audio transcription workspace — record or upload audio and get clean transcripts using OpenAI Whisper (cloud) or a local Whisper model running entirely on your machine.

**No accounts. No data leaves your machine when using local mode.**

<p>
<a href="https://www.linkedin.com/in/sahar-mor/" target="_blank"><img src="https://img.shields.io/badge/LinkedIn-Connect-blue" alt="LinkedIn"></a>
<a href="https://x.com/theaievangelist" target="_blank"><img src="https://img.shields.io/twitter/follow/theaievangelist" alt="X"></a>
<a href="http://aitidbits.ai/" target="_blank"><img src="https://img.shields.io/badge/AI%20Tidbits-Stay%20updated%20on%20AI-yellow" alt="Stay updated on AI"></a>
</p>

<br/>

<img width="900" src="public/preview.png" alt="EchoScribe preview" style="border-radius: 12px;" />

</div>

## Features

- **Dual transcription engines** -- switch between OpenAI Whisper (fast, cloud-based) and local Whisper (offline, private) with a single click.
- **Live recording** -- capture audio directly from your microphone with Safari/Chrome/Firefox support.
- **Batch processing** -- drop multiple files at once and transcribe them sequentially.
- **Timestamped segments** -- local Whisper returns per-segment timing you can browse in a timeline view.
- **Prompt guidance** -- pass context (names, topics) to improve transcription accuracy.
- **Copy & review** -- view full transcripts in a modal, copy to clipboard with one click.

## Tech stack

| Layer    | Tech |
|----------|------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Radix UI |
| Backend  | Python, FastAPI, Pydantic, stable-ts (local Whisper), OpenAI SDK |
| Audio    | pydub + ffmpeg for format conversion |

## Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **ffmpeg** on your `PATH` (required by pydub for audio conversion)
  ```bash
  # macOS
  brew install ffmpeg

  # Ubuntu / Debian
  sudo apt install ffmpeg
  ```
- An **OpenAI API key** if you want to use the cloud Whisper model.

## Quick start

```bash
# 1. Clone the repo
git clone https://github.com/saharmor/EchoScribe.git
cd EchoScribe

# 2. Configure the backend
cp backend/.env.example backend/.env
#    Edit backend/.env and add your OPENAI_API_KEY

# 3. Start everything (installs deps on first run)
chmod +x start_echo_scribe.sh
./start_echo_scribe.sh
```

The script will:
- Create a Python virtual environment in `backend/venv` and install pip dependencies (first run only).
- Install frontend npm packages (first run only).
- Start the FastAPI backend on **http://localhost:9090**.
- Start the Vite dev server on **http://localhost:8282**.

### Custom ports

```bash
BACKEND_PORT=4000 FRONTEND_PORT=3000 ./start_echo_scribe.sh
```

## Project structure

```
EchoScribe/
├── backend/
│   ├── main.py              # FastAPI app -- /api/transcribe, /api/save-recording
│   ├── utils.py              # Audio loading and format conversion helpers
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Template for secrets
├── frontend/
│   ├── src/
│   │   ├── pages/index.tsx           # Main transcription page
│   │   ├── components/               # UI components
│   │   ├── hooks/                    # useTranscriptionWorkflow
│   │   ├── lib/                      # API client, utilities
│   │   └── types/                    # Shared TypeScript types
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── tsconfig.json
├── start_echo_scribe.sh      # One-command launcher for both services
├── LICENSE
└── README.md
```

## Development

### Frontend only

```bash
cd frontend
npm install
npm run dev
```

Available scripts:

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type checking |

### Backend only

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 9090 --reload
```

API docs are available at **http://localhost:9090/docs** when the backend is running.

## License

MIT -- see [LICENSE](LICENSE).
