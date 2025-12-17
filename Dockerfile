FROM python:3.11-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1

# Install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy app
COPY . .

ENV PORT 8080
EXPOSE 8080

CMD ["gunicorn", "app:app", "--workers", "4", "--bind", "0.0.0.0:8080"]
