from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from fastapi import HTTPException

from app.models.company import Company
from app.models.internal_transfer import InternalTransfer
from app.models.account_payable import AccountPayable
from app.models.account_receivable import AccountReceivable
from app.models.daily_closing import DailyClosing
from app.models.manual_adjustment import ManualAdjustment
from app.services.flow_service import get_company_flow

def get_consolidated_flow(db: Session, target_date: date):
    companies = db.query(Company).filter(Company.is_active == True).all()
    
    flows = []
    total_bruto_in = 0.0
    total_bruto_out = 0.0
    total_opening_balance = 0.0
    total_bank_balance = 0.0

    # 1. Agrupar Fluxo Bruto por Empresa
    for company in companies:
        flow_data = get_company_flow(db, company.id, target_date)
        
        # O bruto soma os movimentos de entrada/saída previstos e realizados (banco + ajuste)
        bruto_in = flow_data['realized_in'] + flow_data['planned_in']
        bruto_out = flow_data['realized_out'] + flow_data['planned_out']
        
        total_bruto_in += bruto_in
        total_bruto_out += bruto_out
        total_opening_balance += flow_data['opening_balance']
        total_bank_balance += flow_data['bank_balance']
        
        flows.append({
            "company_name": company.name,
            "company_id": company.id,
            "opening_balance": flow_data['opening_balance'],
            "total_in": bruto_in,
            "total_out": bruto_out,
            "flow_balance": flow_data['flow_balance'],
            "bank_balance": flow_data['bank_balance']
        })

    total_bruto_flow = total_opening_balance + total_bruto_in - total_bruto_out

    # 2. Identificar Transferências Internas no dia
    # Consideramos transferências validadas ou confirmadas que ocorreram nesta data
    internal_transfers = db.query(InternalTransfer).filter(
        InternalTransfer.transfer_date == target_date,
        InternalTransfer.status == 'VALIDATED' # Idealmente só desconta as validadas no consolidado
    ).all()

    total_internal_transfers = sum(float(t.amount) for t in internal_transfers)

    # 3. Calcular Líquido
    # O líquido é o bruto subtraído das transferências que aconteceram entre o próprio grupo
    # A transferência é uma entrada em uma empresa e saída em outra.
    total_liquido_in = total_bruto_in - total_internal_transfers
    total_liquido_out = total_bruto_out - total_internal_transfers
    
    # O saldo final líquido do grupo em teoria é igual ao bruto, pois a transferência é soma zero no balanço total,
    # Mas as métricas de volume (In/Out) são reduzidas para não inflar a visão gerencial.
    total_liquido_flow = total_opening_balance + total_liquido_in - total_liquido_out

    return {
        "date": target_date,
        "companies_breakdown": flows,
        "gross": {
            "opening_balance": total_opening_balance,
            "total_in": total_bruto_in,
            "total_out": total_bruto_out,
            "flow_balance": total_bruto_flow,
            "bank_balance": total_bank_balance
        },
        "internal_transfers_eliminated": total_internal_transfers,
        "net": {
            "opening_balance": total_opening_balance,
            "total_in": total_liquido_in,
            "total_out": total_liquido_out,
            "flow_balance": total_liquido_flow,
            "bank_balance": total_bank_balance
        }
    }

def _date_range(start_date: date, end_date: date):
    current_date = start_date
    while current_date <= end_date:
        yield current_date
        current_date += timedelta(days=1)

def _get_opening_balance(db: Session, company_id: int, start_date: date) -> float:
    previous_closing = db.query(DailyClosing).filter(
        DailyClosing.company_id == company_id,
        DailyClosing.closing_date < start_date,
        DailyClosing.status == 'CLOSED'
    ).order_by(DailyClosing.closing_date.desc(), DailyClosing.id.desc()).first()

    if previous_closing:
        return float(previous_closing.flow_balance)

    initial_balance_adj = db.query(ManualAdjustment).filter(
        ManualAdjustment.company_id == company_id,
        ManualAdjustment.reason == 'Registro de Saldo Inicial',
        ManualAdjustment.adjustment_date <= start_date
    ).order_by(ManualAdjustment.adjustment_date.desc(), ManualAdjustment.id.desc()).first()

    return float(initial_balance_adj.amount) if initial_balance_adj else 0.0

def _get_imported_erp_date_bounds(db: Session, company_ids: list[int]) -> tuple[date | None, date | None]:
    if not company_ids:
        return None, None

    receivable_date = func.coalesce(AccountReceivable.due_date_real, AccountReceivable.due_date)
    payable_date = func.coalesce(AccountPayable.due_date_real, AccountPayable.due_date)

    receivable_bounds = db.query(
        func.min(receivable_date),
        func.max(receivable_date)
    ).filter(
        AccountReceivable.company_id.in_(company_ids),
        func.upper(AccountReceivable.status) != 'CANCELADO'
    ).first()

    payable_bounds = db.query(
        func.min(payable_date),
        func.max(payable_date)
    ).filter(
        AccountPayable.company_id.in_(company_ids),
        func.upper(AccountPayable.status) != 'CANCELADO'
    ).first()

    min_dates = [value for value in [receivable_bounds[0], payable_bounds[0]] if value]
    max_dates = [value for value in [receivable_bounds[1], payable_bounds[1]] if value]

    if not min_dates or not max_dates:
        return None, None

    return min(min_dates), max(max_dates)

