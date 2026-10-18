#!/usr/bin/env python3
"""
scripts/preprocessing/generate_chen_er_diagram.py

Generates end-to-end Peter Chen & (Min, Max) notation ER Diagrams as required by
the PES University DBMS Level 3 course specifications (matching ER_MODEL.pdf):
- Rectangles for Entity Sets
- Double Rectangles for Weak Entity Sets
- Diamonds for Relationship Sets
- Double Diamonds for Identifying Relationship Sets
- Ellipses for Attributes (Solid underline for PK, Dashed underline for Partial Key)
- Double Ellipses for Multivalued Attributes
- Dashed Ellipses for Derived Attributes
- Tree of Ellipses for Composite Attributes
- Double Lines for Total Participation
- Single Lines for Partial Participation
- Explicit Chen Cardinality (1, N, M) and Min-Max Structural Constraints (min, max)

Outputs:
1. docs/database-design/ER_DIAGRAM.drawio (Valid editable diagrams.net XML)
2. docs/database-design/ER_DIAGRAM.png (High-resolution raster export)
3. docs/database-design/ER_DIAGRAM.pdf (High-resolution vector PDF export)
"""

import os
import xml.etree.ElementTree as ET
import matplotlib.pyplot as plt
import matplotlib.patches as patches

# ==============================================================================
# 1. DRAW.IO (DIAGRAMS.NET) XML GENERATOR
# ==============================================================================

