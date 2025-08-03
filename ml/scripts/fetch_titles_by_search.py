import csv
import os
from googleapiclient.discovery import build
from dotenv import load_dotenv
load_dotenv()   

# Load your API key from env
API_KEY = os.getenv("YOUTUBE_API_KEY")
if not API_KEY:
    raise ValueError("Please set YOUTUBE_API_KEY environment variable.")

# List of keywords to search for
KEYWORDS = ["tutorial", "lecture", "how to", "course", "education"]
# Number of pages of results per keyword (50 titles per page)
MAX_PAGES = 2

# Path to your CSV
CSV_PATH = os.path.join(os.path.dirname(__file__), "../data/video_titles.csv")

# Build YouTube API client
youtube = build("youtube", "v3", developerKey=API_KEY)

def fetch_titles_by_keyword(keyword, max_pages=MAX_PAGES):
    titles = []
    next_token = None
    for _ in range(max_pages):
        resp = youtube.search().list(
            part="snippet",
            q=keyword,
            type="video",
            maxResults=50,
            pageToken=next_token
        ).execute()
        # extract titles
        for item in resp.get("items", []):
            titles.append(item["snippet"]["title"])
        next_token = resp.get("nextPageToken")
        if not next_token:
            break
    return titles

def append_to_csv(titles, csv_path=CSV_PATH):
    os.makedirs(os.path.dirname(csv_path), exist_ok=True)
    with open(csv_path, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        for t in titles:
            writer.writerow([t, ""])  # blank label for manual tagging

if __name__ == "__main__":
    all_titles = []
    for kw in KEYWORDS:
        fetched = fetch_titles_by_keyword(kw)
        print(f"Fetched {len(fetched)} titles for '{kw}'")
        all_titles.extend(fetched)

    append_to_csv(all_titles)
    print(f"Appended a total of {len(all_titles)} titles to {CSV_PATH}")
