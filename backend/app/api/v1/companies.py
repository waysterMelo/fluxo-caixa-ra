from fastapi import APIRouter, HTTPException, Query

from app.api import deps
from app.models.company import Company
from app.schemas.company import CompanyCreate, CompanyRead, CompanyUpdate

router = APIRouter()


def _normalize_cnpj(cnpj: str | None) -> str | None:
    if not cnpj:
        return None

    normalized = "".join(char for char in cnpj if char.isdigit())
    return normalized or None


@router.get("/", response_model=list[CompanyRead])
def list_companies(
    db: deps.SessionDep,
    current_user: deps.CurrentUser,
    active_only: bool = Query(False),
):
    query = db.query(Company)
    if active_only:
        query = query.filter(Company.is_active.is_(True))

    return query.order_by(Company.name.asc()).all()


@router.post("/", response_model=CompanyRead, status_code=201)
def create_company(
    payload: CompanyCreate,
    db: deps.SessionDep,
    current_user: deps.CurrentUser,
):
    normalized_cnpj = _normalize_cnpj(payload.cnpj)

    existing_name = (
        db.query(Company)
        .filter(Company.name.ilike(payload.name.strip()))
        .first()
    )
    if existing_name:
        raise HTTPException(status_code=400, detail="Já existe uma empresa com esse nome.")

    if normalized_cnpj:
        existing_cnpj = db.query(Company).filter(Company.cnpj == normalized_cnpj).first()
        if existing_cnpj:
            raise HTTPException(status_code=400, detail="Já existe uma empresa com esse CNPJ.")

    company = Company(
        name=payload.name.strip(),
        cnpj=normalized_cnpj,
        is_active=payload.is_active,
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


@router.put("/{company_id}", response_model=CompanyRead)
def update_company(
    company_id: int,
    payload: CompanyUpdate,
    db: deps.SessionDep,
    current_user: deps.CurrentUser,
):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada.")

    normalized_cnpj = _normalize_cnpj(payload.cnpj)
    normalized_name = payload.name.strip()

    existing_name = (
        db.query(Company)
        .filter(Company.id != company_id, Company.name.ilike(normalized_name))
        .first()
    )
    if existing_name:
        raise HTTPException(status_code=400, detail="Já existe uma empresa com esse nome.")

    if normalized_cnpj:
        existing_cnpj = (
            db.query(Company)
            .filter(Company.id != company_id, Company.cnpj == normalized_cnpj)
            .first()
        )
        if existing_cnpj:
            raise HTTPException(status_code=400, detail="Já existe uma empresa com esse CNPJ.")

    company.name = normalized_name
    company.cnpj = normalized_cnpj
    company.is_active = payload.is_active

    db.commit()
    db.refresh(company)
    return company
