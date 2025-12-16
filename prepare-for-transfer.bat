@echo off
echo ========================================
echo OneChat - Prepare for Transfer
echo ========================================
echo.

echo [1/3] Stopping Laravel server...
taskkill /F /IM php.exe 2>nul
if %errorlevel% == 0 (
    echo Server stopped successfully.
) else (
    echo No running server found (this is OK).
)
echo.

echo [2/3] Checking database...
REM Check database type from .env
if exist .env (
    findstr /C:"DB_CONNECTION=sqlite" .env >nul
    if %errorlevel% equ 0 (
        REM SQLite database
        if exist database\database.sqlite (
            echo [OK] SQLite database file found: database\database.sqlite
            for %%A in (database\database.sqlite) do (
                echo      Size: %%~zA bytes
                echo      Date: %%~tA
            )
        ) else (
            echo [WARNING] SQLite database file NOT found!
            echo           It will be created automatically on the new PC.
        )
    ) else (
        REM MySQL database
        echo [INFO] MySQL database detected.
        echo        Run export-database.bat to export your database before transfer.
        echo        Or export manually using phpMyAdmin.
    )
) else (
    echo [INFO] .env file not found - cannot determine database type.
    echo        Will check for SQLite file...
    if exist database\database.sqlite (
        echo [OK] SQLite database file found: database\database.sqlite
    ) else (
        echo [WARNING] Database file NOT found!
    )
)
echo.

echo [3/3] Checking important files...
if exist .env (
    echo [INFO] .env file found (will be recreated on new PC)
) else (
    echo [OK] .env file not found (will be created from .env.example)
)
echo.

echo ========================================
echo Ready to create ZIP file!
echo ========================================
echo.
echo IMPORTANT: When creating the zip file:
echo   1. For SQLite: Include database\database.sqlite (if it exists)
echo   2. For MySQL: Include database\exports\*.sql (export files)
echo   3. Exclude: node_modules, vendor, .env
echo   4. Include: All other files and folders
echo.
echo For MySQL: Run export-database.bat before creating zip!
echo.
echo After transferring, run: composer run setup
echo.
pause

