import json, os, joblib

# Paths
MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../models"))
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT_DIR   = os.path.join(PROJECT_ROOT, "json")   # will create <project_root>/json

# Load trained artifacts
vectorizer = joblib.load(os.path.join(MODEL_DIR, "video_vectorizer.joblib"))
model      = joblib.load(os.path.join(MODEL_DIR, "video_classifier.joblib"))

# Ensure output directory exists
os.makedirs(OUT_DIR, exist_ok=True)

# 1) Export vocab.json (word → pure int)
vocab = { word: int(idx) for word, idx in vectorizer.vocabulary_.items() }
with open(os.path.join(OUT_DIR, "vocab.json"), "w", encoding="utf-8") as f:
    json.dump(vocab, f, ensure_ascii=False, indent=2)

# 2) Export model_params.json
payload = {
    "coef":      model.coef_[0].tolist(),       # list of Python floats
    "intercept": float(model.intercept_[0])     # pure Python float
}
with open(os.path.join(OUT_DIR, "model_params.json"), "w") as f:
    json.dump(payload, f, indent=2)

print("✅ Exported vocab.json and model_params.json to", OUT_DIR)
