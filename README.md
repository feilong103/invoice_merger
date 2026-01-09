# 发票合并工具

一个现代化的发票PDF文件合并工具，支持批量上传1000+文件，提供优雅的用户界面和高效的合并功能。

## ✨ 功能特性

- 🚀 **批量处理** - 支持一次性上传和合并 1000+ PDF 文件
- 🎨 **现代化界面** - 使用渐变、玻璃透明效果和华丽的动画
- 📁 **拖拽上传** - 支持拖拽文件到上传区域
- 🔄 **拖拽排序** - 可以拖拽文件调整合并顺序
- 📐 **多模式合并** - 支持 2up（上下排版）和 4up（2x2排版）两种模式
- 📊 **实时进度** - 显示上传和处理进度条
- 🗂️ **文件管理** - 支持删除单个文件或清空全部
- 📱 **响应式设计** - 完美适配桌面和移动设备
- 🔔 **消息通知** - 操作反馈和成功提示

## 🛠️ 技术栈

### 后端
- **Flask 3.0** - Python Web 框架
- **PyMuPDF** - PDF 文件处理和高清图像提取
- **ReportLab** - PDF 生成和排版
- **Werkzeug** - 文件上传和安全处理

### 前端
- **原生 JavaScript** - 无框架依赖，轻量高效
- **CSS3 高级特性** - 渐变、动画、玻璃态效果
- **SVG 图标** - 现代化矢量图标
- **拖拽 API** - 文件上传和排序
- **XMLHttpRequest** - 带进度条的文件上传

## 📦 安装与运行

### 方式一：直接运行（开发环境）

#### 1. 安装依赖

```bash
pip install -r requirements.txt
```

#### 2. 启动应用

```bash
python app.py
```

#### 3. 访问应用

打开浏览器访问：http://localhost:3000

### 方式二：使用 Gunicorn（生产环境）

#### 1. 安装依赖

```bash
pip install -r requirements.txt gunicorn
```

#### 2. 启动应用

```bash
# 前台运行
gunicorn -w 4 -b 0.0.0.0:3000 app:app

# 后台运行
gunicorn -w 4 -b 0.0.0.0:3000 app:app --daemon
```

#### 3. 访问应用

打开浏览器访问：http://localhost:3000

### 方式三：使用 Docker（推荐生产环境）

#### 1. 构建镜像

```bash
docker build -t invoice-merger .
```

#### 2. 运行容器

```bash
# 基础运行
docker run -p 3000:3000 invoice-merger

# 自定义工作进程数量
docker run -e WORKERS=8 -p 3000:3000 invoice-merger

# 自定义端口
docker run -e PORT=8080 -p 8080:8080 invoice-merger

# 结合使用
docker run -e WORKERS=4 -e PORT=3000 -p 3000:3000 invoice-merger

# 后台运行
docker run -d --name invoice-merger -p 3000:3000 invoice-merger

# 查看日志
docker logs -f invoice-merger

# 停止容器
docker stop invoice-merger

# 重启容器
docker start invoice-merger
```

#### 3. 访问应用

打开浏览器访问：http://localhost:3000（或您自定义的端口）

### Docker Compose 部署

创建一个 `docker-compose.yml` 文件：

```yaml
version: '3.8'

services:
  invoice-merger:
    build: .
    ports:
      - "3000:3000"
    environment:
      - WORKERS=4
      - PORT=3000
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "python", "-c", "import requests; requests.get('http://localhost:3000', timeout=2)"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
```

运行以下命令启动服务：

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 环境变量说明

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `WORKERS` | 4 | Gunicorn 工作进程数量，建议设置为 CPU 核心数的 2-4 倍 |
| `PORT` | 3000 | 应用监听的端口号 |

### 性能优化建议

- **小规模部署**：WORKERS=4，适用于少量用户
- **中等规模**：WORKERS=8，适用于日常业务使用
- **大规模部署**：WORKERS=16+，配合 Nginx 负载均衡
- **监控工具**：建议使用 Prometheus + Grafana 监控应用性能

## 🎯 使用指南

### 选择文件
1. 点击蓝色按钮"选择文件"或直接拖拽PDF文件到上传区域
2. 文件会自动添加到列表中
3. 支持多次选择和拖拽添加

### 文件管理
- **拖拽排序** - 拖拽文件项可以调整合并顺序
- **删除单个** - 点击文件右侧的删除按钮
- **清空全部** - 点击"清空全部"按钮

