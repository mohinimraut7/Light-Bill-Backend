@echo off
REM ============================================================
REM  VVCMC Lightbill - Sign Service (Windows)
REM  पहिल्यांदा: venv बनवतो, packages install करतो, dummy DSC बनवतो
REM  नंतर: फक्त service चालू करतो  ->  http://127.0.0.1:7001
REM ============================================================
cd /d "%~dp0"

REM ---- Backend चा uploads folder (गरज असल्यास path बदला) ----
set UPLOADS_DIR=%~dp0..\Light-Bill-Backend\uploads
REM ---- Backend .env मधील SIGN_SERVICE_KEY सारखाच ठेवा ----
set SIGN_SERVICE_KEY=vvcmc-dsc-local-123

if not exist venv (
  echo [1/3] Python venv tayar karat ahe...
  py -m venv venv || python -m venv venv
  call venv\Scripts\activate
  echo [2/3] Packages install karat ahe...
  pip install -r requirements.txt
) else (
  call venv\Scripts\activate
)

if not exist dummy-certs\lipik.pfx (
  echo [3/3] Dummy DSC certificates banvat ahe...
  python dummy-certs\make_dummy_certs.py
)

echo.
echo Sign service chalu: http://127.0.0.1:7001/health
echo Uploads folder   : %UPLOADS_DIR%
echo (Band karayla Ctrl+C)
python -m uvicorn app:app --host 127.0.0.1 --port 7001
