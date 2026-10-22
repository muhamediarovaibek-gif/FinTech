@echo off

call ml\venv\Scripts\activate.bat

python -m uvicorn backend.main:app --reload

pause