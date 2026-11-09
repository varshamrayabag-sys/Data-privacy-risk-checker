import io
from datetime import datetime
from typing import List, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.schemas.scan import ScanResponse


class PDFReportGenerator:
    """
    Generates professional, cybersecurity-themed PDF audit reports
    summarizing privacy risks, detected PII classifications, and mitigation steps.
    Never includes raw/unmasked sensitive data.
    """

    @staticmethod
    def generate_report(scan_data: ScanResponse) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Custom color scheme
        c_primary = colors.HexColor("#0f172a")     # Deep Slate/Navy
        c_accent = colors.HexColor("#0284c7")      # Cyan/Blue
        c_light_bg = colors.HexColor("#f8fafc")    # Light slate
        c_border = colors.HexColor("#cbd5e1")

        # Risk colors
        if scan_data.risk_assessment.category == "HIGH":
            risk_color = colors.HexColor("#ef4444")
            risk_bg = colors.HexColor("#fee2e2")
        elif scan_data.risk_assessment.category == "MEDIUM":
            risk_color = colors.HexColor("#f59e0b")
            risk_bg = colors.HexColor("#fef3c7")
        else:
            risk_color = colors.HexColor("#10b981")
            risk_bg = colors.HexColor("#d1fae5")

        # Custom paragraph styles
        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=22,
            textColor=c_primary,
            spaceAfter=4
        )
        subtitle_style = ParagraphStyle(
            "DocSubTitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=10,
            textColor=colors.HexColor("#64748b"),
            spaceAfter=15
        )
        section_style = ParagraphStyle(
            "SectionHeader",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=13,
            textColor=c_accent,
            spaceBefore=14,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            "DocBody",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#334155")
        )
        bold_style = ParagraphStyle(
            "DocBold",
            parent=body_style,
            fontName="Helvetica-Bold"
        )
        masked_code_style = ParagraphStyle(
            "MaskedCode",
            parent=body_style,
            fontName="Courier-Bold",
            fontSize=9,
            textColor=colors.HexColor("#0f172a")
        )

        story = []

        # 1. Header / Title Block
        story.append(Paragraph("DATA PRIVACY AUDIT REPORT", title_style))
        story.append(Paragraph("CONFIDENTIAL • CYBERSECURITY & PII RISK ASSESSMENT", subtitle_style))
        story.append(HRFlowable(width="100%", thickness=2, color=c_accent, spaceAfter=15))

        # 2. Executive Metadata & Risk Score Table
        risk_score_text = f"<b>{scan_data.risk_assessment.score} / 100</b> ({scan_data.risk_assessment.category} RISK)"
        meta_table_data = [
            [
                Paragraph("<b>Audit ID:</b>", bold_style),
                Paragraph(scan_data.scan_id, body_style),
                Paragraph("<b>Overall Privacy Risk:</b>", bold_style),
                Paragraph(f"<font color='{risk_color.hexval()}'><b>{risk_score_text}</b></font>", bold_style)
            ],
            [
                Paragraph("<b>Timestamp:</b>", bold_style),
                Paragraph(scan_data.timestamp, body_style),
                Paragraph("<b>Total PII Detected:</b>", bold_style),
                Paragraph(str(scan_data.total_entities_detected), body_style)
            ],
            [
                Paragraph("<b>Input Source:</b>", bold_style),
                Paragraph(f"{scan_data.input_type.upper()}{f' ({scan_data.document_name})' if scan_data.document_name else ''}", body_style),
                Paragraph("<b>Sensitivity Breakdown:</b>", bold_style),
                Paragraph(f"High: {scan_data.high_sensitivity_count} | Med: {scan_data.medium_sensitivity_count} | Low: {scan_data.low_sensitivity_count}", body_style)
            ]
        ]
        meta_table = Table(meta_table_data, colWidths=[90, 180, 110, 160])
        meta_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), c_light_bg),
            ("BOX", (0, 0), (-1, -1), 1, c_border),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, c_border),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 12))

        # 3. Assessment Summary Box
        story.append(Paragraph("<b>Executive Risk Summary</b>", section_style))
        summary_p = Paragraph(f"<b>Assessment:</b> {scan_data.risk_assessment.summary}", body_style)
        summary_table = Table([[summary_p]], colWidths=[540])
        summary_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), risk_bg),
            ("BOX", (0, 0), (-1, -1), 1, risk_color),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 10))

        # 4. Detected Entities Table (Masked Values Only)
        story.append(Paragraph("<b>Detected Sensitive Information (PII)</b>", section_style))
        if scan_data.detected_entities:
            entity_headers = [
                Paragraph("<b>Entity Category</b>", bold_style),
                Paragraph("<b>Sensitivity</b>", bold_style),
                Paragraph("<b>Confidence</b>", bold_style),
                Paragraph("<b>Verification Status</b>", bold_style),
                Paragraph("<b>Masked Representation</b>", bold_style),
            ]
            entity_rows = [entity_headers]
            for ent in scan_data.detected_entities:
                sens_color = "#ef4444" if ent.sensitivity_level == "HIGH" else ("#f59e0b" if ent.sensitivity_level == "MEDIUM" else "#10b981")
                val_status = "✓ Verified" if ent.is_validated else "Format Match"
                
                entity_rows.append([
                    Paragraph(ent.entity_type, body_style),
                    Paragraph(f"<font color='{sens_color}'><b>{ent.sensitivity_level}</b></font>", bold_style),
                    Paragraph(f"{int(ent.confidence_score * 100)}%", body_style),
                    Paragraph(f"<font size='8'>{val_status}</font>", body_style),
                    Paragraph(ent.masked_text, masked_code_style),
                ])

            ent_table = Table(entity_rows, colWidths=[110, 75, 65, 110, 180])
            ent_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, c_border),
                ("BOX", (0, 0), (-1, -1), 1, c_border),
            ]))
            story.append(ent_table)
        else:
            story.append(Paragraph("<i>No sensitive entities or PII were detected in this document.</i>", body_style))

        story.append(Spacer(1, 12))

        # 5. Risk Scoring Breakdown Table
        story.append(Paragraph("<b>Explainable Risk Scoring Breakdown</b>", section_style))
        if scan_data.risk_assessment.breakdown:
            breakdown_headers = [
                Paragraph("<b>Entity / Factor</b>", bold_style),
                Paragraph("<b>Count</b>", bold_style),
                Paragraph("<b>Base Weight</b>", bold_style),
                Paragraph("<b>Assigned Points</b>", bold_style),
                Paragraph("<b>Risk Rationale</b>", bold_style)
            ]
            breakdown_rows = [breakdown_headers]
            for b in scan_data.risk_assessment.breakdown:
                breakdown_rows.append([
                    Paragraph(b.entity_type, body_style),
                    Paragraph(str(b.count), body_style),
                    Paragraph(f"{b.weight_per_item} pts", body_style),
                    Paragraph(f"<b>+{b.total_points}</b>", bold_style),
                    Paragraph(f"<font size='8'>{b.explanation}</font>", body_style)
                ])

            breakdown_table = Table(breakdown_rows, colWidths=[120, 45, 65, 70, 240])
            breakdown_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, c_border),
                ("BOX", (0, 0), (-1, -1), 1, c_border),
            ]))
            story.append(breakdown_table)

        story.append(Spacer(1, 12))

        # 6. Actionable Privacy Recommendations
        story.append(Paragraph("<b>Actionable Privacy & Security Recommendations</b>", section_style))
        for rec in scan_data.recommendations:
            rec_box_color = colors.HexColor("#ef4444") if rec.severity == "CRITICAL" else (colors.HexColor("#f59e0b") if rec.severity == "WARNING" else colors.HexColor("#0284c7"))
            steps_text = "<br/>".join([f"• {step}" for step in rec.action_steps])
            rec_content = [
                Paragraph(f"<font color='{rec_box_color.hexval()}'><b>[{rec.severity}] {rec.title}</b></font>", bold_style),
                Spacer(1, 3),
                Paragraph(rec.description, body_style),
                Spacer(1, 3),
                Paragraph(f"<b>Remediation Steps:</b><br/>{steps_text}", body_style)
            ]
            rec_table = Table([[rec_content]], colWidths=[540])
            rec_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), c_light_bg),
                ("LINELEFT", (0, 0), (0, -1), 3, rec_box_color),
                ("BOX", (0, 0), (-1, -1), 0.5, c_border),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ]))
            story.append(rec_table)
            story.append(Spacer(1, 6))

        # 7. Compliance & Legal Disclaimer
        story.append(Spacer(1, 10))
        disclaimer_text = (
            "<b>Disclaimer:</b> This report was generated automatically by the Data Privacy Risk Checker. "
            "Detection is performed via natural language processing and deterministic pattern recognition. "
            "No raw PII is permanently stored or transmitted off-premise. Organizations must perform independent legal "
            "reviews to ensure compliance with the Digital Personal Data Protection Act (DPDP), GDPR, HIPAA, and PCI-DSS."
        )
        story.append(Paragraph(disclaimer_text, ParagraphStyle("Disclaimer", parent=body_style, fontSize=7, leading=10, textColor=colors.HexColor("#94a3b8"))))

        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes


pdf_generator = PDFReportGenerator()
