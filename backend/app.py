from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from backend.database.database import create_tables
from backend.routes.auth import router as auth_router

app = FastAPI(title="Finora API")

create_tables()

app.include_router(auth_router)

@app.get("/api")
def api_home():
    return {"message": "Finora backend is running"}

frontend_path = Path(__file__).resolve().parent.parent / "frontend"

app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")