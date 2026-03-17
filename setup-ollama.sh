#!/usr/bin/env bash

echo "=== Ollama Setup for Satellite Analysis ==="
echo ""

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama not found. Please install from: https://ollama.ai/download"
    echo "Then run this script again."
    exit 1
fi

echo "✅ Ollama is installed"

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags &> /dev/null; then
    echo "🚀 Starting Ollama server..."
    ollama serve &
    sleep 3
fi

echo "✅ Ollama server is running"

# Download the recommended model
echo "📥 Downloading Llama 3.1 70B model (this may take a while)..."
echo "   If you want a faster/smaller model, cancel and run:"
echo "   ollama pull llama3.1:8b  # or mixtral:8x7b"
echo ""

ollama pull llama3.1:70b

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Setup complete! Your satellite analysis is now powered by Llama 3.1 70B"
    echo ""
    echo "Next steps:"
    echo "1. Deploy Supabase function: supabase functions deploy analyze-satellite"
    echo "2. Test in your app!"
    echo ""
    echo "💡 Pro tip: The model loads into RAM on first use (~40GB), then stays fast."
else
    echo ""
    echo "❌ Model download failed. Try a smaller model:"
    echo "   ollama pull llama3.1:8b"
fi