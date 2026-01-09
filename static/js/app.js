// 发票合并工具 - JavaScript 功能实现

class InvoiceMergerApp {
    constructor() {
        this.selectedFiles = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateStats();
    }

    setupEventListeners() {
        // 文件输入相关
        const fileInput = document.getElementById('fileInput');
        const selectFilesBtn = document.getElementById('selectFilesBtn');
        const uploadCard = document.getElementById('uploadCard');

        // 点击上传卡片选择文件
        uploadCard.addEventListener('click', (e) => {
            // 如果点击的是按钮或按钮内部的元素，不触发文件选择（避免重复）
            if (e.target === selectFilesBtn || e.target.closest('button') === selectFilesBtn) {
                return;
            }
            fileInput.click();
        });

        // 点击按钮选择文件
        selectFilesBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // 阻止冒泡到 uploadCard
            fileInput.click();
        });

        // 文件选择变化
        fileInput.addEventListener('change', (e) => {
            this.handleFilesSelected(e.target.files);
        });

        // 拖拽上传
        uploadCard.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadCard.classList.add('drag-over');
        });

        uploadCard.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadCard.classList.remove('drag-over');
        });

        uploadCard.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadCard.classList.remove('drag-over');
            this.handleFilesSelected(e.dataTransfer.files);
        });

        // 文件列表操作
        const clearAllBtn = document.getElementById('clearAllBtn');
        clearAllBtn.addEventListener('click', () => {
            this.clearAllFiles();
        });

        const mergeBtn = document.getElementById('mergeBtn');
        mergeBtn.addEventListener('click', () => {
            this.startMerge();
        });

        // 下载和重置按钮
        const downloadBtn = document.getElementById('downloadBtn');
        downloadBtn.addEventListener('click', () => {
            this.downloadMergedFile();
        });

        const resetBtn = document.getElementById('resetBtn');
        resetBtn.addEventListener('click', () => {
            this.resetApp();
        });

        // 合并模式变化监听
        const mergeMode = document.getElementById('mergeMode');
        mergeMode.addEventListener('change', () => {
            this.updateStats();
        });
    }

    // 处理文件选择
    handleFilesSelected(fileList) {
        const files = Array.from(fileList);
        
        // 过滤只保留PDF文件
        const pdfFiles = files.filter(file => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));

        if (pdfFiles.length < files.length) {
            this.showToast('警告：已过滤非PDF文件', 'error');
        }

        // 检查文件数量限制
        const totalFiles = this.selectedFiles.length + pdfFiles.length;
        if (totalFiles > 1000) {
            this.showToast('最多支持1000个文件', 'error');
            pdfFiles.splice(1000 - this.selectedFiles.length);
        }

        // 添加文件到列表
        pdfFiles.forEach(file => {
            const existingFile = this.selectedFiles.find(f => f.name === file.name && f.size === file.size);
            if (!existingFile) {
                this.selectedFiles.push({
                    id: this.generateFileId(),
                    file: file,
                    name: file.name,
                    size: file.size,
                    date: new Date()
                });
            }
        });

        this.updateFileList();
        this.updateStats();

        if (pdfFiles.length > 0) {
            this.showToast(`已添加 ${pdfFiles.length} 个PDF文件`);
        }
    }

    // 生成文件ID
    generateFileId() {
        return 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // 更新文件列表显示
    updateFileList() {
        const fileListContainer = document.getElementById('fileListContainer');
        const fileList = document.getElementById('fileList');
        const uploadCard = document.getElementById('uploadCard');

        if (this.selectedFiles.length > 0) {
            uploadCard.style.display = 'none';
            fileListContainer.style.display = 'block';
        } else {
            uploadCard.style.display = 'block';
            fileListContainer.style.display = 'none';
        }

        fileList.innerHTML = '';
        this.selectedFiles.forEach((fileObj, index) => {
            const fileItem = this.createFileItem(fileObj, index);
            fileList.appendChild(fileItem);
        });

        document.getElementById('fileCounter').textContent = `${this.selectedFiles.length} 个文件`;
    }

    // 创建文件列表项
    createFileItem(fileObj, index) {
        const div = document.createElement('div');
        div.className = 'file-item fade-in';
        div.draggable = true;
        div.dataset.index = index;

        // 拖拽排序功能
        div.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', index);
            div.classList.add('dragging');
        });

        div.addEventListener('dragend', (e) => {
            div.classList.remove('dragging');
        });

        div.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        div.addEventListener('drop', (e) => {
            e.preventDefault();
            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
            const toIndex = index;
            if (fromIndex !== toIndex) {
                this.moveFile(fromIndex, toIndex);
            }
        });

        div.innerHTML = `
            <svg class="file-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                <path d="M14 2v6h6"/>
            </svg>
            <div class="file-info">
                <div class="file-name" title="${fileObj.name}">${fileObj.name}</div>
                <div class="file-size">${this.formatFileSize(fileObj.size)}</div>
            </div>
            <div class="file-actions">
                <button class="btn-remove" onclick="app.removeFile('${fileObj.id}')" title="删除">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0 0 2h1v11a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V9h1a1 1 0 0 0 0-2zM10 6a2 2 0 0 1 4 0v1h-4V6zm6 14a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9h8v11z"/>
                    </svg>
                </button>
            </div>
        `;

        return div;
    }

    // 移动文件位置
    moveFile(fromIndex, toIndex) {
        const file = this.selectedFiles[fromIndex];
        this.selectedFiles.splice(fromIndex, 1);
        this.selectedFiles.splice(toIndex, 0, file);
        this.updateFileList();
        this.showToast('文件顺序已更新');
    }

    // 删除单个文件
    removeFile(fileId) {
        const index = this.selectedFiles.findIndex(f => f.id === fileId);
        if (index !== -1) {
            this.selectedFiles.splice(index, 1);
            this.updateFileList();
            this.updateStats();
            this.showToast('文件已删除');
        }
    }

    // 清空所有文件
    clearAllFiles() {
        if (this.selectedFiles.length > 0) {
            this.selectedFiles = [];
            this.updateFileList();
            this.updateStats();
            this.showToast('已清空所有文件');
        }
    }

    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 更新统计信息
    updateStats() {
        const totalFiles = document.getElementById('totalFiles');
        const estimatedPages = document.getElementById('estimatedPages');
        const totalSize = document.getElementById('totalSize');

        totalFiles.textContent = this.selectedFiles.length;

        // 计算总文件大小
        const totalSizeBytes = this.selectedFiles.reduce((sum, f) => sum + f.size, 0);
        totalSize.textContent = this.formatFileSize(totalSizeBytes);

        // 预估页数（假设每个PDF有1页，实际应根据合并模式计算）
        const mergeMode = document.getElementById('mergeMode').value;
        const perPage = mergeMode === '2up' ? 2 : 4;
        const pages = Math.ceil(this.selectedFiles.length / perPage);
        estimatedPages.textContent = pages;
    }

    // 显示提示消息
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast ' + type;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // 开始合并
    async startMerge() {
        if (this.selectedFiles.length === 0) {
            this.showToast('请先选择文件', 'error');
            return;
        }

        const outputFileName = document.getElementById('outputFileName').value.trim() || 'merged_invoices';
        const mergeMode = document.getElementById('mergeMode').value;

        // 显示进度容器
        this.showProgressContainer();

        try {
            const formData = new FormData();
            formData.append('merge_mode', mergeMode);
            formData.append('output_name', outputFileName);

            this.selectedFiles.forEach((fileObj, index) => {
                formData.append(`file_${index}`, fileObj.file, fileObj.name);
            });

            // 发送到后端
            const response = await this.uploadWithProgress(
                '/merge',
                formData,
                (progress) => {
                    this.updateProgress(progress);
                }
            );

            console.log('服务器响应状态：', response.status, response.statusText);
            
            // 注意：XHR的getAllResponseHeaders()返回字符串，不是Headers对象
            const responseHeaders = response.getAllResponseHeaders();
            console.log('响应头字符串：', responseHeaders);
            
            // XHR 的 response 对象直接包含响应的数据
            const contentType = response.getResponseHeader('content-type');
            const contentDisposition = response.getResponseHeader('content-disposition');
            
            console.log('Content-Type:', contentType);
            console.log('Content-Disposition:', contentDisposition);
            
            if (response.status >= 200 && response.status < 300) {
                // XHR 响应就是 Blob（因为在 uploadWithProgress 中设置了 responseType: 'blob'）
                
                if (contentType && contentType.includes('application/pdf')) {
                    const url = window.URL.createObjectURL(response.response);
                    
                    // 尝试从 Content-Disposition 获取文件名
                    let fileName = outputFileName + '.pdf';
                    if (contentDisposition) {
                        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                        if (filenameMatch) {
                            fileName = filenameMatch[1];
                            console.log('从Content-Disposition获取到文件名:', fileName);
                        }
                    }
                    
                    // 保存下载链接
                    this.lastMergedUrl = url;
                    this.lastMergedFileName = fileName;

                    this.showSuccessContainer();
                    this.showToast('合并完成！');
                    console.log('文件下载链接已创建，文件大小:', response.response.size, '字节');
                } else {
                    // 服务器没有返回 PDF，尝试读取文本查看是什么
                    const reader = new FileReader();
                    reader.onload = () => {
                        const responseText = reader.result.substring(0, 500);
                        console.error('服务器返回了意外的Content-Type:', contentType);
                        console.error('响应内容（前500字符）:', responseText);
                        this.showToast('服务器返回了意外的响应类型: ' + (contentType || '未知'), 'error');
                        this.showFileListContainer();
                    };
                    reader.readAsText(response.response);
                }
            } else {
                // HTTP 错误状态
                const reader = new FileReader();
                reader.onload = () => {
                    const errorText = reader.result;
                    let errorMessage = '合并失败';
                    
                    console.error('HTTP错误状态:', response.status);
                    console.error('错误响应内容:', errorText);
                    
                    try {
                        const errorJson = JSON.parse(errorText);
                        console.error('解析后的JSON:', errorJson);
                        if (errorJson.message) {
                            errorMessage = errorJson.message;
                        }
                    } catch (e) {
                        console.error('无法解析JSON，使用原始文本作为错误信息');
                        errorMessage = errorText || '未知错误';
                    }
                    
                    console.error('最终错误消息:', errorMessage);
                    this.showToast(errorMessage, 'error');
                    this.showFileListContainer();
                };
                reader.readAsText(response.response);
            }
        } catch (error) {
            console.error('合并过程中出现未捕获的异常：', error);
            console.error('错误堆栈：', error.stack);
            this.showToast('合并失败，请重试: ' + error.message, 'error');
            this.showFileListContainer();
        }
    }

    // 显示进度容器
    showProgressContainer() {
        document.getElementById('fileListContainer').style.display = 'none';
        document.getElementById('progressContainer').style.display = 'block';
        
        this.updateProgress(0);
    }

    // 显示文件列表容器
    showFileListContainer() {
        document.getElementById('progressContainer').style.display = 'none';
        document.getElementById('successContainer').style.display = 'none';
        document.getElementById('fileListContainer').style.display = 'block';
    }

    // 显示成功容器
    showSuccessContainer() {
        document.getElementById('progressContainer').style.display = 'none';
        document.getElementById('successContainer').style.display = 'block';
        
        const successMessage = document.getElementById('successMessage');
        successMessage.textContent = `成功合并 ${this.selectedFiles.length} 个文件`;
    }

    // 更新进度
    updateProgress(percentage) {
        const progressFill = document.getElementById('progressFill');
        const progressPercentage = document.getElementById('progressPercentage');
        const stepInfo = document.getElementById('stepInfo');
        const stepDetail = document.getElementById('stepDetail');

        percentage = Math.min(100, Math.max(0, percentage));
        progressFill.style.width = percentage + '%';
        progressPercentage.textContent = Math.round(percentage) + '%';

        if (percentage < 30) {
            stepInfo.textContent = '正在上传文件...';
            stepDetail.textContent = `${this.selectedFiles.length} 个文件`;
        } else if (percentage < 80) {
            stepInfo.textContent = '正在处理PDF...';
            stepDetail.textContent = '正在转换和优化';
        } else if (percentage < 100) {
            stepInfo.textContent = '正在生成输出文件...';
            stepDetail.textContent = '即将完成';
        } else {
            stepInfo.textContent = '完成！';
            stepDetail.textContent = '文件已准备就绪';
        }
    }

    // 带进度条的上传
    uploadWithProgress(url, data, onProgress) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            // 监听上传进度
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    onProgress((e.loaded / e.total) * 100);
                }
            });

            // 监听下载进度
            xhr.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    // 上传完成，开始处理：从50%到100%
                    onProgress(50 + (e.loaded / e.total) * 50);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr);
                } else {
                    reject(new Error('Upload failed'));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Upload failed'));
            });

            xhr.open('POST', url);
            xhr.responseType = 'blob';
            xhr.send(data);
        });
    }

    // 下载合并后的文件
    downloadMergedFile() {
        if (this.lastMergedUrl) {
            const link = document.createElement('a');
            link.href = this.lastMergedUrl;
            link.download = this.lastMergedFileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // 重置应用
    resetApp() {
        this.selectedFiles = [];
        this.updateFileList();
        this.updateStats();
        this.showFileListContainer();
        
        document.getElementById('outputFileName').value = 'merged_invoices';
        document.getElementById('mergeMode').value = '2up';

        if (this.lastMergedUrl) {
            window.URL.revokeObjectURL(this.lastMergedUrl);
            this.lastMergedUrl = null;
            this.lastMergedFileName = null;
        }
    }

    // 公共方法：添加文件（用于测试）
    addFile(file) {
        this.selectedFiles.push({
            id: this.generateFileId(),
            file: file,
            name: file.name,
            size: file.size,
            date: new Date()
        });
        this.updateFileList();
        this.updateStats();
    }
}

// 全局应用实例
const app = new InvoiceMergerApp();

// 导出到全局（方便调试）
window.app = app;

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('发票合并工具已加载');
});// 全局应用实例