def generate_drawio_xml(output_path="docs/database-design/ER_DIAGRAM.drawio"):
    root = ET.Element("mxfile", attrib={
        "host": "app.diagrams.net",
        "modified": "2026-10-18T20:00:00.000Z",
        "agent": "Antigravity-PES-DBMS",
        "version": "21.0.0",
        "type": "device"
    })
    diagram = ET.SubElement(root, "diagram", attrib={"id": "chen-er-diagram", "name": "Chen & Min-Max ER Model"})
    mxGraphModel = ET.SubElement(diagram, "mxGraphModel", attrib={
        "dx": "2000", "dy": "1400", "grid": "1", "gridSize": "10", "guides": "1",
        "tooltips": "1", "connect": "1", "arrows": "1", "fold": "1", "page": "1",
        "pageScale": "1", "pageWidth": "2400", "pageHeight": "1700", "math": "0", "shadow": "0"
    })
    model_root = ET.SubElement(mxGraphModel, "root")
    
    ET.SubElement(model_root, "mxCell", attrib={"id": "0"})
    ET.SubElement(model_root, "mxCell", attrib={"id": "1", "parent": "0"})

    # Title Block
    title_val = "<b>Patient-Specific Multi-Hop Drug Interaction Risk Discovery</b><br>" \
                "<font style='font-size: 14px; font-weight: normal; color: #475569;'>" \
                "Conceptual Entity-Relationship Diagram — Peter Chen & (Min, Max) Notation " \
                "(PES University DBMS Level 3 — Course Standard)</font>"
    title_cell = ET.SubElement(model_root, "mxCell", attrib={
        "id": "title", "value": title_val,
        "style": "text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;"
                 "whiteSpace=wrap;rounded=0;fontSize=20;fontColor=#0F172A;fontFamily=Helvetica;",
        "vertex": "1", "parent": "1"
    })
    ET.SubElement(title_cell, "mxGeometry", attrib={"as": "geometry", "x": "600", "y": "25", "width": "1200", "height": "60"})

    # Legend Block
    legend_text = "<b>PES CSE ER NOTATION LEGEND (ER_MODEL.pdf):</b><br>" \
                  "• <b>Rectangle:</b> Strong Entity | <b>Double Rectangle:</b> Weak Entity<br>" \
                  "• <b>Diamond:</b> Relationship | <b>Double Diamond:</b> Identifying Relationship<br>" \
                  "• <b>Oval:</b> Attribute | <b><u>Underlined</u>:</b> Primary Key | <b>- - Underline:</b> Partial Key<br>" \
                  "• <b>Double Oval:</b> Multivalued | <b>Dashed Oval:</b> Derived | <b>Tree:</b> Composite<br>" \
                  "• <b>Single Line:</b> Partial Participation | <b>Double Line:</b> Total Participation<br>" \
                  "• <b>Labels:</b> Chen (1, N, M) and Structural Constraints (min, max)"
    legend_cell = ET.SubElement(model_root, "mxCell", attrib={
        "id": "legend", "value": legend_text,
        "style": "rounded=1;whiteSpace=wrap;html=1;fillColor=#F8FAFC;strokeColor=#94A3B8;strokeWidth=1.5;"
                 "align=left;spacingLeft=12;fontSize=11;fontFamily=Helvetica;fontColor=#1E293B;verticalAlign=middle;",
        "vertex": "1", "parent": "1"
    })
    ET.SubElement(legend_cell, "mxGeometry", attrib={"as": "geometry", "x": "1780", "y": "20", "width": "560", "height": "110"})

    # 1. ENTITY SETS
    entities = [
        # Strong Entities
        {"id": "ent_drug", "name": "<b>DRUG</b>", "x": 620, "y": 680, "w": 160, "h": 70, 
         "style": "rounded=0;whiteSpace=wrap;html=1;fillColor=#DBEAFE;strokeColor=#1D4ED8;strokeWidth=2.5;fontSize=14;fontFamily=Helvetica;fontColor=#1E3A8A;"},
        {"id": "ent_patient", "name": "<b>PATIENT</b><br><font style='font-size:10px;'>(SYNTHETIC)</font>", "x": 1620, "y": 680, "w": 170, "h": 70, 
         "style": "rounded=0;whiteSpace=wrap;html=1;fillColor=#DBEAFE;strokeColor=#1D4ED8;strokeWidth=2.5;fontSize=14;fontFamily=Helvetica;fontColor=#1E3A8A;"},
        {"id": "ent_user", "name": "<b>USER_ACCOUNT</b><br><font style='font-size:10px;'>(DOCTOR / ADMIN)</font>", "x": 1120, "y": 1400, "w": 180, "h": 70, 
         "style": "rounded=0;whiteSpace=wrap;html=1;fillColor=#DBEAFE;strokeColor=#1D4ED8;strokeWidth=2.5;fontSize=14;fontFamily=Helvetica;fontColor=#1E3A8A;"},
        
        # Weak Entities (Double Rectangle: shape=ext;double=1)
        {"id": "ent_mapping", "name": "<b>DRUG_SOURCE<br>MAPPING</b>", "x": 180, "y": 1140, "w": 170, "h": 75, 
         "style": "shape=ext;double=1;rounded=0;whiteSpace=wrap;html=1;fillColor=#DCFCE7;strokeColor=#15803D;strokeWidth=2;fontSize=13;fontFamily=Helvetica;fontColor=#14532D;"},
        {"id": "ent_prescription", "name": "<b>PRESCRIPTION</b>", "x": 1120, "y": 680, "w": 180, "h": 70, 
         "style": "shape=ext;double=1;rounded=0;whiteSpace=wrap;html=1;fillColor=#DCFCE7;strokeColor=#15803D;strokeWidth=2;fontSize=13;fontFamily=Helvetica;fontColor=#14532D;"},
        {"id": "ent_assessment", "name": "<b>RISK_ASSESSMENT</b>", "x": 1620, "y": 1140, "w": 180, "h": 70, 
         "style": "shape=ext;double=1;rounded=0;whiteSpace=wrap;html=1;fillColor=#DCFCE7;strokeColor=#15803D;strokeWidth=2;fontSize=13;fontFamily=Helvetica;fontColor=#14532D;"},
        {"id": "ent_finding", "name": "<b>ASSESSMENT<br>FINDING</b>", "x": 700, "y": 1140, "w": 180, "h": 75, 
         "style": "shape=ext;double=1;rounded=0;whiteSpace=wrap;html=1;fillColor=#DCFCE7;strokeColor=#15803D;strokeWidth=2;fontSize=13;fontFamily=Helvetica;fontColor=#14532D;"}
    ]

    for ent in entities:
        cell = ET.SubElement(model_root, "mxCell", attrib={
            "id": ent["id"], "value": ent["name"], "style": ent["style"], "vertex": "1", "parent": "1"
        })
        ET.SubElement(cell, "mxGeometry", attrib={
            "as": "geometry", "x": str(ent["x"]), "y": str(ent["y"]), "width": str(ent["w"]), "height": str(ent["h"])
        })

    # 2. RELATIONSHIPS (Diamonds & Double Diamonds)
    relationships = [
        # Recursive Relationship on DRUG (Diamond)
        {"id": "rel_interacts", "name": "<b>INTERACTS<br>WITH</b>", "x": 635, "y": 380, "w": 130, "h": 80, "double": False},
        
        # Identifying Relationships (Double Diamonds: shape=doubleRhombus)
        {"id": "rel_maps_to", "name": "<b>MAPS_TO</b>", "x": 370, "y": 1000, "w": 120, "h": 70, "double": True},
        {"id": "rel_prescribed_to", "name": "<b>PRESCRIBED<br>TO</b>", "x": 1390, "y": 680, "w": 130, "h": 70, "double": True},
        {"id": "rel_undergoes", "name": "<b>UNDERGOES</b>", "x": 1645, "y": 930, "w": 130, "h": 70, "double": True},
        {"id": "rel_produces_finding", "name": "<b>PRODUCES<br>FINDING</b>", "x": 1140, "y": 1140, "w": 140, "h": 70, "double": True},
        
        # Non-Identifying Relationships (Standard Diamonds)
        {"id": "rel_contains_drug", "name": "<b>CONTAINS<br>DRUG</b>", "x": 880, "y": 680, "w": 130, "h": 70, "double": False},
        {"id": "rel_written_by", "name": "<b>WRITTEN<br>BY</b>", "x": 1145, "y": 1030, "w": 130, "h": 70, "double": False},
        {"id": "rel_performed_by", "name": "<b>PERFORMED<br>BY</b>", "x": 1410, "y": 1270, "w": 130, "h": 70, "double": False},
        {"id": "rel_flags_drug", "name": "<b>FLAGS<br>DRUG</b>", "x": 670, "y": 930, "w": 120, "h": 70, "double": False}
    ]

    for rel in relationships:
        style = "rhombus;whiteSpace=wrap;html=1;fillColor=#FEF3C7;strokeColor=#D97706;strokeWidth=2;" \
                "fontSize=12;fontFamily=Helvetica;fontColor=#92400E;"
        if rel["double"]:
            style += "shape=doubleRhombus;"
        cell = ET.SubElement(model_root, "mxCell", attrib={
            "id": rel["id"], "value": rel["name"], "style": style, "vertex": "1", "parent": "1"
        })
        ET.SubElement(cell, "mxGeometry", attrib={
            "as": "geometry", "x": str(rel["x"]), "y": str(rel["y"]), "width": str(rel["w"]), "height": str(rel["h"])
        })

    # 3. ATTRIBUTES (Ovals, Double Ovals, Dashed Ovals)
    attributes = [
        # DRUG Attributes
        {"id": "att_d_id", "name": "<u><b>Drug_ID</b></u>", "x": 370, "y": 550, "w": 105, "h": 45, "type": "pk", "parent_ent": "ent_drug"},
        {"id": "att_d_name", "name": "Canonical_Name", "x": 485, "y": 515, "w": 125, "h": 45, "type": "std", "parent_ent": "ent_drug"},
        {"id": "att_d_cid", "name": "PubChem_CID", "x": 620, "y": 515, "w": 115, "h": 45, "type": "std", "parent_ent": "ent_drug"},
        {"id": "att_d_inchi", "name": "InChIKey", "x": 360, "y": 625, "w": 95, "h": 45, "type": "std", "parent_ent": "ent_drug"},
        {"id": "att_d_smiles", "name": "SMILES", "x": 360, "y": 700, "w": 90, "h": 45, "type": "std", "parent_ent": "ent_drug"},
        {"id": "att_d_type", "name": "Drug_Type", "x": 360, "y": 775, "w": 100, "h": 45, "type": "std", "parent_ent": "ent_drug"},
        {"id": "att_d_class", "name": "Therapeutic_Class", "x": 380, "y": 850, "w": 135, "h": 45, "type": "std", "parent_ent": "ent_drug"},
        {"id": "att_d_tot", "name": "Total_Interactions", "x": 525, "y": 880, "w": 135, "h": 45, "type": "derived", "parent_ent": "ent_drug"},
        {"id": "att_d_syn", "name": "Synonyms", "x": 670, "y": 880, "w": 110, "h": 45, "type": "multi", "parent_ent": "ent_drug"},

        # INTERACTS_WITH Relationship Attributes
        {"id": "att_i_sev", "name": "Severity_Level", "x": 790, "y": 320, "w": 115, "h": 45, "type": "std", "parent_ent": "rel_interacts"},
        {"id": "att_i_src", "name": "Evidence_Source", "x": 790, "y": 390, "w": 125, "h": 45, "type": "std", "parent_ent": "rel_interacts"},
        {"id": "att_i_atc", "name": "ATC_Codes", "x": 790, "y": 460, "w": 105, "h": 45, "type": "multi", "parent_ent": "rel_interacts"},
        {"id": "att_i_mech", "name": "Mechanism_<br>Categories", "x": 630, "y": 250, "w": 140, "h": 50, "type": "multi", "parent_ent": "rel_interacts"},

        # DRUG_SOURCE_MAPPING Attributes
        {"id": "att_m_id", "name": "- - <u>Source_Drug_ID</u>", "x": 60, "y": 1050, "w": 135, "h": 45, "type": "partial_key", "parent_ent": "ent_mapping"},
        {"id": "att_m_src", "name": "Source_Name", "x": 40, "y": 1130, "w": 105, "h": 45, "type": "std", "parent_ent": "ent_mapping"},
        {"id": "att_m_name", "name": "Source_Drug_Name", "x": 50, "y": 1210, "w": 135, "h": 45, "type": "std", "parent_ent": "ent_mapping"},
        {"id": "att_m_meth", "name": "Match_Method", "x": 120, "y": 1285, "w": 115, "h": 45, "type": "std", "parent_ent": "ent_mapping"},

        # PATIENT Attributes
        {"id": "att_p_id", "name": "<u><b>Patient_ID</b></u>", "x": 1845, "y": 560, "w": 105, "h": 45, "type": "pk", "parent_ent": "ent_patient"},
        {"id": "att_p_mrn", "name": "MRN", "x": 1865, "y": 630, "w": 85, "h": 45, "type": "std", "parent_ent": "ent_patient"},
        {"id": "att_p_name", "name": "Full_Name", "x": 1870, "y": 700, "w": 95, "h": 45, "type": "std", "parent_ent": "ent_patient"},
        {"id": "att_p_gender", "name": "Gender", "x": 1870, "y": 770, "w": 85, "h": 45, "type": "std", "parent_ent": "ent_patient"},
        {"id": "att_p_dob", "name": "Date_of_Birth", "x": 1840, "y": 840, "w": 110, "h": 45, "type": "std", "parent_ent": "ent_patient"},
        {"id": "att_p_age", "name": "Age", "x": 1740, "y": 890, "w": 80, "h": 45, "type": "derived", "parent_ent": "ent_patient"},
        {"id": "att_p_cond", "name": "Primary_Condition", "x": 1600, "y": 890, "w": 130, "h": 45, "type": "std", "parent_ent": "ent_patient"},
        {"id": "att_p_syn", "name": "is_synthetic", "x": 1470, "y": 890, "w": 105, "h": 45, "type": "std", "parent_ent": "ent_patient"},
        {"id": "att_p_addr", "name": "Address", "x": 1740, "y": 490, "w": 95, "h": 45, "type": "composite", "parent_ent": "ent_patient"},
        # Composite sub-attributes
        {"id": "att_p_city", "name": "City", "x": 1875, "y": 420, "w": 70, "h": 35, "type": "std", "parent_ent": "att_p_addr"},
        {"id": "att_p_state", "name": "State", "x": 1885, "y": 470, "w": 70, "h": 35, "type": "std", "parent_ent": "att_p_addr"},
        {"id": "att_p_pin", "name": "Pincode", "x": 1880, "y": 520, "w": 80, "h": 35, "type": "std", "parent_ent": "att_p_addr"},

        # USER_ACCOUNT Attributes
        {"id": "att_u_id", "name": "<u><b>User_ID</b></u>", "x": 960, "y": 1475, "w": 95, "h": 45, "type": "pk", "parent_ent": "ent_user"},
        {"id": "att_u_name", "name": "Username", "x": 1075, "y": 1525, "w": 95, "h": 45, "type": "std", "parent_ent": "ent_user"},
        {"id": "att_u_role", "name": "Role", "x": 1195, "y": 1525, "w": 85, "h": 45, "type": "std", "parent_ent": "ent_user"},
        {"id": "att_u_fname", "name": "Full_Name", "x": 1305, "y": 1485, "w": 95, "h": 45, "type": "std", "parent_ent": "ent_user"},
        {"id": "att_u_pwd", "name": "Password_Hash", "x": 1335, "y": 1400, "w": 115, "h": 45, "type": "std", "parent_ent": "ent_user"},

        # PRESCRIPTION Attributes
        {"id": "att_pr_id", "name": "- - <u>Prescription_ID</u>", "x": 1010, "y": 570, "w": 130, "h": 45, "type": "partial_key", "parent_ent": "ent_prescription"},
        {"id": "att_pr_dose", "name": "Dosage", "x": 1150, "y": 550, "w": 90, "h": 45, "type": "std", "parent_ent": "ent_prescription"},
        {"id": "att_pr_freq", "name": "Frequency", "x": 1260, "y": 565, "w": 90, "h": 45, "type": "std", "parent_ent": "ent_prescription"},
        {"id": "att_pr_stat", "name": "Status", "x": 990, "y": 640, "w": 80, "h": 45, "type": "std", "parent_ent": "ent_prescription"},
        {"id": "att_pr_start", "name": "Start_Date", "x": 1290, "y": 630, "w": 90, "h": 45, "type": "std", "parent_ent": "ent_prescription"},
        {"id": "att_pr_end", "name": "End_Date", "x": 1025, "y": 795, "w": 85, "h": 45, "type": "std", "parent_ent": "ent_prescription"},

        # RISK_ASSESSMENT Attributes
        {"id": "att_ra_id", "name": "- - <u>Assessment_ID</u>", "x": 1855, "y": 1080, "w": 130, "h": 45, "type": "partial_key", "parent_ent": "ent_assessment"},
        {"id": "att_ra_hop", "name": "Max_Hop_Depth", "x": 1875, "y": 1150, "w": 120, "h": 45, "type": "std", "parent_ent": "ent_assessment"},
        {"id": "att_ra_date", "name": "Assessment_Date", "x": 1865, "y": 1220, "w": 130, "h": 45, "type": "std", "parent_ent": "ent_assessment"},
        {"id": "att_ra_notes", "name": "Notes", "x": 1820, "y": 1290, "w": 80, "h": 45, "type": "std", "parent_ent": "ent_assessment"},
        {"id": "att_ra_act", "name": "Total_Active_Meds", "x": 1720, "y": 1330, "w": 130, "h": 45, "type": "derived", "parent_ent": "ent_assessment"},
        {"id": "att_ra_dir", "name": "Direct_Count", "x": 1585, "y": 1340, "w": 110, "h": 45, "type": "derived", "parent_ent": "ent_assessment"},
        {"id": "att_ra_cand", "name": "Candidate_Count", "x": 1465, "y": 1370, "w": 125, "h": 45, "type": "derived", "parent_ent": "ent_assessment"},

        # ASSESSMENT_FINDING Attributes
        {"id": "att_af_id", "name": "- - <u>Finding_ID</u>", "x": 585, "y": 1210, "w": 105, "h": 45, "type": "partial_key", "parent_ent": "ent_finding"},
        {"id": "att_af_hop", "name": "Hop_Count", "x": 615, "y": 1285, "w": 95, "h": 45, "type": "std", "parent_ent": "ent_finding"},
        {"id": "att_af_path", "name": "Traversal_Path", "x": 725, "y": 1325, "w": 115, "h": 45, "type": "std", "parent_ent": "ent_finding"},
        {"id": "att_af_sev", "name": "Severity_Level", "x": 850, "y": 1325, "w": 115, "h": 45, "type": "std", "parent_ent": "ent_finding"},
        {"id": "att_af_mech", "name": "Mechanism_Category", "x": 930, "y": 1265, "w": 145, "h": 45, "type": "std", "parent_ent": "ent_finding"},
        {"id": "att_af_type", "name": "Finding_Type", "x": 955, "y": 1195, "w": 105, "h": 45, "type": "std", "parent_ent": "ent_finding"},
        {"id": "att_af_src", "name": "Evidence_Sources", "x": 935, "y": 1120, "w": 125, "h": 45, "type": "std", "parent_ent": "ent_finding"}
    ]

    for att in attributes:
        base_style = "ellipse;whiteSpace=wrap;html=1;fontSize=10;fontFamily=Helvetica;fontColor=#0F172A;"
        if att["type"] == "pk":
            style = base_style + "fillColor=#EFF6FF;strokeColor=#2563EB;strokeWidth=2;fontStyle=1;"
        elif att["type"] == "partial_key":
            style = base_style + "fillColor=#F0FDF4;strokeColor=#16A34A;strokeWidth=1.5;"
        elif att["type"] == "derived":
            style = base_style + "fillColor=#F8FAFC;strokeColor=#64748B;strokeWidth=1.5;dashed=1;dashPattern=3 3;"
        elif att["type"] == "multi":
            style = base_style + "shape=doubleEllipse;fillColor=#FEF9C3;strokeColor=#CA8A04;strokeWidth=1.5;"
        elif att["type"] == "composite":
            style = base_style + "fillColor=#EDE9FE;strokeColor=#7C3AED;strokeWidth=1.5;fontStyle=1;"
        else:
            style = base_style + "fillColor=#F8FAFC;strokeColor=#64748B;strokeWidth=1.5;"

        cell = ET.SubElement(model_root, "mxCell", attrib={
            "id": att["id"], "value": att["name"], "style": style, "vertex": "1", "parent": "1"
        })
        ET.SubElement(cell, "mxGeometry", attrib={
            "as": "geometry", "x": str(att["x"]), "y": str(att["y"]), "width": str(att["w"]), "height": str(att["h"])
        })

        # Connect attribute to parent entity or parent composite attribute
        edge_style = "endArrow=none;html=1;strokeColor=#94A3B8;strokeWidth=1;"
        edge = ET.SubElement(model_root, "mxCell", attrib={
            "id": f"edge_{att['id']}", "style": edge_style, "edge": "1", "parent": "1",
            "source": att["id"], "target": att["parent_ent"]
        })
        ET.SubElement(edge, "mxGeometry", attrib={"as": "geometry", "relative": "1"})

    # 4. RELATIONSHIP CONNECTIONS (LINES WITH CHEN + MIN-MAX NOTATION)
    # Total participation uses double lines (strokeWidth=3.5 in drawio)
    rel_lines = [
        # 1. DRUG <-> INTERACTS_WITH (Recursive)
        {"id": "line_d_i1", "src": "ent_drug", "trg": "rel_interacts", "label": "Drug_A<br><b>(0, N) [M]</b>", 
         "total": False, "exitX": "0.3", "exitY": "0", "entryX": "0", "entryY": "0.5"},
        {"id": "line_d_i2", "src": "ent_drug", "trg": "rel_interacts", "label": "Drug_B<br><b>(0, N) [N]</b>", 
         "total": False, "exitX": "0.7", "exitY": "0", "entryX": "1", "entryY": "0.5"},

        # 2. DRUG <-> MAPS_TO <-> DRUG_SOURCE_MAPPING (Identifying)
        {"id": "line_d_map", "src": "ent_drug", "trg": "rel_maps_to", "label": "<b>(0, N) [1]</b>", "total": False},
        {"id": "line_map_m", "src": "rel_maps_to", "trg": "ent_mapping", "label": "<b>(1, 1) [N]</b>", "total": True},

        # 3. DRUG <-> CONTAINS_DRUG <-> PRESCRIPTION
        {"id": "line_d_cd", "src": "ent_drug", "trg": "rel_contains_drug", "label": "<b>(0, N) [1]</b>", "total": False},
        {"id": "line_cd_pr", "src": "rel_contains_drug", "trg": "ent_prescription", "label": "<b>(1, 1) [N]</b>", "total": True},

        # 4. PATIENT <-> PRESCRIBED_TO <-> PRESCRIPTION (Identifying)
        {"id": "line_p_pto", "src": "ent_patient", "trg": "rel_prescribed_to", "label": "<b>(0, N) [1]</b>", "total": False},
        {"id": "line_pto_pr", "src": "rel_prescribed_to", "trg": "ent_prescription", "label": "<b>(1, 1) [N]</b>", "total": True},

        # 5. USER_ACCOUNT <-> WRITTEN_BY <-> PRESCRIPTION
        {"id": "line_u_wb", "src": "ent_user", "trg": "rel_written_by", "label": "<b>(0, N) [1]</b>", "total": False},
        {"id": "line_wb_pr", "src": "rel_written_by", "trg": "ent_prescription", "label": "<b>(1, 1) [N]</b>", "total": True},

        # 6. PATIENT <-> UNDERGOES <-> RISK_ASSESSMENT (Identifying)
        {"id": "line_p_und", "src": "ent_patient", "trg": "rel_undergoes", "label": "<b>(0, N) [1]</b>", "total": False},
        {"id": "line_und_ra", "src": "rel_undergoes", "trg": "ent_assessment", "label": "<b>(1, 1) [N]</b>", "total": True},

        # 7. USER_ACCOUNT <-> PERFORMED_BY <-> RISK_ASSESSMENT
        {"id": "line_u_pb", "src": "ent_user", "trg": "rel_performed_by", "label": "<b>(0, N) [1]</b>", "total": False},
        {"id": "line_pb_ra", "src": "rel_performed_by", "trg": "ent_assessment", "label": "<b>(1, 1) [N]</b>", "total": True},

        # 8. RISK_ASSESSMENT <-> PRODUCES_FINDING <-> ASSESSMENT_FINDING (Identifying)
        {"id": "line_ra_pf", "src": "ent_assessment", "trg": "rel_produces_finding", "label": "<b>(0, N) [1]</b>", "total": False},
        {"id": "line_pf_af", "src": "rel_produces_finding", "trg": "ent_finding", "label": "<b>(1, 1) [N]</b>", "total": True},

        # 9. ASSESSMENT_FINDING <-> FLAGS_DRUG <-> DRUG
        {"id": "line_af_fd", "src": "ent_finding", "trg": "rel_flags_drug", "label": "<b>(1, 2) [N]</b>", "total": True},
        {"id": "line_fd_d", "src": "rel_flags_drug", "trg": "ent_drug", "label": "<b>(0, N) [M]</b>", "total": False}
    ]

    for line in rel_lines:
        line_style = "endArrow=none;html=1;fontSize=10;fontColor=#0F172A;labelBackgroundColor=#FFFFFF;"
        if line["total"]:
            line_style += "strokeWidth=3.5;strokeColor=#0F172A;" # Double line representation in draw.io
        else:
            line_style += "strokeWidth=1.5;strokeColor=#475569;"

        edge = ET.SubElement(model_root, "mxCell", attrib={
            "id": line["id"], "value": line["label"], "style": line_style, "edge": "1", "parent": "1",
            "source": line["src"], "target": line["trg"]
        })
        ET.SubElement(edge, "mxGeometry", attrib={"as": "geometry", "relative": "1"})

    tree = ET.ElementTree(root)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    tree.write(output_path, encoding="utf-8", xml_declaration=True)
    print(f"Generated draw.io XML: {output_path}")

