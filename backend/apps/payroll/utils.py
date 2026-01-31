import os
from io import BytesIO
import decimal
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.units import inch

def generate_payslip_pdf(payslip):
    """
    Generate a high-fidelity PDF payslip matching the User's reference design.
    Uses Courier font for a professional white-paper look.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=A4, 
        rightMargin=40, 
        leftMargin=40, 
        topMargin=40, 
        bottomMargin=40
    )
    
    # Define styles using Courier
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Normal'],
        fontName='Courier-Bold',
        fontSize=20,
        letterSpacing=1,
        spaceAfter=2
    )
    
    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Normal'],
        fontName='Courier-Bold',
        fontSize=11,
        textColor=colors.HexColor('#333333'),
        spaceBefore=0
    )
    
    company_style = ParagraphStyle(
        'CompanyStyle',
        parent=styles['Normal'],
        fontName='Courier-Bold',
        fontSize=14,
        alignment=2 # Right align
    )
    
    address_style = ParagraphStyle(
        'AddressStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=9,
        textColor=colors.HexColor('#666666'),
        alignment=2 # Right align
    )
    
    label_style = ParagraphStyle(
        'LabelStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=9,
        textColor=colors.HexColor('#666666'),
        textTransform='uppercase'
    )
    
    value_bold_style = ParagraphStyle(
        'ValueBoldStyle',
        parent=styles['Normal'],
        fontName='Courier-Bold',
        fontSize=12,
        textColor=colors.black
    )
    
    net_payable_style = ParagraphStyle(
        'NetPayableStyle',
        parent=styles['Normal'],
        fontName='Courier-Bold',
        fontSize=20,
        alignment=2
    )

    def format_val(val):
        return f"Rs.{val:,.2f}"

    elements = []

    # 1. Header (PAYSLIP and Company Info)
    # Using a 2-row table for perfect separation to prevent text overlap
    company_name = "Company Name"
    if payslip.employee and payslip.employee.company:
        company_name = payslip.employee.company.name
        
    header_data = [
        [Paragraph("PAYSLIP", title_style), Paragraph(company_name, company_style)],
        [Paragraph(payslip.payroll_period.name if payslip.payroll_period else "", subtitle_style), 
         Paragraph("123 Business Rd, Tech City", address_style)]
    ]
    header_table = Table(header_data, colWidths=[3.5*inch, 3.5*inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8), # Add padding between rows
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 5))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.black))
    elements.append(Spacer(1, 20))

    # 2. Metadata Section (Employee Details and Pay Summary)
    emp_full_name = getattr(payslip.employee, 'full_name', 'Employee Name')
    emp_id = getattr(payslip.employee, 'employee_id', 'Unknown ID')
    emp_designation = "Staff"
    if payslip.employee and payslip.employee.designation:
        emp_designation = payslip.employee.designation.name

    meta_data = [
        [Paragraph("EMPLOYEE DETAILS", label_style), "", Paragraph("PAY SUMMARY", label_style), ""],
        [Paragraph(f"<b>{emp_full_name}</b>", value_bold_style), "", 
         Paragraph("Gross Pay:", label_style), Paragraph(format_val(payslip.gross_earnings), value_bold_style)],
        [Paragraph(str(emp_id), styles['Normal']), "", 
         Paragraph("Net Pay:", label_style), Paragraph(format_val(payslip.net_salary), value_bold_style)],
        [Paragraph(emp_designation.upper(), label_style), "", "", ""]
    ]
    meta_table = Table(meta_data, colWidths=[2.5*inch, 0.5*inch, 2.5*inch, 1.5*inch])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 30))

    # 3. Earnings and Deductions Tables
    earnings = [[Paragraph("Earnings", ParagraphStyle('E', fontName='Courier-Bold', fontSize=11, textColor=colors.HexColor('#166534'))), ""]]
    earning_components = payslip.components.filter(component__component_type='earning')
    if earning_components.exists():
        for comp in earning_components:
            earnings.append([comp.component.name, format_val(comp.amount)])
    else:
        earnings.append(["-", format_val(0)])
    
    e_style = [
        ('BOX', (0,0), (-1,-1), 1, colors.black),
        ('FONTNAME', (0,0), (-1,0), 'Courier-Bold'),
        ('FONTNAME', (0,1), (-1,-1), 'Courier'),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('LINEBELOW', (0,0), (-1,0), 0.5, colors.grey),
        ('GRID', (0,1), (-1,-1), 0.5, colors.HexColor('#eeeeee')),
        ('PADDING', (0,0), (-1,-1), 8),
    ]

    deductions = [[Paragraph("Deductions", ParagraphStyle('D', fontName='Courier-Bold', fontSize=11, textColor=colors.HexColor('#991b1b'))), ""]]
    deduction_components = payslip.components.filter(component__component_type='deduction')
    if deduction_components.exists():
        for comp in deduction_components:
            deductions.append([comp.component.name, format_val(comp.amount)])
    else:
        deductions.append(["-", format_val(0)])
    
    # Re-using side-by-side tables logic with totals added inside
    earnings.append([Paragraph("<b>Total Earnings</b>", label_style), Paragraph(f"<b>{format_val(payslip.gross_earnings)}</b>", value_bold_style)])
    deductions.append([Paragraph("<b>Total Deductions</b>", label_style), Paragraph(f"<b>{format_val(payslip.total_deductions)}</b>", value_bold_style)])

    e_table = Table(earnings, colWidths=[1.5*inch, 1.3*inch])
    e_table.setStyle(TableStyle(e_style + [('LINEABOVE', (0, -1), (-1, -1), 1, colors.black)]))

    d_table = Table(deductions, colWidths=[1.5*inch, 1.3*inch])
    d_table.setStyle(TableStyle(e_style + [('LINEABOVE', (0, -1), (-1, -1), 1, colors.black)]))

    body_data = [[e_table, Spacer(0.4*inch, 0), d_table]]
    body_table = Table(body_data, colWidths=[2.8*inch, 0.4*inch, 2.8*inch])
    body_table.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')]))
    elements.append(body_table)
    elements.append(Spacer(1, 40))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.black))
    elements.append(Spacer(1, 10))

    # 5. Footer
    footer_data = [
        [Paragraph("Generated automatically by System", label_style), Paragraph("NET PAYABLE", label_style)],
        ["", Paragraph(format_val(payslip.net_salary), net_payable_style)]
    ]
    footer_table = Table(footer_data, colWidths=[4.2*inch, 2.8*inch])
    footer_table.setStyle(TableStyle([('ALIGN', (1,0), (1,1), 'RIGHT')]))
    elements.append(footer_table)

    doc.build(elements)
    buffer.seek(0)
    return buffer
