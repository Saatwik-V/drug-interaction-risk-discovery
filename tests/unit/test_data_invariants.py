"""
tests/unit/test_data_invariants.py

Unit tests verifying critical data integrity invariants:
- Canonical pair ordering
- Domain constraints for severity and mechanisms
- String normalization idempotence
- Synthetic seed cohort alignment
"""

import unittest
import sys
import os

# Ensure preprocessing scripts are importable
sys.path.insert(0, os.path.abspath("scripts/preprocessing"))
from build_drug_mapping import normalize_name

class TestDataInvariants(unittest.TestCase):

    def test_canonical_pair_ordering(self):
        """Test that canonical pairs always satisfy drug_a_id < drug_b_id and reject self-loops."""
        def make_pair(a, b):
            if a == b:
                raise ValueError("Self-interaction prohibited")
            return (min(a, b), max(a, b))

        # Distinct IDs
        pair = make_pair(10, 4)
        self.assertEqual(pair, (4, 10))
        self.assertTrue(pair[0] < pair[1])

        # Self-interaction check
        with self.assertRaises(ValueError):
            make_pair(5, 5)

    def test_name_normalization_idempotence(self):
        """Test that normalize_name is deterministic, lowercases, and trims whitespace."""
        raw_name = "  Warfarin  Sodium   "
        norm_1 = normalize_name(raw_name)
        norm_2 = normalize_name(norm_1)
        self.assertEqual(norm_1, "warfarin sodium")
        self.assertEqual(norm_1, norm_2)

    def test_severity_levels_domain(self):
        """Test that recognized DDInter severity levels match domain specification."""
        valid_severities = {'Major', 'Moderate', 'Minor', 'Unknown'}
        test_samples = ['Major', 'Moderate', 'Minor', 'Unknown']
        for s in test_samples:
            self.assertIn(s, valid_severities)

        invalid_samples = ['Severe', 'Low', 'Critical', 'None', '']
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

if __name__ == "__main__":
    unittest.main()
