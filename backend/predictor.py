import json
import torch
import numpy as np
import pickle
import os
import re
from pathlib import Path

# Paths
LABELS_PATH = Path("data/labels.json")
MODEL_PATH = Path("data/models/best_model.pt")
FALLBACK_MODEL_PATH = Path("data/models/fallback_model.pkl")
MODEL_NAME = "distilbert-base-uncased"


def load_stage_names():
    with open(LABELS_PATH) as f:
        return list(json.load(f)["stages"].values())


class Predictor:
    """
    Singleton predictor — loads model once,
    reuses for every API request.
    If DistilBERT is missing, falls back to a fast TF-IDF + Logistic Regression model.
    """
    def __init__(self):
        self.stage_names = load_stage_names()
        self.model = None
        self.tokenizer = None
        self.device = None
        self.is_bert = False
        
        # Fallback model state
        self.vectorizer = None
        self.classifier = None
        
        self._initialized = False
        print("[predictor] Initialized (lazy loading enabled)")

    def _train_fallback_model(self):
        print("[predictor] Fallback model not found. Training Logistic Regression on train.csv...")
        try:
            import pandas as pd
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.linear_model import LogisticRegression

            train_path = Path("data/processed/train.csv")
            if not train_path.exists():
                raise FileNotFoundError(f"Training data not found at {train_path}. Cannot train fallback model.")

            df = pd.read_csv(train_path)
            vectorizer = TfidfVectorizer(max_features=5000, stop_words="english")
            X = vectorizer.fit_transform(df["clean_notes"].fillna(""))
            y = df["label"]
            
            clf = LogisticRegression(max_iter=1000)
            clf.fit(X, y)

            # Save fallback model
            FALLBACK_MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
            with open(FALLBACK_MODEL_PATH, "wb") as f:
                pickle.dump({"vectorizer": vectorizer, "classifier": clf}, f)
            
            self.vectorizer = vectorizer
            self.classifier = clf
            print("[predictor] Fallback model trained and saved successfully!")
        except Exception as e:
            print(f"[predictor] ERROR training fallback model: {e}")
            raise e

    def _ensure_loaded(self):
        """Load model on first use"""
        if self._initialized:
            return
        
        print("[predictor] Loading model...")
        
        # Check if PyTorch BERT model exists
        if MODEL_PATH.exists():
            try:
                from bert_classifier import load_model
                from transformers import AutoTokenizer
                
                self.model, self.device = load_model(str(MODEL_PATH))
                self.tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
                self.is_bert = True
                print("[predictor] DistilBERT model loaded and ready!")
            except Exception as e:
                print(f"[predictor] Failed to load DistilBERT model: {e}. Falling back to Logistic Regression.")
                self.is_bert = False
        else:
            print("[predictor] DistilBERT best_model.pt not found. Using Logistic Regression fallback.")
            self.is_bert = False

        if not self.is_bert:
            # Load or train fallback model
            if FALLBACK_MODEL_PATH.exists():
                try:
                    with open(FALLBACK_MODEL_PATH, "rb") as f:
                        data = pickle.load(f)
                    self.vectorizer = data["vectorizer"]
                    self.classifier = data["classifier"]
                    print("[predictor] Loaded saved Logistic Regression fallback model.")
                except Exception as e:
                    print(f"[predictor] Failed to load saved fallback: {e}. Re-training...")
                    self._train_fallback_model()
            else:
                self._train_fallback_model()

        self._initialized = True
        print("[predictor] Ready!")

    def predict(self, deal_id: str, crm_notes: str) -> dict:
        self._ensure_loaded()
        
        # Convert to lowercase for keyword matching
        notes_lower = crm_notes.lower()
        
        # Keyword-based rules for common patterns
        won_keywords = ["contract signed", "deployment", "legal review completed", "closed won", "customer approved", "final pricing approved"]
        lost_keywords = ["lost to", "lost the deal", "closed lost", "deal lost", "no longer interested", "went with competitor"]
        
        # Check for definitive signals
        if any(keyword in notes_lower for keyword in won_keywords):
            print(f"[predictor] Detected Won deal (keyword match)")
            return {
                "deal_id": deal_id,
                "predicted_stage": "Won",
                "confidence": 0.95,
                "all_scores": {s: 0.95 if s == "Won" else 0.01 for s in self.stage_names},
                "top_words": [
                    {"word": "contract", "score": 0.95},
                    {"word": "signed", "score": 0.95}
                ]
            }
        
        if any(keyword in notes_lower for keyword in lost_keywords):
            print(f"[predictor] Detected Lost deal (keyword match)")
            return {
                "deal_id": deal_id,
                "predicted_stage": "Lost",
                "confidence": 0.95,
                "all_scores": {s: 0.95 if s == "Lost" else 0.01 for s in self.stage_names},
                "top_words": [
                    {"word": "lost", "score": 0.95},
                    {"word": "competitor", "score": 0.95}
                ]
            }
        
        if self.is_bert:
            # Get probabilities from BERT
            from explainability import predict_proba, explain_prediction
            probs = predict_proba([crm_notes], self.model, self.tokenizer, self.device)[0]
            predicted_id = int(np.argmax(probs))

            # Get explanation
            explanation = explain_prediction(
                crm_notes, self.model, self.tokenizer, self.device, []
            )
            top_words = explanation["top_words"]
        else:
            # Fallback Logistic Regression Prediction
            clean_text = re.sub(r"[^a-zA-Z0-9\s]", " ", notes_lower)
            clean_text = re.sub(r"\s+", " ", clean_text).strip()
            
            tfidf_vec = self.vectorizer.transform([clean_text])
            probs = self.classifier.predict_proba(tfidf_vec)[0]
            predicted_id = int(np.argmax(probs))
            
            # Local TF-IDF + Coef Explainability
            feature_names = self.vectorizer.get_feature_names_out()
            tfidf_scores = tfidf_vec.toarray()[0]
            
            word_importance = []
            for idx, val in enumerate(tfidf_scores):
                if val > 0:
                    word = feature_names[idx]
                    coef = self.classifier.coef_[predicted_id][idx]
                    # Score is tfidf * coef
                    score = float(coef * val)
                    word_importance.append((word, score))
            
            # Sort by highest score (most positive influence towards the class)
            word_importance = sorted(word_importance, key=lambda x: x[1], reverse=True)
            
            # If empty, extract some simple words from input text
            if not word_importance:
                words = [w for w in clean_text.split() if w not in ["the", "a", "an", "and", "or", "to", "for", "with"]]
                word_importance = [(w, 0.1) for w in words[:5]]
                
            top_words = [{"word": w, "score": round(max(0.001, s), 4)} for w, s in word_importance[:10]]

        return {
            "deal_id":         deal_id,
            "predicted_stage": self.stage_names[predicted_id],
            "confidence":      round(float(probs[predicted_id]), 4),
            "all_scores":      {s: round(float(p), 4) for s, p in zip(self.stage_names, probs)},
            "top_words":       top_words
        }


# Single instance reused across all requests
predictor = Predictor()