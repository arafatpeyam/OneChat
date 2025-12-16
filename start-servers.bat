@echo off
echo Starting OneChat Servers...
echo.
echo Starting Laravel server on http://127.0.0.1:8000
start "Laravel Server" cmd /k "php artisan serve --host=127.0.0.1 --port=8000"
timeout /t 2 /nobreak >nul
echo.
echo Starting Vite dev server...
start "Vite Dev Server" cmd /k "npm run dev"
timeout /t 2 /nobreak >nul
echo.
echo Both servers are starting!
echo.
echo Open your browser and go to: http://localhost:8000
echo.
echo Press any key to exit this window (servers will keep running)...
pause >nul

