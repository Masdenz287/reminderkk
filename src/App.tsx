import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { StoreProvider, useStore } from './lib/store';
import Layout, { RoleGate } from './components/Layout';
import Login from './pages/Login';
import Today from './pages/Today';
import Riwayat from './pages/Riwayat';
import Kunjungan from './pages/Kunjungan';
import Dashboard from './pages/Dashboard';
import Issues from './pages/Issues';
import Notifikasi from './pages/Notifikasi';
import Lainnya from './pages/Lainnya';
import Admin from './pages/Admin';
import { can } from './lib/store';

const canAccessAdminPanel = (r: NonNullable<ReturnType<typeof useStore>['currentUser']>['role']) =>
  can.manageTeam(r) || can.viewAudit(r);

function Protected() {
  const { currentUser } = useStore();
  const location = useLocation();
  if (!currentUser) return <Navigate to="/login" state={{ from: location }} replace />;
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Today />} />
        <Route path="/riwayat" element={<Riwayat />} />
        <Route path="/kunjungan" element={<Kunjungan />} />
        <Route path="/issues" element={<Issues />} />
        <Route path="/notifikasi" element={<Notifikasi />} />
        <Route path="/lainnya" element={<Lainnya />} />
        <Route path="/dashboard" element={<RoleGate allow={can.viewDashboard}><Dashboard /></RoleGate>} />
        <Route path="/admin" element={<RoleGate allow={canAccessAdminPanel}><Admin /></RoleGate>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<Protected />} />
        </Routes>
      </HashRouter>
    </StoreProvider>
  );
}
