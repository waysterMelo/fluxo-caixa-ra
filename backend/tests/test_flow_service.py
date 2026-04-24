from datetime import date

from app.models.account_payable import AccountPayable
from app.models.account_receivable import AccountReceivable
from app.models.bank_account import BankAccount
from app.models.bank_movement import BankMovement
from app.models.company import Company
from app.models.daily_closing import DailyClosing
from app.models.import_batch import ImportBatch
from app.models.manual_adjustment import ManualAdjustment
from app.services.flow_service import get_company_flow


def test_company_flow_uses_only_target_date_movements(db_session):
    company = Company(name="Fluxo Teste", is_active=True)
    db_session.add(company)
    db_session.flush()

    bank_account = BankAccount(
        company_id=company.id,
        bank_code="001",
        bank_name="Banco Teste",
        agency="0001",
        account_number="12345",
        is_active=True,
    )
    db_session.add(bank_account)
    db_session.flush()

    batch = ImportBatch(
        source_type="TEST",
        company_id=company.id,
        bank_account_id=bank_account.id,
        file_hash="hash",
        status="SUCCESS",
        created_by=1,
    )
    db_session.add(batch)
    db_session.flush()

    db_session.add(
        DailyClosing(
            company_id=company.id,
            closing_date=date(2026, 1, 9),
            flow_balance=1000,
            bank_balance=1000,
            difference_amount=0,
            closed_by=1,
            status="CLOSED",
        )
    )
    db_session.add_all(
        [
            AccountReceivable(
                company_id=company.id,
                batch_id=batch.id,
                customer_name="Cliente Hoje",
                due_date=date(2026, 1, 10),
                amount=500,
                status="ABERTO",
            ),
            AccountReceivable(
                company_id=company.id,
                batch_id=batch.id,
                customer_name="Cliente Outro Dia",
                due_date=date(2026, 1, 11),
                amount=999,
                status="ABERTO",
            ),
            AccountPayable(
                company_id=company.id,
                batch_id=batch.id,
                supplier_name="Fornecedor Hoje",
                due_date=date(2026, 1, 10),
                amount=200,
                status="ABERTO",
            ),
            AccountPayable(
                company_id=company.id,
                batch_id=batch.id,
                supplier_name="Fornecedor Outro Dia",
                due_date=date(2026, 1, 11),
                amount=999,
                status="ABERTO",
            ),
            BankMovement(
                company_id=company.id,
                bank_account_id=bank_account.id,
                batch_id=batch.id,
                movement_date=date(2026, 1, 10),
                description_raw="Recebimento",
                description_normalized="RECEBIMENTO",
                credit_amount=300,
                debit_amount=0,
                balance_after=1300,
                dedup_key="bank-current-in",
            ),
            BankMovement(
                company_id=company.id,
                bank_account_id=bank_account.id,
                batch_id=batch.id,
                movement_date=date(2026, 1, 11),
                description_raw="Recebimento outro dia",
                description_normalized="RECEBIMENTO OUTRO DIA",
                credit_amount=999,
                debit_amount=0,
                balance_after=2299,
                dedup_key="bank-other-day",
            ),
            ManualAdjustment(
                company_id=company.id,
                adjustment_date=date(2026, 1, 10),
                kind="OUT",
                amount=25,
                description="Tarifa",
                reason="Ajuste",
                created_by=1,
            ),
            ManualAdjustment(
                company_id=company.id,
                adjustment_date=date(2026, 1, 11),
                kind="IN",
                amount=999,
                description="Outro dia",
                reason="Ajuste",
                created_by=1,
            ),
        ]
    )
    db_session.commit()

    flow = get_company_flow(db_session, company.id, date(2026, 1, 10))

    assert flow["opening_balance"] == 1000
    assert flow["planned_in"] == 500
    assert flow["planned_out"] == 200
    assert flow["realized_in"] == 300
    assert flow["realized_out"] == 25
    assert flow["flow_balance"] == 1275
    assert {movement["fornecedor"] for movement in flow["movements"]} == {
        "Cliente Hoje",
        "Fornecedor Hoje",
        "RECEBIMENTO",
        "AJUSTE MANUAL",
    }
