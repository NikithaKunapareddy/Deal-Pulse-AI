# DealPulse AI 🚀

**Smart CRM Sales Pipeline Stage Predictor** — A full-stack AI application that uses NLP (DistilBERT / Logistic Regression) to predict the current deal stage based on CRM notes and interaction history.

---

## 🏗️ Architecture

```
dealpulseai-main/
├── backend/            ← Python FastAPI Backend (AI + Database)
│   ├── main.py          ← REST API (FastAPI)
│   ├── predictor.py     ← ML model inference (BERT / TF-IDF fallback)
│   ├── database.py      ← SQLite / Supabase PostgreSQL connector
│   ├── schemas.py       ← Pydantic request/response models
│   ├── train.py         ← Training script for fallback model
│   ├── .env             ← Environment variables (Supabase credentials)
│   └── data/
│       ├── labels.json  ← Stage definitions & colors
│       ├── dealpulse.db ← SQLite DB (auto-created if no Supabase)
│       └── models/      ← Trained model files
│
└── frontend/            ← Next.js Frontend (React + TypeScript + Tailwind)
    ├── app/page.tsx     ← Main dashboard page
    ├── components/      ← UI components
    ├── lib/api.ts       ← API client (axios)
    └── .env.local       ← Frontend env (API URL)
```

---

## ⚡ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, React, TypeScript, Tailwind CSS |
| **Backend** | FastAPI (Python), Uvicorn |
| **AI Model** | DistilBERT (primary) / TF-IDF + Logistic Regression (fallback) |
| **Database** | Supabase PostgreSQL (cloud) / SQLite (local fallback) |
| **NLP** | HuggingFace Transformers, scikit-learn |

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend   # go into the Python backend folder

# Install dependencies
pip install -r requirements.txt

# Configure environment (see Supabase section below)
# Edit .env and set your SUPABASE_CONN_STRING

# Start the backend server
python main.py
# → API runs at http://localhost:8001
# → Swagger docs at http://localhost:8001/docs
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
# → App runs at http://localhost:3000
```

---

## 🔧 Supabase Configuration (Real-time Cloud Database)

To use Supabase as the persistent cloud database (so multiple users share data in real-time):

### Step 1: Get your Database Password
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `btyuwjofencwzexukxbc`
3. Navigate to **Project Settings → Database**
4. Copy the **Connection string (URI)** — it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.btyuwjofencwzexukxbc.supabase.co:5432/postgres
   ```

### Step 2: Edit `backend/.env`
```env
SUPABASE_CONN_STRING=postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.btyuwjofencwzexukxbc.supabase.co:5432/postgres
```

### Step 3: Install PostgreSQL driver
```bash
pip install psycopg2-binary
```

### Step 4: Restart backend
The backend will auto-create tables and seed initial data on first run.

> **Without Supabase**: The app automatically falls back to a local SQLite database (`data/dealpulse.db`). All features work the same, but data is only stored locally.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `GET` | `/health` | Model & version info |
| `GET` | `/users` | List all CRM users |
| `POST` | `/users` | Register new CRM user |
| `POST` | `/predict` | Run AI prediction on CRM notes |
| `GET` | `/recent` | Get recent predictions (filterable by user/agent) |
| `GET` | `/stages` | Get pipeline stage definitions |

### Example: Make a Prediction
```bash
curl -X POST http://localhost:8001/predict \
  -H "Content-Type: application/json" \
  -d '{
    "deal_id": "DEAL-2024-001",
    "crm_notes": "Had a discovery call. Client very interested. Demo scheduled.",
    "user_id": 1,
    "client_name": "Tesla Corp",
    "deal_value": 95000,
    "industry": "Automotive",
    "interactions": [
      {
        "type": "call",
        "date": "2024-06-20",
        "subject": "Discovery Call",
        "notes": "Discussed requirements, very engaged.",
        "duration": 45,
        "participant": "Elon Musk"
      }
    ]
  }'
```

---

## 👥 Multi-User Architecture

The app supports two user roles:

| Role | Capabilities |
|------|-------------|
| **Sales Representative** | Log deals, run AI predictions, view own history |
| **Sales Manager** | View all reps' predictions, filter by agent, see team pipeline |

Users are stored in the database and can be registered directly from the UI.

---

## 🤖 AI Model Details

### Primary: DistilBERT
- Fine-tuned `distilbert-base-uncased` model
- Trained on CRM notes with 4-class classification
- Requires `data/models/best_model.pt`

### Fallback: TF-IDF + Logistic Regression
- Auto-trains on `data/processed/train.csv` if BERT model not available
- Saved to `data/models/fallback_model.pkl`
- Provides word-importance explainability

### Pipeline Stages
| Stage | Description |
|-------|-------------|
| 🔍 **Prospecting** | Initial contact, lead identified |
| 💬 **Engaging** | Actively engaging with client |
| 🎉 **Won** | Deal closed successfully |
| ❌ **Lost** | Deal lost or abandoned |

---

## 📦 Requirements

### Backend (`requirements.txt`)
```
fastapi
uvicorn
pydantic
transformers
torch
scikit-learn
pandas
numpy
psycopg2-binary   ← for Supabase
```

### Frontend (`package.json`)
- Next.js 14
- React 18
- Axios
- Lucide React (icons)
- Tailwind CSS

---

## 🎯 Features

- ✅ **Real-time AI predictions** from CRM notes text
- ✅ **Multi-user profiles** (representatives + managers)
- ✅ **Interaction timeline** (log emails, calls, meetings, notes)
- ✅ **Pipeline overview** with win rate analytics
- ✅ **AI explainability** — top contributing keywords shown
- ✅ **Manager dashboard** — filter by representative
- ✅ **Cloud-first database** — Supabase PostgreSQL with SQLite fallback
- ✅ **Dark mode UI** with glassmorphism design

---

*Built with ❤️ for CRM sales pipeline intelligence*
