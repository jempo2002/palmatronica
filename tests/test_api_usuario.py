import pytest
import sys
from types import SimpleNamespace
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))
from app import app

class DummyCursor:
    def __enter__(self):
        return self
    def __exit__(self, exc_type, exc, tb):
        pass
    def execute(self, *args, **kwargs):
        pass
    def fetchone(self):
        return None

class DummyConnection:
    def cursor(self, dictionary=False):
        return DummyCursor()
    def __enter__(self):
        return self
    def __exit__(self, exc_type, exc, tb):
        pass
    def close(self):
        pass

@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr('app.obtener_conexion', lambda: DummyConnection())
    app.config.update({'TESTING': True, 'WTF_CSRF_ENABLED': False})
    return app.test_client()

def test_api_usuario_not_found(client):
    resp = client.get('/api/usuario/9999')
    assert resp.status_code == 404
    assert resp.is_json
    assert resp.get_json()['error'] == 'Usuario no encontrado'
