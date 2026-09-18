import io
import os
import tempfile
import requests
from PIL import Image as PILImage, ImageDraw
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.units import inch

# ---------------------------------------------------------------------------
# Brand assets / colors — kept in sync with the frontend (ResultSlip.jsx)
# ---------------------------------------------------------------------------
LOGO_URL = "https://pub-8e6b93e949904a4483a44991b1520604.r2.dev/public/britannia-logo.png"

# The frontend falls back to local static files ("/female-shadow.png" and
# "/male-shadow.png") served from the React app's public/ folder. The PDF is
# generated server-side, so it needs a URL it can actually fetch — these are
# assumed to be hosted alongside the logo on the same R2 bucket. If they live
# somewhere else, just update these two constants.
FEMALE_SHADOW_URL = "https://pub-8e6b93e949904a4483a44991b1520604.r2.dev/public/female-shadow.png"
MALE_SHADOW_URL = "https://pub-8e6b93e949904a4483a44991b1520604.r2.dev/public/male-shadow.png"

# Combined authorized-signature + academy seal graphic, shown at the foot of
# the result slip. Native size is ~396x196 (roughly 2:1) — keep that ratio
# whenever it's resized.
SIGNATURE_CREST_URL = "https://pub-8e6b93e949904a4483a44991b1520604.r2.dev/public/britania-logo-crest.png"

NAVY = colors.HexColor("#0f172a")
ORANGE = colors.HexColor("#c2410c")
CREAM = colors.HexColor("#fdf6e3")
GRAY_50 = colors.HexColor("#f9fafb")
GRAY_100 = colors.HexColor("#f3f4f6")
GRAY_300 = colors.HexColor("#d1d5db")
GRAY_500 = colors.HexColor("#64748b")
GRAY_800 = colors.HexColor("#1f2937")


def fetch_image_from_url(url, width, height):
    """Securely fetch an image from a URL (like R2) into memory for the PDF."""
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            image_stream = io.BytesIO(response.content)
            return Image(image_stream, width=width, height=height)
    except Exception as e:
        print(f"Failed to fetch image for PDF: {e}")
    return None  # Return None if fetch fails; layout handles it


def _make_footer_icon_file(kind, color_hex="#c2410c", size_px=64):
    """
    Draws a small pin / globe / mail / phone glyph with Pillow and saves it
    to a temp PNG file (ReportLab's inline <img> tag in a Paragraph needs a
    real file path). Caller is responsible for deleting the returned path
    once the PDF has been built.
    """
    r, g, b = (int(color_hex.lstrip('#')[i:i + 2], 16) for i in (0, 2, 4))
    stroke = (r, g, b, 255)
    lw = max(3, size_px // 11)

    img = PILImage.new("RGBA", (size_px, size_px), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if kind == "pin":
        cx, cy, rad = size_px * 0.5, size_px * 0.38, size_px * 0.30
        draw.polygon([
            (cx - rad * 0.62, cy + rad * 0.5),
            (cx + rad * 0.62, cy + rad * 0.5),
            (cx, size_px * 0.90),
        ], fill=stroke)
        draw.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], outline=stroke, width=lw)
        inner = rad * 0.4
        draw.ellipse([cx - inner, cy - inner, cx + inner, cy + inner], fill=(0, 0, 0, 0))

    elif kind == "globe":
        cx, cy, rad = size_px / 2, size_px / 2, size_px * 0.40
        draw.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], outline=stroke, width=lw)
        draw.ellipse([cx - rad * 0.42, cy - rad, cx + rad * 0.42, cy + rad], outline=stroke, width=lw)
        draw.line([cx - rad, cy, cx + rad, cy], fill=stroke, width=lw)

    elif kind == "mail":
        pad_x, top, bottom = size_px * 0.10, size_px * 0.22, size_px * 0.78
        draw.rectangle([pad_x, top, size_px - pad_x, bottom], outline=stroke, width=lw)
        draw.line([pad_x, top, size_px / 2, size_px * 0.52], fill=stroke, width=lw)
        draw.line([size_px - pad_x, top, size_px / 2, size_px * 0.52], fill=stroke, width=lw)

    elif kind == "phone":
        x0, y0 = size_px * 0.24, size_px * 0.80
        x1, y1 = size_px * 0.76, size_px * 0.24
        draw.line([x0, y0, x1, y1], fill=stroke, width=int(lw * 1.8))
        cap = lw * 1.2
        draw.ellipse([x0 - cap, y0 - cap, x0 + cap, y0 + cap], fill=stroke)
        draw.ellipse([x1 - cap, y1 - cap, x1 + cap, y1 + cap], fill=stroke)

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=f"_{kind}.png")
    img.save(tmp.name, format="PNG")
    tmp.close()
    return tmp.name


