@echo off
cd /d D:\Projects\Statics
echo Starting HTTP server on port 8000...
python -m http.server 8000
pause