from fastapi import APIRouter
from app.api.v1 import adjustments, auth, bank_accounts, companies, consolidated, flows, imports, reconciliations, users, config

api_router = APIRouter()
api_router.include_router(auth.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(companies.router, prefix="/companies", tags=["companies"])
api_router.include_router(bank_accounts.router, prefix="/bank-accounts", tags=["bank-accounts"])
api_router.include_router(imports.router, prefix="/imports", tags=["imports"])
api_router.include_router(reconciliations.router, prefix="/reconciliations", tags=["reconciliations"])
api_router.include_router(flows.router, prefix="/flows", tags=["flows"])
api_router.include_router(adjustments.router, prefix="/adjustments", tags=["adjustments"])
api_router.include_router(consolidated.router, prefix="/consolidated", tags=["consolidated"])
api_router.include_router(config.router, prefix="/config", tags=["config"])