# ==============================================================================
# 2. MATPLOTLIB HIGH-RESOLUTION EXPORTER (PNG & PDF)
# ==============================================================================

def render_chen_matplotlib(output_png="docs/database-design/ER_DIAGRAM.png", output_pdf="docs/database-design/ER_DIAGRAM.pdf"):
    fig, ax = plt.subplots(figsize=(26, 18), dpi=150)
    ax.set_xlim(0, 2400)
    ax.set_ylim(0, 1700)
    ax.axis("off")

    fig.patch.set_facecolor("#F8FAFC")

    # Title Block
    ax.text(1200, 1640, "Patient-Specific Multi-Hop Drug Interaction Risk Discovery", 
            fontsize=24, fontweight="bold", ha="center", va="center", color="#0F172A", fontfamily="sans-serif")
    ax.text(1200, 1605, "Complete Conceptual Entity-Relationship (ER) Diagram — Peter Chen & (Min, Max) Notation", 
            fontsize=15, fontstyle="italic", ha="center", va="center", color="#475569", fontfamily="sans-serif")
    ax.text(1200, 1580, "PES University DBMS Level 3 (August–December 2026) | Dr. Nagasundari S Standards Alignment", 
            fontsize=12, ha="center", va="center", color="#64748B", fontfamily="sans-serif")

    # Legend Block
    legend_box = patches.FancyBboxPatch((1780, 1490), 570, 150, boxstyle="round,pad=10",
                                        facecolor="#FFFFFF", edgecolor="#94A3B8", linewidth=1.5, zorder=2)
    ax.add_patch(legend_box)
    legend_str = (
        "PES CSE ER NOTATION LEGEND (ER_MODEL.pdf):\n"
        "• Rectangle: Strong Entity Set  |  Double Rectangle: Weak Entity Set\n"
        "• Diamond: Relationship Set     |  Double Diamond: Identifying Relationship\n"
        "• Oval: Attribute              |  Underlined: Primary Key  |  Dashed Underline: Partial Key\n"
        "• Double Oval: Multivalued      |  Dashed Oval: Derived     |  Tree: Composite\n"
        "• Single Line: Partial Participation (0, N) | Double Line: Total Participation (1, 1)\n"
        "• Cardinality: Chen Notation (1, N, M) & Structural Constraints (min, max)"
    )
    ax.text(1800, 1565, legend_str, fontsize=10, color="#1E293B", va="center", fontfamily="monospace", zorder=3)

    # Coordinates dictionary for connecting lines: id -> (cx, cy)
    centers = {}

    # 1. ENTITIES
    # (id, name, cx, cy, w, h, is_weak, fill, border)
    entities_data = [
        ("ent_drug", "DRUG", 700, 1000, 170, 70, False, "#DBEAFE", "#1D4ED8"),
        ("ent_patient", "PATIENT\n(SYNTHETIC)", 1700, 1000, 170, 70, False, "#DBEAFE", "#1D4ED8"),
        ("ent_user", "USER_ACCOUNT\n(DOCTOR/ADMIN)", 1200, 250, 190, 75, False, "#DBEAFE", "#1D4ED8"),
        ("ent_mapping", "DRUG_SOURCE\nMAPPING", 260, 520, 180, 75, True, "#DCFCE7", "#15803D"),
        ("ent_prescription", "PRESCRIPTION", 1200, 1000, 180, 70, True, "#DCFCE7", "#15803D"),
        ("ent_assessment", "RISK_ASSESSMENT", 1700, 520, 190, 70, True, "#DCFCE7", "#15803D"),
        ("ent_finding", "ASSESSMENT\nFINDING", 780, 520, 180, 75, True, "#DCFCE7", "#15803D")
    ]

    for eid, name, cx, cy, w, h, is_weak, fill, border in entities_data:
        centers[eid] = (cx, cy)
        # Main Box
        x, y = cx - w / 2, cy - h / 2
        rect = patches.Rectangle((x, y), w, h, facecolor=fill, edgecolor=border, linewidth=2.5, zorder=3)
        ax.add_patch(rect)
        if is_weak:
            # Double rectangle inner box
            inner_rect = patches.Rectangle((x + 5, y + 5), w - 10, h - 10, facecolor="none", edgecolor=border, linewidth=1.5, zorder=3)
            ax.add_patch(inner_rect)
        ax.text(cx, cy, name, fontsize=11, fontweight="bold", ha="center", va="center", color="#0F172A", zorder=4, fontfamily="sans-serif")

    # 2. RELATIONSHIPS
    # (id, name, cx, cy, w, h, is_identifying)
    relationships_data = [
        ("rel_interacts", "INTERACTS\nWITH", 700, 1320, 140, 85, False),
        ("rel_maps_to", "MAPS_TO", 450, 680, 130, 75, True),
        ("rel_prescribed_to", "PRESCRIBED\nTO", 1450, 1000, 140, 75, True),
        ("rel_undergoes", "UNDERGOES", 1700, 750, 140, 75, True),
        ("rel_produces_finding", "PRODUCES\nFINDING", 1210, 520, 150, 75, True),
        ("rel_contains_drug", "CONTAINS\nDRUG", 950, 1000, 140, 75, False),
        ("rel_written_by", "WRITTEN\nBY", 1200, 650, 130, 75, False),
        ("rel_performed_by", "PERFORMED\nBY", 1470, 390, 140, 75, False),
        ("rel_flags_drug", "FLAGS\nDRUG", 730, 750, 130, 75, False)
    ]

    for rid, name, cx, cy, w, h, is_ident in relationships_data:
        centers[rid] = (cx, cy)
        # Diamond polygon
        pts = [[cx, cy + h / 2], [cx + w / 2, cy], [cx, cy - h / 2], [cx - w / 2, cy]]
        diamond = patches.Polygon(pts, closed=True, facecolor="#FEF3C7", edgecolor="#D97706", linewidth=2.5, zorder=3)
        ax.add_patch(diamond)
        if is_ident:
            # Inner diamond
            w2, h2 = w - 14, h - 14
            pts_inner = [[cx, cy + h2 / 2], [cx + w2 / 2, cy], [cx, cy - h2 / 2], [cx - w2 / 2, cy]]
            diamond_inner = patches.Polygon(pts_inner, closed=True, facecolor="none", edgecolor="#D97706", linewidth=1.5, zorder=3)
            ax.add_patch(diamond_inner)
        ax.text(cx, cy, name, fontsize=10, fontweight="bold", ha="center", va="center", color="#92400E", zorder=4, fontfamily="sans-serif")

    # 3. ATTRIBUTES
    # (id, name, cx, cy, w, h, type, parent_id)
    attributes_data = [
        # DRUG Attributes
        ("att_d_id", "Drug_ID", 420, 1150, 110, 45, "pk", "ent_drug"),
        ("att_d_name", "Canonical_Name", 540, 1180, 130, 45, "std", "ent_drug"),
        ("att_d_cid", "PubChem_CID", 680, 1180, 120, 45, "std", "ent_drug"),
        ("att_d_inchi", "InChIKey", 420, 1070, 100, 45, "std", "ent_drug"),
        ("att_d_smiles", "SMILES", 410, 1000, 95, 45, "std", "ent_drug"),
        ("att_d_type", "Drug_Type", 420, 925, 105, 45, "std", "ent_drug"),
        ("att_d_class", "Therapeutic_Class", 440, 850, 140, 45, "std", "ent_drug"),
        ("att_d_tot", "Total_Interactions", 580, 820, 140, 45, "derived", "ent_drug"),
        ("att_d_syn", "Synonyms", 720, 820, 115, 45, "multi", "ent_drug"),

        # INTERACTS_WITH Relationship Attributes
        ("att_i_sev", "Severity_Level", 860, 1375, 120, 45, "std", "rel_interacts"),
        ("att_i_src", "Evidence_Source", 860, 1310, 130, 45, "std", "rel_interacts"),
        ("att_i_atc", "ATC_Codes", 860, 1245, 110, 45, "multi", "rel_interacts"),
        ("att_i_mech", "Mechanism_\nCategories", 700, 1465, 145, 50, "multi", "rel_interacts"),

        # DRUG_SOURCE_MAPPING Attributes
        ("att_m_id", "Source_Drug_ID", 130, 610, 140, 45, "partial_key", "ent_mapping"),
        ("att_m_src", "Source_Name", 100, 530, 110, 45, "std", "ent_mapping"),
        ("att_m_name", "Source_Drug_Name", 110, 450, 140, 45, "std", "ent_mapping"),
        ("att_m_meth", "Match_Method", 200, 375, 120, 45, "std", "ent_mapping"),

        # PATIENT Attributes
        ("att_p_id", "Patient_ID", 1920, 1140, 110, 45, "pk", "ent_patient"),
        ("att_p_mrn", "MRN", 1940, 1070, 90, 45, "std", "ent_patient"),
        ("att_p_name", "Full_Name", 1950, 1000, 100, 45, "std", "ent_patient"),
        ("att_p_gender", "Gender", 1940, 930, 90, 45, "std", "ent_patient"),
        ("att_p_dob", "Date_of_Birth", 1910, 860, 115, 45, "std", "ent_patient"),
        ("att_p_age", "Age", 1800, 810, 85, 45, "derived", "ent_patient"),
        ("att_p_cond", "Primary_Condition", 1660, 810, 135, 45, "std", "ent_patient"),
        ("att_p_syn", "is_synthetic", 1520, 810, 110, 45, "std", "ent_patient"),
        ("att_p_addr", "Address", 1800, 1210, 100, 45, "composite", "ent_patient"),
        ("att_p_city", "City", 1950, 1275, 75, 38, "std", "att_p_addr"),
        ("att_p_state", "State", 1955, 1225, 75, 38, "std", "att_p_addr"),
        ("att_p_pin", "Pincode", 1950, 1175, 85, 38, "std", "att_p_addr"),

        # USER_ACCOUNT Attributes
        ("att_u_id", "User_ID", 1020, 175, 100, 45, "pk", "ent_user"),
        ("att_u_name", "Username", 1140, 125, 100, 45, "std", "ent_user"),
        ("att_u_role", "Role", 1260, 125, 90, 45, "std", "ent_user"),
        ("att_u_fname", "Full_Name", 1370, 170, 100, 45, "std", "ent_user"),
        ("att_u_pwd", "Password_Hash", 1390, 250, 120, 45, "std", "ent_user"),

        # PRESCRIPTION Attributes
        ("att_pr_id", "Prescription_ID", 1070, 1130, 135, 45, "partial_key", "ent_prescription"),
        ("att_pr_dose", "Dosage", 1200, 1150, 95, 45, "std", "ent_prescription"),
        ("att_pr_freq", "Frequency", 1315, 1130, 95, 45, "std", "ent_prescription"),
        ("att_pr_stat", "Status", 1050, 1060, 85, 45, "std", "ent_prescription"),
        ("att_pr_start", "Start_Date", 1350, 1060, 95, 45, "std", "ent_prescription"),
        ("att_pr_end", "End_Date", 1080, 895, 90, 45, "std", "ent_prescription"),

        # RISK_ASSESSMENT Attributes
        ("att_ra_id", "Assessment_ID", 1930, 580, 135, 45, "partial_key", "ent_assessment"),
        ("att_ra_hop", "Max_Hop_Depth", 1950, 510, 125, 45, "std", "ent_assessment"),
        ("att_ra_date", "Assessment_Date", 1940, 440, 135, 45, "std", "ent_assessment"),
        ("att_ra_notes", "Notes", 1880, 370, 85, 45, "std", "ent_assessment"),
        ("att_ra_act", "Total_Active_Meds", 1770, 335, 135, 45, "derived", "ent_assessment"),
        ("att_ra_dir", "Direct_Count", 1630, 335, 115, 45, "derived", "ent_assessment"),
        ("att_ra_cand", "Candidate_Count", 1510, 305, 130, 45, "derived", "ent_assessment"),

        # ASSESSMENT_FINDING Attributes
        ("att_af_id", "Finding_ID", 640, 445, 110, 45, "partial_key", "ent_finding"),
        ("att_af_hop", "Hop_Count", 670, 375, 100, 45, "std", "ent_finding"),
        ("att_af_path", "Traversal_Path", 780, 335, 120, 45, "std", "ent_finding"),
        ("att_af_sev", "Severity_Level", 905, 335, 120, 45, "std", "ent_finding"),
        ("att_af_mech", "Mechanism_\nCategory", 990, 395, 145, 48, "std", "ent_finding"),
        ("att_af_type", "Finding_Type", 1010, 470, 110, 45, "std", "ent_finding"),
        ("att_af_src", "Evidence_Sources", 985, 545, 130, 45, "std", "ent_finding")
    ]

    for aid, name, cx, cy, w, h, atype, pid in attributes_data:
        centers[aid] = (cx, cy)
        # Line to parent
        px, py = centers[pid]
        ax.plot([cx, px], [cy, py], color="#94A3B8", linewidth=1.2, zorder=1)

        # Oval patch
        dash = [4, 4] if atype == "derived" else []
        ls = "--" if atype == "derived" else "-"
        fill = "#EFF6FF" if atype == "pk" else ("#F0FDF4" if atype == "partial_key" else ("#FEF9C3" if atype == "multi" else ("#EDE9FE" if atype == "composite" else "#FFFFFF")))
        border = "#2563EB" if atype == "pk" else ("#16A34A" if atype == "partial_key" else ("#CA8A04" if atype == "multi" else ("#7C3AED" if atype == "composite" else "#64748B")))
        lw = 2.0 if atype in ["pk", "composite"] else 1.5

        ellipse = patches.Ellipse((cx, cy), w, h, facecolor=fill, edgecolor=border, linewidth=lw, linestyle=ls, zorder=3)
        ax.add_patch(ellipse)
        if atype == "multi":
            # Inner ellipse
            inner_el = patches.Ellipse((cx, cy), w - 8, h - 8, facecolor="none", edgecolor=border, linewidth=1.5, zorder=3)
            ax.add_patch(inner_el)

        # Text inside oval
        font_weight = "bold" if atype in ["pk", "composite"] else "normal"
        text_color = "#1E3A8A" if atype == "pk" else ("#14532D" if atype == "partial_key" else "#0F172A")
        ax.text(cx, cy, name, fontsize=8.5, fontweight=font_weight, ha="center", va="center", color=text_color, zorder=4, fontfamily="sans-serif")
        
        # Solid underline for primary keys
        if atype == "pk":
            ax.plot([cx - w / 3.2, cx + w / 3.2], [cy - 6, cy - 6], color=border, linewidth=1.8, zorder=5)
        # Dashed underline for partial keys
        elif atype == "partial_key":
            ax.plot([cx - w / 3.0, cx + w / 3.0], [cy - 6, cy - 6], color=border, linewidth=1.5, linestyle="--", zorder=5)

    # 4. RELATIONSHIP LINES (WITH CHEN & MIN-MAX LABELS)
    # (src, trg, label, is_total, text_offset_x, text_offset_y)
    rel_lines_data = [
        # DRUG <-> INTERACTS_WITH (Recursive)
        ("ent_drug", "rel_interacts", "Drug_A\n(0, N) [M]", False, -85, 0),
        ("ent_drug", "rel_interacts", "Drug_B\n(0, N) [N]", False, 85, 0),

        # DRUG <-> MAPS_TO <-> DRUG_SOURCE_MAPPING (Identifying)
        ("ent_drug", "rel_maps_to", "(0, N) [1]", False, 30, 25),
        ("rel_maps_to", "ent_mapping", "(1, 1) [N]", True, -35, -25),

        # DRUG <-> CONTAINS_DRUG <-> PRESCRIPTION
        ("ent_drug", "rel_contains_drug", "(0, N) [1]", False, 0, 25),
        ("rel_contains_drug", "ent_prescription", "(1, 1) [N]", True, 0, 25),

        # PATIENT <-> PRESCRIBED_TO <-> PRESCRIPTION (Identifying)
        ("ent_patient", "rel_prescribed_to", "(0, N) [1]", False, 0, 25),
        ("rel_prescribed_to", "ent_prescription", "(1, 1) [N]", True, 0, 25),

        # USER_ACCOUNT <-> WRITTEN_BY <-> PRESCRIPTION
        ("ent_user", "rel_written_by", "(0, N) [1]", False, 45, 0),
        ("rel_written_by", "ent_prescription", "(1, 1) [N]", True, 45, 0),

        # PATIENT <-> UNDERGOES <-> RISK_ASSESSMENT (Identifying)
        ("ent_patient", "rel_undergoes", "(0, N) [1]", False, 55, 0),
        ("rel_undergoes", "ent_assessment", "(1, 1) [N]", True, 55, 0),

        # USER_ACCOUNT <-> PERFORMED_BY <-> RISK_ASSESSMENT
        ("ent_user", "rel_performed_by", "(0, N) [1]", False, -25, 25),
        ("rel_performed_by", "ent_assessment", "(1, 1) [N]", True, -25, 25),

        # RISK_ASSESSMENT <-> PRODUCES_FINDING <-> ASSESSMENT_FINDING (Identifying)
        ("ent_assessment", "rel_produces_finding", "(0, N) [1]", False, 0, 25),
        ("rel_produces_finding", "ent_finding", "(1, 1) [N]", True, 0, 25),

        # ASSESSMENT_FINDING <-> FLAGS_DRUG <-> DRUG
        ("ent_finding", "rel_flags_drug", "(1, 2) [N]", True, -35, 25),
        ("rel_flags_drug", "ent_drug", "(0, N) [M]", False, -35, 25)
    ]

    for src_id, trg_id, label, is_total, off_x, off_y in rel_lines_data:
        x1, y1 = centers[src_id]
        x2, y2 = centers[trg_id]

        if src_id == "ent_drug" and trg_id == "rel_interacts":
            # Curved recursive lines
            if "Drug_A" in label:
                pts_x = [x1 - 35, x1 - 35, x2 - 40]
                pts_y = [y1 + 35, (y1 + y2) / 2, y2]
                ax.plot(pts_x, pts_y, color="#1E293B", linewidth=2.0, zorder=2)
                mid_x, mid_y = x1 - 50, (y1 + y2) / 2
            else:
                pts_x = [x1 + 35, x1 + 35, x2 + 40]
                pts_y = [y1 + 35, (y1 + y2) / 2, y2]
                ax.plot(pts_x, pts_y, color="#1E293B", linewidth=2.0, zorder=2)
                mid_x, mid_y = x1 + 50, (y1 + y2) / 2
        else:
            if is_total:
                # Double line for total participation (two closely spaced parallel lines)
                dx, dy = x2 - x1, y2 - y1
                dist = (dx**2 + dy**2)**0.5
                if dist > 0:
                    px, py = -dy / dist * 3.5, dx / dist * 3.5
                    ax.plot([x1 + px, x2 + px], [y1 + py, y2 + py], color="#0F172A", linewidth=2.0, zorder=2)
                    ax.plot([x1 - px, x2 - px], [y1 - py, y2 - py], color="#0F172A", linewidth=2.0, zorder=2)
                else:
                    ax.plot([x1, x2], [y1, y2], color="#0F172A", linewidth=3.5, zorder=2)
            else:
                ax.plot([x1, x2], [y1, y2], color="#334155", linewidth=2.0, zorder=2)
            mid_x = (x1 + x2) / 2 + off_x
            mid_y = (y1 + y2) / 2 + off_y

        # Label bubble
        ax.text(mid_x, mid_y, label, fontsize=9.5, fontweight="bold", color="#0F172A",
                ha="center", va="center", zorder=5,
                bbox=dict(boxstyle="round,pad=0.25", facecolor="#FFFFFF", edgecolor="#CBD5E1", alpha=0.95))

    plt.tight_layout()
    plt.savefig(output_png, dpi=180, bbox_inches="tight")
    plt.savefig(output_pdf, bbox_inches="tight")
    plt.close()
    print(f"Generated High-Res PNG: {output_png}")
    print(f"Generated Vector PDF: {output_pdf}")

if __name__ == "__main__":
    generate_drawio_xml()
    render_chen_matplotlib()