### 合并设置
- **输出文件名** - 自定义合并后的文件名
- **每页合并** - 选择每页显示2张或4张发票

### 开始合并
1. 点击"开始合并"按钮
2. 观察进度条和状态提示
3. 完成后自动跳转到成功页面
4. 点击"下载文件"获取合并后的PDF
5. 点击"继续合并"开始新一轮合并

## 📁 项目结构

```
invoice_merger/
├── app.py                 # Flask 主程序
├── main.py               # 原始核心合并函数
├── requirements.txt      # Python 依赖包
├── README.md            # 项目说明文档
├── templates/
│   └── index.html       # 前端主页面
└── static/
    ├── css/
    │   └── style.css    # CSS 样式文件
    └── js/
        └── app.js       # JavaScript 功能脚本
```

## 🎨 界面设计亮点

### 配色方案
- **主色调** - 蓝色渐变 (#3b82f6 → #06b6d4)
- **成功色** - 绿色渐变 (#10b981 → #059669)
- **错误色** - 红色 (#ef4444)
- **文字色** - 深灰系阶梯 (#1e293b, #64748b, #94a3b8)

### 视觉效果
- **玻璃透明效果** - 使用 backdrop-filter: blur(10px)
- **渐变背景** - 径向渐变装饰，提升视觉效果
- **阴影层次** - 多级阴影系统，增强立体感
- **交互动画** - 悬停、点击、渐变过渡效果
- **加载动画** - 自定义旋转加载图标

### 响应式布局
- **桌面端** - 两列布局，操作区和预览区分开
- **移动端** - 单列布局，自适应屏幕尺寸
- **网格系统** - CSS Grid 和 Flexbox 灵活布局

## 🔧 技术特性

### 性能优化
- **异步处理** - 后台线程处理大文件，不阻塞界面
- **临时文件** - 自动清理机制，10分钟后删除
- **批量处理** - 支持大量文件同时上传
- **进度反馈** - 实时显示处理进度

### 安全特性
- **文件验证** - 检查文件格式和大小
- **文件名过滤** - 防止路径遍历攻击
- **错误处理** - 完善的异常捕获和用户提示
- **CORS 支持** - 跨域资源共享配置

### 用户体验
- **拖拽操作** - 简单直观的文件管理
- **即时反馈** - Toast 通知和状态提示
- **文件统计** - 显示文件数量、预计页数和总大小
- **操作提示** - 清晰的按钮和图标说明

## 🔧 配置项

### Flask 配置
```python
app.config['MAX_CONTENT_LENGTH'] = 1000 * 1024 * 1024  # 文件大小限制
app.config['UPLOAD_FOLDER']                            # 临时上传目录
```

### 前端配置
可根据需要在 `app.py` 中调整：
- 文件数量上限（默认1000）
- 单个文件大小限制（默认10MB）
- 临时文件清理时间（默认10分钟）

## 🐛 故障排除

### 常见问题

**Q: 无法上传文件？**
A: 检查文件是否为 PDF 格式，单个文件是否超过10MB

**Q: 合并失败？**
A: 确认文件是有效的 PDF 格式，检查服务器日志了解详细错误

**Q: 临时文件未清理？**
A: 重启应用会自动清理，或手动清理 /tmp 目录

**Q: 内存占用过高？**
A: 减少同时处理的文件数量，或增加服务器RAM

### 日志查看
```bash
# 启动时查看实时日志
python app.py

# 查看 Flask 日志
tail -f flask.log
```

## 📈 性能基准

- **小批量**（10-50个文件）：2-5秒
- **中批量**（50-200个文件）：10-30秒  
- **大批量**（200-1000个文件）：30-120秒

实际速度取决于文件大小和服务器性能。

## 🎓 开发指南

### 代码结构
- **模块化设计** - 前后端分离，易于维护
- **面向对象** - JavaScript 使用 ES6 类
- **函数式编程** - Python 函数化设计
- **简洁清晰** - 代码注释完善，易于理解

### 扩展建议
- 添加 PDF 预览功能
- 支持更多页面布局选项
- 增加文件压缩选项
- 添加云存储集成

## 📄 许可证

本项目仅供学习和个人使用。商业使用请联系作者获取授权。

## 🤝 贡献

欢迎提出建议和改进方案。如需添加新功能，请 Fork 本项目并提交 Pull Request。

---

💡 **提示**：本工具适合处理发票、合同等标准化 PDF 文档的批量合并，为公司财务和文档管理提供便捷解决方案。