def generate_result_pdf(student, record):
    """
    Generates a PDF result slip in memory that mirrors the ResultSlip.jsx
    layout used on the frontend.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=40, leftMargin=40,
        topMargin=40, bottomMargin=40
    )

    elements = []
    styles = getSampleStyleSheet()

    # ------------------------------------------------------------------
    # Custom paragraph styles
    # ------------------------------------------------------------------
    title_style = ParagraphStyle(
        'BritanniaTitle', parent=styles['Heading1'],
        fontName='Helvetica-Bold', fontSize=16, leading=19,
        textColor=NAVY, alignment=0, spaceAfter=2
    )
    subtitle_style = ParagraphStyle(
        'BritanniaSubtitle', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=10, leading=12,
        textColor=ORANGE, alignment=0
    )
    section_header_style = ParagraphStyle(
        'SectionHeader', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=10,
        textColor=colors.whitesmoke, alignment=0
    )
    label_style = ParagraphStyle(
        'FieldLabel', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=8,
        textColor=GRAY_500
    )
    value_style = ParagraphStyle(
        'FieldValue', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=10,
        textColor=GRAY_800
    )
    value_style_lg = ParagraphStyle(
        'FieldValueLarge', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=13,
        textColor=NAVY
    )
    subject_style = ParagraphStyle(
        'Subject', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=9,
        textColor=GRAY_800
    )
    grade_style = ParagraphStyle(
        'Grade', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=12,
        textColor=ORANGE, alignment=1
    )
    mark_style = ParagraphStyle(
        'Mark', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=9,
        textColor=GRAY_800, alignment=1
    )
    remark_style = ParagraphStyle(
        'Remark', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=7,
        textColor=GRAY_500, alignment=1
    )
    col_header_style = ParagraphStyle(
        'ColHeader', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=8, textColor=GRAY_800
    )
    approved_label_style = ParagraphStyle(
        'ApprovedLabel', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=8, textColor=GRAY_500,
        alignment=1, spaceAfter=4  # 1 = centered
    )
    footer_style = ParagraphStyle(
        'Footer', parent=styles['Normal'],
        fontName='Helvetica', fontSize=7.5, textColor=GRAY_500,
        alignment=1, leading=11  # 1 = centered
    )

    # ------------------------------------------------------------------
    # 1. Header — logo + school name / subtitle on a cream background,
    #    with a thick navy rule beneath it (matches the JSX header block)
    # ------------------------------------------------------------------
    logo_img = fetch_image_from_url(LOGO_URL, 0.7 * inch, 0.7 * inch)
    header_content = [
        Paragraph("BRITANNIA INTERNATIONAL ACADEMY", title_style),
        Paragraph("OFFICIAL RESULT STATEMENT", subtitle_style),
    ]

    header_table = Table(
        [[logo_img if logo_img else "", header_content]],
        colWidths=[1 * inch, 6 * inch]
    )
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CREAM),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (0, 0), 'CENTER'),
        ('LEFTPADDING', (0, 0), (-1, -1), 14),
        ('RIGHTPADDING', (0, 0), (-1, -1), 14),
        ('TOPPADDING', (0, 0), (-1, -1), 14),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 14),
    ]))
    elements.append(header_table)

    # Thick navy rule under the header (border-b-[6px] border-[#0f172a])
    rule = Table([[""]], colWidths=[7 * inch], rowHeights=[6])
    rule.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), NAVY)]))
    elements.append(rule)
    elements.append(Spacer(1, 20))

    # ------------------------------------------------------------------
    # 2. Candidate's Details section
    # ------------------------------------------------------------------
    elements.append(_section_header("CANDIDATE'S DETAILS", section_header_style))

    target_photo = student.photo_url
    if not target_photo:
        if student.gender and student.gender.lower() == 'female':
            target_photo = FEMALE_SHADOW_URL
        else:
            target_photo = MALE_SHADOW_URL

    # Plain inline photo — no bordered/backgrounded frame, just the image
    # itself, matching the frontend's unframed <img> treatment.
    photo_img = fetch_image_from_url(target_photo, 1.2 * inch, 1.2 * inch)
    photo_cell_content = photo_img if photo_img else Paragraph("PHOTO", label_style)
    photo_cell = Table([[photo_cell_content]], colWidths=[1.5 * inch], rowHeights=[1.5 * inch])
    photo_cell.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))

    details_rows = [
        [Paragraph("STUDENT ID NUMBER", label_style),
         Paragraph(student.student_id, value_style_lg)],
        [Paragraph("CANDIDATE NAME", label_style),
         Paragraph(f"{student.first_name} {student.last_name}".upper(), value_style)],
        [Paragraph("TYPE OF EXAMINATION", label_style),
         Paragraph(record.exam_type.name.upper(), value_style)],
        [Paragraph("EXAMINATION YEAR", label_style),
         Paragraph(record.academic_year.year_string.upper(), value_style)],
    ]
    details_left = Table(details_rows, colWidths=[2 * inch, 3 * inch])
    details_left.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), GRAY_50),
        ('GRID', (0, 0), (-1, -1), 0.75, GRAY_300),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))

    details_outer = Table(
        [[details_left, photo_cell]],
        colWidths=[5 * inch, 2 * inch]
    )
    details_outer.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 1, GRAY_300),
        ('LINEAFTER', (0, 0), (0, 0), 1, GRAY_300),
        ('ALIGN', (1, 0), (1, 0), 'CENTER'),
        ('VALIGN', (1, 0), (1, 0), 'MIDDLE'),
        ('LEFTPADDING', (1, 0), (1, 0), 10),
        ('RIGHTPADDING', (1, 0), (1, 0), 10),
        ('TOPPADDING', (1, 0), (1, 0), 10),
        ('BOTTOMPADDING', (1, 0), (1, 0), 10),
        ('LEFTPADDING', (0, 0), (0, 0), 0),
        ('RIGHTPADDING', (0, 0), (0, 0), 0),
        ('TOPPADDING', (0, 0), (0, 0), 0),
        ('BOTTOMPADDING', (0, 0), (0, 0), 0),
    ]))
    elements.append(details_outer)
    elements.append(Spacer(1, 24))

    # ------------------------------------------------------------------
    # 3. Statement of Results section
    # ------------------------------------------------------------------
    elements.append(_section_header("STATEMENT OF RESULTS", section_header_style))

    results_data = [[
        Paragraph("SUBJECT", col_header_style),
        Paragraph("GRADE", col_header_style),
        Paragraph("MARK", col_header_style),
        Paragraph("REMARK", col_header_style),
    ]]

    for item in record.items:
        results_data.append([
            Paragraph(item.subject.name.upper(), subject_style),
            Paragraph(str(item.grade), grade_style),
            Paragraph(str(item.mark), mark_style),
            Paragraph(item.remark.upper() if item.remark else "", remark_style),
        ])

    results_table = Table(results_data, colWidths=[2.8 * inch, 1.4 * inch, 1.4 * inch, 1.4 * inch])
    results_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), GRAY_100),
        ('LINEBELOW', (0, 0), (-1, 0), 1, GRAY_300),
        ('GRID', (0, 0), (-1, -1), 0.75, GRAY_300),
        ('BOX', (0, 0), (-1, -1), 1, GRAY_300),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
    ]))
    elements.append(results_table)

    # ------------------------------------------------------------------
    # 4. Approved by — authorized signature + academy seal, right-aligned
    #    below a thin divider (matches the border-t block in ResultSlip.jsx)
    # ------------------------------------------------------------------
    elements.append(Spacer(1, 28))

    signature_img = fetch_image_from_url(SIGNATURE_CREST_URL, 1.8 * inch, 0.89 * inch)
    signature_block = Table(
        [[Paragraph("APPROVED BY", approved_label_style)],
         [signature_img if signature_img else ""]],
        colWidths=[1.8 * inch]
    )
    signature_block.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))

    signature_row = Table([["", signature_block]], colWidths=[5.2 * inch, 1.8 * inch])
    signature_row.setStyle(TableStyle([
        ('LINEABOVE', (0, 0), (-1, 0), 1, GRAY_300),
        ('ALIGN', (1, 0), (1, 0), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 16),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(signature_row)

    # ------------------------------------------------------------------
    # 5. Institutional contact footer — address, website, email, phone,
    #    each preceded by a small icon (matches the icon row in
    #    ResultSlip.jsx). ReportLab's <img> tag needs a real file path, so
    #    the icons are rendered to temp PNGs and cleaned up after doc.build().
    # ------------------------------------------------------------------
    elements.append(Spacer(1, 24))

    icon_paths = {
        "pin": _make_footer_icon_file("pin"),
        "globe": _make_footer_icon_file("globe"),
        "mail": _make_footer_icon_file("mail"),
        "phone": _make_footer_icon_file("phone"),
    }

    footer_content = Paragraph(
        f'<img src="{icon_paths["pin"]}" width="8" height="8" valign="-1.5"/>&nbsp;'
        'Bartle House, Oxford Court, Manchester, England'
        '&nbsp;&nbsp;&nbsp;&nbsp;'
        f'<img src="{icon_paths["globe"]}" width="8" height="8" valign="-1.5"/>&nbsp;'
        'www.britacademy.uk'
        '&nbsp;&nbsp;&nbsp;&nbsp;'
        f'<img src="{icon_paths["mail"]}" width="8" height="8" valign="-1.5"/>&nbsp;'
        'admissions@britacademy.uk'
        '&nbsp;&nbsp;&nbsp;&nbsp;'
        f'<img src="{icon_paths["phone"]}" width="8" height="8" valign="-1.5"/>&nbsp;'
        '+44 7448 889731',
        footer_style
    )
    footer_bar = Table([[footer_content]], colWidths=[7 * inch])
    footer_bar.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), GRAY_50),
        ('LINEABOVE', (0, 0), (-1, 0), 1, GRAY_300),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(footer_bar)

    try:
        doc.build(elements)
    finally:
        for path in icon_paths.values():
            try:
                os.unlink(path)
            except OSError:
                pass

    buffer.seek(0)
    return buffer


def _section_header(text, style):
    """A full-width navy bar used for the 'CANDIDATE'S DETAILS' and
    'STATEMENT OF RESULTS' headers, matching the dark section headers in the
    JSX (bg-[#0f172a] text-white)."""
    t = Table([[Paragraph(text, style)]], colWidths=[7 * inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), NAVY),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    return t