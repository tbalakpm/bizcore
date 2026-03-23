const PdfPrinter = require('pdfmake/js/printer').default;
const fonts = { Helvetica: { normal: 'Helvetica' } };
const printer = new PdfPrinter(fonts);
console.log("Success", typeof printer);
