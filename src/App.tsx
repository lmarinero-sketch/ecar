import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './components/LoginPage';
import { CheckInPage } from './components/CheckInPage';
import { VehicleCheckInPage } from './components/VehicleCheckInPage';
import { VehicleTrackingPage } from './components/tracking/VehicleTrackingPage';
import { useAppStore } from './store/useStore';
import { MesaTecnicaPresentation } from './components/MesaTecnicaPresentation';
import { FuelRequestPage } from './components/FuelRequestPage';

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
import { RomboChat } from './components/RomboChat';
import { LiquidityDashboard } from './components/LiquidityDashboard';
import { InventoryModule } from './components/InventoryModule';
import { MonthlyReportModule } from './components/MonthlyReportModule';
import { PurchaseRequestsModule } from './components/PurchaseRequestsModule';
import { SafetyModule } from './components/SafetyModule';
import { InspectionsModule } from './components/InspectionsModule';
import { RFIModule } from './components/RFIModule';
import { ExpensesModule } from './components/ExpensesModule';
import { PaymentsModule } from './components/PaymentsModule';
import { ProjectBudgetModule } from './components/ProjectBudgetModule';
import { BudgetLandingModule } from './components/BudgetLandingModule';
import { OpportunitiesModule } from './components/OpportunitiesModule';
import { NonConformitiesModule } from './components/NonConformitiesModule';
import { ScopeChangesModule } from './components/ScopeChangesModule';
import { PurchaseOrdersModule } from './components/PurchaseOrdersModule';
import { SupplierEvalModule } from './components/SupplierEvalModule';
import { GuideModule } from './components/GuideModule';
import { ManualModule } from './components/ManualModule';
import { ImplementationModule } from './components/ImplementationModule';
import { UserManagementModule } from './components/UserManagementModule';
import { UserActivityModule } from './components/UserActivityModule';
import { CommunicationsModule } from './components/CommunicationsModule';
import { WeeklyReportModule } from './components/WeeklyReportModule';
import { ActivityTracker } from './components/ActivityTracker';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 min
      retry: 1,
    },
  },
});

// Detect public QR routes before auth
function getPublicRoute(): { type: 'checkin_attendance' } | { type: 'checkin_vehicle'; vehicleId: string } | { type: 'mesa_tecnica' } | { type: 'tracking' } | { type: 'fuel_request' } | null {
  const path = window.location.pathname;
  if (path === '/fuel-request' || path === '/fuel-request/' || path === '/solicitud-combustible' || path === '/solicitud-combustible/') {
    return { type: 'fuel_request' };
  }
  if (path === '/tracking' || path === '/tracking/') {
    return { type: 'tracking' };
  }
  if (path === '/presentacion-mesa-tecnica' || path === '/presentacion-mesa-tecnica/') {
    return { type: 'mesa_tecnica' };
  }
  // /checkin/{uuid} → Vehicle daily report (QR scan)
  const vehicleMatch = path.match(/^\/checkin\/([0-9a-f-]{36})$/i);
  if (vehicleMatch) {
    return { type: 'checkin_vehicle', vehicleId: vehicleMatch[1] };
  }
  // /checkin?token=... or /fichar?token=... → Attendance check-in
  if (path === '/checkin' || path === '/checkin/' || path === '/fichar' || path === '/fichar/') {
    return { type: 'checkin_attendance' };
  }
  return null;
}

function AppContent() {
  const { user, loading } = useAuth();
  const { activeModule } = useAppStore();

  // Public routes (no auth required)
  const publicRoute = getPublicRoute();
  if (publicRoute) {
    if (publicRoute.type === 'fuel_request') {
      return <FuelRequestPage />;
    }
    if (publicRoute.type === 'tracking') {
      return <VehicleTrackingPage />;
    }
    if (publicRoute.type === 'mesa_tecnica') {
      return <MesaTecnicaPresentation />;
    }
    if (publicRoute.type === 'checkin_vehicle') {
      return <VehicleCheckInPage vehicleId={publicRoute.vehicleId} />;
    }
    return <CheckInPage />;
  }

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
      case 'liquidity': return <LiquidityDashboard />;
      case 'wbs': return <WbsModule />;
      case 'invoicing': return <AccountingModule />;
      case 'purchases': return <PurchasesModule />;
      case 'finances': return <FinancesModule />;
      case 'obligations': return <ObligationsModule />;
      case 'rrhh': return <RrhhModule />;
      case 'inventory': return <InventoryModule />;
      case 'monthly_report': return <MonthlyReportModule />;
      case 'purchase_requests': return <PurchaseRequestsModule />;
      case 'logistics': return <LogisticsModule />;
      case 'fleet': return <FleetModule />;
      case 'certifications': return <CertificationsModule />;
      case 'field': return <FieldModule />;
      case 'safety': return <SafetyModule />;
      case 'inspections': return <InspectionsModule />;
      case 'rfi': return <RFIModule />;
      case 'expenses': return <ExpensesModule />;
      case 'payments': return <PaymentsModule />;
      case 'project_budget': return <ProjectBudgetModule />;
      case 'opportunities': return <OpportunitiesModule />;
      case 'budget_landing': return <BudgetLandingModule />;
      case 'nonconformities': return <NonConformitiesModule />;
      case 'scope_changes': return <ScopeChangesModule />;
      case 'purchase_orders': return <PurchaseOrdersModule />;
      case 'supplier_eval': return <SupplierEvalModule />;

      case 'documents': return <DocumentsModule />;
      case 'guide': return <GuideModule />;
      case 'manual': return <ManualModule />;
      case 'implementation': return <ImplementationModule />;
      case 'user_management': return <UserManagementModule />;
      case 'user_activity': return <UserActivityModule />;
      case 'communications': return <CommunicationsModule />;
      case 'weekly_report': return <WeeklyReportModule />;
      default: return <BiDashboard />;
    }
  };

  return (
    <>
      <ActivityTracker />
      <Layout>
        {renderModule()}
      </Layout>
      <RomboChat />
    </>
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
