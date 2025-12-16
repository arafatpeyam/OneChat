#!/bin/bash

echo "========================================"
echo "OneChat - Prepare for Transfer"
echo "========================================"
echo ""

echo "[1/3] Stopping Laravel server..."
pkill -f "php artisan serve" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "Server stopped successfully."
else
    echo "No running server found (this is OK)."
fi
echo ""

echo "[2/3] Checking database..."
# Check database type from .env
if [ -f .env ]; then
    if grep -q "^DB_CONNECTION=sqlite" .env; then
        # SQLite database
        if [ -f database/database.sqlite ]; then
            echo "[OK] SQLite database file found: database/database.sqlite"
            ls -lh database/database.sqlite
        else
            echo "[WARNING] SQLite database file NOT found!"
            echo "          It will be created automatically on the new PC."
        fi
    else
        # MySQL database
        echo "[INFO] MySQL database detected."
        echo "       Run ./export-database.sh to export your database before transfer."
        echo "       Or export manually using phpMyAdmin."
    fi
else
    echo "[INFO] .env file not found - cannot determine database type."
    echo "       Will check for SQLite file..."
    if [ -f database/database.sqlite ]; then
        echo "[OK] SQLite database file found: database/database.sqlite"
    else
        echo "[WARNING] Database file NOT found!"
    fi
fi
echo ""

echo "[3/3] Checking important files..."
if [ -f .env ]; then
    echo "[INFO] .env file found (will be recreated on new PC)"
else
    echo "[OK] .env file not found (will be created from .env.example)"
fi
echo ""

echo "========================================"
echo "Ready to create ZIP file!"
echo "========================================"
echo ""
echo "IMPORTANT: When creating the zip file:"
echo "  1. For SQLite: Include database/database.sqlite (if it exists)"
echo "  2. For MySQL: Include database/exports/*.sql (export files)"
echo "  3. Exclude: node_modules, vendor, .env"
echo "  4. Include: All other files and folders"
echo ""
echo "For MySQL: Run ./export-database.sh before creating zip!"
echo ""
echo "After transferring, run: composer run setup"
echo ""

