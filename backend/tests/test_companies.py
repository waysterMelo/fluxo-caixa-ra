from fastapi.testclient import TestClient

def test_create_company(client: TestClient):
    response = client.post(
        "/api/v1/companies/", 
        json={"name": "Empresa Teste 1", "cnpj": "12.345.678/0001-90", "is_active": True}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Empresa Teste 1"
    assert data["cnpj"] == "12345678000190"
    assert data["is_active"] is True
    assert "id" in data

def test_create_company_duplicate_name(client: TestClient):
    # Create first company
    client.post("/api/v1/companies/", json={"name": "Empresa Unica", "is_active": True})
    
    # Try to create duplicate
    response = client.post(
        "/api/v1/companies/", 
        json={"name": "Empresa Unica", "is_active": True}
    )
    assert response.status_code == 400
    assert "Já existe uma empresa com esse nome" in response.json()["detail"]

def test_create_company_duplicate_cnpj(client: TestClient):
    # Create first company
    client.post("/api/v1/companies/", json={"name": "Empresa A", "cnpj": "11111111111111", "is_active": True})
    
    # Try to create duplicate with same CNPJ
    response = client.post(
        "/api/v1/companies/", 
        json={"name": "Empresa B", "cnpj": "11.111.111/1111-11", "is_active": True}
    )
    assert response.status_code == 400
    assert "Já existe uma empresa com esse CNPJ" in response.json()["detail"]

def test_list_companies(client: TestClient):
    client.post("/api/v1/companies/", json={"name": "Company Active", "is_active": True})
    client.post("/api/v1/companies/", json={"name": "Company Inactive", "is_active": False})

    # List all
    response = client.get("/api/v1/companies/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    
    # List active only
    response_active = client.get("/api/v1/companies/?active_only=true")
    assert response_active.status_code == 200
    data_active = response_active.json()
    assert all(c["is_active"] for c in data_active)

def test_update_company(client: TestClient):
    # Create
    create_resp = client.post("/api/v1/companies/", json={"name": "Empresa Velha", "is_active": True})
    company_id = create_resp.json()["id"]

    # Update
    update_resp = client.put(
        f"/api/v1/companies/{company_id}", 
        json={"name": "Empresa Nova", "cnpj": "99999999999999", "is_active": False}
    )
    assert update_resp.status_code == 200
    data = update_resp.json()
    assert data["name"] == "Empresa Nova"
    assert data["cnpj"] == "99999999999999"
    assert data["is_active"] is False

    # Verify fetch
    list_resp = client.get("/api/v1/companies/")
    companies = list_resp.json()
    updated = next(c for c in companies if c["id"] == company_id)
    assert updated["name"] == "Empresa Nova"
