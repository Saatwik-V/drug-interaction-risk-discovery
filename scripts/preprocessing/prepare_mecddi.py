#!/usr/bin/env python3
"""
scripts/preprocessing/prepare_mecddi.py

Extracts and normalizes raw MecDDI files from data/raw/mecddi/
- Master drug info: chemical properties, identifiers, drug types
- Master interaction pairs: canonical unordered ordering (id_a < id_b)
- Multi-mechanism classifications: maps up to 3 mechanism categories per pair
- Outputs:
    data/processed/mecddi_drugs.csv
    data/processed/mecddi_pairs.csv
    data/processed/mecddi_mechanisms.csv
"""

import os
import glob
import csv
from collections import defaultdict
import pandas as pd

def process_mecddi(raw_dir="data/raw/mecddi", out_dir="data/processed"):
    os.makedirs(out_dir, exist_ok=True)
    print("Processing MecDDI files...")

    # 1. Master Drug Information
    drug_info_path = os.path.join(raw_dir, "Drug General Information.csv")
    if not os.path.exists(drug_info_path):
        raise FileNotFoundError(f"MecDDI Drug master file not found: {drug_info_path}")
    df_drugs = pd.read_csv(drug_info_path, dtype=str)
    print(f"  Drug master loaded: {len(df_drugs):,} records")

    # Clean and write mecddi_drugs.csv
    drugs_out = os.path.join(out_dir, "mecddi_drugs.csv")
    df_drugs_clean = df_drugs[[
        'Drug_ID', 'Drug_Name', 'PubChem_CID', 'InChIKey', 'Canonical_SMILES', 
        'Drug_Type', 'Therapeutic_Class', 'Disease_Class'
    ]].copy()
    df_drugs_clean.rename(columns={
        'Drug_ID': 'mecddi_id',
        'Drug_Name': 'drug_name',
        'PubChem_CID': 'pubchem_cid',
        'InChIKey': 'inchikey',
        'Canonical_SMILES': 'smiles',
        'Drug_Type': 'drug_type',
        'Therapeutic_Class': 'therapeutic_class',
        'Disease_Class': 'disease_class'
    }, inplace=True)
    df_drugs_clean.to_csv(drugs_out, index=False)
    print(f"  Wrote {drugs_out}")

    # 2. Master Interaction Pairs
    pair_master_path = os.path.join(raw_dir, "Drug-Drug-Interaction-Pair.csv")
    if not os.path.exists(pair_master_path):
        raise FileNotFoundError(f"MecDDI Pair master file not found: {pair_master_path}")
    df_pairs = pd.read_csv(pair_master_path, dtype=str)
    master_pairs = set()
    for _, row in df_pairs.iterrows():
        a_id = str(row['A_Drug_ID']).strip()
        b_id = str(row['B_Drug_ID']).strip()
        master_pairs.add(tuple(sorted([a_id, b_id])))
    print(f"  Master interaction pairs loaded: {len(master_pairs):,} unique pairs")

    pairs_out = os.path.join(out_dir, "mecddi_pairs.csv")
    with open(pairs_out, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["mecddi_id_a", "mecddi_id_b"])
        for (id_a, id_b) in sorted(master_pairs):
            writer.writerow([id_a, id_b])
    print(f"  Wrote {pairs_out}")

    # 3. Mechanism Classifications (7 files)
    mechanism_files = [
        "Affected cellular transport.csv",
        "Affected excretion pathways.csv",
        "Affected gastrointestinal absorption.csv",
        "Affected intra_extra-hepatic metabolism.csv",
        "Affected organization distribution.csv",
        "Pharmacodynamic additive effects.csv",
        "Pharmacodynamic antagonistic effects.csv"
    ]

    pair_mechanisms = defaultdict(set)
    total_raw_mech_rows = 0

    for mfile in mechanism_files:
        fpath = os.path.join(raw_dir, mfile)
        if not os.path.exists(fpath):
            raise FileNotFoundError(f"Required MecDDI mechanism file missing: {fpath}")
        df_mech = pd.read_csv(fpath, dtype=str)
        total_raw_mech_rows += len(df_mech)
        for _, row in df_mech.iterrows():
            a_id = str(row['A_Drug_ID']).strip()
            b_id = str(row['B_Drug_ID']).strip()
            cat = str(row['Mechanism_Category']).strip()
            u_pair = tuple(sorted([a_id, b_id]))
            pair_mechanisms[u_pair].add(cat)

    print(f"  Total raw mechanism rows processed: {total_raw_mech_rows:,}")
    print(f"  Pairs with mapped mechanisms: {len(pair_mechanisms):,}")

    mechanisms_out = os.path.join(out_dir, "mecddi_mechanisms.csv")
    with open(mechanisms_out, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["mecddi_id_a", "mecddi_id_b", "mechanism_category"])
        for (id_a, id_b), cats in sorted(pair_mechanisms.items()):
            for cat in sorted(cats):
                writer.writerow([id_a, id_b, cat])
    print(f"  Wrote {mechanisms_out}")

if __name__ == "__main__":
    process_mecddi()
