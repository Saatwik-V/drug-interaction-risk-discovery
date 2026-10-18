#!/usr/bin/env python3
"""
scripts/preprocessing/build_drug_mapping.py

Reconciles DDInter and MecDDI entities into a unified canonical schema:
1. Matches drug names conservatively using exact normalized strings.
2. Assigns unified surrogate integer drug_id (1..N).
3. Produces:
    data/processed/canonical_drugs.csv
    data/processed/drug_source_mappings.csv
    data/processed/canonical_ddi_pairs.csv
    data/processed/canonical_ddi_severities.csv
    data/processed/canonical_ddi_mechanisms.csv
"""

import os
import csv
from collections import defaultdict
import pandas as pd

def normalize_name(s):
    if not isinstance(s, str) or pd.isna(s):
        return ""
    return " ".join(s.strip().lower().split())

def build_mappings(proc_dir="data/processed"):
    print("Building canonical drug mapping and unified pairs...")

    # 1. Load prepared intermediate datasets
    df_dd_drugs = pd.read_csv(os.path.join(proc_dir, "ddinter_drugs.csv"), dtype=str)
    df_mec_drugs = pd.read_csv(os.path.join(proc_dir, "mecddi_drugs.csv"), dtype=str)

    # Index MecDDI drugs by normalized name
    mec_by_norm = {}
    for _, row in df_mec_drugs.iterrows():
        norm = normalize_name(row['drug_name'])
        mec_by_norm[norm] = row

    # Index DDInter drugs by normalized name
    dd_by_norm = {}
    for _, row in df_dd_drugs.iterrows():
        norm = normalize_name(row['drug_name'])
        dd_by_norm[norm] = row

    canonical_drugs = []
    source_mappings = []
    
    dd_to_canonical = {}  # ddinter_id -> canonical_drug_id
    mec_to_canonical = {} # mecddi_id -> canonical_drug_id
    
    current_drug_id = 1
    mapping_id = 1

    # First: Process shared drugs (exact 1-to-1 matches)
    all_norm_names = sorted(set(mec_by_norm.keys()) | set(dd_by_norm.keys()))

    for norm in all_norm_names:
        in_mec = norm in mec_by_norm
        in_dd = norm in dd_by_norm
        
        cid = current_drug_id
        current_drug_id += 1

        if in_mec and in_dd:
            m_row = mec_by_norm[norm]
            d_row = dd_by_norm[norm]
            
            canonical_name = m_row['drug_name'].strip()
            canonical_drugs.append({
                "drug_id": cid,
                "canonical_name": canonical_name,
                "pubchem_cid": m_row['pubchem_cid'],
                "inchikey": m_row['inchikey'],
                "smiles": m_row['smiles'],
                "drug_type": m_row['drug_type'],
                "therapeutic_class": m_row['therapeutic_class']
            })
            
            # Mappings
            source_mappings.append({
                "mapping_id": mapping_id,
                "drug_id": cid,
                "source_name": "MecDDI",
                "source_drug_id": m_row['mecddi_id'],
                "source_drug_name": m_row['drug_name'],
                "match_method": "EXACT_NORMALIZED_NAME"
            })
            mapping_id += 1
            
            source_mappings.append({
                "mapping_id": mapping_id,
                "drug_id": cid,
                "source_name": "DDInter",
                "source_drug_id": d_row['ddinter_id'],
                "source_drug_name": d_row['drug_name'],
                "match_method": "EXACT_NORMALIZED_NAME"
            })
            mapping_id += 1
            
            mec_to_canonical[m_row['mecddi_id']] = cid
            dd_to_canonical[d_row['ddinter_id']] = cid
            
        elif in_mec:
            m_row = mec_by_norm[norm]
            canonical_drugs.append({
                "drug_id": cid,
                "canonical_name": m_row['drug_name'].strip(),
                "pubchem_cid": m_row['pubchem_cid'],
                "inchikey": m_row['inchikey'],
                "smiles": m_row['smiles'],
                "drug_type": m_row['drug_type'],
                "therapeutic_class": m_row['therapeutic_class']
            })
            source_mappings.append({
                "mapping_id": mapping_id,
                "drug_id": cid,
                "source_name": "MecDDI",
                "source_drug_id": m_row['mecddi_id'],
                "source_drug_name": m_row['drug_name'],
                "match_method": "SOURCE_EXCLUSIVE"
            })
            mapping_id += 1
            mec_to_canonical[m_row['mecddi_id']] = cid
            
        elif in_dd:
            d_row = dd_by_norm[norm]
            canonical_drugs.append({
                "drug_id": cid,
                "canonical_name": d_row['drug_name'].strip(),
                "pubchem_cid": "",
                "inchikey": "",
                "smiles": "",
                "drug_type": "",
                "therapeutic_class": ""
            })
            source_mappings.append({
                "mapping_id": mapping_id,
                "drug_id": cid,
                "source_name": "DDInter",
                "source_drug_id": d_row['ddinter_id'],
                "source_drug_name": d_row['drug_name'],
                "match_method": "SOURCE_EXCLUSIVE"
            })
            mapping_id += 1
            dd_to_canonical[d_row['ddinter_id']] = cid

    print(f"  Total canonical drugs created: {len(canonical_drugs):,}")
    print(f"  Total source mappings created: {len(source_mappings):,}")

    # Write canonical drugs
    df_can = pd.DataFrame(canonical_drugs)
    df_can.to_csv(os.path.join(proc_dir, "canonical_drugs.csv"), index=False)

    # Write source mappings
    df_map = pd.DataFrame(source_mappings)
    df_map.to_csv(os.path.join(proc_dir, "drug_source_mappings.csv"), index=False)

    # 2. Build Unified Canonical Pairs
    # Map DDInter pairs
    df_dd_pairs = pd.read_csv(os.path.join(proc_dir, "ddinter_pairs.csv"), dtype=str)
    # Map MecDDI pairs
    df_mec_pairs = pd.read_csv(os.path.join(proc_dir, "mecddi_pairs.csv"), dtype=str)
    # Map MecDDI mechanisms
    df_mec_mech = pd.read_csv(os.path.join(proc_dir, "mecddi_mechanisms.csv"), dtype=str)

    # Register all canonical pairs: (min(cid_a, cid_b), max(cid_a, cid_b)) -> pair_id
    canonical_pairs = {} # (cid_a, cid_b) -> pair_id
    pair_severities = [] # list of {pair_id, severity_level, source_dataset, source_atc_codes}
    pair_mechanisms = [] # list of {pair_id, mechanism_category, source_dataset}

    current_pair_id = 1

    # Ingest DDInter pairs
    for _, row in df_dd_pairs.iterrows():
        d_a = row['ddinter_id_a']
        d_b = row['ddinter_id_b']
        if d_a in dd_to_canonical and d_b in dd_to_canonical:
            c_a = dd_to_canonical[d_a]
            c_b = dd_to_canonical[d_b]
            if c_a == c_b:
                continue # prevent self-loop
            u_pair = tuple(sorted([c_a, c_b]))
            if u_pair not in canonical_pairs:
                canonical_pairs[u_pair] = current_pair_id
                current_pair_id += 1
            
            p_id = canonical_pairs[u_pair]
            pair_severities.append({
                "pair_id": p_id,
                "severity_level": row['severity_level'],
                "source_dataset": "DDInter",
                "source_atc_codes": row['atc_codes']
            })

    # Ingest MecDDI pairs
    for _, row in df_mec_pairs.iterrows():
        m_a = row['mecddi_id_a']
        m_b = row['mecddi_id_b']
        if m_a in mec_to_canonical and m_b in mec_to_canonical:
            c_a = mec_to_canonical[m_a]
            c_b = mec_to_canonical[m_b]
            if c_a == c_b:
                continue
            u_pair = tuple(sorted([c_a, c_b]))
            if u_pair not in canonical_pairs:
                canonical_pairs[u_pair] = current_pair_id
                current_pair_id += 1

    # Ingest MecDDI mechanisms
    for _, row in df_mec_mech.iterrows():
        m_a = row['mecddi_id_a']
        m_b = row['mecddi_id_b']
        if m_a in mec_to_canonical and m_b in mec_to_canonical:
            c_a = mec_to_canonical[m_a]
            c_b = mec_to_canonical[m_b]
            u_pair = tuple(sorted([c_a, c_b]))
            if u_pair in canonical_pairs:
                p_id = canonical_pairs[u_pair]
                pair_mechanisms.append({
                    "pair_id": p_id,
                    "mechanism_category": row['mechanism_category'],
                    "source_dataset": "MecDDI"
                })

    print(f"  Total canonical interaction pairs: {len(canonical_pairs):,}")
    print(f"  Total severity records: {len(pair_severities):,}")
    print(f"  Total mechanism records: {len(pair_mechanisms):,}")

    # Write canonical_ddi_pairs.csv
    pairs_list = [{"pair_id": pid, "drug_a_id": u[0], "drug_b_id": u[1]} for u, pid in canonical_pairs.items()]
    df_pairs_out = pd.DataFrame(pairs_list)
    df_pairs_out.to_csv(os.path.join(proc_dir, "canonical_ddi_pairs.csv"), index=False)

    # Write canonical_ddi_severities.csv
    df_sev_out = pd.DataFrame(pair_severities)
    df_sev_out.to_csv(os.path.join(proc_dir, "canonical_ddi_severities.csv"), index=False)

    # Write canonical_ddi_mechanisms.csv
    df_mech_out = pd.DataFrame(pair_mechanisms).drop_duplicates()
    df_mech_out.to_csv(os.path.join(proc_dir, "canonical_ddi_mechanisms.csv"), index=False)

    print("  Unified canonical files successfully generated in data/processed/")

if __name__ == "__main__":
    build_mappings()
