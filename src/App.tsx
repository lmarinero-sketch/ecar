import { Layout } from './components/Layout';
import { useStore } from './store/useStore';
import { BiDashboard } from './components/BiDashboard';
import { WbsModule } from './components/WbsModule';
import { LogisticsModule } from './components/LogisticsModule';
import { FieldModule } from './components/FieldModule';
import { FleetModule } from './components/FleetModule';
import { CertificationsModule } from './components/CertificationsModule';
import { FinancesModule } from './components/FinancesModule';
import { AccountingModule } from './components/AccountingModule';
import { RrhhModule } from './components/RrhhModule';

function App() {
  const { activeModule } = useStore();

  const renderModule = () => {
    switch (activeModule) {
      case 'bi':
        return <BiDashboard />;
      case 'finances':
        return <FinancesModule />;
      case 'accounting':
        return <AccountingModule />;
      case 'rrhh':
        return <RrhhModule />;
      case 'wbs':
        return <WbsModule />;
      case 'logistics':
        return <LogisticsModule />;
      case 'field':
        return <FieldModule />;
      case 'fleet':
        return <FleetModule />;
      case 'certifications':
        return <CertificationsModule />;
      default:
        return <BiDashboard />;
    }
  };

  return (
    <Layout>
      {renderModule()}
    </Layout>
  );
}

export default App;
