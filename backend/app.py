from fastapi import FastAPI
from database.database import create_tables
from routes.auth import router as auth_router

app = FastAPI(title="Finora API")

create_tables()

app.include_router(auth_router)


@app.get("/")
def home():
    return {"message": "Finora backend is running"}