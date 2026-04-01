import { text } from 'node:stream/consumers';
import type { PdfDocument } from './pdf-document';
import type { CompanyInfo, ReportMeta, Address, TableColumn } from './pdf-types';
import bwipjs from 'bwip-js';
import { LogService } from '../../../core/logger/logger.service';

// --- Section 1: Company Header ---
export function renderCompanyHeader(pdf: PdfDocument, company: CompanyInfo): void {
  const addrLines = [
    company.addressLine1,
    [company.city, company.state, company.postalCode].filter(Boolean).join(' '),
  ].filter(Boolean);

  const contactLines = [
    company.gstin ? `GSTIN: ${company.gstin}` : null,
    company.phone ? `Phone: ${company.phone}` : null,
  ].filter(Boolean);

  pdf.addContent([
    {
      text: company.name.toUpperCase(),
      style: 'companyName',
      alignment: 'center',
      margin: [0, 0, 0, 5]
    },
    {
      text: addrLines.join(', '),
      alignment: 'center',
      margin: [0, 0, 0, 2]
    },
    {
      text: contactLines.join('  |  '),
      alignment: 'center',
      margin: [0, 0, 0, 5]
    },
    {
      canvas: [{ type: 'line', x1: 0, y1: 0, x2: pdf.usableWidth, y2: 0, lineWidth: 0.5, lineColor: '#CCCCCC' }],
      margin: [0, 5, 0, 10]
    }
  ]);

  if (!pdf.docDefinition.styles) {
    pdf.docDefinition.styles = {};
  }
  pdf.docDefinition.styles.companyName = { fontSize: 18, bold: true };
}

// --- Section 2: Report Meta ---
export function renderReportMeta(pdf: PdfDocument, meta: ReportMeta): void {
  const rightMeta: any[] = [
    {
      columns: [
        { text: 'Number:', bold: true, width: 60 },
        { text: meta.number, width: '*' }
      ],
      margin: [0, 0, 0, 2]
    },
    {
      columns: [
        { text: 'Date:', bold: true, width: 60 },
        { text: meta.date, width: '*' }
      ],
      margin: [0, 0, 0, 2]
    }
  ];

  if (meta.extraMeta) {
    for (const extra of meta.extraMeta) {
      rightMeta.push({
        columns: [
          { text: `${extra.label}:`, bold: true, width: 60 },
          { text: extra.value, width: '*' }
        ],
        margin: [0, 0, 0, 2]
      });
    }
  }

  pdf.addContent({
    columns: [
      {
        text: meta.title,
        fontSize: 14,
        bold: true,
        width: '*'
      },
      {
        stack: rightMeta,
        width: 130,
        fontSize: 9
      }
    ],
    margin: [0, 0, 0, 10]
  });
}

// --- Section 3: E-Invoice Block ---
export async function renderEInvoiceBlock(
  pdf: PdfDocument,
  irn?: string | null,
  ackNo?: string | null,
  ackDate?: string | null,
  signedQrCode?: string | null,
): Promise<void> {
  if (!irn) return;

  const row1Columns: any[] = [
    { text: 'IRN:', bold: true, width: 30 },
    { text: irn, width: 300 }
  ];

  if (signedQrCode) {
    try {
      const qrPng = await bwipjs.toBuffer({
        bcid: 'qrcode',
        text: signedQrCode,
        scale: 2,
        height: 65,
        width: 65,
      });
      const b64 = qrPng.toString('base64');
      row1Columns.push({
        image: `data:image/png;base64,${b64}`,
        width: 65,
        alignment: 'right'
      });
    } catch (e) {
      LogService.error('QR rendering failed', e);
    }
  }

  const row2Columns = [
    { text: 'Ack No:', bold: true, width: 40 },
    { text: ackNo || '', width: 'auto', margin: [0, 0, 20, 0] },
    { text: 'Ack Date:', bold: true, width: 50 },
    { text: ackDate || '', width: 'auto' }
  ];

  pdf.addContent([
    {
      columns: row1Columns,
      fontSize: 8,
      margin: [0, 0, 0, 5]
    },
    {
      columns: row2Columns,
      fontSize: 8,
      margin: [0, 0, 0, 10]
    }
  ]);
}

// --- Section 4: Address Block ---
export function renderAddressBlock(
  pdf: PdfDocument,
  left: Address,
  right?: Address,
  leftLabel = 'BILL TO',
  rightLabel = 'SHIP TO',
): void {
  const formatAddr = (addr: Address) => {
    const lines = [
      addr.name,
      addr.gstin ? `GSTIN: ${addr.gstin}` : null,
      addr.line1,
      [addr.city, addr.state, addr.postalCode].filter(Boolean).join(' '),
      addr.phone ? `Phone: ${addr.phone}` : null,
    ].filter(Boolean);
    return lines.join('\n');
  };

  const columns: any[] = [
    {
      stack: [
        { text: leftLabel, bold: true, margin: [0, 0, 0, 5] },
        { text: formatAddr(left) }
      ],
      width: '*'
    }
  ];

  if (right) {
    columns.push({
      stack: [
        { text: rightLabel, bold: true, margin: [0, 0, 0, 5] },
        { text: formatAddr(right) }
      ],
      width: '*'
    });
  }

  pdf.addContent({
    columns,
    margin: [0, 0, 0, 15]
  });
}

