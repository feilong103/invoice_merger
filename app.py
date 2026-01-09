from flask import Flask, render_template, request, send_file, jsonify, abort
import os
import tempfile
import shutil
import threading
from pathlib import Path
from werkzeug.utils import secure_filename

# 导入发票合并核心程序
from tools.merge_pdfs import merge_pdfs_2up_professional_hd, merge_pdfs_4up_professional_hd

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 1000 * 1024 * 1024  # 1000 MB 文件大小限制
app.config['UPLOAD_FOLDER'] = tempfile.mkdtemp()

# 允许上传的扩展名
ALLOWED_EXTENSIONS = {'pdf'}

# 添加 CORS 支持
@app.after_request
def after_request(response):
    response.headers.add('Accept-Ranges', 'bytes')
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

def allowed_file(filename):
    """检查文件扩展名"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    """主页"""
    return render_template('index.html')

@app.route('/merge', methods=['POST'])
def merge_pdfs():
    """
    处理PDF合并请求
    支持大量文件上传和两种合并模式
    """
    try:
        # 检查文件数量
        files = [v for k, v in request.files.items() if k.startswith('file_')]
        
        if not files:
            abort(400, "未选择任何文件")

        # 检查文件数量上限
        if len(files) > 1000:
            abort(400, "文件数量超过1000个限制")

        # 验证所有文件
        for file in files:
            if not allowed_file(file.filename):
                abort(400, f"文件 {file.filename} 不是PDF格式")
            if file.content_length and file.content_length > 10 * 1024 * 1024:  # 10MB文件大小限制
                abort(400, f"文件 {file.filename} 超过10MB大小限制")

        # 获取合并选项
        merge_mode = request.form.get('merge_mode', '2up')
        output_name = request.form.get('output_name', 'merged_invoices')
        output_name = secure_filename(output_name)
        if not output_name:
            output_name = 'merged_invoices'

        # 创建临时目录
        temp_dir = tempfile.mkdtemp(prefix='invoice_merge_')
        upload_dir = os.path.join(temp_dir, 'uploads')
        os.makedirs(upload_dir)

        # 保存所有上传的文件
        pdf_paths = []
        for idx, file in enumerate(files):
            # 提取原始文件名（去除路径，仅取文件名）
            original_filename = os.path.basename(file.filename)
            filename = f"{idx:04d}_{secure_filename(original_filename)}"
            file_path = os.path.join(upload_dir, filename)
            file.save(file_path)
            
            # 验证文件是否是PDF
            if not os.path.isfile(file_path):
                continue
            try:
                # 更宽松的PDF验证，使用文件扩展名和文件头检查
                with open(file_path, 'rb') as f:
                    header = f.read(10)  # 读取更多字节以提高兼容性
                    # 检查 PDF 文件头（可以是标准的 %PDF-x.x 或其他常见变体）
                    pdf_header_valid = header.startswith(b'%PDF') or b'%PDF' in header[:100]
                    if not pdf_header_valid:
                        print(f"警告：文件 {original_filename} 看起来不是有效的PDF文件，跳过")
                        continue
            except Exception:
                print(f"警告：无法读取文件 {original_filename}，跳过")
                continue
                
            pdf_paths.append(file_path)

        if not pdf_paths:
            shutil.rmtree(temp_dir)
            abort(400, "没有有效的PDF文件")

        # 生成输出文件路径
        output_path = os.path.join(temp_dir, f"{output_name}.pdf")

        # 执行合并
        try:
            if merge_mode == '4up':
                # 使用4up合并模式
                merge_pdfs_4up_professional_hd(pdf_paths, output_path)
            else:
                # 使用默认2up合并模式
                merge_pdfs_2up_professional_hd(pdf_paths, output_path)
        except Exception as e:
            print(f"合并PDF时出错：{e}")
            shutil.rmtree(temp_dir, ignore_errors=True)
            abort(500, f"合并PDF失败：{str(e)}")

        # 检查输出文件是否存在
        if not os.path.exists(output_path):
            shutil.rmtree(temp_dir, ignore_errors=True)
            abort(500, "无法生成输出文件")

        # 异步清理临时文件的函数
        def delayed_cleanup(file_path):
            """10分钟后清理临时文件"""
            import time
            time.sleep(600)  # 10分钟
            try:
                base_dir = os.path.dirname(file_path)
                shutil.rmtree(base_dir, ignore_errors=True)
                print(f"已清理临时文件：{base_dir}")
            except Exception as e:
                print(f"清理临时文件失败：{e}")

        cleanup_thread = threading.Thread(target=delayed_cleanup, args=(output_path,))
        cleanup_thread.daemon = True
        cleanup_thread.start()

        # 发送文件给用户
        response = send_file(
            output_path,
            as_attachment=True,
            download_name=f"{output_name}.pdf",
            mimetype='application/pdf'
        )

        return response

    except Exception as e:
        print(f"服务器错误：{e}")
        if 'temp_dir' in locals():
            shutil.rmtree(temp_dir, ignore_errors=True)
        
        if isinstance(e, Exception) and hasattr(e, 'code'):
            abort(e.code, str(e))
        else:
            abort(500, f"服务器内部错误：{str(e)}")

@app.errorhandler(400)
@app.errorhandler(413)
@app.errorhandler(500)
def handle_error(e):
    """错误处理"""
    error_message = str(e.description) if hasattr(e, 'description') else str(e)
    return jsonify({
        'error': True,
        'message': error_message
    }), e.code if hasattr(e, 'code') else 500

if __name__ == '__main__':
    # 开发环境配置
    app.run(
        host='0.0.0.0',
        port=3000,
        debug=True,
        threaded=True
    )
