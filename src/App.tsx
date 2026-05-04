import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './components/LoginPage';
import { useAppStore } from './store/useStore';

// Module imports
import { BiDashboard } from './components/BiDashboard';
import { WbsModule } from './components/WbsModule';
import { FinancesModule } from './components/FinancesModule';
import { AccountingModule } from './components/AccountingModule';
import { RrhhModule } from './components/RrhhModule';
import { LogisticsModule } from './components/LogisticsModule';
import { FleetModule } from './components/FleetModule';
import { CertificationsModule } from './components/CertificationsModule';
import { FieldModule } from './components/FieldModule';
import { ObligationsModule } from './components/ObligationsModule';
import { PurchasesModule } from './components/PurchasesModule';
import { DocumentsModule } from './components/DocumentsModule';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 min
      retry: 1,
    },
  },
});

function AppContent() {
  const { user, loading } = useAuth();
  const { activeModule } = useAppStore();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-ecar-blue rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm font-medium">Cargando ECAR...</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const renderModule = () => {
    switch (activeModule) {
      case 'bi': return <BiDashboard />;
      case 'wbs': return <WbsModule />;
      case 'invoicing': return <AccountingModule />;
      case 'purchases': return <PurchasesModule />;
      case 'finances': return <FinancesModule />;
      case 'obligations': return <ObligationsModule />;
      case 'rrhh': return <RrhhModule />;
      case 'logistics': return <LogisticsModule />;
      case 'fleet': return <FleetModule />;
      case 'certifications': return <CertificationsModule />;
      case 'field': return <FieldModule />;
      case 'documents': return <DocumentsModule />;
      default: return <BiDashboard />;
    }
  };

  return (
    <Layout>
      {renderModule()}
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
