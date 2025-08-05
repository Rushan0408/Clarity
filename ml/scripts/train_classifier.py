import pandas as pd
from sklearn.model_selection import train_test_split, GridSearchCV  # ⇧ INSERTED ⇧
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix  # ⇧ INSERTED ⇧
from sklearn.utils import resample                                          # ⇧ INSERTED ⇧
import joblib
import os

# 1) Load data
df = pd.read_csv("ml/data/video_titles_final.csv", dtype=str)

# 2) Clean the label column
df['label'] = pd.to_numeric(df['label'], errors='coerce').fillna(0).astype(int)

# ⇧ INSERTED ⇧ ────────────────────────────────────────────────────────────────────
# Oversample the positive (label=1) class to match the negatives
df_pos = df[df.label == 1]
df_neg = df[df.label == 0]
df_pos_up = resample(df_pos, replace=True, n_samples=len(df_neg), random_state=42)
df = pd.concat([df_neg, df_pos_up]).sample(frac=1, random_state=42).reset_index(drop=True)
# ⇧ END INSERTION ⇧ ─────────────────────────────────────────────────────────────

# 3) Prepare features/labels
X = df["title"].astype(str)
y = df["label"]

# 4) Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# ⇧ INSERTED ⇧ ────────────────────────────────────────────────────────────────────
# 5) Enriched TF-IDF (unigrams + bigrams, larger vocab, drop rare tokens)
vectorizer = TfidfVectorizer(
    max_features=1000,
    stop_words="english",
    ngram_range=(1,2),
    min_df=2
)
# ⇧ END INSERTION ⇧ ─────────────────────────────────────────────────────────────

# 6) Vectorize
X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec  = vectorizer.transform(X_test)

# ⇧ INSERTED ⇧ ────────────────────────────────────────────────────────────────────
# 7) Grid-search class-weighted logistic regression
base_clf = LogisticRegression(class_weight="balanced", max_iter=1000)
param_grid = {"C": [0.01, 0.1, 1, 10]}
grid = GridSearchCV(base_clf, param_grid, cv=3, scoring="f1_weighted", n_jobs=-1)
grid.fit(X_train_vec, y_train)
model = grid.best_estimator_
print("Best C:", grid.best_params_["C"], "CV F1:", grid.best_score_)
# ⇧ END INSERTION ⇧ ─────────────────────────────────────────────────────────────

# 8) Evaluate
y_pred = model.predict(X_test_vec)
print("Accuracy:", accuracy_score(y_test, y_pred))
print("\nClassification report:\n", classification_report(y_test, y_pred, digits=3))
print("\nConfusion matrix:\n", confusion_matrix(y_test, y_pred))

# 9) Save
os.makedirs("ml/models", exist_ok=True)
joblib.dump(vectorizer, "ml/models/video_vectorizer.joblib")
joblib.dump(model,      "ml/models/video_classifier.joblib")
print("Saved vectorizer and model to ml/models/")
