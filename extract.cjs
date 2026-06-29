const mammoth = require('mammoth');
const fs = require('fs');

mammoth.extractRawText({path: 'C:/Users/lucas/OneDrive/Escritorio/Proyectos/Ecar/4- ECAR_Procedimiento_Gerencia_Logistica_v3_Premium.docx'})
    .then(function(result){
        fs.writeFileSync('4.txt', result.value);
        console.log("Extracted successfully.");
    })
    .catch(console.error);
