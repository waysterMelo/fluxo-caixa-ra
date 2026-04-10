from fastapi import APIRouter
from app.api.v1 import auth, imports, reconciliations, flows, adjustments, consolidated

api_router = APIRouter()
api_router.include_router(auth.router, tags=["login"])
api_router.include_router(imports.router, prefix="/imports", tags=["imports"])
api_router.include_router(reconciliations.router, prefix="/reconciliations", tags=["reconciliations"])
api_router.include_router(flows.router, prefix="/flows", tags=["flows"])
api_router.include_router(adjustments.router, prefix="/adjustments", tags=["adjustments"])
api_router.include_router(consolidated.router, prefix="/consolidated", tags=["consolidated"])
