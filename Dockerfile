# 使用官方 Python 3.11 镜像作为基础镜像
FROM python:3.11-slim as builder

# 安装构建依赖
RUN apt-get update && apt-get install -y \
    build-essential \
    libpython3-dev \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制 requirements.txt 文件
COPY requirements.txt .

# 安装 Python 依赖到临时目录
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels gunicorn==21.2.0

# 生产阶段
FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 安装运行时依赖
RUN apt-get update && apt-get install -y \
    libpython3-dev \
    && rm -rf /var/lib/apt/lists/*

# 从构建阶段复制预编译的 wheels
COPY --from=builder /app/wheels /wheels
RUN pip install --no-cache /wheels/* && rm -rf /wheels

# 创建非 root 用户
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app

# 复制应用代码
COPY --chown=appuser:appuser app.py .
COPY --chown=appuser:appuser tools ./tools
COPY --chown=appuser:appuser templates ./templates
COPY --chown=appuser:appuser static ./static

# 创建临时文件目录
RUN mkdir -p /tmp/uploads && chown appuser:appuser /tmp/uploads

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV PYTHONUNBUFFERED=1 \
    WORKERS=4 \
    PORT=3000

# 切换到非 root 用户
USER appuser

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:3000', timeout=2)" || exit 1

# 启动应用（生产环境配置，使用 gunicorn）
CMD ["sh", "-c", "gunicorn -w ${WORKERS:-4} -b 0.0.0.0:${PORT:-3000} app:app"]
