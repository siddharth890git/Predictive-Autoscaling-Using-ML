"""
SRS Markdown to PDF Converter (Playwright Version)
Converts docs/SRS.md into a professional PDF with full styling.
"""
import re
import markdown
import os
import asyncio
from playwright.async_api import async_playwright

SRS_PATH = "docs/SRS.md"
OUTPUT_PATH = "docs/SRS.pdf"
HTML_TEMP_PATH = "docs/temp_srs.html"

# ── Read the markdown source ──────────────────────────────────────
with open(SRS_PATH, "r", encoding="utf-8") as f:
    md_text = f.read()

# ── Strip HTML div/align tags GitHub uses ─────────────────────────
md_text = re.sub(r'<div[^>]*>', '', md_text)
md_text = re.sub(r'</div>', '', md_text)

# ── Convert Mermaid code blocks to styled diagram boxes ──────────
mermaid_counter = [0]

def replace_mermaid(match):
    mermaid_counter[0] += 1
    code = match.group(1).strip()

    title = f"Diagram {mermaid_counter[0]}"
    if "classDiagram" in code:
        title = "UML Class Diagram"
    elif "sequenceDiagram" in code:
        title = "UML Sequence Diagram — Dashboard Request Flow"
    elif "flowchart TD" in code or "flowchart LR" in code:
        if "SCALE_UP" in code or "SCALE UP" in code:
            title = "Control Flow Diagram — Autoscaling Decision Engine"
        elif "Phase 1" in code or "Training" in code:
            title = "Control Flow Diagram — End-to-End ML Pipeline"
        else:
            title = "Flowchart Diagram"
    elif "graph LR" in code or "graph TB" in code:
        if "Frontend Component" in code or "Backend Component" in code:
            title = "UML Component Diagram"
        elif "Actors" in code:
            title = "UML Use Case Diagram"
        elif "Data Layer" in code:
            title = "System Architecture — Product Perspective"
        elif "External Data" in code:
            title = "Data Flow Diagram (Level 0 — Context)"
        else:
            title = "Architecture Diagram"

    lines = code.split('\n')
    nodes = []
    for line in lines:
        labels = re.findall(r'\["([^"]+)"\]', line)
        for l in labels:
            clean = re.sub(r'<br/?>', ' ', l).strip()
            if clean and len(clean) > 2 and clean not in nodes:
                nodes.append(clean)

    desc_items = ""
    if nodes:
        items_html = "".join(f"<li>{n}</li>" for n in nodes[:12])
        desc_items = f"<p style='margin:4px 0 2px 0;font-size:10px;color:#555;'>Key elements:</p><ul style='font-size:10px;color:#555;margin:0;padding-left:20px;'>{items_html}</ul>"

    return f"""
<div class="mermaid-box">
    <div class="mermaid-icon">📊</div>
    <div class="mermaid-title">{title}</div>
    <div class="mermaid-note">This diagram renders interactively on GitHub. View it at:<br/>
    <a href="https://github.com/siddharth890git/Predictive-Autoscaling-Using-ML/blob/main/docs/SRS.md">github.com/.../docs/SRS.md</a></div>
    {desc_items}
</div>
"""

md_text = re.sub(r'```mermaid\s*\n(.*?)```', replace_mermaid, md_text, flags=re.DOTALL)

# ── Convert Markdown to HTML ──────────────────────────────────────
html_body = markdown.markdown(
    md_text,
    extensions=["tables", "fenced_code", "toc", "nl2br"],
)

