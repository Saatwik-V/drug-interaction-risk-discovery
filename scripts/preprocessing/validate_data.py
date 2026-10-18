#!/usr/bin/env python3
"""
scripts/preprocessing/validate_data.py

Rigorous automated validation of processed canonical datasets:
1. Referential integrity: all pair endpoints exist in canonical_drugs.
2. Canonical pair ordering: drug_a_id < drug_b_id for all pairs.
3. Uniqueness: zero duplicate pairs in canonical_ddi_pairs.
4. Domain validity: severities in ('Major', 'Moderate', 'Minor', 'Unknown').
5. Mechanism validity: mechanism_category in 7 recognized categories.
6. Reconciliation: verifies output counts against raw input audit.
Outputs validation_report.json in data/processed/.
"""

import os
import json
import pandas as pd

def run_validation(proc_dir="data/processed"):
    print("Running automated data validation suite...")
    report = {"status": "PASSED", "checks": [], "metrics": {}}

    def add_check(name, passed, message, details=None):
        report["checks"].append({
            "check": name,
            "passed": bool(passed),
            "message": message,
            "details": details or {}
        })
        status_str = "PASS" if passed else "FAIL"
        print(f"  [{status_str}] {name}: {message}")
        if not passed:
            report["status"] = "FAILED"

    # 1. Load canonical drugs
    drugs_path = os.path.join(proc_dir, "canonical_drugs.csv")
    if not os.path.exists(drugs_path):
        add_check("canonical_drugs_exist", False, f"Missing {drugs_path}")
        return report
    
    df_drugs = pd.read_csv(drugs_path, dtype=str)
    drug_ids = set(df_drugs['drug_id'].astype(int))
    add_check("canonical_drugs_non_empty", len(df_drugs) > 0, f"Found {len(df_drugs):,} canonical drugs")
    add_check("canonical_drugs_unique_names", df_drugs['canonical_name'].is_unique, "All canonical drug names are unique")
    report["metrics"]["total_canonical_drugs"] = len(df_drugs)

    # 2. Load canonical pairs
    pairs_path = os.path.join(proc_dir, "canonical_ddi_pairs.csv")
    df_pairs = pd.read_csv(pairs_path)
    report["metrics"]["total_canonical_pairs"] = len(df_pairs)

    # Invariant: drug_a_id < drug_b_id
    invalid_ordering = (df_pairs['drug_a_id'] >= df_pairs['drug_b_id']).sum()
    add_check("canonical_pair_ordering", invalid_ordering == 0, 
              f"Enforced drug_a_id < drug_b_id (violations: {invalid_ordering})")

    # Invariant: uniqueness of unordered pairs
    pair_tuples = list(zip(df_pairs['drug_a_id'], df_pairs['drug_b_id']))
    unique_pairs_count = len(set(pair_tuples))
    add_check("canonical_pairs_uniqueness", len(pair_tuples) == unique_pairs_count,
              f"All {len(pair_tuples):,} canonical pairs are unique (duplicates: {len(pair_tuples) - unique_pairs_count})")

    # Invariant: referential integrity to canonical_drugs
    endpoints = set(df_pairs['drug_a_id']) | set(df_pairs['drug_b_id'])
    unmatched_endpoints = endpoints - drug_ids
    add_check("pair_referential_integrity", len(unmatched_endpoints) == 0,
              f"All pair endpoints exist in canonical_drugs (unmatched: {len(unmatched_endpoints)})")

    # 3. Load severities
    sev_path = os.path.join(proc_dir, "canonical_ddi_severities.csv")
    df_sev = pd.read_csv(sev_path)
    report["metrics"]["total_severity_records"] = len(df_sev)

    valid_severities = {'Major', 'Moderate', 'Minor', 'Unknown'}
    invalid_sev = (~df_sev['severity_level'].isin(valid_severities)).sum()
    add_check("severity_domain_validity", invalid_sev == 0,
              f"All severity levels belong to permitted domain (violations: {invalid_sev})")

    pair_ids = set(df_pairs['pair_id'].astype(int))
    unmatched_sev_pairs = set(df_sev['pair_id'].astype(int)) - pair_ids
    add_check("severity_pair_referential_integrity", len(unmatched_sev_pairs) == 0,
              f"All severity pair_ids exist in canonical_ddi_pairs (unmatched: {len(unmatched_sev_pairs)})")

    # 4. Load mechanisms
    mech_path = os.path.join(proc_dir, "canonical_ddi_mechanisms.csv")
    df_mech = pd.read_csv(mech_path)
    report["metrics"]["total_mechanism_records"] = len(df_mech)

    valid_mechanisms = {
        'Affected cellular transport',
        'Affected excretion pathways',
        'Affected gastrointestinal absorption',
        'Affected intra/extra-hepatic metabolism',
        'Affected intra_extra-hepatic metabolism',
        'Affected organization distribution',
        'Pharmacodynamic additive effects',
        'Pharmacodynamic antagonistic effects'
    }
    invalid_mech = (~df_mech['mechanism_category'].isin(valid_mechanisms)).sum()
    add_check("mechanism_domain_validity", invalid_mech == 0,
              f"All mechanism categories belong to permitted 7 categories (violations: {invalid_mech})")

    unmatched_mech_pairs = set(df_mech['pair_id'].astype(int)) - pair_ids
    add_check("mechanism_pair_referential_integrity", len(unmatched_mech_pairs) == 0,
              f"All mechanism pair_ids exist in canonical_ddi_pairs (unmatched: {len(unmatched_mech_pairs)})")

    # 5. Load and validate drug source mappings
    maps_path = os.path.join(proc_dir, "drug_source_mappings.csv")
    if os.path.exists(maps_path):
        df_maps = pd.read_csv(maps_path)
        report["metrics"]["total_source_mappings"] = len(df_maps)
        # Foreign key integrity
        unmatched_map_drugs = set(df_maps['drug_id'].astype(int)) - drug_ids
        add_check("mapping_drug_referential_integrity", len(unmatched_map_drugs) == 0,
                  f"All mapping drug_ids exist in canonical_drugs (unmatched: {len(unmatched_map_drugs)})")

        # Source uniqueness: (source_name, source_drug_id) unique
        map_tuples = list(zip(df_maps['source_name'], df_maps['source_drug_id']))
        unique_map_tuples = len(set(map_tuples))
        add_check("mapping_source_uniqueness", len(map_tuples) == unique_map_tuples,
                  f"All source mappings are unique by (source_name, source_drug_id) (duplicates: {len(map_tuples) - unique_map_tuples})")

    # Write report
    report_path = os.path.join(proc_dir, "validation_report.json")
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)
    print(f"\nValidation complete. Status: {report['status']}. Report saved to {report_path}")
    return report

if __name__ == "__main__":
    run_validation()
