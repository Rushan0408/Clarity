import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os

# 1) Load data
df = pd.read_csv("ml/data/video_titles.csv", dtype=str)

# 2) Clean the label column: coerce non-ints to NaN, then fill with 0
df['label'] = pd.to_numeric(df['label'], errors='coerce').fillna(0).astype(int)

# 3) Prepare features/labels
X = df["title"].astype(str)
y = df["label"]

# 4) Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# 5) Vectorize
vectorizer = TfidfVectorizer(max_features=500, stop_words="english")
X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec  = vectorizer.transform(X_test)

# 6) Train
model = LogisticRegression(
    max_iter=1000,
    class_weight='balanced'
)

model.fit(X_train_vec, y_train)

# 7) Evaluate
y_pred = model.predict(X_test_vec)
print("Accuracy:", accuracy_score(y_test, y_pred))
print(classification_report(y_test, y_pred))

# 8) Save
os.makedirs("ml/models", exist_ok=True)
joblib.dump(vectorizer, "ml/models/video_vectorizer.joblib")
joblib.dump(model,      "ml/models/video_classifier.joblib")
print("Saved vectorizer and model to ml/models/")
