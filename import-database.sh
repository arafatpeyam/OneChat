#!/bin/bash

echo "========================================"
echo "OneChat - Import MySQL Database"
echo "========================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "[ERROR] .env file not found!"
    echo "Please run: composer run setup"
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
    echo "[INFO] Using SQLite - no import needed."
    echo "       Database file will be created automatically."
    echo ""
    exit 0
fi

if [ -z "$DB_DATABASE" ]; then
    echo "[ERROR] DB_DATABASE not set in .env file!"
    exit 1
fi

echo "[1/3] Checking for database export files..."
if [ ! -d database/exports ]; then
    echo "[WARNING] database/exports folder not found!"
    echo "          No database import needed - will use migrations."
    echo ""
    exit 0
fi

# Find the most recent SQL file
LATEST_FILE=$(ls -t database/exports/*.sql 2>/dev/null | head -n 1)

if [ -z "$LATEST_FILE" ]; then
    echo "[WARNING] No SQL export files found in database/exports/"
    echo "          Database will be created using migrations."
    echo ""
    exit 0
fi

echo "[OK] Found export file: $LATEST_FILE"
echo ""

echo "[2/3] Creating database (if not exists)..."
# Check if mysql is available
if ! command -v mysql &> /dev/null; then
    echo "[WARNING] mysql client not found!"
    echo "          Please create the database manually:"
    echo "          1. Open phpMyAdmin or MySQL client"
    echo "          2. Create database: $DB_DATABASE"
    echo "          3. Then run this script again"
    echo ""
    exit 1
fi

# Create database
if [ -z "$DB_PASSWORD" ]; then
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -e "CREATE DATABASE IF NOT EXISTS $DB_DATABASE CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
else
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DB_DATABASE CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
fi

if [ $? -ne 0 ]; then
    echo "[WARNING] Could not create database automatically."
    echo "          Please create it manually: $DB_DATABASE"
    echo ""
fi

echo "[3/3] Importing database..."
if [ -z "$DB_PASSWORD" ]; then
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" "$DB_DATABASE" < "$LATEST_FILE"
else
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_DATABASE" < "$LATEST_FILE"
fi

if [ $? -eq 0 ]; then
    echo "[OK] Database imported successfully!"
    echo ""
    echo "[INFO] You may want to run migrations to ensure schema is up to date:"
    echo "       php artisan migrate --force"
else
    echo "[ERROR] Database import failed!"
    echo "        Please import manually using phpMyAdmin:"
    echo "        1. Open phpMyAdmin"
    echo "        2. Select database: $DB_DATABASE"
    echo "        3. Click 'Import' tab"
    echo "        4. Choose file: $LATEST_FILE"
    echo "        5. Click 'Go'"
    echo ""
    exit 1
fi

echo ""

