from pydantic import BaseModel, Field
from typing import List, Dict, Any


class InteractionModel(BaseModel):
    type:        str
    date:        str
    subject:     str
    notes:       str
    duration:    int = None
    participant: str = None


class PredictRequest(BaseModel):
    deal_id:      str = Field(..., example="D001")
    crm_notes:    str = Field(..., example="Sent the proposal and pricing document to the client today.")
    user_id:      int = Field(1, example=1)  # ID of user creating the prediction
    client_name:  str = None
    deal_value:   float = 0.0
    industry:     str = None
    interactions: List[InteractionModel] = []



class UserResponse(BaseModel):
    id:        int
    username:  str
    role:      str
    full_name: str


class UserCreate(BaseModel):
    username:  str = Field(..., example="alice_rep")
    role:      str = Field(..., example="representative")
    full_name: str = Field(..., example="Alice Agent")



class StageConfidence(BaseModel):

    stage:      str
    confidence: float


class TopWord(BaseModel):          # ← ADDED: proper schema for top words
    word:  str
    score: float


class PredictResponse(BaseModel):
    deal_id:          str
    predicted_stage:  str
    confidence:       float
    all_scores:       Dict[str, float]  # Changed to Dict to match frontend type Record<string, number>
    top_words:        List[TopWord]



class HealthResponse(BaseModel):
    status:  str
    model:   str
    version: str