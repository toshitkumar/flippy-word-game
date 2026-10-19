@echo off
echo Starting Flippy Words local test server...
start http://localhost:8080/index.html
python -m http.server 8080
pause
