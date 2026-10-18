#!/usr/bin/env python3
"""
scripts/preprocessing/inspect_sources.py

Comprehensive audit and inspection script for:
- 8 DDInter CSV files in data/raw/ddinter/
- 9 MecDDI CSV files in data/raw/mecddi/

Outputs detailed statistics for data dictionary, manifest, and validation reports.
"""

import os
import glob
import json
import hashlib
from collections import defaultdict
import pandas as pd
import numpy as np

def compute_file_hash(filepath):
    """Compute SHA-256 checksum of a file."""
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()

def normalize_name(name):
    """Conservative name normalization for exploratory matching."""
    if not isinstance(name, str) or pd.isna(name):
        return ""
    return " ".join(name.strip().lower().split())

def audit_ddinter(ddinter_dir="data/raw/ddinter"):
    print("=== Auditing DDInter Files ===")
    files = sorted(glob.glob(os.path.join(ddinter_dir, "*.csv")))
    file_stats = []
    
    all_pairs_seen = defaultdict(set) # unordered_pair -> set of (file, level)
    all_drugs = {} # id -> set of names
    global_total_rows = 0
    
    for fpath in files:
        fname = os.path.basename(fpath)
        fsize = os.path.getsize(fpath)
        fhash = compute_file_hash(fpath)
        
        df = pd.read_csv(fpath, dtype=str)
        num_rows, num_cols = df.shape
        global_total_rows += num_rows
        
        # Null counts
        null_counts = df.isnull().sum().to_dict()
        empty_counts = {c: int((df[c].str.strip() == "").sum()) for c in df.columns}
        
        # Unique IDs & Names
        drugs_a_ids = set(df['DDInterID_A'].dropna().str.strip())
        drugs_b_ids = set(df['DDInterID_B'].dropna().str.strip())
        all_file_drug_ids = drugs_a_ids | drugs_b_ids
        
        drugs_a_names = set(df['Drug_A'].dropna().str.strip())
        drugs_b_names = set(df['Drug_B'].dropna().str.strip())
        all_file_drug_names = drugs_a_names | drugs_b_names
        
        for _, row in df.iterrows():
            id_a, name_a = str(row['DDInterID_A']).strip(), str(row['Drug_A']).strip()
            id_b, name_b = str(row['DDInterID_B']).strip(), str(row['Drug_B']).strip()
            if id_a not in all_drugs: all_drugs[id_a] = set()
            all_drugs[id_a].add(name_a)
            if id_b not in all_drugs: all_drugs[id_b] = set()
            all_drugs[id_b].add(name_b)
            
        # Distinct levels
        level_counts = df['Level'].value_counts(dropna=False).to_dict()
        level_counts = {str(k): int(v) for k, v in level_counts.items()}
        
        # Duplicate rows
        dup_rows_count = int(df.duplicated().sum())
        
        # Unordered pairs
        unordered_pairs = []
        conflicting_within_file = 0
        pair_to_levels = defaultdict(set)
        
        for _, row in df.iterrows():
            id_a = str(row['DDInterID_A']).strip()
            id_b = str(row['DDInterID_B']).strip()
            lvl = str(row['Level']).strip()
            u_pair = tuple(sorted([id_a, id_b]))
            unordered_pairs.append(u_pair)
            pair_to_levels[u_pair].add(lvl)
            all_pairs_seen[u_pair].add((fname, lvl))
            
        unique_pairs = set(unordered_pairs)
        dup_pairs_count = len(unordered_pairs) - len(unique_pairs)
        
        conflicting_pairs_in_file = {p: lvls for p, lvls in pair_to_levels.items() if len(lvls) > 1}
        
        file_stats.append({
            "filename": fname,
            "filepath": fpath,
            "size_bytes": fsize,
            "sha256": fhash,
            "row_count": num_rows,
            "col_count": num_cols,
            "columns": list(df.columns),
            "null_counts": null_counts,
            "empty_counts": empty_counts,
            "unique_drug_ids": len(all_file_drug_ids),
            "unique_drug_names": len(all_file_drug_names),
            "unique_unordered_pairs": len(unique_pairs),
            "duplicate_rows": dup_rows_count,
            "duplicate_pairs": dup_pairs_count,
            "level_distribution": level_counts,
            "conflicting_pairs_within_file": len(conflicting_pairs_in_file)
        })
        print(f"  {fname}: {num_rows:,} rows, {len(unique_pairs):,} unique pairs, levels={level_counts}")
        
    # Cross-file analysis for DDInter
    conflicting_across_files = 0
    multi_file_pairs = 0
    pair_cross_levels = defaultdict(set)
    for u_pair, occurrences in all_pairs_seen.items():
        files_for_pair = set(f for f, lvl in occurrences)
        levels_for_pair = set(lvl for f, lvl in occurrences)
        pair_cross_levels[u_pair] = levels_for_pair
        if len(files_for_pair) > 1:
            multi_file_pairs += 1
        if len(levels_for_pair) > 1:
            conflicting_across_files += 1
            
    ddinter_summary = {
        "files": file_stats,
        "total_rows_across_files": global_total_rows,
        "total_unique_drugs": len(all_drugs),
        "total_unique_unordered_pairs": len(all_pairs_seen),
        "pairs_in_multiple_files": multi_file_pairs,
        "pairs_with_conflicting_levels_across_files": conflicting_across_files
    }
    return ddinter_summary, all_pairs_seen, all_drugs

