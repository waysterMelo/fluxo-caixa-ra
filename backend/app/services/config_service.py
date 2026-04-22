from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models.bank_movement import BankMovement
from app.models.reconciliation import Reconciliation
from app.models.title_settlement import TitleSettlement
from app.models.manual_adjustment import ManualAdjustment
from app.models.daily_closing import DailyClosing
from app.models.internal_transfer import InternalTransfer
from app.models.account_payable import AccountPayable
from app.models.account_receivable import AccountReceivable
from app.models.import_batch import ImportBatch

class ConfigService:
    @staticmethod
    def cleanup_period(db: Session, company_id: int, start_date: date, end_date: date):
        # 0. Identificar Lotes criados no período para limpeza forçada de dependências
        batches_in_period = db.query(ImportBatch.id).filter(
            and_(
                ImportBatch.company_id == company_id,
                ImportBatch.created_at >= start_date,
                ImportBatch.created_at <= end_date
            )
        ).all()
        batch_ids = [b[0] for b in batches_in_period]

        # 1. Reconciliations
        # Deletar se o movimento bancário estiver no período OU pertencer a um lote do período
        movements_to_clean_query = db.query(BankMovement.id).filter(
            or_(
                and_(
                    BankMovement.company_id == company_id,
                    BankMovement.movement_date >= start_date,
                    BankMovement.movement_date <= end_date
                ),
                BankMovement.batch_id.in_(batch_ids) if batch_ids else False
            )
        )
        movements_ids = [m[0] for m in movements_to_clean_query.all()]
        
        if movements_ids:
            db.query(Reconciliation).filter(
                Reconciliation.movement_id.in_(movements_ids)
            ).delete(synchronize_session=False)

        # 2. Internal Transfers
        db.query(InternalTransfer).filter(
            and_(
                or_(
                    InternalTransfer.company_from_id == company_id,
                    InternalTransfer.company_to_id == company_id
                ),
                InternalTransfer.transfer_date >= start_date,
                InternalTransfer.transfer_date <= end_date
            )
        ).delete(synchronize_session=False)

        # 3. Bank Movements
        db.query(BankMovement).filter(
            or_(
                and_(
                    BankMovement.company_id == company_id,
                    BankMovement.movement_date >= start_date,
                    BankMovement.movement_date <= end_date
                ),
                BankMovement.batch_id.in_(batch_ids) if batch_ids else False
            )
        ).delete(synchronize_session=False)

        # 4. Title Settlements
        # Deletar se a liquidação for no período OU pertencer a um lote do período
        db.query(TitleSettlement).filter(
            or_(
                and_(
                    TitleSettlement.source_batch_id.in_(
                        db.query(ImportBatch.id).filter(ImportBatch.company_id == company_id)
                    ),
                    TitleSettlement.settlement_date >= start_date,
                    TitleSettlement.settlement_date <= end_date
                ),
                TitleSettlement.source_batch_id.in_(batch_ids) if batch_ids else False
            )
        ).delete(synchronize_session=False)

        # 5. Manual Adjustments
        db.query(ManualAdjustment).filter(
            and_(
                ManualAdjustment.company_id == company_id,
                ManualAdjustment.adjustment_date >= start_date,
                ManualAdjustment.adjustment_date <= end_date
            )
        ).delete(synchronize_session=False)

        # 6. Daily Closings
        db.query(DailyClosing).filter(
            and_(
                DailyClosing.company_id == company_id,
                DailyClosing.closing_date >= start_date,
                DailyClosing.closing_date <= end_date
            )
        ).delete(synchronize_session=False)

        # 7. Accounts Payable
        db.query(AccountPayable).filter(
            or_(
                and_(
                    AccountPayable.company_id == company_id,
                    AccountPayable.due_date >= start_date,
                    AccountPayable.due_date <= end_date
                ),
                AccountPayable.batch_id.in_(batch_ids) if batch_ids else False
            )
        ).delete(synchronize_session=False)

        # 8. Accounts Receivable
        db.query(AccountReceivable).filter(
            or_(
                and_(
                    AccountReceivable.company_id == company_id,
                    AccountReceivable.due_date >= start_date,
                    AccountReceivable.due_date <= end_date
                ),
                AccountReceivable.batch_id.in_(batch_ids) if batch_ids else False
            )
        ).delete(synchronize_session=False)

        # 9. Import Batches (Agora seguro para deletar)
        db.query(ImportBatch).filter(
            and_(
                ImportBatch.company_id == company_id,
                ImportBatch.created_at >= start_date,
                ImportBatch.created_at <= end_date
            )
        ).delete(synchronize_session=False)

        db.commit()
        return {"message": "Dados apagados com sucesso para o período selecionado."}

config_service = ConfigService()
