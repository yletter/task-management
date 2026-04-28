FROM python:3.11-slim

WORKDIR /app

# Install system dependencies if required by mysqlclient or other native packages
# Sometimes default slim image misses gcc, though mysql-connector-python usually works without it.
# RUN apt-get update && apt-get install -y gcc

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Setting environment variables used by the Flask app
ENV DB_HOST=localhost
ENV DB_PORT=3306
ENV DB_USER=root
ENV DB_PASSWORD=admin
ENV DB_NAME=task_management

EXPOSE 5000

CMD ["python", "app.py"]