def audit_mecddi(mecddi_dir="data/raw/mecddi"):
    print("\n=== Auditing MecDDI Files ===")
    files = sorted(glob.glob(os.path.join(mecddi_dir, "*.csv")))
    file_stats = []
    
    # 1. Master drug info
    drug_master_path = os.path.join(mecddi_dir, "Drug General Information.csv")
    df_drugs = pd.read_csv(drug_master_path, dtype=str)
    master_drug_ids = set(df_drugs['Drug_ID'].dropna().str.strip())
    master_id_to_name = {str(row['Drug_ID']).strip(): str(row['Drug_Name']).strip() for _, row in df_drugs.iterrows() if pd.notna(row['Drug_ID'])}
    master_name_to_id = {str(row['Drug_Name']).strip(): str(row['Drug_ID']).strip() for _, row in df_drugs.iterrows() if pd.notna(row['Drug_Name'])}
    
    # 2. Pairs master
    pair_master_path = os.path.join(mecddi_dir, "Drug-Drug-Interaction-Pair.csv")
    df_pair_master = pd.read_csv(pair_master_path, dtype=str)
    master_pairs_set = set()
    for _, row in df_pair_master.iterrows():
        a = str(row['A_Drug_ID']).strip()
        b = str(row['B_Drug_ID']).strip()
        master_pairs_set.add(tuple(sorted([a, b])))
        
    mecddi_pair_categories = defaultdict(set) # u_pair -> set of categories
    
    for fpath in files:
        fname = os.path.basename(fpath)
        fsize = os.path.getsize(fpath)
        fhash = compute_file_hash(fpath)
        
        df = pd.read_csv(fpath, dtype=str)
        num_rows, num_cols = df.shape
        
        null_counts = df.isnull().sum().to_dict()
        empty_counts = {c: int((df[c].str.strip() == "").sum()) for c in df.columns}
        dup_rows_count = int(df.duplicated().sum())
        
        stat = {
            "filename": fname,
            "filepath": fpath,
            "size_bytes": fsize,
            "sha256": fhash,
            "row_count": num_rows,
            "col_count": num_cols,
            "columns": list(df.columns),
            "null_counts": null_counts,
            "empty_counts": empty_counts,
            "duplicate_rows": dup_rows_count,
        }
        
        if fname == "Drug General Information.csv":
            stat["unique_drug_ids"] = len(master_drug_ids)
            stat["unique_drug_names"] = int(df['Drug_Name'].dropna().nunique())
            stat["drug_type_distribution"] = df['Drug_Type'].value_counts(dropna=False).to_dict()
            stat["pubchem_cid_present"] = int(df['PubChem_CID'].dropna().count())
            stat["smiles_present"] = int(df['Canonical_SMILES'].dropna().count())
        else:
            # Pair or Mechanism file
            a_ids = set(df['A_Drug_ID'].dropna().str.strip())
            b_ids = set(df['B_Drug_ID'].dropna().str.strip())
            file_drug_ids = a_ids | b_ids
            stat["unique_drug_ids"] = len(file_drug_ids)
            stat["unmatched_drug_ids"] = len(file_drug_ids - master_drug_ids)
            
            # Unordered pairs
            u_pairs = []
            name_discrepancies = 0
            for _, row in df.iterrows():
                a_id = str(row['A_Drug_ID']).strip()
                b_id = str(row['B_Drug_ID']).strip()
                a_name = str(row['A_Drug_Name']).strip()
                b_name = str(row['B_Drug_Name']).strip()
                u_pair = tuple(sorted([a_id, b_id]))
                u_pairs.append(u_pair)
                
                # Check name agreement with master
                if a_id in master_id_to_name and master_id_to_name[a_id] != a_name:
                    name_discrepancies += 1
                if b_id in master_id_to_name and master_id_to_name[b_id] != b_name:
                    name_discrepancies += 1
                    
                if 'Mechanism_Category' in df.columns:
                    cat = str(row['Mechanism_Category']).strip()
                    mecddi_pair_categories[u_pair].add(cat)
                    
            unique_u_pairs = set(u_pairs)
            stat["unique_unordered_pairs"] = len(unique_u_pairs)
            stat["duplicate_pairs"] = len(u_pairs) - len(unique_u_pairs)
            stat["name_discrepancies_with_master"] = name_discrepancies
            stat["pairs_not_in_master_pairs"] = len(unique_u_pairs - master_pairs_set)
            
            if 'Mechanism_Category' in df.columns:
                cat_counts = df['Mechanism_Category'].value_counts(dropna=False).to_dict()
                stat["mechanism_categories"] = {str(k): int(v) for k, v in cat_counts.items()}
                
        file_stats.append(stat)
        print(f"  {fname}: {num_rows:,} rows, {num_cols} cols")
        
    # Analyze multiple mechanism categories per pair
    multi_cat_pairs = {p: cats for p, cats in mecddi_pair_categories.items() if len(cats) > 1}
    cat_distribution_per_pair = defaultdict(int)
    for p, cats in mecddi_pair_categories.items():
        cat_distribution_per_pair[len(cats)] += 1
        
    mecddi_summary = {
        "files": file_stats,
        "master_drug_count": len(master_drug_ids),
        "master_pairs_count": len(master_pairs_set),
        "pairs_with_mechanisms": len(mecddi_pair_categories),
        "pairs_with_multiple_categories": len(multi_cat_pairs),
        "category_count_distribution": dict(cat_distribution_per_pair)
    }
    return mecddi_summary, master_id_to_name, master_pairs_set, mecddi_pair_categories

