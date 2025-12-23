#!/bin/bash
# Install dependencies is usually handled by Render's build command, 
# but we can ensure uvicorn is installed if needed.

# Start the application
# --host 0.0.0.0 is CRITICAL for Render
# --port $PORT uses the port assigned by Render (default 10000)
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
