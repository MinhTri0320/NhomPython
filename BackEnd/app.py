"""Điểm khởi động BackEnd.

Chạy (trong thư mục BackEnd, đã bật venv):
    uvicorn app:app --reload
Tài liệu API tự sinh: http://127.0.0.1:8000/docs
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

import models  # noqa: F401  (đăng ký toàn bộ model)
from config.database import engine
from config.settings import settings
from routes import adminR, forgotPasswordR, loginR, registerR, verifyEmailR
from services.errors import AppError

app = FastAPI(title="Hệ thống quản lý tuyển dụng", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


app.include_router(registerR.router)
app.include_router(loginR.router)
app.include_router(verifyEmailR.router)
app.include_router(forgotPasswordR.router)
app.include_router(adminR.router)


@app.get("/", tags=["Hệ thống"])
def health():
    """Kiểm tra BackEnd và kết nối CSDL."""
    try:
        with engine.connect() as conn:
            roles = [r[0] for r in conn.execute(text("SELECT code FROM roles ORDER BY id"))]
        return {"status": "ok", "database": "connected", "roles": roles}
    except Exception as exc:  # noqa: BLE001
        return JSONResponse(status_code=503, content={"status": "error", "database": str(exc)})
