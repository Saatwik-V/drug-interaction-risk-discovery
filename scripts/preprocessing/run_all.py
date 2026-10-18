#!/usr/bin/env python3
"""
scripts/preprocessing/run_all.py

Master pipeline orchestrator for Phase 1 Data Preparation and Validation:
1. Inspects raw sources (DDInter + MecDDI)
2. Normalizes DDInter records
3. Normalizes MecDDI records
4. Builds canonical drug mappings and unified interaction tables
5. Validates data integrity invariants
6. Generates ER diagrams (.drawio, .png, .pdf)
"""

import sys
import time
from inspect_sources import main as run_inspect
from prepare_ddinter import process_ddinter
from prepare_mecddi import process_mecddi
from build_drug_mapping import build_mappings
from validate_data import run_validation
from generate_chen_er_diagram import generate_drawio_xml, render_chen_matplotlib as render_diagram_matplotlib

def run_pipeline():
    start_time = time.time()
    print("================================================================================")
    print("STARTING DATA PREPROCESSING & PREPARATION PIPELINE")
    print("================================================================================\n")

    print(">>> Step 1/6: Running Source Inspection and Audit...")
    run_inspect()

    print("\n>>> Step 2/6: Normalizing DDInter Data...")
    process_ddinter()

    print("\n>>> Step 3/6: Normalizing MecDDI Data...")
    process_mecddi()

    print("\n>>> Step 4/6: Building Canonical Entity Mappings and Unified Tables...")
    build_mappings()

    print("\n>>> Step 5/6: Executing Data Validation Checks...")
    report = run_validation()
    if report.get("status") != "PASSED":
        raise RuntimeError(f"Pipeline validation failed with status: {report.get('status')}")

    print("\n>>> Step 6/6: Generating ER Diagrams...")
    generate_drawio_xml()
    render_diagram_matplotlib()

    elapsed = time.time() - start_time
    print(f"\n================================================================================")
    print(f"PIPELINE COMPLETED SUCCESSFULLY in {elapsed:.2f} seconds")
    print(f"Validation Status: {report['status']}")
    print(f"================================================================================")

if __name__ == "__main__":
    run_pipeline()
