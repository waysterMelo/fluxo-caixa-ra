from datetime import date

from app.models.account_payable import AccountPayable
from app.models.account_receivable import AccountReceivable
from app.models.company import Company
from app.models.daily_closing import DailyClosing
from app.models.import_batch import ImportBatch
from app.models.manual_adjustment import ManualAdjustment


def _create_batch(db_session, company_id: int, suffix: str) -> ImportBatch:
    batch = ImportBatch(
        source_type="TEST",
        company_id=company_id,
        file_hash=f"hash-{suffix}",
        status="SUCCESS",
        created_by=1,
    )
    db_session.add(batch)
    db_session.flush()
    return batch


def test_consolidated_daily_projection_rows_balances_and_monthly_summary(client, db_session):
    ra = Company(name="RA Teste", is_active=True)
    tec = Company(name="TEC Teste", is_active=True)
    inactive = Company(name="Inativa Teste", is_active=False)
    db_session.add_all([ra, tec, inactive])
    db_session.flush()

    ra_batch = _create_batch(db_session, ra.id, "ra")
    tec_batch = _create_batch(db_session, tec.id, "tec")
    inactive_batch = _create_batch(db_session, inactive.id, "inactive")

    db_session.add(
        DailyClosing(
            company_id=ra.id,
            closing_date=date(2026, 4, 9),
            flow_balance=100,
            bank_balance=100,
            difference_amount=0,
            closed_by=1,
            status="CLOSED",
        )
    )
    db_session.add(
        ManualAdjustment(
            company_id=tec.id,
            adjustment_date=date(2026, 4, 1),
            kind="IN",
            amount=200,
            description="Saldo inicial TEC",
            reason="Registro de Saldo Inicial",
            created_by=1,
        )
    )

    db_session.add_all(
        [
            AccountReceivable(
                company_id=ra.id,
                batch_id=ra_batch.id,
                customer_name="Cliente RA",
                due_date=date(2026, 4, 10),
                amount=50,
                status="ABERTO",
            ),
            AccountReceivable(
                company_id=ra.id,
                batch_id=ra_batch.id,
                customer_name="Cliente RA Real",
                due_date=date(2026, 4, 9),
                due_date_real=date(2026, 4, 11),
                amount=20,
                status="RECEBIDO",
            ),
            AccountReceivable(
                company_id=ra.id,
                batch_id=ra_batch.id,
                customer_name="Cliente Cancelado",
                due_date=date(2026, 4, 10),
                amount=999,
                status="CANCELADO",
            ),
            AccountPayable(
                company_id=ra.id,
                batch_id=ra_batch.id,
                supplier_name="Fornecedor RA",
                due_date=date(2026, 4, 10),
                amount=30,
                status="PAGO",
            ),
            AccountReceivable(
                company_id=tec.id,
                batch_id=tec_batch.id,
                customer_name="Cliente TEC",
                due_date=date(2026, 4, 11),
                amount=10,
                status="A RECEBER",
            ),
            AccountPayable(
                company_id=tec.id,
                batch_id=tec_batch.id,
                supplier_name="Fornecedor TEC",
                due_date=date(2026, 5, 1),
                amount=70,
                status="A PAGAR",
            ),
            AccountReceivable(
                company_id=inactive.id,
                batch_id=inactive_batch.id,
                customer_name="Cliente Inativo",
                due_date=date(2026, 4, 10),
                amount=5000,
                status="ABERTO",
            ),
        ]
    )
    db_session.commit()

    response = client.get("/api/v1/consolidated/daily?start_date=2026-04-10&end_date=2026-05-01")

    assert response.status_code == 200
    data = response.json()
    company_ids = {company["id"] for company in data["companies"]}
    assert company_ids == {ra.id, tec.id}
    assert len(data["rows"]) == 22
    assert data["opening_balances"]["companies"][str(ra.id)] == 100
    assert data["opening_balances"]["companies"][str(tec.id)] == 200
    assert data["opening_balances"]["total"] == 300

    first_day = data["rows"][0]
    assert first_day["date"] == "2026-04-10"
    assert first_day["companies"][str(ra.id)]["entradas"] == 50
    assert first_day["companies"][str(ra.id)]["saidas"] == 30
    assert first_day["companies"][str(ra.id)]["saldo"] == 120
    assert first_day["saldo_consolidado"] == 320
    assert first_day["situacao"] == "COM SALDO"

    second_day = data["rows"][1]
    assert second_day["companies"][str(ra.id)]["entradas"] == 20
    assert second_day["companies"][str(ra.id)]["saldo"] == 140
    assert second_day["companies"][str(tec.id)]["entradas"] == 10
    assert second_day["saldo_consolidado"] == 350

    may_summary = next(item for item in data["monthly_summary"] if item["month"] == "2026-05")
    assert may_summary["companies"][str(tec.id)]["saidas"] == 70
    assert may_summary["total_saidas"] == 70
    assert may_summary["saldo_final_total"] == 280


def test_consolidated_daily_projection_marks_negative_balance(client, db_session):
    company = Company(name="Negativa Teste", is_active=True)
    db_session.add(company)
    db_session.flush()
    batch = _create_batch(db_session, company.id, "negative")
    db_session.add(
        AccountPayable(
            company_id=company.id,
            batch_id=batch.id,
            supplier_name="Fornecedor",
            due_date=date(2026, 4, 10),
            amount=10,
            status="ABERTO",
        )
    )
    db_session.commit()

    response = client.get("/api/v1/consolidated/daily?start_date=2026-04-10&end_date=2026-04-10")

    assert response.status_code == 200
    row = response.json()["rows"][0]
    assert row["saldo_consolidado"] == -10
    assert row["situacao"] == "SEM SALDO"


def test_consolidated_daily_projection_defaults_to_imported_reports_period(client, db_session):
    company = Company(name="Periodo Importado Teste", is_active=True)
    db_session.add(company)
    db_session.flush()
    batch = _create_batch(db_session, company.id, "period")
    db_session.add_all(
        [
            AccountReceivable(
                company_id=company.id,
                batch_id=batch.id,
                customer_name="Cliente",
                due_date=date(2026, 4, 5),
                amount=100,
                status="ABERTO",
            ),
            AccountPayable(
                company_id=company.id,
                batch_id=batch.id,
                supplier_name="Fornecedor",
                due_date=date(2026, 4, 20),
                amount=40,
                status="A PAGAR",
            ),
        ]
    )
    db_session.commit()

    response = client.get("/api/v1/consolidated/daily")

    assert response.status_code == 200
    data = response.json()
    assert data["start_date"] == "2026-04-05"
    assert data["end_date"] == "2026-04-20"
    assert len(data["rows"]) == 16


def test_consolidated_daily_projection_validates_dates(client):
    invalid_order = client.get("/api/v1/consolidated/daily?start_date=2026-05-01&end_date=2026-04-01")
    assert invalid_order.status_code == 400

    too_large = client.get("/api/v1/consolidated/daily?start_date=2026-01-01&end_date=2027-02-01")
    assert too_large.status_code == 400
