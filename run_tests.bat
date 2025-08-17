@echo off
echo ===================================================
echo Virtual Assistant Test Runner
echo ===================================================

echo Installing required packages...
pip install -r test-requirements.txt

echo.
echo Starting local HTTP server on port 8000...
start cmd /k "python -m http.server 8000"

echo.
echo Waiting for server to start...
timeout /t 5 /nobreak > nul

echo.
echo Running all tests...
echo.
echo Running basic virtual assistant test...
python simple_va_test.py
echo.
echo Running comprehensive tests...
python run_all_tests.py

echo.
echo Tests completed. Press any key to stop the server and exit.
pause > nul

echo.
echo Stopping server...
taskkill /f /im python.exe /fi "WINDOWTITLE eq C:\Windows\system32\cmd.exe - python -m http.server 8000"

echo.
echo Done!