def get_consolidated_daily_projection(db: Session, start_date: date | None = None, end_date: date | None = None):
    companies = db.query(Company).filter(Company.is_active == True).order_by(Company.name).all()
    company_ids = [company.id for company in companies]

    if start_date is None or end_date is None:
        imported_start, imported_end = _get_imported_erp_date_bounds(db, company_ids)
        if start_date is None:
            start_date = imported_start or date.today()
        if end_date is None:
            end_date = imported_end or start_date

    if start_date > end_date:
        raise HTTPException(status_code=400, detail="Data inicial deve ser menor ou igual à data final.")

    total_days = (end_date - start_date).days + 1
    if total_days > 370:
        raise HTTPException(status_code=400, detail="O intervalo máximo permitido é de 370 dias.")

    company_key_by_id = {company.id: str(company.id) for company in companies}

    opening_by_company = {
        company_key_by_id[company.id]: _get_opening_balance(db, company.id, start_date)
        for company in companies
    }

    daily_values = {
        target_date: {
            company_key_by_id[company.id]: {"entradas": 0.0, "saidas": 0.0}
            for company in companies
        }
        for target_date in _date_range(start_date, end_date)
    }

    if company_ids:
        receivables = db.query(AccountReceivable).filter(
            AccountReceivable.company_id.in_(company_ids),
            func.coalesce(AccountReceivable.due_date_real, AccountReceivable.due_date) >= start_date,
            func.coalesce(AccountReceivable.due_date_real, AccountReceivable.due_date) <= end_date,
            func.upper(AccountReceivable.status) != 'CANCELADO'
        ).all()

        for title in receivables:
            flow_date = title.due_date_real or title.due_date
            company_key = company_key_by_id[title.company_id]
            daily_values[flow_date][company_key]["entradas"] += float(title.amount)

        payables = db.query(AccountPayable).filter(
            AccountPayable.company_id.in_(company_ids),
            func.coalesce(AccountPayable.due_date_real, AccountPayable.due_date) >= start_date,
            func.coalesce(AccountPayable.due_date_real, AccountPayable.due_date) <= end_date,
            func.upper(AccountPayable.status) != 'CANCELADO'
        ).all()

        for title in payables:
            flow_date = title.due_date_real or title.due_date
            company_key = company_key_by_id[title.company_id]
            daily_values[flow_date][company_key]["saidas"] += float(title.amount)

    balances = opening_by_company.copy()
    rows = []
    monthly_accumulator = {}

    for target_date in _date_range(start_date, end_date):
        total_entradas = 0.0
        total_saidas = 0.0
        row_companies = {}
        month_key = target_date.strftime("%Y-%m")

        if month_key not in monthly_accumulator:
            monthly_accumulator[month_key] = {
                "month": month_key,
                "label": target_date.strftime("%m/%Y"),
                "companies": {
                    company_key_by_id[company.id]: {
                        "company_id": company.id,
                        "entradas": 0.0,
                        "saidas": 0.0,
                        "saldo_final": balances[company_key_by_id[company.id]],
                    }
                    for company in companies
                },
                "total_entradas": 0.0,
                "total_saidas": 0.0,
                "saldo_final_total": sum(balances.values()),
            }

        for company in companies:
            company_key = company_key_by_id[company.id]
            entradas = daily_values[target_date][company_key]["entradas"]
            saidas = daily_values[target_date][company_key]["saidas"]
            balances[company_key] += entradas - saidas

            total_entradas += entradas
            total_saidas += saidas

            row_companies[company_key] = {
                "company_id": company.id,
                "entradas": entradas,
                "saidas": saidas,
                "saldo": balances[company_key],
            }

            monthly_company = monthly_accumulator[month_key]["companies"][company_key]
            monthly_company["entradas"] += entradas
            monthly_company["saidas"] += saidas
            monthly_company["saldo_final"] = balances[company_key]

        saldo_consolidado = sum(company_data["saldo"] for company_data in row_companies.values())

        monthly_accumulator[month_key]["total_entradas"] += total_entradas
        monthly_accumulator[month_key]["total_saidas"] += total_saidas
        monthly_accumulator[month_key]["saldo_final_total"] = saldo_consolidado

        rows.append({
            "date": target_date.isoformat(),
            "companies": row_companies,
            "total_entradas": total_entradas,
            "total_saidas": total_saidas,
            "saldo_consolidado": saldo_consolidado,
            "situacao": "COM SALDO" if saldo_consolidado >= 0 else "SEM SALDO",
        })

    return {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "companies": [
            {"id": company.id, "name": company.name}
            for company in companies
        ],
        "opening_balances": {
            "companies": opening_by_company,
            "total": sum(opening_by_company.values()),
        },
        "rows": rows,
        "monthly_summary": list(monthly_accumulator.values()),
    }
