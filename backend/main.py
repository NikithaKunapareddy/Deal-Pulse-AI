from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List, Optional, Set
import json
import asyncio
from datetime import datetime, timedelta
import logging

from schemas import PredictRequest, PredictResponse, HealthResponse, UserResponse, UserCreate
from predictor import predictor
from database import init_db, get_connection, is_postgres

# ============================================================
# Logging
# ============================================================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================
# Real-time Streaming State
# ============================================================
class StreamManager:
    """Manages active SSE connections for real-time updates"""
    def __init__(self):
        self.active_connections: Set[asyncio.Queue] = set()
        self.event_queue = asyncio.Queue()
    
    async def broadcast(self, event: dict):
        """Broadcast event to all connected clients"""
        await self.event_queue.put(event)
        for queue in self.active_connections:
            try:
                await queue.put(event)
            except:
                pass
    
    async def stream_generator(self, client_queue: asyncio.Queue):
        """Generate SSE stream for a client"""
        try:
            while True:
                event = await asyncio.wait_for(client_queue.get(), timeout=30.0)
                yield f"data: {json.dumps(event)}\n\n"
        except asyncio.TimeoutError:
            yield f": heartbeat\n\n"
        except Exception as e:
            logger.error(f"Stream error: {e}")

stream_manager = StreamManager()

# ============================================================
# FastAPI Lifespan
# ============================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage app startup and shutdown"""
    logger.info("[startup] Starting DealPulse AI API...")
    init_db()
    logger.info("[startup] Database initialized successfully")
    yield
    logger.info("[shutdown] Shutting down DealPulse AI API...")

