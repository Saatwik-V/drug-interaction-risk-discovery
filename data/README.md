# Data Directory

This directory stores datasets, fixtures, schemas, and data manifests for the **Patient-Specific Multi-Hop Drug Interaction Risk Discovery** project.

> [!IMPORTANT]
> **Status: Acquisition and Access Verification Pending**
> Data acquisition, licensing verification, and format inspection have **not yet been started**. No datasets (e.g., DrugBank, FAERS, or external biomedical databases) should be downloaded or imported without verifying licensing terms, schemas, and actual access availability.

## Subdirectory Structure

- `raw/`: Unmodified external source files (when acquired). Large files are excluded from git.
- `samples/`: Small, reproducible, sample fixtures used for local unit and integration tests.
- `processed/`: Transformed datasets ready for staging or database loading.
- `synthetic/`: Generated synthetic patient and prescription records used for testing application flows and benchmarking.
- `manifests/`: Metadata records capturing source URLs, download timestamps, checksums, and license information for data provenance.

## Operating Guidelines

1. **Explicit Separation**: Synthetic patient records must remain strictly isolated from sourced biomedical evidence.
2. **Provenance Tracking**: All external biomedical data must have an entry in `manifests/` detailing its source, license, version, and schema assumptions.
3. **No Fabricated Evidence**: Do not invent pharmacological connections or candidate pathways. Only genuine, sourced biomedical relationships should populate the knowledge graph.