def cross_source_comparison(ddinter_drugs, ddinter_pairs, mecddi_id_to_name, mecddi_pairs):
    print("\n=== Cross-Source Audit & Mapping ===")
    
    # 1. Drug Name Comparison
    # Build normalized lookup for MecDDI: norm_name -> (id, orig_name)
    mecddi_norm_to_info = defaultdict(list)
    for m_id, m_name in mecddi_id_to_name.items():
        norm = normalize_name(m_name)
        mecddi_norm_to_info[norm].append((m_id, m_name))
        
    # DDInter names: ddinter_drugs is id -> set of original names
    ddinter_norm_to_info = defaultdict(list)
    for d_id, names in ddinter_drugs.items():
        for name in names:
            norm = normalize_name(name)
            ddinter_norm_to_info[norm].append((d_id, name))
            
    shared_norm_names = set(mecddi_norm_to_info.keys()) & set(ddinter_norm_to_info.keys())
    
    # Exact mappings where 1-to-1
    exact_1to1_mappings = []
    ambiguous_mappings = []
    
    for norm in shared_norm_names:
        m_list = mecddi_norm_to_info[norm]
        d_list = ddinter_norm_to_info[norm]
        if len(m_list) == 1 and len(d_list) == 1:
            exact_1to1_mappings.append({
                "norm_name": norm,
                "ddinter_id": d_list[0][0],
                "ddinter_name": d_list[0][1],
                "mecddi_id": m_list[0][0],
                "mecddi_name": m_list[0][1]
            })
        else:
            ambiguous_mappings.append({
                "norm_name": norm,
                "ddinter_entries": d_list,
                "mecddi_entries": m_list
            })
            
    # DDInter mapped to MecDDI dictionary
    d_to_m_map = {item['ddinter_id']: item['mecddi_id'] for item in exact_1to1_mappings}
    
    # 2. Pair Comparison
    # Map DDInter pairs to MecDDI IDs using exact 1-to-1 mappings
    ddinter_mapped_pairs = set()
    ddinter_unmapped_pairs = 0
    for (d_a, d_b) in ddinter_pairs.keys():
        if d_a in d_to_m_map and d_b in d_to_m_map:
            m_a, m_b = d_to_m_map[d_a], d_to_m_map[d_b]
            if m_a != m_b:
                ddinter_mapped_pairs.add(tuple(sorted([m_a, m_b])))
        else:
            ddinter_unmapped_pairs += 1
            
    overlapping_pairs = ddinter_mapped_pairs & mecddi_pairs
    
    print(f"Total DDInter unique drug IDs: {len(ddinter_drugs):,}")
    print(f"Total MecDDI master drug IDs: {len(mecddi_id_to_name):,}")
    print(f"Shared normalized drug names: {len(shared_norm_names):,}")
    print(f"  - Clean 1-to-1 drug mappings: {len(exact_1to1_mappings):,}")
    print(f"  - Ambiguous / multi-match drug names: {len(ambiguous_mappings):,}")
    print(f"DDInter pairs where BOTH drugs mapped to MecDDI: {len(ddinter_mapped_pairs):,}")
    print(f"Overlapping pairs found in BOTH DDInter and MecDDI: {len(overlapping_pairs):,}")
    
    cross_summary = {
        "total_ddinter_drugs": len(ddinter_drugs),
        "total_mecddi_drugs": len(mecddi_id_to_name),
        "shared_normalized_names": len(shared_norm_names),
        "exact_1to1_mappings_count": len(exact_1to1_mappings),
        "ambiguous_mappings_count": len(ambiguous_mappings),
        "ddinter_pairs_both_mapped": len(ddinter_mapped_pairs),
        "ddinter_pairs_unmapped": ddinter_unmapped_pairs,
        "overlapping_pairs_in_both": len(overlapping_pairs),
        "sample_mappings": exact_1to1_mappings[:10],
        "sample_ambiguous": ambiguous_mappings[:5]
    }
    return cross_summary, exact_1to1_mappings, ambiguous_mappings

def main():
    ddinter_summary, ddinter_pairs, ddinter_drugs = audit_ddinter()
    mecddi_summary, mecddi_id_to_name, mecddi_pairs, mecddi_pair_categories = audit_mecddi()
    cross_summary, exact_mappings, ambiguous = cross_source_comparison(
        ddinter_drugs, ddinter_pairs, mecddi_id_to_name, mecddi_pairs
    )
    
    full_audit = {
        "ddinter": ddinter_summary,
        "mecddi": mecddi_summary,
        "cross_source": cross_summary
    }
    
    out_dir = "data/processed"
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, "audit_summary.json"), "w") as f:
        json.dump(full_audit, f, indent=2)
    print(f"\nAudit complete. Summary written to {os.path.join(out_dir, 'audit_summary.json')}")

if __name__ == "__main__":
    main()
