import pandas as pd
import os

# Paths
base = r"C:\Users\rusha\Downloads\MyProjects\Clarity\ml\data"
pos_path = os.path.join(base, "video_titles_pos_filled.csv")
neg_path = os.path.join(base, "video_titles.csv") 
out_path = os.path.join(base, "video_titles_final.csv")

# Load
df_pos = pd.read_csv(pos_path)
df_neg = pd.read_csv(neg_path)

# Combine
df = pd.concat([df_pos, df_neg], ignore_index=True)

# Shuffle (optional but recommended)
df = df.sample(frac=1, random_state=42).reset_index(drop=True)

# Save
df.to_csv(out_path, index=False)
print(f"👉 Merged dataset saved to {out_path}")
