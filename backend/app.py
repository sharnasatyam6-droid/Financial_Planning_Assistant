from pathlib import Path

from fastapi import FastAPI, Request, JSONResponse
from fastapi.staticfiles import StaticFiles

from backend.database.database import create_tables
from backend.routes.auth import router as auth_router, get_user_id_from_session
from backend.routes.profile import router as profile_router
from backend.routes.expenses import router as expenses_router
from backend.routes.goals import router as goals_router
from backend.routes.alerts import router as alerts_router
from backend.routes.insights import router as insights_router

app = FastAPI(title="Finora API")

create_tables()

PROTECTED_PREFIXES = ("/profile", "/expenses", "/goals", "/alerts", "/insights")


@app.middleware("http")
async def protect_financial_routes(request: Request, call_next):
    path = request.url.path

    if path.startswith(PROTECTED_PREFIXES):
        session_user_id = get_user_id_from_session(request.cookies.get("finora_session"))

        if session_user_id is None:
            return JSONResponse(
                status_code=401,
                content={"detail": "Authentication required"}
            )

        parts = [part for part in path.split("/") if part]

        if parts and parts[-1].isdigit() and int(parts[-1]) != session_user_id:
            return JSONResponse(
                status_code=403,
                content={"detail": "You cannot access another user's financial data"}
            )

        if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
            try:
                body = await request.json()
            except Exception:
                body = None

            if isinstance(body, dict) and "user_id" in body:
                try:
                    body_user_id = int(body["user_id"])
                except (TypeError, ValueError):
                    return JSONResponse(status_code=400, content={"detail": "Invalid user ID"})

                if body_user_id != session_user_id:
                    return JSONResponse(
                        status_code=403,
                        content={"detail": "You cannot modify another user's financial data"}
                    )

            if isinstance(body, list):
                for item in body:
                    if isinstance(item, dict) and "user_id" in item:
                        try:
                            body_user_id = int(item["user_id"])
                        except (TypeError, ValueError):
                            return JSONResponse(status_code=400, content={"detail": "Invalid user ID"})
                        if body_user_id != session_user_id:
                            return JSONResponse(
                                status_code=403,
                                content={"detail": "You cannot modify another user's financial data"}
                            )

    return await call_next(request)

app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(expenses_router)
app.include_router(goals_router)
app.include_router(alerts_router)
app.include_router(insights_router)


@app.get("/api")
def api_home():
    return {"message": "Finora backend is running"}


frontend_path = Path(__file__).resolve().parent.parent / "frontend"

app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