// --- Section 5: Generic Items Table ---
export function renderItemsTable(
  pdf: PdfDocument,
  columns: TableColumn[],
  rows: any[]
): void {
  const tableHeader = columns.map(col => ({
    text: col.header,
    bold: true,
    fillColor: '#CCCCCC',
    alignment: col.align || 'left',
    margin: [2, 4, 2, 4]
  }));

  const tableWidths = columns.map(col => {
    if (col.width) return col.width;
    // if (col.key === 'index' || col.key === 'hsnSac' || col.key === 'gtn' || col.header === 'Qty' || col.header === 'Rate' || col.header === 'Tax%') return 'auto';
    // if (col.key === 'productName') return '*';
    return 'auto';
  });

  const tableBodyItems = rows.map((row, index) => {
    const isOdd = index % 2 === 1;
    return columns.map(col => {
      const value = col.key === 'index' ? (index + 1).toString() : row[col.key];
      const displayValue = col.format ? col.format(value) : (value?.toString() ?? '');
      return {
        text: displayValue,
        alignment: col.align || 'left',
        fillColor: isOdd ? '#F7F7F7' : null,
        margin: [2, 4, 2, 4]
      };
    });
  });

  pdf.addContent({
    table: {
      headerRows: 1,
      widths: tableWidths,
      body: [
        tableHeader,
        ...tableBodyItems
      ]
    },
    layout: {
      defaultBorder: false,
      hLineWidth: function (i: number, node: any) {
        return (i === 0 || i === node.table.body.length) ? 0 : 0.5;
      },
      vLineWidth: function () {
        return 0;
      },
      hLineColor: function () {
        return '#EEEEEE';
      },
      paddingLeft: function () { return 2; },
      paddingRight: function () { return 2; },
      paddingTop: function () { return 2; },
      paddingBottom: function () { return 2; },
    },
    margin: [0, 0, 0, 10]
  });
}

// --- Section 6: Totals Block ---
export function renderTotals(
  pdf: PdfDocument,
  totals: {
    subtotal?: number;
    discountAmount?: number;
    taxableAmount?: number;
    taxAmount?: number;
    taxPct?: number;
    cgstAmount?: number;
    sgstAmount?: number;
    igstAmount?: number;
    roundOff: number;
    netAmount: number;
  },
  company: CompanyInfo,
  hsnSummary?: Array<{
    hsnSac: string;
    taxableValue: number;
    taxPct: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
  }>,
  isEstimate?: boolean
): void {
  const fmt = (v: number) => v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  let hsnBlock: any = null;
  if (!isEstimate && hsnSummary && hsnSummary.length > 0) {
    const isIgst = totals.igstAmount! > 0;
    const headerRow = [
      { text: 'HSN/SAC', bold: true },
      { text: 'Taxable', bold: true, alignment: 'right' }
    ];

    if (isIgst) {
      headerRow.push({ text: 'IGST', bold: true, alignment: 'right' });
    } else {
      headerRow.push({ text: 'CGST', bold: true, alignment: 'right' });
      headerRow.push({ text: 'SGST', bold: true, alignment: 'right' });
    }

    const hsnBody = hsnSummary.map(hsn => {
      const row = [
        { text: hsn.hsnSac || '' },
        { text: fmt(hsn.taxableValue), alignment: 'right' }
      ];
      if (isIgst) {
        row.push({ text: `${Number(hsn.taxPct).toFixed(1)}% - ${fmt(hsn.igstAmount)}`, alignment: 'right' });
      } else {
        row.push({ text: `${(Number(hsn.taxPct) / 2).toFixed(1)}% - ${fmt(hsn.cgstAmount)}`, alignment: 'right' });
        row.push({ text: `${(Number(hsn.taxPct) / 2).toFixed(1)}% - ${fmt(hsn.sgstAmount)}`, alignment: 'right' });
      }
      return row;
    });

    hsnBlock = {
      table: {
        headerRows: 1,
        widths: isIgst ? ['auto', 'auto', 'auto'] : ['auto', 'auto', 'auto', 'auto'],
        body: [headerRow, ...hsnBody],
        // lineWidth: 0.5,
        // lineColor: '#CCCCCC'
        // borderColor: ['#ff00ff', '#00ffff', '#ff00ff', '#00ffff']
      },
      // layout: 'lightHorizontalLines',
      layout: {
        hLineWidth: function (i: number, node: any) {
          return 0.5; //(i === 0 || i === node.table.body.length) ? 0 : 0.5;
        },
        vLineWidth: function () {
          return 0;
        },
        hLineColor: function () {
          return '#CCCCCC';
        },
        // paddingLeft: function () {
        //   return 2;
        // },
        // paddingRight: function () {
        //   return 2;
        // },
        // paddingTop: function () {
        //   return 2;
        // },
        // paddingBottom: function () {
        //   return 2;
        // }
      },
      fontSize: 8,
      margin: [0, 0, 10, 0],
    };
  }

  const totalsStack: any[] = [];
  const pushTotal = (label: string, value: string, bold = false) => {
    totalsStack.push({
      columns: [
        { text: label, width: 120, alignment: 'right', bold },
        { text: value, width: 80, alignment: 'right', bold }
      ],
      margin: [0, 2, 0, 2]
    });
  };

  if (!isEstimate && totals.taxableAmount !== undefined) {
    pushTotal('Taxable Amount:', fmt(totals.taxableAmount));
    if (totals.igstAmount && totals.igstAmount > 0) {
      pushTotal('IGST:', fmt(totals.igstAmount));
    } else {
      pushTotal('CGST:', fmt(totals.cgstAmount || 0));
      pushTotal('SGST:', fmt(totals.sgstAmount || 0));
    }
  } else if (!isEstimate) {
    pushTotal('Subtotal:', fmt(totals.subtotal || 0));
    if (totals.discountAmount && totals.discountAmount > 0) {
      pushTotal('Discount:', `- ${fmt(totals.discountAmount)}`);
    }

    const tAmt = (totals.subtotal || 0) - (totals.discountAmount || 0);
    pushTotal('Taxable Amount:', fmt(tAmt));

    if (totals.taxAmount && totals.taxAmount > 0) {
      const halfTax = (totals.taxPct || 0) / 2;
      const halfAmt = (totals.taxAmount || 0) / 2;
      pushTotal(`CGST (${halfTax}%):`, fmt(halfAmt));
      pushTotal(`SGST (${halfTax}%):`, fmt(halfAmt));
    }
  }

  if (Math.abs(totals.roundOff) > 0.001) {
    pushTotal('Round Off:', fmt(totals.roundOff));
  }

  totalsStack.push({
    canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5, lineColor: '#CCCCCC' }],
    margin: [0, 5, 0, 5],
    alignment: 'right'
  });

  totalsStack.push({
    columns: [
      { text: 'NET AMOUNT:', width: 120, alignment: 'right', bold: true },
      { text: fmt(totals.netAmount), width: 80, alignment: 'right', bold: true }
    ],
    margin: [0, 2, 0, 2]
  });

  pdf.addContent({
    unbreakable: true, // Keep totals block together
    columns: [
      { width: '*', stack: hsnBlock ? [hsnBlock] : [] },
      { width: 205, stack: totalsStack }
    ],
    margin: [0, 10, 0, 20]
  });
}

