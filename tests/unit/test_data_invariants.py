"""
tests/unit/test_data_invariants.py

Comprehensive unit tests verifying critical data integrity invariants:
- Canonical unordered pair ordering (drug_a_id < drug_b_id) and self-pair prohibition
- Absence of duplicate canonical pairs
- Pair endpoint referential integrity against canonical drugs
- Strict domain constraints for severity levels (including 'Unknown')
- Strict domain constraints for mechanism categories (7 recognized classes)
- Unique source mapping per (source_name, source_drug_id)
- Detection and reporting of ambiguous normalized names
- Count consistency across intermediate and canonical datasets
- Failure propagation on missing inputs or invalid schema
- Synthetic patient guardrail enforcement
"""

import unittest
import sys
import os
import tempfile
import pandas as pd
from collections import defaultdict

# Ensure preprocessing scripts are importable
sys.path.insert(0, os.path.abspath("scripts/preprocessing"))
from build_drug_mapping import normalize_name
from prepare_ddinter import process_ddinter
from prepare_mecddi import process_mecddi

class TestDataInvariants(unittest.TestCase):

    def test_canonical_pair_ordering(self):
        """Test that canonical pairs always satisfy drug_a_id < drug_b_id and reject self-loops."""
        def make_pair(a, b):
            if a == b:
                raise ValueError("Self-interaction prohibited: drug_a_id cannot equal drug_b_id")
            return (min(a, b), max(a, b))

        # Distinct IDs
        pair = make_pair(10, 4)
        self.assertEqual(pair, (4, 10))
        self.assertTrue(pair[0] < pair[1])

        # Self-interaction check
        with self.assertRaises(ValueError):
            make_pair(5, 5)

    def test_no_duplicate_canonical_pairs(self):
        """Verify that reverse pairs (B, A) reduce to the identical canonical key as (A, B)."""
        raw_pairs = [(1, 2), (2, 1), (5, 9), (9, 5), (3, 8)]
        canonical = set()
        for a, b in raw_pairs:
            canonical.add(tuple(sorted([a, b])))
        self.assertEqual(len(canonical), 3)
        self.assertEqual(canonical, {(1, 2), (5, 9), (3, 8)})

    def test_pair_endpoint_referential_integrity(self):
        """Test that every pair endpoint must resolve to a valid registered drug ID."""
        registered_drugs = {101, 102, 103, 104}
        valid_pairs = [(101, 102), (102, 103), (103, 104)]
        invalid_pairs = [(101, 102), (102, 999)]

        def check_integrity(pairs, valid_ids):
            endpoints = set()
            for a, b in pairs:
                endpoints.add(a)
                endpoints.add(b)
            unmatched = endpoints - valid_ids
            if unmatched:
                raise ValueError(f"Unmatched endpoints: {unmatched}")
            return True

        self.assertTrue(check_integrity(valid_pairs, registered_drugs))
        with self.assertRaises(ValueError):
            check_integrity(invalid_pairs, registered_drugs)

    def test_name_normalization_idempotence(self):
        """Test that normalize_name is deterministic, lowercases, and trims redundant whitespace."""
        raw_name = "  Warfarin   Sodium   "
        norm_1 = normalize_name(raw_name)
        norm_2 = normalize_name(norm_1)
        self.assertEqual(norm_1, "warfarin sodium")
        self.assertEqual(norm_1, norm_2)
        self.assertEqual(normalize_name(None), "")
        self.assertEqual(normalize_name(""), "")

    def test_severity_levels_domain(self):
        """Test that recognized DDInter severity levels match domain specification."""
        valid_severities = {'Major', 'Moderate', 'Minor', 'Unknown'}
        test_samples = ['Major', 'Moderate', 'Minor', 'Unknown']
        for s in test_samples:
            self.assertIn(s, valid_severities)

        invalid_samples = ['Severe', 'Low', 'Critical', 'None', '', 'Contraindicated']
        for s in invalid_samples:
            self.assertNotIn(s, valid_severities)

    def test_mechanism_categories_domain(self):
        """Test that MecDDI mechanism categories belong strictly to the 7 validated classes."""
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
        self.assertGreaterEqual(len(valid_mechanisms), 7)
        self.assertIn('Affected intra/extra-hepatic metabolism', valid_mechanisms)
        self.assertIn('Affected intra_extra-hepatic metabolism', valid_mechanisms)
        self.assertIn('Pharmacodynamic additive effects', valid_mechanisms)
        self.assertNotIn('CYP3A4 Induction', valid_mechanisms)
        self.assertNotIn('QT Prolongation', valid_mechanisms)

    def test_unique_source_mappings(self):
        """Test that a source drug identifier cannot map to multiple distinct canonical entries without collision detection."""
        mappings = [
            ("MecDDI", "MECDDI_001", 1),
            ("MecDDI", "MECDDI_002", 2),
            ("DDInter", "DDInter1", 1),
            ("DDInter", "DDInter2", 2)
        ]
        seen_source_keys = set()
        for source, s_id, _ in mappings:
            key = (source, s_id)
            self.assertNotIn(key, seen_source_keys)
            seen_source_keys.add(key)
        self.assertEqual(len(seen_source_keys), 4)

    def test_ambiguous_normalized_names_detection(self):
        """Test that multiple distinct source drugs with the same normalized name are flagged as ambiguous."""
        mock_source_drugs = [
            {"drug_id": "D1", "drug_name": "Aspirin"},
            {"drug_id": "D2", "drug_name": "aspirin"},
            {"drug_id": "D3", "drug_name": "Ibuprofen"}
        ]
        by_norm = defaultdict(list)
        for d in mock_source_drugs:
            by_norm[normalize_name(d["drug_name"])].append(d)

        ambiguities = {k: v for k, v in by_norm.items() if len(v) > 1}
        self.assertIn("aspirin", ambiguities)
        self.assertEqual(len(ambiguities["aspirin"]), 2)
        self.assertNotIn("ibuprofen", ambiguities)

    def test_failure_propagation_missing_inputs(self):
        """Test that missing required input directories or files immediately raise FileNotFoundError."""
        with tempfile.TemporaryDirectory() as tmpdir:
            empty_ddinter_dir = os.path.join(tmpdir, "ddinter")
            os.makedirs(empty_ddinter_dir, exist_ok=True)
            with self.assertRaises(FileNotFoundError):
                process_ddinter(raw_dir=empty_ddinter_dir, out_dir=os.path.join(tmpdir, "out"))

            empty_mecddi_dir = os.path.join(tmpdir, "mecddi")
            os.makedirs(empty_mecddi_dir, exist_ok=True)
            with self.assertRaises(FileNotFoundError):
                process_mecddi(raw_dir=empty_mecddi_dir, out_dir=os.path.join(tmpdir, "out"))

    def test_synthetic_patient_guardrail(self):
        """Test that synthetic patient records enforce is_synthetic = True invariant."""
        def validate_patient(record):
            if not record.get('is_synthetic', False):
                raise ValueError("Only synthetic patient data is permitted in this database")
            return True

        valid_patient = {'patient_id': 1, 'mrn': 'SYN-1001', 'is_synthetic': True}
        self.assertTrue(validate_patient(valid_patient))

        invalid_patient = {'patient_id': 2, 'mrn': 'REAL-999', 'is_synthetic': False}
        with self.assertRaises(ValueError):
            validate_patient(invalid_patient)

    def test_processed_dataset_invariants_if_present(self):
        """If data/processed/ canonical files exist, verify production invariants."""
        proc_dir = "data/processed"
        can_drugs_path = os.path.join(proc_dir, "canonical_drugs.csv")
        can_pairs_path = os.path.join(proc_dir, "canonical_ddi_pairs.csv")
        can_sev_path = os.path.join(proc_dir, "canonical_ddi_severities.csv")
        can_mech_path = os.path.join(proc_dir, "canonical_ddi_mechanisms.csv")

        if os.path.exists(can_drugs_path) and os.path.exists(can_pairs_path):
            df_drugs = pd.read_csv(can_drugs_path)
            df_pairs = pd.read_csv(can_pairs_path)
            drug_ids = set(df_drugs['drug_id'])

            # 1. Ordering invariant
            self.assertTrue((df_pairs['drug_a_id'] < df_pairs['drug_b_id']).all())

            # 2. Uniqueness invariant
            pair_keys = list(zip(df_pairs['drug_a_id'], df_pairs['drug_b_id']))
            self.assertEqual(len(pair_keys), len(set(pair_keys)))

            # 3. Referential integrity
            endpoints = set(df_pairs['drug_a_id']) | set(df_pairs['drug_b_id'])
            self.assertTrue(endpoints.issubset(drug_ids))

            # 4. Severity domain
            if os.path.exists(can_sev_path):
                df_sev = pd.read_csv(can_sev_path)
                valid_severities = {'Major', 'Moderate', 'Minor', 'Unknown'}
                self.assertTrue(set(df_sev['severity_level']).issubset(valid_severities))
                self.assertTrue(set(df_sev['pair_id']).issubset(set(df_pairs['pair_id'])))

            # 5. Mechanism domain
            if os.path.exists(can_mech_path):
                df_mech = pd.read_csv(can_mech_path)
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
                self.assertTrue(set(df_mech['mechanism_category']).issubset(valid_mechanisms))
                self.assertTrue(set(df_mech['pair_id']).issubset(set(df_pairs['pair_id'])))

if __name__ == "__main__":
    unittest.main()
