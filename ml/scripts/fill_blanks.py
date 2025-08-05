import csv
import sys

input_path = r"C:\Users\rusha\Downloads\MyProjects\Clarity\ml\data\video_titles.csv"

with open(input_path, newline='', encoding='utf-8') as f:
    reader = csv.reader(f)
    writer = csv.writer(sys.stdout)

    for row in reader:
        # Skip empty lines
        if not row:
            continue
        # If there’s no label column, or it’s blank, set to "0"
        if len(row) == 1 or row[1].strip() == "":
            row = [row[0], "0"]
        writer.writerow(row)
