from app.services.bank_import_service import parse_money


def test_parse_money_accepts_brazilian_formats():
    assert parse_money("R$ 1.234,56") == 1234.56
    assert parse_money("1.234,56") == 1234.56
    assert parse_money("(1.234,56)") == -1234.56
    assert parse_money("-1234,56") == -1234.56
    assert parse_money(1234.56) == 1234.56
