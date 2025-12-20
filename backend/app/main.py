from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import api_router
from app.db.mongo import client

app = FastAPI(title="Shop Dashboard API", version="1.0.0", redirect_slashes=True)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    # Test MongoDB connection
    try:
        await client.admin.command('ping')
        print("Connected to MongoDB")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    client.close()

@app.get("/")
async def root():
    return {"message": "Shop Dashboard API"}
