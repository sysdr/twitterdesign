from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
import uvicorn
import numpy as np
from typing import List, Dict, Optional
import pickle
import os
import redis
import json
import cv2
import io
from PIL import Image
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
import re

app = FastAPI(title="Content Moderation ML Service", version="1.0.0")

# Redis connection
redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

# Load ML models
class ModerationModels:
    def __init__(self):
        # Simple toxicity detection using keyword matching and ML
        self.toxic_keywords = [
            'hate', 'stupid', 'idiot', 'dumb', 'kill', 'die', 'suck', 'crap',
            'shit', 'fuck', 'damn', 'hell', 'bitch', 'asshole', 'retard'
        ]
        self.spam_detector = self._load_spam_model()
        
    def _load_spam_model(self):
        # Simplified spam detection model
        vectorizer = TfidfVectorizer(max_features=1000)
        classifier = MultinomialNB()
        
        # Mock training data
        spam_texts = [
            "Buy now!", "Free money!", "Click here!", "Limited offer!",
            "Make money fast!", "Get rich quick!", "Special deal!",
            "Act now!", "Don't miss out!", "Guaranteed results!"
        ]
        normal_texts = [
            "Hello friend", "How are you?", "Nice post", "Great content",
            "Thanks for sharing", "Interesting article", "Good morning",
            "Have a nice day", "See you later", "Take care"
        ]
        
        all_texts = spam_texts + normal_texts
        labels = [1] * len(spam_texts) + [0] * len(normal_texts)
        
        X = vectorizer.fit_transform(all_texts)
        classifier.fit(X, labels)
        
        return {'vectorizer': vectorizer, 'classifier': classifier}
    
    def detect_toxicity(self, text: str) -> Dict:
        """Simple toxicity detection using keyword matching"""
        text_lower = text.lower()
        toxic_count = sum(1 for word in self.toxic_keywords if word in text_lower)
        
        # Calculate confidence based on keyword density
        words = text.split()
        confidence = min(toxic_count / len(words) * 10, 1.0) if words else 0
        
        return {
            'is_toxic': toxic_count > 0,
            'confidence': confidence,
            'toxic_words_found': toxic_count
        }

models = ModerationModels()

class ContentRequest(BaseModel):
    text: str
    user_id: str
    post_id: str

class ModerationResult(BaseModel):
    post_id: str
    violations: List[Dict]
    overall_decision: str
    confidence: float

@app.post("/moderate/text", response_model=ModerationResult)
async def moderate_text(request: ContentRequest):
    """Moderate text content using multiple ML models"""
    
    results = []
    
    # Toxicity detection
    toxic_result = models.detect_toxicity(request.text)
    if toxic_result['is_toxic'] and toxic_result['confidence'] > 0.3:
        results.append({
            'type': 'toxicity',
            'confidence': toxic_result['confidence'],
            'severity': 'high' if toxic_result['confidence'] > 0.7 else 'medium'
        })
    
    # Spam detection
    text_vectorized = models.spam_detector['vectorizer'].transform([request.text])
    spam_prob = models.spam_detector['classifier'].predict_proba(text_vectorized)[0][1]
    
    if spam_prob > 0.6:
        results.append({
            'type': 'spam',
            'confidence': spam_prob,
            'severity': 'high' if spam_prob > 0.8 else 'medium'
        })
    
    # Overall decision logic
    if results:
        max_confidence = max([r['confidence'] for r in results])
        decision = 'reject' if max_confidence > 0.7 else 'review'
    else:
        max_confidence = 0.95
        decision = 'approve'
    
    # Cache result
    cache_key = f"moderation:{request.post_id}"
    redis_client.setex(cache_key, 3600, json.dumps({
        'decision': decision,
        'violations': results,
        'confidence': max_confidence
    }))
    
    return ModerationResult(
        post_id=request.post_id,
        violations=results,
        overall_decision=decision,
        confidence=max_confidence
    )

@app.post("/moderate/image")
async def moderate_image(file: UploadFile = File(...), post_id: str = ""):
    """Moderate image content"""
    
    # Read image
    image_data = await file.read()
    image = Image.open(io.BytesIO(image_data))
    
    # Convert to OpenCV format
    opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    
    # Simple inappropriate content detection (placeholder)
    # In production, use specialized models like NSFW detection
    height, width = opencv_image.shape[:2]
    
    # Mock decision based on image properties
    decision = 'approve'
    confidence = 0.95
    violations = []
    
    # Simulate some basic checks
    if width * height > 10000000:  # Very large image
        violations.append({
            'type': 'oversized',
            'confidence': 0.9,
            'severity': 'low'
        })
    
    return {
        'post_id': post_id,
        'violations': violations,
        'overall_decision': decision,
        'confidence': confidence
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "models_loaded": True}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
