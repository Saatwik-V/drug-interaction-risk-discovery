#!/usr/bin/env python3
"""
scripts/preprocessing/prepare_ddinter.py

Extracts and normalizes raw DDInter files from data/raw/ddinter/
- Standardizes unordered drug pairs (min_id, max_id)
- Aggregates multi-ATC code appearances without conflicting levels
- Preserves original severity labels (Major, Moderate, Minor, Unknown)
- Outputs data/processed/ddinter_drugs.csv and data/processed/ddinter_pairs.csv
"""

import os
import glob
import csv
from collections import defaultdict
import pandas as pd

def process_ddinter(raw_dir="data/raw/ddinter", out_dir="data/processed"):
    os.makedirs(out_dir, exist_ok=True)
    files = sorted(glob.glob(os.path.join(raw_dir, "*.csv")))
    if not files:
        raise FileNotFoundError(f"No DDInter CSV files found in {raw_dir}")
    print(f"Processing {len(files)} DDInter files...")

    drugs = {} # id -> name
    pairs = defaultdict(lambda: {"level": None, "atc_codes": set()})
    total_raw_rows = 0

    for fpath in files:
        fname = os.path.basename(fpath)
        # Extract ATC code letter from filename e.g. ddinter_downloads_code_A.csv -> A
        atc_letter = fname.replace("ddinter_downloads_code_", "").replace(".csv", "")
        df = pd.read_csv(fpath, dtype=str)
        total_raw_rows += len(df)

        for _, row in df.iterrows():
            id_a = str(row['DDInterID_A']).strip()
            name_a = str(row['Drug_A']).strip()
            id_b = str(row['DDInterID_B']).strip()
            name_b = str(row['Drug_B']).strip()
            level = str(row['Level']).strip()

            drugs[id_a] = name_a
            drugs[id_b] = name_b

            # Canonical unordered pair key
            u_pair = tuple(sorted([id_a, id_b]))
            if pairs[u_pair]["level"] is None:
                pairs[u_pair]["level"] = level
            elif pairs[u_pair]["level"] != level:
                raise ValueError(f"Conflicting severity levels detected for pair {u_pair}: {pairs[u_pair]['level']} vs {level}")

            pairs[u_pair]["atc_codes"].add(atc_letter)

    print(f"  Total raw input rows: {total_raw_rows:,}")
    print(f"  Extracted unique drugs: {len(drugs):,}")
    print(f"  Extracted unique interaction pairs: {len(pairs):,}")

    # Write ddinter_drugs.csv
    drugs_out = os.path.join(out_dir, "ddinter_drugs.csv")
    with open(drugs_out, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["ddinter_id", "drug_name"])
        for d_id in sorted(drugs.keys()):
            writer.writerow([d_id, drugs[d_id]])
    print(f"  Wrote {drugs_out}")

    # Write ddinter_pairs.csv
    pairs_out = os.path.join(out_dir, "ddinter_pairs.csv")
    with open(pairs_out, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["ddinter_id_a", "ddinter_id_b", "severity_level", "atc_codes"])
        for (id_a, id_b), data in sorted(pairs.items()):
            atc_str = ",".join(sorted(data["atc_codes"]))
            writer.writerow([id_a, id_b, data["level"], atc_str])
    print(f"  Wrote {pairs_out}")

if __name__ == "__main__":
    process_ddinter()
