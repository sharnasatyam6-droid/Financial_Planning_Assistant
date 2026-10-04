from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from backend.database.database import create_tables
from backend.routes.auth import router as auth_router
from backend.routes.profile import router as profile_router
from backend.routes.expenses import router as expenses_router

app = FastAPI(title="Finora API")

create_tables()

app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(expenses_router)

@app.get("/api")
def api_home():
    return {"message": "Finora backend is running"}

frontend_path = Path(__file__).resolve().parent.parent / "frontend"

app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")