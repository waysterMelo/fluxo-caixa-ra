import os
import sys

# Add the backend directory to the sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

def create_initial_admin(email: str, password: str, full_name: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user:
            print(f"Usuário {email} já existe!")
            return
        
        hashed_password = get_password_hash(password)
        new_user = User(
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
            is_active=True,
            is_admin=True
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print(f"Usuário administrador {email} criado com sucesso!")
    except Exception as e:
        print(f"Erro ao criar usuário: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    email = input("Digite o email do admin: ")
    password = input("Digite a senha do admin: ")
    full_name = input("Digite o nome completo do admin: ")
    create_initial_admin(email, password, full_name)
