from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date

from app.models.company import Company
from app.models.internal_transfer import InternalTransfer
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
