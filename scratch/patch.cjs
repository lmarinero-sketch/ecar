const fs = require('fs');
let content = fs.readFileSync('src/components/FinancesModule.tsx', 'utf8');

if (!content.includes('createPortal')) {
  content = content.replace('import React, ', 'import { createPortal } from \'react-dom\';\nimport React, ');
}

// 1. mode === 'form'
content = content.replace(
  /{mode === 'form' && \(\s*<div className="fixed inset-0/g, 
  "{mode === 'form' && createPortal(\n            <div className=\"fixed inset-0"
);
content = content.replace(
  /<\/div>\n            <\/div>\n          \)}/g, 
  "</div>\n            </div>\n          ), document.body)}"
);

// 2. showReceiptModal
content = content.replace(
  /{showReceiptModal && \(\s*<div className="fixed inset-0/g, 
  "{showReceiptModal && createPortal(\n        <div className=\"fixed inset-0"
);
content = content.replace(
  /<\/div>\n        <\/div>\n      \)}\n\n      {\/\* Edit Cheque Modal \*\//g, 
  "</div>\n        </div>\n      ), document.body)}\n\n      {/* Edit Cheque Modal */"
);

// 3. editingCheque
content = content.replace(
  /{editingCheque && \(\s*<div className="fixed inset-0/g, 
  "{editingCheque && createPortal(\n        <div className=\"fixed inset-0"
);
content = content.replace(
  /<\/div>\n        <\/div>\n      \)}\n\n      {\/\* Audit Log Modal \*\//g, 
  "</div>\n        </div>\n      ), document.body)}\n\n      {/* Audit Log Modal */"
);

// 4. ChequeAuditModal
content = content.replace(
  /return \(\s*<div className="fixed inset-0/g, 
  "return createPortal(\n    <div className=\"fixed inset-0"
);
content = content.replace(
  /<\/div>\n    <\/div>\n  \);\n};/g, 
  "</div>\n    </div>\n  ), document.body);\n};"
);

fs.writeFileSync('src/components/FinancesModule.tsx', content);
console.log('Patched FinancesModule.tsx successfully!');