// --- Section 7: Footer ---
export function renderFooter(pdf: PdfDocument, company: CompanyInfo): void {
  pdf.setFooter(function (currentPage: number, pageCount: number) {
    const pageNumberBlock = {
      // absolutePosition: { x: 0, y: pdf.pageHeight - 25 },
      columns: [
        {
          width: '*',
          fontSize: 8,
          alignment: 'center',
          stack: [
            { text: '', margin: [0, 0, 0, 20] },
            {
              text: `Page ${currentPage} of ${pageCount}`, margin: [0, 0, 0, 20]
            }]
        }
      ]
    };

    if (currentPage !== pageCount) {
      return pageNumberBlock;
      // return null;
    }

    return {
      stack: [
        {
          canvas: [{ type: 'line', x1: 0, y1: 0, x2: pdf.usableWidth, y2: 0, lineWidth: 0.5, lineColor: '#CCCCCC' }],
          margin: [0, 0, 0, 10]
        },
        {
          columns: [
            // Column 1: Bank Info
            {
              width: '*',
              fontSize: 8,
              stack: [
                { text: 'Bank Details:', bold: true, margin: [0, 0, 0, 2] },
                { text: `Bank: ${company.bankName || ''}`, margin: [0, 0, 0, 2] },
                { text: `A/c: ${company.bankAccount || ''}`, margin: [0, 0, 0, 2] },
                { text: `IFSC: ${company.bankIfsc || ''}`, margin: [0, 0, 0, 2] }
              ]
            },
            // Column 2: Terms
            {
              width: '*',
              fontSize: 8,
              stack: [
                { text: 'Terms & Conditions:', bold: true, margin: [0, 0, 0, 2] },
                { text: company.invoiceTerms || '', margin: [0, 0, 0, 2] },
                { text: '', margin: [0, 0, 0, 11] },
                { text: `Page ${currentPage} of ${pageCount}`, alignment: 'center' }
              ]
            },
            // Column 3: Signatory
            {
              width: '*',
              fontSize: 8,
              alignment: 'right',
              stack: [
                { text: `For ${company.name}`, bold: true, margin: [0, 0, 0, 30] },
                { text: 'Authorised Signatory' }
              ]
            }
          ]
        },
        // pageNumberBlock
      ],
      margin: [pdf.marginLeft, 20, pdf.marginRight, 0]
    };
  });
}

// --- Section 8: Rule ---
export function renderRule(pdf: PdfDocument): void {
  pdf.addContent({
    canvas: [{ type: 'line', x1: 0, y1: 0, x2: pdf.usableWidth, y2: 0, lineWidth: 0.5, lineColor: '#CCCCCC' }],
    margin: [0, 5, 0, 10]
  });
}
