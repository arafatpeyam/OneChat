#!/bin/bash

echo "========================================"
echo "OneChat - Export MySQL Database"
echo "========================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "[ERROR] .env file not found!"
    echo "Please create .env file first or copy from .env.example"
    exit 1
fi

# Read database credentials from .env
DB_CONNECTION=$(grep "^DB_CONNECTION=" .env | cut -d '=' -f2 | tr -d ' ')
DB_DATABASE=$(grep "^DB_DATABASE=" .env | cut -d '=' -f2 | tr -d ' ')
DB_USERNAME=$(grep "^DB_USERNAME=" .env | cut -d '=' -f2 | tr -d ' ')
DB_PASSWORD=$(grep "^DB_PASSWORD=" .env | cut -d '=' -f2 | tr -d ' ')
DB_HOST=$(grep "^DB_HOST=" .env | cut -d '=' -f2 | tr -d ' ')
DB_PORT=$(grep "^DB_PORT=" .env | cut -d '=' -f2 | tr -d ' ')

# Set defaults if not found
DB_CONNECTION=${DB_CONNECTION:-mysql}
DB_HOST=${DB_HOST:-127.0.0.1}
DB_PORT=${DB_PORT:-3306}

echo "[INFO] Database Configuration:"
echo "       Connection: $DB_CONNECTION"
echo "       Database: $DB_DATABASE"
echo "       Host: $DB_HOST"
echo "       Port: $DB_PORT"
echo "       Username: $DB_USERNAME"
echo ""

if [ "$DB_CONNECTION" = "sqlite" ]; then
    echo "[INFO] Using SQLite - checking database file..."
    if [ -f database/database.sqlite ]; then
        echo "[OK] SQLite database file found: database/database.sqlite"
        echo "      Make sure to include this file in your zip!"
        ls -lh database/database.sqlite
    else
        echo "[WARNING] SQLite database file NOT found!"
        echo "          It will be created automatically on the new PC."
    fi
    echo ""
    exit 0
fi

if [ -z "$DB_DATABASE" ]; then
    echo "[ERROR] DB_DATABASE not set in .env file!"
    exit 1
fi

echo "[1/2] Creating database export directory..."
mkdir -p database/exports
echo "[OK] Directory created: database/exports"
echo ""

echo "[2/2] Exporting MySQL database..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
EXPORT_FILE="database/exports/${DB_DATABASE}_export_${TIMESTAMP}.sql"

# Check if mysqldump is available
if ! command -v mysqldump &> /dev/null; then
    echo "[ERROR] mysqldump not found!"
    echo ""
    echo "Please install MySQL client tools or use phpMyAdmin to export:"
    echo "  1. Open phpMyAdmin"
    echo "  2. Select database: $DB_DATABASE"
    echo "  3. Click 'Export' tab"
    echo "  4. Choose 'Quick' method"
    echo "  5. Click 'Go' and save the file"
    echo "  6. Place the SQL file in: database/exports/"
    echo ""
    exit 1
fi

# Export database
if [ -z "$DB_PASSWORD" ]; then
    mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" "$DB_DATABASE" > "$EXPORT_FILE"
else
    mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_DATABASE" > "$EXPORT_FILE"
fi

if [ $? -eq 0 ]; then
    echo "[OK] Database exported successfully!"
    echo "      File: $EXPORT_FILE"
    ls -lh "$EXPORT_FILE"
    echo ""
    echo "[IMPORTANT] Include this file in your zip transfer!"
    echo "            Path: database/exports/"
else
    echo "[ERROR] Database export failed!"
    echo ""
    echo "Please export manually using phpMyAdmin:"
    echo "  1. Open phpMyAdmin"
    echo "  2. Select database: $DB_DATABASE"
    echo "  3. Click 'Export' tab"
    echo "  4. Choose 'Quick' method"
    echo "  5. Click 'Go' and save the file"
    echo "  6. Place the SQL file in: database/exports/"
    echo ""
    exit 1
fi

echo ""

