import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import FluxoDiario from '../pages/FluxoDiario';
import Fechamento from '../pages/Fechamento';
import Importacoes from '../pages/Importacoes';
import Conciliacao from '../pages/Conciliacao';
import Ajustes from '../pages/Ajustes';
import Empresas from '../pages/Empresas';
import Relatorios from '../pages/Relatorios';
import '../styles/global.css';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fluxo-diario"
            element={
              <ProtectedRoute>
                <FluxoDiario />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fechamento"
            element={
              <ProtectedRoute>
                <Fechamento />
              </ProtectedRoute>
            }
          />
          <Route
            path="/importacoes"
            element={
              <ProtectedRoute>
                <Importacoes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/empresas"
            element={
              <ProtectedRoute>
                <Empresas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/conciliacao"
            element={
              <ProtectedRoute>
                <Conciliacao />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ajustes"
            element={
              <ProtectedRoute>
                <Ajustes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/relatorios"
            element={
              <ProtectedRoute>
                <Relatorios />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