# ============================================================
# FastAPI App
# ============================================================
app = FastAPI(
    title="DealPulse AI",
    description="Smart Opportunity Stage Predictor with Real-time Monitoring",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# ============================================================
# Root & Health Endpoints
# ============================================================
@app.get("/")
async def root():
    return {
        "message": "Welcome to DealPulse AI API",
        "docs": "/docs",
        "version": "2.0.0"
    }

@app.get("/health", response_model=HealthResponse)
async def health():
    return {
        "status": "ok",
        "model": "distilbert-base-uncased",
        "version": "2.0.0"
    }

# ============================================================
# Users Endpoints
# ============================================================
@app.get("/users", response_model=List[UserResponse])
def get_users():
    """Get all users"""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        if is_postgres:
            cursor.execute("SELECT id, username, role, full_name FROM users ORDER BY id;")
        else:
            cursor.execute("SELECT id, username, role, full_name FROM users ORDER BY id;")
        
        rows = cursor.fetchall()
        users = []
        for r in rows:
            users.append({
                "id": r[0] if is_postgres else r["id"],
                "username": r[1] if is_postgres else r["username"],
                "role": r[2] if is_postgres else r["role"],
                "full_name": r[3] if is_postgres else r["full_name"],
            })
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.post("/users", response_model=UserResponse)
def create_user(request: UserCreate):
    """Create a new user"""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # Check if username exists
        if is_postgres:
            cursor.execute("SELECT id FROM users WHERE username = %s;", (request.username,))
        else:
            cursor.execute("SELECT id FROM users WHERE username = ?;", (request.username,))
        
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Username already in use")
        
        # Insert user
        if is_postgres:
            cursor.execute(
                "INSERT INTO users (username, role, full_name) VALUES (%s, %s, %s) RETURNING id;",
                (request.username, request.role, request.full_name)
            )
            user_id = cursor.fetchone()[0]
        else:
            cursor.execute(
                "INSERT INTO users (username, role, full_name) VALUES (?, ?, ?);",
                (request.username, request.role, request.full_name)
            )
            user_id = cursor.lastrowid
        
        conn.commit()
        return {
            "id": user_id,
            "username": request.username,
            "role": request.role,
            "full_name": request.full_name
        }
    except Exception as e:
        conn.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

# ============================================================
# Prediction Endpoints
# ============================================================
@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    """Make a prediction and store in database"""
    try:
        # ML prediction
        result = predictor.predict(request.deal_id, request.crm_notes)
        
        # Store in database
        conn = get_connection()
        cursor = conn.cursor()
        
        try:
            if is_postgres:
                cursor.execute(
                    """
                    INSERT INTO predictions 
                    (deal_id, client_name, deal_value, industry, predicted_stage, confidence,
                     all_scores, top_words, created_by_user_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id;
                    """,
                    (
                        request.deal_id,
                        request.client_name,
                        request.deal_value,
                        request.industry,
                        result["predicted_stage"],
                        result["confidence"],
                        json.dumps(result["all_scores"]),
                        json.dumps(result["top_words"]),
                        request.user_id
                    )
                )
                pred_id = cursor.fetchone()[0]
            else:
                cursor.execute(
                    """
                    INSERT INTO predictions 
                    (deal_id, client_name, deal_value, industry, predicted_stage, confidence,
                     all_scores, top_words, created_by_user_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
                    """,
                    (
                        request.deal_id,
                        request.client_name,
                        request.deal_value,
                        request.industry,
                        result["predicted_stage"],
                        result["confidence"],
                        json.dumps(result["all_scores"]),
                        json.dumps(result["top_words"]),
                        request.user_id
                    )
                )
                pred_id = cursor.lastrowid
            
            # Store interactions
            for inter in request.interactions:
                if is_postgres:
                    cursor.execute(
                        """INSERT INTO interactions 
                           (prediction_id, type, date, subject, notes, duration, participant)
                           VALUES (%s, %s, %s, %s, %s, %s, %s);""",
                        (pred_id, inter.type, inter.date, inter.subject, inter.notes, 
                         inter.duration, inter.participant)
                    )
                else:
                    cursor.execute(
                        """INSERT INTO interactions 
                           (prediction_id, type, date, subject, notes, duration, participant)
                           VALUES (?, ?, ?, ?, ?, ?, ?);""",
                        (pred_id, inter.type, inter.date, inter.subject, inter.notes, 
                         inter.duration, inter.participant)
                    )
            
            conn.commit()
            
            # Broadcast event to real-time subscribers
            event = {
                "type": "prediction_created",
                "prediction_id": pred_id,
                "deal_id": request.deal_id,
                "client_name": request.client_name,
                "predicted_stage": result["predicted_stage"],
                "confidence": result["confidence"],
                "user_id": request.user_id,
                "timestamp": datetime.now().isoformat()
            }
            await stream_manager.broadcast(event)
            
            result["id"] = pred_id
            return result
            
        finally:
            cursor.close()
            conn.close()
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/recent")
def get_recent(user_id: Optional[int] = None, agent_id: Optional[int] = None):
    """Get recent predictions"""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        query = """
            SELECT p.id, p.deal_id, p.client_name, p.deal_value, p.industry, 
                   p.predicted_stage, p.confidence, p.all_scores, p.top_words, 
                   p.timestamp, u.full_name as creator_name, u.role as creator_role, u.id as creator_id
            FROM predictions p
            LEFT JOIN users u ON p.created_by_user_id = u.id
            WHERE 1=1
        """
        params = []
        
        if user_id is not None:
            query += (" AND p.created_by_user_id = %s" if is_postgres else " AND p.created_by_user_id = ?")
            params.append(user_id)
        
        if agent_id is not None:
            query += (" AND p.created_by_user_id = %s" if is_postgres else " AND p.created_by_user_id = ?")
            params.append(agent_id)
        
        query += " ORDER BY p.timestamp DESC LIMIT 50;"
        
        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()
        
        predictions = []
        for r in rows:
            p_id = r[0] if is_postgres else r["id"]
            
            # Get interactions
            if is_postgres:
                cursor.execute(
                    "SELECT type, date, subject, notes, duration, participant FROM interactions WHERE prediction_id = %s ORDER BY id DESC;",
                    (p_id,)
                )
            else:
                cursor.execute(
                    "SELECT type, date, subject, notes, duration, participant FROM interactions WHERE prediction_id = ? ORDER BY id DESC;",
                    (p_id,)
                )
            
            int_rows = cursor.fetchall()
            interactions = [
                {
                    "type": ir[0] if is_postgres else ir["type"],
                    "date": ir[1] if is_postgres else ir["date"],
                    "subject": ir[2] if is_postgres else ir["subject"],
                    "notes": ir[3] if is_postgres else ir["notes"],
                    "duration": ir[4] if is_postgres else ir["duration"],
                    "participant": ir[5] if is_postgres else ir["participant"]
                }
                for ir in int_rows
            ]
            
            all_scores_raw = r[7] if is_postgres else r["all_scores"]
            top_words_raw = r[8] if is_postgres else r["top_words"]
            
            predictions.append({
                "id": p_id,
                "deal_id": r[1] if is_postgres else r["deal_id"],
                "predicted_stage": r[5] if is_postgres else r["predicted_stage"],
                "confidence": r[6] if is_postgres else r["confidence"],
                "all_scores": json.loads(all_scores_raw) if isinstance(all_scores_raw, str) else all_scores_raw,
                "top_words": json.loads(top_words_raw) if isinstance(top_words_raw, str) else top_words_raw,
                "timestamp": str(r[9] if is_postgres else r["timestamp"]),
                "creator": {
                    "id": r[12] if is_postgres else r["creator_id"],
                    "name": r[10] if is_postgres else r["creator_name"],
                    "role": r[11] if is_postgres else r["creator_role"]
                },
                "dealInfo": {
                    "dealId": r[1] if is_postgres else r["deal_id"],
                    "clientName": r[2] if is_postgres else r["client_name"],
                    "dealValue": r[3] if is_postgres else r["deal_value"],
                    "industry": r[4] if is_postgres else r["industry"]
                },
                "interactions": interactions
            })
        
        return {"predictions": predictions}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.get("/stages")
def get_stages():
    """Get available stages"""
    try:
        labels_path = Path("data/labels.json")
        with open(labels_path) as f:
            labels_data = json.load(f)
        return {
            "stages": [
                {"id": int(k), "name": v, "color": labels_data["colors"][v]}
                for k, v in labels_data["stages"].items()
            ]
        }
    except:
        return {
            "stages": [
                {"id": 0, "name": "Prospecting", "color": "#6366f1"},
                {"id": 1, "name": "Engaging", "color": "#f59e0b"},
                {"id": 2, "name": "Won", "color": "#10b981"},
                {"id": 3, "name": "Lost", "color": "#ef4444"}
            ]
        }

# ============================================================
# Real-time Streaming
# ============================================================
@app.get("/stream")
async def stream_predictions():
    """SSE endpoint for real-time prediction updates"""
    client_queue = asyncio.Queue()
    stream_manager.active_connections.add(client_queue)
    
    async def event_generator():
        try:
            # Send initial connection message
            yield f"data: {json.dumps({'type': 'connected'})}\n\n"
            
            # Stream events
            async for event in stream_manager.stream_generator(client_queue):
                yield event
        except Exception as e:
            logger.error(f"Stream error: {e}")
        finally:
            stream_manager.active_connections.discard(client_queue)
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")

# ============================================================
# Analytics Endpoints
# ============================================================
@app.get("/analytics")
def get_analytics():
    """Get dashboard analytics"""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # Total predictions and stage breakdown
        if is_postgres:
            cursor.execute("""
                SELECT predicted_stage, COUNT(*) as count
                FROM predictions
                GROUP BY predicted_stage;
            """)
        else:
            cursor.execute("""
                SELECT predicted_stage, COUNT(*) as count
                FROM predictions
                GROUP BY predicted_stage;
            """)
        
        stage_breakdown = {}
        for row in cursor.fetchall():
            stage = row[0] if is_postgres else row["predicted_stage"]
            count = row[1] if is_postgres else row["count"]
            stage_breakdown[stage] = count
        
        total_predictions = sum(stage_breakdown.values())
        
        # Win rate calculation
        won_count = stage_breakdown.get("Won", 0)
        total_finished = stage_breakdown.get("Won", 0) + stage_breakdown.get("Lost", 0)
        win_rate = (won_count / total_finished * 100) if total_finished > 0 else 0
        
        # Top performing representative
        if is_postgres:
            cursor.execute("""
                SELECT u.full_name, COUNT(p.id) as deal_count
                FROM predictions p
                LEFT JOIN users u ON p.created_by_user_id = u.id
                GROUP BY u.id, u.full_name
                ORDER BY deal_count DESC
                LIMIT 1;
            """)
        else:
            cursor.execute("""
                SELECT u.full_name, COUNT(p.id) as deal_count
                FROM predictions p
                LEFT JOIN users u ON p.created_by_user_id = u.id
                GROUP BY u.full_name
                ORDER BY deal_count DESC
                LIMIT 1;
            """)
        
        top_rep_row = cursor.fetchone()
        top_rep = {
            "name": top_rep_row[0] if is_postgres else top_rep_row["full_name"],
            "deals": top_rep_row[1] if is_postgres else top_rep_row["deal_count"]
        } if top_rep_row else {"name": "N/A", "deals": 0}
        
        # Average deal value
        if is_postgres:
            cursor.execute("SELECT AVG(deal_value) FROM predictions WHERE deal_value > 0;")
        else:
            cursor.execute("SELECT AVG(deal_value) FROM predictions WHERE deal_value > 0;")
        
        avg_deal = cursor.fetchone()[0] or 0
        
        # Total pipeline value
        if is_postgres:
            cursor.execute("SELECT SUM(deal_value) FROM predictions;")
        else:
            cursor.execute("SELECT SUM(deal_value) FROM predictions;")
        
        total_value = cursor.fetchone()[0] or 0
        
        # Predictions last 7 days
        seven_days_ago = datetime.now() - timedelta(days=7)
        if is_postgres:
            cursor.execute("""
                SELECT DATE(timestamp) as date, COUNT(*) as count
                FROM predictions
                WHERE timestamp >= %s
                GROUP BY DATE(timestamp)
                ORDER BY date ASC;
            """, (seven_days_ago,))
        else:
            cursor.execute("""
                SELECT DATE(timestamp) as date, COUNT(*) as count
                FROM predictions
                WHERE timestamp >= ?
                GROUP BY DATE(timestamp)
                ORDER BY date ASC;
            """, (seven_days_ago.date(),))
        
        predictions_by_day = []
        for row in cursor.fetchall():
            predictions_by_day.append({
                "date": str(row[0] if is_postgres else row["date"]),
                "count": row[1] if is_postgres else row["count"]
            })
        
        return {
            "total_predictions": total_predictions,
            "stage_breakdown": stage_breakdown,
            "win_rate": round(win_rate, 2),
            "top_performer": top_rep,
            "average_deal_value": round(avg_deal, 2),
            "total_pipeline_value": round(total_value, 2),
            "predictions_by_day": predictions_by_day
        }
    
    except Exception as e:
        logger.error(f"Analytics error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

# ============================================================
# Activity Feed
# ============================================================
@app.get("/activity-feed")
def get_activity_feed(limit: int = 20):
    """Get recent activity feed"""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        if is_postgres:
            cursor.execute("""
                SELECT p.id, p.deal_id, p.client_name, p.predicted_stage, p.confidence,
                       p.timestamp, u.full_name, u.username, p.deal_value
                FROM predictions p
                LEFT JOIN users u ON p.created_by_user_id = u.id
                ORDER BY p.timestamp DESC
                LIMIT %s;
            """, (limit,))
        else:
            cursor.execute("""
                SELECT p.id, p.deal_id, p.client_name, p.predicted_stage, p.confidence,
                       p.timestamp, u.full_name, u.username, p.deal_value
                FROM predictions p
                LEFT JOIN users u ON p.created_by_user_id = u.id
                ORDER BY p.timestamp DESC
                LIMIT ?;
            """, (limit,))
        
        activities = []
        stage_colors = {
            "Prospecting": "#6366f1",
            "Engaging": "#f59e0b",
            "Won": "#10b981",
            "Lost": "#ef4444"
        }
        
        for row in cursor.fetchall():
            activities.append({
                "id": row[0] if is_postgres else row["id"],
                "deal_id": row[1] if is_postgres else row["deal_id"],
                "client_name": row[2] if is_postgres else row["client_name"],
                "stage": row[3] if is_postgres else row["predicted_stage"],
                "stage_color": stage_colors.get(row[3] if is_postgres else row["predicted_stage"], "#6366f1"),
                "confidence": row[4] if is_postgres else row["confidence"],
                "timestamp": str(row[5] if is_postgres else row["timestamp"]),
                "creator_name": row[6] if is_postgres else row["full_name"],
                "creator_username": row[7] if is_postgres else row["username"],
                "deal_value": row[8] if is_postgres else row["deal_value"]
            })
        
        return {"activities": activities}
    
    except Exception as e:
        logger.error(f"Activity feed error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

# ============================================================
# Server Entry Point
# ============================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")

    