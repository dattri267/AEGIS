import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import zones, dispatch, scorecard

# Auto-create tables if the DB doesn't exist yet (seed.py does the full seed)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Aegis API", version="0.1.0")
@app.get("/")
def root():
    return {
        "message": "Welcome to Aegis API",
        "docs": "/docs",
        "health": "/api/health"
    }

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(zones.router)
app.include_router(dispatch.router)
app.include_router(scorecard.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
