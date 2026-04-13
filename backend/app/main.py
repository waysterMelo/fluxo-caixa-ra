from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.api.v1.api import api_router
from datetime import datetime
import json

# Configurar timezone padrão
import os
os.environ['TZ'] = settings.TIMEZONE

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, restrinja para domínios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_timezone_info(request: Request, call_next):
    response = await call_next(request)
    # Adicionar timezone do servidor nas respostas
    if isinstance(response, JSONResponse):
        response.headers["X-Timezone"] = settings.TIMEZONE
    return response

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {"message": "API de Fluxo de Caixa Diário", "version": settings.VERSION, "timezone": settings.TIMEZONE}
