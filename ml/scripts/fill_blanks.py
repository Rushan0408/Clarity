import csv
import os

# 1) Paths
input_path  = r"C:\Users\rusha\Downloads\MyProjects\Clarity\ml\data\video_titles_pos.csv"
output_path = r"C:\Users\rusha\Downloads\MyProjects\Clarity\ml\data\video_titles_pos_filled.csv"

# 2) Read input and write output
with open(input_path,  newline="", encoding="utf-8") as inf, \
     open(output_path, "w", newline="", encoding="utf-8") as outf:
    reader = csv.reader(inf)
    writer = csv.writer(outf)

    for row in reader:
        # Skip empty lines
        if not row:
            continue

        # If there's no label column, or it's blank, mark it as "1"
        if len(row) < 2 or row[1].strip() == "":
            row = [row[0], "1"]

        writer.writerow(row)

print(f"✅ All blanks filled with 1 and saved to:\n   {output_path}")