# ── Build the full HTML document with professional styling ────────
html_full = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    body {{
        font-family: 'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
        font-size: 11px;
        line-height: 1.65;
        color: #1a1a2e;
        max-width: 100%;
        margin: 0;
        padding: 0;
    }}

    h1 {{
        font-size: 24px;
        font-weight: 700;
        color: #0f62fe;
        border-bottom: 3px solid #0f62fe;
        padding-bottom: 8px;
        margin-top: 30px;
        page-break-after: avoid;
    }}

    h2 {{
        font-size: 18px;
        font-weight: 600;
        color: #051438;
        border-bottom: 2px solid #e0e0e0;
        padding-bottom: 6px;
        margin-top: 28px;
        page-break-after: avoid;
    }}

    h3 {{
        font-size: 14px;
        font-weight: 600;
        color: #0f62fe;
        margin-top: 22px;
        page-break-after: avoid;
    }}

    h4 {{
        font-size: 12px;
        font-weight: 600;
        color: #333;
        margin-top: 16px;
        page-break-after: avoid;
    }}

    p {{
        margin: 6px 0;
        text-align: justify;
    }}

    strong {{
        font-weight: 600;
        color: #051438;
    }}

    code {{
        background: #f0f4f8;
        padding: 1px 5px;
        border-radius: 3px;
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 10px;
        color: #0f62fe;
    }}

    pre {{
        background: #1a1a2e;
        color: #e0e0e0;
        padding: 14px 18px;
        border-radius: 6px;
        font-size: 10px;
        line-height: 1.5;
        overflow-x: auto;
        page-break-inside: avoid;
    }}

    pre code {{
        background: none;
        color: #e0e0e0;
        padding: 0;
    }}

    table {{
        width: 100%;
        border-collapse: collapse;
        margin: 10px 0 16px 0;
        font-size: 10.5px;
        page-break-inside: avoid;
    }}

    th {{
        background: #0f62fe;
        color: white;
        font-weight: 600;
        text-align: left;
        padding: 8px 10px;
        font-size: 10px;
    }}

    td {{
        padding: 7px 10px;
        border-bottom: 1px solid #e8e8e8;
        vertical-align: top;
    }}

    tr:nth-child(even) td {{
        background: #f8f9fb;
    }}

    ul, ol {{
        padding-left: 22px;
        margin: 6px 0;
    }}

    li {{
        margin: 3px 0;
    }}

    hr {{
        border: none;
        border-top: 2px solid #e0e0e0;
        margin: 24px 0;
    }}

    a {{
        color: #0f62fe;
        text-decoration: none;
    }}

    .mermaid-box {{
        border: 2px dashed #0f62fe;
        border-radius: 10px;
        padding: 20px 24px;
        margin: 16px 0;
        background: linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%);
        text-align: center;
        page-break-inside: avoid;
    }}

    .mermaid-icon {{
        font-size: 28px;
        margin-bottom: 6px;
    }}

    .mermaid-title {{
        font-size: 13px;
        font-weight: 700;
        color: #0f62fe;
        margin-bottom: 6px;
    }}

    .mermaid-note {{
        font-size: 9.5px;
        color: #666;
        line-height: 1.5;
    }}

    /* Title page styling */
    body > h1:first-of-type {{
        text-align: center;
        font-size: 28px;
        border: none;
        margin-top: 80px;
        color: #0f62fe;
    }}

    blockquote {{
        border-left: 4px solid #0f62fe;
        margin: 12px 0;
        padding: 8px 16px;
        background: #f0f4ff;
        color: #333;
        font-style: italic;
    }}

</style>
</head>
<body>
{html_body}
</body>
</html>"""

# Write temp HTML
with open(HTML_TEMP_PATH, "w", encoding="utf-8") as f:
    f.write(html_full)

# ── Render PDF via Playwright ──────────────────────────────────────
async def render_pdf():
    print("Launching headless Chromium...")
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        # Load the HTML string directly (or from file)
        abs_path = "file:///" + os.path.abspath(HTML_TEMP_PATH).replace("\\", "/")
        await page.goto(abs_path, wait_until="networkidle")
        
        print("Generating PDF...")
        await page.pdf(
            path=OUTPUT_PATH,
            format="A4",
            print_background=True,
            margin={"top": "2cm", "right": "2.2cm", "bottom": "2.5cm", "left": "2.2cm"},
            display_header_footer=True,
            header_template="<span></span>",
            footer_template="""
            <div style="font-size: 8px; color: #888; text-align: center; width: 100%; padding: 0 20px; font-family: sans-serif; display: flex; justify-content: space-between;">
                <span>Software Requirements Specification — Predictive Autoscaling</span>
                <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
            </div>
            """
        )
        await browser.close()
    
    # Cleanup temp file
    if os.path.exists(HTML_TEMP_PATH):
        os.remove(HTML_TEMP_PATH)
    print(f"✅ PDF generated successfully: {OUTPUT_PATH}")

if __name__ == "__main__":
    asyncio.run(render_pdf())
