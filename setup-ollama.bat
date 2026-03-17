@echo off
echo === Ollama Setup for Satellite Analysis ===
echo.

:: Check if Ollama is installed
ollama --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Ollama not found. Please install from: https://ollama.ai/download
    echo Then run this script again.
    pause
    exit /b 1
)

echo ✅ Ollama is installed

:: Check if Ollama is running
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% neq 0 (
    echo 🚀 Starting Ollama server...
    start /B ollama serve
    timeout /t 3 /nobreak >nul
)

echo ✅ Ollama server is running

:: Download the recommended model
echo 📥 Downloading Llama 3.1 70B model ^(this may take a while^)...
echo    If you want a faster/smaller model, cancel with Ctrl+C and run:
echo    ollama pull llama3.1:8b     ^(recommended for most users^)
echo    or: ollama pull mixtral:8x7b
echo.

ollama pull llama3.1:70b

if %errorlevel% equ 0 (
    echo.
    echo 🎉 Setup complete! Your satellite analysis is now powered by Llama 3.1 70B
    echo.
    echo Next steps:
    echo 1. Deploy Supabase function: supabase functions deploy analyze-satellite
    echo 2. Test in your app!
    echo.
    echo 💡 Pro tip: The model loads into RAM on first use ^(~40GB^), then stays fast.
) else (
    echo.
    echo ❌ Model download failed. Try a smaller model:
    echo    ollama pull llama3.1:8b
)

pause