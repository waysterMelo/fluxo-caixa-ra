from fastapi import APIRouter, Depends
from app.api import deps
from app.models.user import User as DBUser

router = APIRouter()

@router.get("/me")
def read_user_me(current_user: DBUser = Depends(deps.get_current_user)):
    """
    Get current user.
    Retorna os dados no formato que o frontend espera (mapeando full_name para nome).
    """
    return {
        "id": current_user.id,
        "email": current_user.email,
        "nome": current_user.full_name or "",
        "is_admin": current_user.is_admin
    }
