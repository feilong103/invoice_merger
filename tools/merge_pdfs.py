from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors
import fitz  # PyMuPDF
import io

def pdf_page_to_image(pdf_path, zoom=3):
    """
    把 PDF 的第一页转成 ImageReader 对象
    zoom: 放大倍数，提高清晰度，默认 3x
    """
    doc = fitz.open(pdf_path)
    page = doc[0]
    pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom))
    img_bytes = pix.tobytes("ppm")
    return ImageReader(io.BytesIO(img_bytes)), pix.width, pix.height

def merge_pdfs_2up_professional_hd(pdf_paths, output_file="merged_2up_hd.pdf", margin=15, line_color=colors.grey, line_width=0.5, dash=(4, 4)):
    """
    每页放两张发票，上下排列，中间加虚线分割线，高清渲染
    dash: 虚线模式 (实线长度, 间隔长度)
    """
    page_width, page_height = A4
    c = canvas.Canvas(output_file, pagesize=A4)

    cell_width = page_width
    cell_height = page_height / 2  # 上下各一张

    for idx, pdf in enumerate(pdf_paths):
        img, img_w, img_h = pdf_page_to_image(pdf)

        row = idx % 2  # 上下
        x = margin
        y = page_height - (row + 1) * cell_height + margin

        # 缩放比例，保持宽高比
        scale_w = (cell_width - 2*margin) / img_w
        scale_h = (cell_height - 2*margin) / img_h
        scale = min(scale_w, scale_h)

        c.saveState()
        c.translate(x, y)
        c.scale(scale, scale)
        c.drawImage(img, 0, 0, mask=None, preserveAspectRatio=True)
        c.restoreState()

        # 如果是上半页，画虚线分割
        if row == 0:
            line_y = page_height / 2
            c.setStrokeColor(line_color)
            c.setLineWidth(line_width)
            c.setDash(dash)  # 虚线
            c.line(margin, line_y, page_width - margin, line_y)
            c.setDash()  # 恢复实线模式

        # 每页两张换页
        if row == 1:
            c.showPage()

    # 最后一页可能只放了一张
    if len(pdf_paths) % 2 != 0:
        c.showPage()

    c.save()

def merge_pdfs_4up_professional_hd(
    pdf_paths,
    output_file="merged_4up_hd.pdf",
    margin=10,
    line_color=colors.grey,
    line_width=0.4,
    dash=(4, 4)
):
    """
    每页显示 4 张发票（2x2），横向 A4，高清渲染
    """

    # ⚡ 纸张横向
    page_width, page_height = landscape(A4)
    c = canvas.Canvas(output_file, pagesize=landscape(A4))

    # ⚡ 2x2 格子大小
    cell_w = page_width / 2
    cell_h = page_height / 2

    for idx, pdf in enumerate(pdf_paths):
        img, img_w, img_h = pdf_page_to_image(pdf)

        # 当前格子序号 0~3
        pos = idx % 4

        # 行列位置
        row = pos // 2    # 0 或 1
        col = pos % 2     # 0 或 1

        # 左下角坐标
        x = col * cell_w + margin
        y = page_height - (row + 1) * cell_h + margin

        # 计算缩放，使图片在 cell 内适配
        scale_w = (cell_w - 2 * margin) / img_w
        scale_h = (cell_h - 2 * margin) / img_h
        scale = min(scale_w, scale_h)

        # 绘制图片
        c.saveState()
        c.translate(x, y)
        c.scale(scale, scale)
        c.drawImage(img, 0, 0, preserveAspectRatio=True, mask=None)
        c.restoreState()

        # 每页 4 张，画分割线（只画一次）
        if pos == 0:
            # 中间竖线
            c.setStrokeColor(line_color)
            c.setLineWidth(line_width)
            c.setDash(dash)
            c.line(page_width / 2, margin, page_width / 2, page_height - margin)

            # 中间横线
            c.line(margin, page_height / 2, page_width - margin, page_height / 2)
            c.setDash()  # 恢复实线

        # 每 4 张发票换页
        if pos == 3:
            c.showPage()

    # 如果最后一页未满 4，仍需要 showPage
    if len(pdf_paths) % 4 != 0:
        c.showPage()

    c.save()

# 用法示例
# pdf_files = ["invoice1.pdf", "invoice2.pdf", "invoice3.pdf", "invoice4.pdf"]
# merge_pdfs_2up_professional_hd(pdf_files, output_file="invoices_2up_hd.pdf")