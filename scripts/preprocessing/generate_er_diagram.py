#!/usr/bin/env python3
"""
scripts/preprocessing/generate_er_diagram.py

Generates:
1. docs/database-design/ER_DIAGRAM.drawio (Valid editable diagrams.net XML)
2. docs/database-design/ER_DIAGRAM.png (High-resolution raster export)
3. docs/database-design/ER_DIAGRAM.pdf (Vector export)
"""

import os
import xml.etree.ElementTree as ET
import matplotlib.pyplot as plt
import matplotlib.patches as patches

def generate_drawio_xml(output_path="docs/database-design/ER_DIAGRAM.drawio"):
    root = ET.Element("mxfile", host="app.diagrams.net", modified="2026-10-18T18:00:00.000Z", agent="Antigravity", version="21.0.0", type="device")
    diagram = ET.SubElement(root, "diagram", id="er-diagram-page", name="ER Diagram - Drug Interaction System")
    mxGraphModel = ET.SubElement(diagram, "mxGraphModel", dx="1422", dy="880", grid="1", gridSize="10", guides="1", tooltips="1", connect="1", arrows="1", fold="1", page="1", pageScale="1", pageWidth="1654", pageHeight="1169", math="0", shadow="0")
    model_root = ET.SubElement(mxGraphModel, "root")
    
    ET.SubElement(model_root, "mxCell", id="0")
    ET.SubElement(model_root, "mxCell", id="1", parent="0")
    
    # Title Block
    title_cell = ET.SubElement(model_root, "mxCell", id="title", value="<b>Patient-Specific Multi-Hop Drug Interaction Risk Discovery</b><br>Conceptual & Relational Entity-Relationship Diagram (DBMS Level 3)", style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=18;fontColor=#1E293B;fontFamily=Helvetica;", vertex="1", parent="1")
    ET.SubElement(title_cell, "mxGeometry", attrib={"as": "geometry", "x": "350", "y": "30", "width": "800", "height": "50"})

    entities = [
        {
            "id": "ent_drugs", "name": "DRUGS", "x": 40, "y": 120, "w": 230, "h": 220, "color": "#E0F2FE", "border": "#0284C7",
            "attrs": [
                "+ drug_id: INT [PK]",
                "+ canonical_name: VARCHAR(255) [U, NOT NULL]",
                "+ pubchem_cid: VARCHAR(50)",
                "+ inchikey: VARCHAR(50)",
                "+ smiles: TEXT",
                "+ drug_type: VARCHAR(100)",
                "+ therapeutic_class: TEXT",
                "+ created_at: TIMESTAMPTZ"
            ]
        },
        {
            "id": "ent_mappings", "name": "DRUG_SOURCE_MAPPINGS", "x": 40, "y": 420, "w": 230, "h": 190, "color": "#F0F9FF", "border": "#0369A1",
            "attrs": [
                "+ mapping_id: INT [PK]",
                "# drug_id: INT [FK -> DRUGS]",
                "+ source_name: VARCHAR(50) [CHECK]",
                "+ source_drug_id: VARCHAR(50)",
                "+ source_drug_name: VARCHAR(255)",
                "+ match_method: VARCHAR(50)",
                "[U: source_name, source_drug_id]"
            ]
        },
        {
            "id": "ent_pairs", "name": "DDI_PAIRS", "x": 370, "y": 120, "w": 250, "h": 180, "color": "#FEF3C7", "border": "#D97706",
            "attrs": [
                "+ pair_id: BIGINT [PK]",
                "# drug_a_id: INT [FK -> DRUGS]",
                "# drug_b_id: INT [FK -> DRUGS]",
                "+ created_at: TIMESTAMPTZ",
                "[CHECK: drug_a_id < drug_b_id]",
                "[U: drug_a_id, drug_b_id]"
            ]
        },
        {
            "id": "ent_severities", "name": "DDI_SEVERITIES", "x": 370, "y": 380, "w": 250, "h": 160, "color": "#FEF9C3", "border": "#CA8A04",
            "attrs": [
                "+ severity_id: BIGINT [PK]",
                "# pair_id: BIGINT [FK -> DDI_PAIRS]",
                "+ severity_level: VARCHAR(20) [CHECK]",
                "+ source_dataset: VARCHAR(50)",
                "+ source_atc_codes: VARCHAR(100)",
                "[U: pair_id, source_dataset]"
            ]
        },
        {
            "id": "ent_mechanisms", "name": "DDI_MECHANISMS", "x": 370, "y": 600, "w": 250, "h": 170, "color": "#FEF9C3", "border": "#CA8A04",
            "attrs": [
                "+ mechanism_id: BIGINT [PK]",
                "# pair_id: BIGINT [FK -> DDI_PAIRS]",
                "+ mechanism_category: VARCHAR(100)",
                "+ source_dataset: VARCHAR(50)",
                "[U: pair_id, mechanism_category]"
            ]
        },
        {
            "id": "ent_assessments", "name": "RISK_ASSESSMENTS", "x": 720, "y": 120, "w": 250, "h": 220, "color": "#F3E8FF", "border": "#9333EA",
            "attrs": [
                "+ assessment_id: BIGINT [PK]",
                "# patient_id: INT [FK -> PATIENTS]",
                "+ performed_by: VARCHAR(100) [FK]",
                "+ max_hop_depth: INT [CHECK 1..3]",
                "+ total_active_meds: INT",
                "+ direct_interaction_count: INT",
                "+ multi_hop_candidate_count: INT",
                "+ created_at: TIMESTAMPTZ"
            ]
        },
        {
            "id": "ent_findings", "name": "ASSESSMENT_FINDINGS", "x": 720, "y": 420, "w": 250, "h": 240, "color": "#FAF5FF", "border": "#7E22CE",
            "attrs": [
                "+ finding_id: BIGINT [PK]",
                "# assessment_id: BIGINT [FK]",
                "# drug_a_id: INT [FK -> DRUGS]",
                "# drug_b_id: INT [FK -> DRUGS]",
                "+ hop_count: INT [CHECK 1..3]",
                "+ traversal_path: TEXT",
                "+ severity_level: VARCHAR(20)",
                "+ mechanism_category: VARCHAR(100)",
                "+ finding_type: VARCHAR(50)"
            ]
        },
        {
            "id": "ent_patients", "name": "PATIENTS (SYNTHETIC)", "x": 1080, "y": 120, "w": 240, "h": 210, "color": "#DCFCE7", "border": "#16A34A",
            "attrs": [
                "+ patient_id: INT [PK]",
                "+ mrn: VARCHAR(50) [U, NOT NULL]",
                "+ full_name: VARCHAR(255)",
                "+ gender: VARCHAR(20) [CHECK]",
                "+ date_of_birth: DATE",
                "+ primary_condition: VARCHAR(255)",
                "+ is_synthetic: BOOLEAN [CHECK=T]",
                "+ created_at: TIMESTAMPTZ"
            ]
        },
        {
            "id": "ent_prescriptions", "name": "PRESCRIPTIONS", "x": 1080, "y": 410, "w": 240, "h": 230, "color": "#F0FDF4", "border": "#15803D",
            "attrs": [
                "+ prescription_id: INT [PK]",
                "# patient_id: INT [FK -> PATIENTS]",
                "# drug_id: INT [FK -> DRUGS]",
                "+ dosage: VARCHAR(100)",
                "+ frequency: VARCHAR(100)",
                "+ status: VARCHAR(20) [CHECK]",
                "+ prescribed_by: VARCHAR(100) [FK]",
                "+ start_date: DATE",
                "+ end_date: DATE"
            ]
        },
        {
            "id": "ent_users", "name": "USER_ACCOUNTS (RBAC)", "x": 1080, "y": 700, "w": 240, "h": 170, "color": "#FFE4E6", "border": "#E11D48",
            "attrs": [
                "+ user_id: INT [PK]",
                "+ username: VARCHAR(100) [U]",
                "+ password_hash: VARCHAR(255)",
                "+ full_name: VARCHAR(255)",
                "+ role: VARCHAR(20) [DOCTOR/ADMIN]",
                "+ is_active: BOOLEAN [DEFAULT TRUE]",
                "+ created_at: TIMESTAMPTZ"
            ]
        }
    ]

    for ent in entities:
        # Entity Header
        header_val = f"<b>{ent['name']}</b><hr>" + "<br>".join(ent['attrs'])
        cell = ET.SubElement(model_root, "mxCell", id=ent['id'], value=header_val, style=f"swimlane;fontStyle=0;childLayout=stackLayout;horizontal=1;startSize=26;fillColor={ent['color']};strokeColor={ent['border']};rounded=1;shadow=0;comic=0;labelBackgroundColor=none;strokeWidth=2;align=left;spacingLeft=8;fontSize=11;fontFamily=Helvetica;fontColor=#0F172A;verticalAlign=top;whiteSpace=wrap;", vertex="1", parent="1")
        ET.SubElement(cell, "mxGeometry", attrib={"as": "geometry", "x": str(ent['x']), "y": str(ent['y']), "width": str(ent['w']), "height": str(ent['h'])})

    relationships = [
        ("rel_1", "ent_drugs", "ent_mappings", "1", "0..N", "mapped_to"),
        ("rel_2", "ent_drugs", "ent_pairs", "1", "0..N", "participates_as_drug_A"),
        ("rel_3", "ent_drugs", "ent_pairs", "1", "0..N", "participates_as_drug_B"),
        ("rel_4", "ent_pairs", "ent_severities", "1", "0..1", "has_severity"),
        ("rel_5", "ent_pairs", "ent_mechanisms", "1", "0..N", "has_mechanisms"),
        ("rel_6", "ent_patients", "ent_prescriptions", "1", "0..N", "receives"),
        ("rel_7", "ent_drugs", "ent_prescriptions", "1", "0..N", "is_prescribed_in"),
        ("rel_8", "ent_patients", "ent_assessments", "1", "0..N", "undergoes"),
        ("rel_9", "ent_assessments", "ent_findings", "1", "0..N", "identifies"),
        ("rel_10", "ent_drugs", "ent_findings", "1", "0..N", "finding_drug_A"),
        ("rel_11", "ent_drugs", "ent_findings", "1", "0..N", "finding_drug_B"),
        ("rel_12", "ent_users", "ent_assessments", "1", "0..N", "evaluates"),
        ("rel_13", "ent_users", "ent_prescriptions", "1", "0..N", "prescribes")
    ]

    for rid, src, trg, src_card, trg_card, label in relationships:
        edge = ET.SubElement(model_root, "mxCell", id=rid, value=f"{src_card}  —  {label}  —  {trg_card}", style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;fontSize=10;fontColor=#475569;strokeColor=#64748B;strokeWidth=1.5;endArrow=ERzeroToMany;startArrow=ERone;", edge="1", parent="1", source=src, target=trg)
        ET.SubElement(edge, "mxGeometry", attrib={"as": "geometry", "relative": "1"})

    tree = ET.ElementTree(root)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    tree.write(output_path, encoding="utf-8", xml_declaration=True)
    print(f"Generated editable draw.io diagram: {output_path}")

def render_diagram_matplotlib(output_png="docs/database-design/ER_DIAGRAM.png", output_pdf="docs/database-design/ER_DIAGRAM.pdf"):
    fig, ax = plt.subplots(figsize=(24, 16), dpi=150)
    ax.set_xlim(0, 1500)
    ax.set_ylim(0, 1000)
    ax.axis("off")

    fig.patch.set_facecolor("#F8FAFC")

    # Title
    ax.text(750, 960, "Patient-Specific Multi-Hop Drug Interaction Risk Discovery", 
            fontsize=22, fontweight="bold", ha="center", va="center", color="#0F172A", fontfamily="sans-serif")
    ax.text(750, 930, "Conceptual & Relational Entity-Relationship (ER) Schema — PES University DBMS Level 3", 
            fontsize=14, fontstyle="italic", ha="center", va="center", color="#475569", fontfamily="sans-serif")

    # Boxes: (name, x, y, w, h, bg_color, border_color, attrs)
    boxes = [
        ("DRUGS", 50, 600, 260, 280, "#E0F2FE", "#0284C7", [
            "drug_id: INT [PK]",
            "canonical_name: VARCHAR(255) [U, NOT NULL]",
            "pubchem_cid: VARCHAR(50)",
            "inchikey: VARCHAR(50)",
            "smiles: TEXT",
            "drug_type: VARCHAR(100)",
            "therapeutic_class: TEXT",
            "created_at: TIMESTAMPTZ"
        ]),
        ("DRUG_SOURCE_MAPPINGS", 50, 280, 260, 240, "#F0F9FF", "#0369A1", [
            "mapping_id: INT [PK]",
            "drug_id: INT [FK -> DRUGS]",
            "source_name: VARCHAR(50) [CHECK]",
            "source_drug_id: VARCHAR(50)",
            "source_drug_name: VARCHAR(255)",
            "match_method: VARCHAR(50)",
            "UNIQUE(source_name, source_drug_id)"
        ]),
        ("DDI_PAIRS", 420, 650, 280, 230, "#FEF3C7", "#D97706", [
            "pair_id: BIGINT [PK]",
            "drug_a_id: INT [FK -> DRUGS]",
            "drug_b_id: INT [FK -> DRUGS]",
            "created_at: TIMESTAMPTZ",
            "CHECK (drug_a_id < drug_b_id)",
            "UNIQUE (drug_a_id, drug_b_id)"
        ]),
        ("DDI_SEVERITIES", 420, 390, 280, 200, "#FEF9C3", "#CA8A04", [
            "severity_id: BIGINT [PK]",
            "pair_id: BIGINT [FK -> DDI_PAIRS]",
            "severity_level: VARCHAR(20) [CHECK]",
            "source_dataset: VARCHAR(50) [DDInter]",
            "source_atc_codes: VARCHAR(100)",
            "UNIQUE (pair_id, source_dataset)"
        ]),
        ("DDI_MECHANISMS", 420, 130, 280, 200, "#FEF9C3", "#CA8A04", [
            "mechanism_id: BIGINT [PK]",
            "pair_id: BIGINT [FK -> DDI_PAIRS]",
            "mechanism_category: VARCHAR(100)",
            "source_dataset: VARCHAR(50) [MecDDI]",
            "UNIQUE (pair_id, category, source)"
        ]),
        ("RISK_ASSESSMENTS", 810, 650, 290, 240, "#F3E8FF", "#9333EA", [
            "assessment_id: BIGINT [PK]",
            "patient_id: INT [FK -> PATIENTS]",
            "performed_by: VARCHAR(100) [FK]",
            "max_hop_depth: INT [CHECK 1..3]",
            "total_active_meds: INT",
            "direct_interaction_count: INT",
            "multi_hop_candidate_count: INT",
            "created_at: TIMESTAMPTZ"
        ]),
        ("ASSESSMENT_FINDINGS", 810, 280, 290, 300, "#FAF5FF", "#7E22CE", [
            "finding_id: BIGINT [PK]",
            "assessment_id: BIGINT [FK]",
            "drug_a_id: INT [FK -> DRUGS]",
            "drug_b_id: INT [FK -> DRUGS]",
            "hop_count: INT [CHECK 1..3]",
            "traversal_path: TEXT",
            "severity_level: VARCHAR(20)",
            "mechanism_category: VARCHAR(100)",
            "finding_type: VARCHAR(50)"
        ]),
        ("PATIENTS (SYNTHETIC)", 1180, 660, 270, 230, "#DCFCE7", "#16A34A", [
            "patient_id: INT [PK]",
            "mrn: VARCHAR(50) [U, NOT NULL]",
            "full_name: VARCHAR(255)",
            "gender: VARCHAR(20) [CHECK]",
            "date_of_birth: DATE",
            "primary_condition: VARCHAR(255)",
            "is_synthetic: BOOLEAN [CHECK=T]",
            "created_at: TIMESTAMPTZ"
        ]),
        ("PRESCRIPTIONS", 1180, 360, 270, 240, "#F0FDF4", "#15803D", [
            "prescription_id: INT [PK]",
            "patient_id: INT [FK -> PATIENTS]",
            "drug_id: INT [FK -> DRUGS]",
            "dosage: VARCHAR(100)",
            "frequency: VARCHAR(100)",
            "status: VARCHAR(20) [CHECK]",
            "prescribed_by: VARCHAR(100) [FK]",
            "start_date: DATE, end_date: DATE"
        ]),
        ("USER_ACCOUNTS (RBAC)", 1180, 100, 270, 200, "#FFE4E6", "#E11D48", [
            "user_id: INT [PK]",
            "username: VARCHAR(100) [U]",
            "password_hash: VARCHAR(255)",
            "full_name: VARCHAR(255)",
            "role: VARCHAR(20) [DOCTOR/ADMIN]",
            "is_active: BOOLEAN [DEFAULT TRUE]",
            "created_at: TIMESTAMPTZ"
        ])
    ]

    for name, x, y, w, h, bg, border, attrs in boxes:
        # Background box
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=5", 
                                      facecolor=bg, edgecolor=border, linewidth=2, zorder=2)
        ax.add_patch(rect)
        # Header banner
        header_rect = patches.FancyBboxPatch((x, y + h - 35), w, 35, boxstyle="round,pad=3", 
                                            facecolor=border, edgecolor=border, linewidth=1, zorder=3)
        ax.add_patch(header_rect)
        ax.text(x + w / 2, y + h - 17, name, color="white", fontsize=11, fontweight="bold", 
                ha="center", va="center", zorder=4, fontfamily="sans-serif")
        
        # Attributes
        line_y = y + h - 55
        for attr in attrs:
            prefix = ""
            weight = "normal"
            color = "#1E293B"
            if "[PK]" in attr:
                weight = "bold"
                color = "#B91C1C"
            elif "[FK" in attr:
                color = "#4338CA"
            elif "[U" in attr or "[CHECK" in attr:
                color = "#047857"
                
            ax.text(x + 12, line_y, attr, fontsize=9.5, fontweight=weight, color=color, 
                    va="center", zorder=4, fontfamily="monospace")
            line_y -= 22

    # Draw connectors / relationships
    lines = [
        # (x1, y1, x2, y2, label)
        (180, 600, 180, 520, "1 : 0..N (mapped_to)"),
        (310, 750, 420, 750, "1 : 0..N (participates)"),
        (560, 650, 560, 590, "1 : 0..1 (has_severity)"),
        (560, 390, 560, 330, "1 : 0..N (has_mechanisms)"),
        (1315, 660, 1315, 600, "1 : 0..N (receives)"),
        (310, 680, 1180, 480, "1 : 0..N (is_prescribed)"),
        (1180, 760, 1100, 760, "1 : 0..N (undergoes)"),
        (945, 650, 945, 580, "1 : 0..N (identifies)"),
        (1315, 360, 1315, 300, "1 : 0..N (prescribes)"),
        (1180, 200, 1060, 670, "1 : 0..N (evaluates)")
    ]

    for x1, y1, x2, y2, lbl in lines:
        ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle="->", color="#64748B", lw=1.8, linestyle="--",
                                    connectionstyle="arc3,rad=0.05"), zorder=1)
        mid_x = (x1 + x2) / 2
        mid_y = (y1 + y2) / 2
        ax.text(mid_x, mid_y, lbl, fontsize=8.5, color="#334155", backgroundcolor="#FFFFFF",
                ha="center", va="center", zorder=5, bbox=dict(boxstyle="round,pad=0.2", facecolor="#F1F5F9", edgecolor="#CBD5E1", alpha=0.9))

    plt.tight_layout()
    plt.savefig(output_png, dpi=180, bbox_inches="tight")
    plt.savefig(output_pdf, bbox_inches="tight")
    plt.close()
    print(f"Generated PNG: {output_png}")
    print(f"Generated PDF: {output_pdf}")

if __name__ == "__main__":
    generate_drawio_xml()
    render_diagram_matplotlib()
