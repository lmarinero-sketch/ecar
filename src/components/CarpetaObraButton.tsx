import React, { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { useBudgets, useBudgetItems, useBudgetSections } from '../hooks/useData';
import { exportToObra } from '../lib/budgetExports';

export const CarpetaObraButton: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { data: budgets } = useBudgets();
  const activeBudget = (budgets || []).find(b => b.project_id === projectId && (b.status === 'approved' || b.status === 'closed'));
  
  if (!activeBudget) return null;

  return <CarpetaObraGenerator budget={activeBudget} />;
};

const CarpetaObraGenerator: React.FC<{ budget: any }> = ({ budget }) => {
  const { data: items = [], isLoading: itemsLoading } = useBudgetItems(budget.id);
  const { data: sections = [], isLoading: sectionsLoading } = useBudgetSections(budget.id);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = () => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        exportToObra(budget, items, sections);
      } catch(e) {
        console.error(e);
        alert('Error al generar la carpeta.');
      } finally {
        setIsGenerating(false);
      }
    }, 500); // small delay to allow UI to update
  };

  const isLoading = itemsLoading || sectionsLoading;

  return (
    <button 
      onClick={handleDownload} 
      disabled={isLoading || isGenerating}
      className="bg-blue-50 text-blue-700 px-3 py-2 rounded-xl text-xs font-bold border border-blue-200 hover:bg-blue-100 flex items-center gap-1.5 transition-all shadow-sm w-full justify-center disabled:opacity-50"
    >
      {isGenerating || isLoading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
      Descargar Carpeta de Obra (PDF)
    </button>
  );
};
