# DealPulse AI - Next.js Frontend

Modern React/Next.js frontend for the DealPulse AI deal stage prediction application.

## Features

- 🎨 Beautiful, responsive UI with Tailwind CSS
- ⚡ Next.js with TypeScript for type safety
- 📊 Real-time dashboard with statistics
- 🎯 AI-powered deal stage predictions
- 📈 Pipeline overview and recent predictions table
- 🔌 Seamless integration with Python FastAPI backend

## Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- Python backend running on `http://127.0.0.1:8001`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` (already done, verify):
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8001
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page (dashboard)
│   └── globals.css         # Global styles
├── components/
│   ├── DashboardCard.tsx   # Statistics cards
│   ├── PredictionForm.tsx  # Prediction input form
│   ├── PredictionResult.tsx # Results display
│   ├── PipelineOverview.tsx # Pipeline visualization
│   └── RecentPredictions.tsx # Recent predictions table
├── lib/
│   └── api.ts              # API client
├── public/                 # Static files
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── postcss.config.js
```

## API Endpoints

The frontend communicates with the Python backend:

- `POST /predict` - Get deal stage prediction
- `GET /health` - Check backend health
- `GET /recent` - Fetch recent predictions
- `GET /stages` - Get available deal stages

## Building for Production

```bash
npm run build
npm run start
```

## Technology Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Notes

- Backend API URL is configured in `.env.local`
- All API calls are proxied through the Next.js frontend
- CORS is handled by the Python backend
