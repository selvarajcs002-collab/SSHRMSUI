import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx-js-style';

export interface SalaryExportItem {
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  designation: string;
  presentDays: number;
  leaveDays: number; // Absent days
  halfDays: number;
  perDaySalary: number;
  totalSalary: number; // Present days salary
  incentive: number;
  advance: number;
  salary: number; // Net total salary
  paymentStatus: 'Paid' | 'Pending' | string;
}

export interface SalaryExportSummary {
  totalEmployees: number;
  totalSalary: number;
  paidAmount: number;
  remainingAmount: number;
}

export interface SalaryExportOptions {
  monthLabel: string; // e.g. "September 2026"
  fromDate: Date;
  toDate: Date;
  companyName?: string;
  companySubtitle?: string;
  companyTagline?: string;
  companyAddress?: string;
  companyCity?: string;
  companyGst?: string;
  companyContact?: string;
  remarks?: string;
  fileName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SalaryExcelExportService {

  public exportSalaryReport(
    items: SalaryExportItem[],
    summary: SalaryExportSummary,
    options: SalaryExportOptions
  ): void {
    const wb = XLSX.utils.book_new();

    // 1. Prepare Sheet Data Array of Arrays (aoa)
    const aoa: any[][] = [];
    const merges: XLSX.Range[] = [];
    const rowHeights: { hpt: number }[] = [];

    // Helper to format Indian currency
    const formatINR = (val: number | null | undefined): string => {
      const num = Number(val) || 0;
      return '₹ ' + num.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    };

    // Helper to format Date as DD/MM/YYYY
    const formatDateDDMMYYYY = (d: Date): string => {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    // Helper to format employee code e.g. EMP-001
    const formatEmpId = (code: string | undefined | null, id: number): string => {
      const raw = (code || '').trim();
      if (!raw) {
        return `EMP-${String(id).padStart(3, '0')}`;
      }
      const match = raw.match(/^EMP[-_]?(\d+)$/i);
      if (match) {
        return `EMP-${match[1].padStart(3, '0')}`;
      }
      if (/^\d+$/.test(raw)) {
        return `EMP-${raw.padStart(3, '0')}`;
      }
      return raw;
    };

    // Style constants
    const thinBorder = (colorHex: string = 'E2E8F0') => ({
      top: { style: 'thin', color: { rgb: colorHex } },
      bottom: { style: 'thin', color: { rgb: colorHex } },
      left: { style: 'thin', color: { rgb: colorHex } },
      right: { style: 'thin', color: { rgb: colorHex } }
    });

    const createCell = (
      val: any,
      type: 's' | 'n' = 's',
      style: any = {}
    ) => ({
      v: val,
      t: type,
      s: style
    });

    // Company & Report Defaults
    const compName = options.companyName || 'S.S. Embroidery';
    const compSubtitle = options.companySubtitle || 'Textile & Garment Solutions';
    const compTagline = options.companyTagline || 'Stitching Excellence for a Better Tomorrow';
    const compAddr1 = options.companyAddress || '123, Industrial Estate, Avinashi Road,';
    const compAddr2 = options.companyCity || 'Tiruppur – 641 603, Tamil Nadu, India';
    const compGst = options.companyGst || 'GST No: 33ABCDE1234F1Z5';
    const compContact = options.companyContact || 'Phone: +91 98765 43210  |  Email: info@ssembroidery.in';
    const dateRangeStr = `${formatDateDDMMYYYY(options.fromDate)}  to  ${formatDateDDMMYYYY(options.toDate)}`;
    const monthText = options.monthLabel;

    // Header light blue fill for right box
    const headerBoxFill = { fgColor: { rgb: 'E8F2FC' } };
    const headerBoxBorder = {
      top: { style: 'thin', color: { rgb: 'BAE6FD' } },
      bottom: { style: 'thin', color: { rgb: 'BAE6FD' } },
      left: { style: 'thin', color: { rgb: 'BAE6FD' } },
      right: { style: 'thin', color: { rgb: 'BAE6FD' } }
    };

    // =========================================================================
    // ROW 0 (Header Line 1)
    // =========================================================================
    const row0: any[] = new Array(12).fill(null);
    row0[0] = createCell(compName, 's', {
      font: { name: 'Calibri', sz: 17, bold: true, color: { rgb: '0B3C73' } },
      alignment: { horizontal: 'left', vertical: 'center' }
    });
    row0[4] = createCell(compAddr1, 's', {
      font: { name: 'Calibri', sz: 8.5, color: { rgb: '334155' } },
      alignment: { horizontal: 'center', vertical: 'center' }
    });
    row0[8] = createCell('Salary Report', 's', {
      font: { name: 'Calibri', sz: 15, bold: true, color: { rgb: '0B3C73' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      fill: headerBoxFill,
      border: { top: headerBoxBorder.top, left: headerBoxBorder.left, right: headerBoxBorder.right }
    });
    // Fill empty cells in merged areas so background and borders render seamlessly
    for (let c = 9; c <= 11; c++) {
      row0[c] = createCell('', 's', { fill: headerBoxFill, border: { top: headerBoxBorder.top, right: c === 11 ? headerBoxBorder.right : undefined } });
    }
    aoa.push(row0);
    merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } });
    merges.push({ s: { r: 0, c: 4 }, e: { r: 0, c: 7 } });
    merges.push({ s: { r: 0, c: 8 }, e: { r: 0, c: 11 } });
    rowHeights.push({ hpt: 26 });

    // =========================================================================
    // ROW 1 (Header Line 2)
    // =========================================================================
    const row1: any[] = new Array(12).fill(null);
    row1[0] = createCell(compSubtitle, 's', {
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '1E3A8A' } },
      alignment: { horizontal: 'left', vertical: 'center' }
    });
    row1[4] = createCell(compAddr2, 's', {
      font: { name: 'Calibri', sz: 8.5, color: { rgb: '334155' } },
      alignment: { horizontal: 'center', vertical: 'center' }
    });
    row1[8] = createCell(monthText, 's', {
      font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '1E3A8A' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      fill: headerBoxFill,
      border: { left: headerBoxBorder.left, right: headerBoxBorder.right }
    });
    for (let c = 9; c <= 11; c++) {
      row1[c] = createCell('', 's', { fill: headerBoxFill, border: { right: c === 11 ? headerBoxBorder.right : undefined } });
    }
    aoa.push(row1);
    merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 3 } });
    merges.push({ s: { r: 1, c: 4 }, e: { r: 1, c: 7 } });
    merges.push({ s: { r: 1, c: 8 }, e: { r: 1, c: 11 } });
    rowHeights.push({ hpt: 19 });

    // =========================================================================
    // ROW 2 (Header Line 3)
    // =========================================================================
    const row2: any[] = new Array(12).fill(null);
    row2[0] = createCell(compTagline, 's', {
      font: { name: 'Calibri', sz: 9, italic: true, color: { rgb: '2563EB' } },
      alignment: { horizontal: 'left', vertical: 'center' }
    });
    row2[4] = createCell(compGst, 's', {
      font: { name: 'Calibri', sz: 8.5, bold: true, color: { rgb: '1E293B' } },
      alignment: { horizontal: 'center', vertical: 'center' }
    });
    row2[8] = createCell(dateRangeStr, 's', {
      font: { name: 'Calibri', sz: 9, color: { rgb: '334155' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      fill: headerBoxFill,
      border: { bottom: headerBoxBorder.bottom, left: headerBoxBorder.left, right: headerBoxBorder.right }
    });
    for (let c = 9; c <= 11; c++) {
      row2[c] = createCell('', 's', { fill: headerBoxFill, border: { bottom: headerBoxBorder.bottom, right: c === 11 ? headerBoxBorder.right : undefined } });
    }
    aoa.push(row2);
    merges.push({ s: { r: 2, c: 0 }, e: { r: 2, c: 3 } });
    merges.push({ s: { r: 2, c: 4 }, e: { r: 2, c: 7 } });
    merges.push({ s: { r: 2, c: 8 }, e: { r: 2, c: 11 } });
    rowHeights.push({ hpt: 19 });

    // =========================================================================
    // ROW 3 (Header Line 4: Contact details)
    // =========================================================================
    const row3: any[] = new Array(12).fill(null);
    row3[4] = createCell(compContact, 's', {
      font: { name: 'Calibri', sz: 8, color: { rgb: '475569' } },
      alignment: { horizontal: 'center', vertical: 'center' }
    });
    aoa.push(row3);
    merges.push({ s: { r: 3, c: 4 }, e: { r: 3, c: 7 } });
    rowHeights.push({ hpt: 16 });

    // =========================================================================
    // ROW 4 (Blank separator)
    // =========================================================================
    aoa.push(new Array(12).fill(null));
    rowHeights.push({ hpt: 12 });

    // =========================================================================
    // ROW 5 (Table Headers)
    // =========================================================================
    const tableHeaderTitles = [
      'S.No',
      'Employee ID',
      'Name',
      'Designation',
      'Present Days',
      'Absent Days',
      'Half Days',
      'Salary (Present Days)',
      'Incentives',
      'Advance',
      'Total Salary',
      'Status'
    ];

    const tableHeaderRow = tableHeaderTitles.map((title, colIdx) => {
      let align = 'center';
      if (colIdx === 2 || colIdx === 3) align = 'left';
      if (colIdx >= 7 && colIdx <= 10) align = 'right';

      return createCell(title, 's', {
        fill: { fgColor: { rgb: '144A75' } }, // Deep Navy Blue
        font: { name: 'Calibri', sz: 9.5, bold: true, color: { rgb: 'FFFFFF' } },
        alignment: { horizontal: align, vertical: 'center', wrapText: true },
        border: thinBorder('0F3657')
      });
    });

    aoa.push(tableHeaderRow);
    rowHeights.push({ hpt: 30 });

    // =========================================================================
    // DATA ROWS (Row 6 onwards)
    // =========================================================================
    let currentRowIndex = 6;

    items.forEach((item, index) => {
      const isEven = index % 2 === 0;
      const rowBgHex = isEven ? 'FFFFFF' : 'F8FAFC';
      const cellBorder = thinBorder('E2E8F0');

      // Present days salary
      const presentSalary = Number(item.totalSalary ?? 0) > 0
        ? Number(item.totalSalary)
        : (Number(item.presentDays || 0) * Number(item.perDaySalary || 0)) +
          (Number(item.halfDays || 0) * Number(item.perDaySalary || 0) * 0.5);

      // Net salary
      const netSalary = Number(item.salary ?? 0) > 0
        ? Number(item.salary)
        : (presentSalary + Number(item.incentive || 0) - Number(item.advance || 0));

      // Status styling
      const isPaid = (item.paymentStatus || '').toLowerCase() === 'paid';
      const statusFillHex = isPaid ? 'DCFCE7' : 'FEF3C7';
      const statusFontHex = isPaid ? '166534' : 'B45309';

      const dataRow = [
        // 0. S.No
        createCell(index + 1, 'n', {
          font: { name: 'Calibri', sz: 9, color: { rgb: '1E293B' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          fill: { fgColor: { rgb: rowBgHex } },
          border: cellBorder
        }),
        // 1. Employee ID
        createCell(formatEmpId(item.employeeCode, item.employeeId), 's', {
          font: { name: 'Calibri', sz: 9, color: { rgb: '1E293B' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          fill: { fgColor: { rgb: rowBgHex } },
          border: cellBorder
        }),
        // 2. Name
        createCell(item.employeeName || '', 's', {
          font: { name: 'Calibri', sz: 9.5, bold: false, color: { rgb: '0F172A' } },
          alignment: { horizontal: 'left', vertical: 'center' },
          fill: { fgColor: { rgb: rowBgHex } },
          border: cellBorder
        }),
        // 3. Designation
        createCell(item.designation || 'N/A', 's', {
          font: { name: 'Calibri', sz: 9, color: { rgb: '475569' } },
          alignment: { horizontal: 'left', vertical: 'center' },
          fill: { fgColor: { rgb: rowBgHex } },
          border: cellBorder
        }),
        // 4. Present Days
        createCell(item.presentDays || 0, 'n', {
          font: { name: 'Calibri', sz: 9, color: { rgb: '1E293B' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          fill: { fgColor: { rgb: rowBgHex } },
          border: cellBorder
        }),
        // 5. Absent Days
        createCell(item.leaveDays || 0, 'n', {
          font: { name: 'Calibri', sz: 9, color: { rgb: '1E293B' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          fill: { fgColor: { rgb: rowBgHex } },
          border: cellBorder
        }),
        // 6. Half Days
        createCell(item.halfDays || 0, 'n', {
          font: { name: 'Calibri', sz: 9, color: { rgb: '1E293B' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          fill: { fgColor: { rgb: rowBgHex } },
          border: cellBorder
        }),
        // 7. Salary (Present Days)
        createCell(formatINR(presentSalary), 's', {
          font: { name: 'Calibri', sz: 9.5, color: { rgb: '0F172A' } },
          alignment: { horizontal: 'right', vertical: 'center' },
          fill: { fgColor: { rgb: rowBgHex } },
          border: cellBorder
        }),
        // 8. Incentives
        createCell(
          item.incentive > 0 ? formatINR(item.incentive) : '-',
          's',
          {
            font: { name: 'Calibri', sz: 9.5, color: { rgb: '0F172A' } },
            alignment: { horizontal: item.incentive > 0 ? 'right' : 'center', vertical: 'center' },
            fill: { fgColor: { rgb: rowBgHex } },
            border: cellBorder
          }
        ),
        // 9. Advance
        createCell(
          item.advance > 0 ? formatINR(item.advance) : '-',
          's',
          {
            font: { name: 'Calibri', sz: 9.5, color: { rgb: '0F172A' } },
            alignment: { horizontal: item.advance > 0 ? 'right' : 'center', vertical: 'center' },
            fill: { fgColor: { rgb: rowBgHex } },
            border: cellBorder
          }
        ),
        // 10. Total Salary
        createCell(formatINR(netSalary), 's', {
          font: { name: 'Calibri', sz: 9.5, bold: true, color: { rgb: '0F172A' } },
          alignment: { horizontal: 'right', vertical: 'center' },
          fill: { fgColor: { rgb: rowBgHex } },
          border: cellBorder
        }),
        // 11. Status Badge
        createCell(isPaid ? 'Paid' : 'Pending', 's', {
          font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: statusFontHex } },
          alignment: { horizontal: 'center', vertical: 'center' },
          fill: { fgColor: { rgb: statusFillHex } },
          border: cellBorder
        })
      ];

      aoa.push(dataRow);
      rowHeights.push({ hpt: 23 });
      currentRowIndex++;
    });

    // =========================================================================
    // GAP ROW AFTER TABLE
    // =========================================================================
    aoa.push(new Array(12).fill(null));
    rowHeights.push({ hpt: 14 });
    currentRowIndex++;

    // =========================================================================
    // SUMMARY & REMARKS HEADER ROW
    // =========================================================================
    const sumHeaderRow: any[] = new Array(12).fill(null);
    sumHeaderRow[0] = createCell('Summary', 's', {
      font: { name: 'Calibri', sz: 12, bold: true, color: { rgb: '0F172A' } },
      alignment: { horizontal: 'left', vertical: 'center' }
    });

    const remarksTitle = createCell('Remarks', 's', {
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '1E3A8A' } },
      alignment: { horizontal: 'left', vertical: 'center' },
      fill: { fgColor: { rgb: 'F0F7FF' } },
      border: {
        top: { style: 'thin', color: { rgb: 'BAE6FD' } },
        left: { style: 'thin', color: { rgb: 'BAE6FD' } },
        right: { style: 'thin', color: { rgb: 'BAE6FD' } }
      }
    });
    sumHeaderRow[8] = remarksTitle;
    for (let c = 9; c <= 11; c++) {
      sumHeaderRow[c] = createCell('', 's', {
        fill: { fgColor: { rgb: 'F0F7FF' } },
        border: {
          top: { style: 'thin', color: { rgb: 'BAE6FD' } },
          right: c === 11 ? { style: 'thin', color: { rgb: 'BAE6FD' } } : undefined
        }
      });
    }

    aoa.push(sumHeaderRow);
    merges.push({ s: { r: currentRowIndex, c: 0 }, e: { r: currentRowIndex, c: 7 } });
    merges.push({ s: { r: currentRowIndex, c: 8 }, e: { r: currentRowIndex, c: 11 } });
    rowHeights.push({ hpt: 20 });
    currentRowIndex++;

    // =========================================================================
    // SUMMARY CARDS (Top Row: Labels) + REMARKS TEXT
    // =========================================================================
    const cardTopBorder = (color: string) => ({
      top: { style: 'thin', color: { rgb: color } },
      left: { style: 'thin', color: { rgb: color } },
      right: { style: 'thin', color: { rgb: color } }
    });

    const sumCardsTopRow: any[] = new Array(12).fill(null);
    // Card 1: Total Employees
    sumCardsTopRow[0] = createCell('Total Employees', 's', {
      font: { name: 'Calibri', sz: 8.5, color: { rgb: '475569' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      fill: { fgColor: { rgb: 'EFF6FF' } },
      border: cardTopBorder('BFDBFE')
    });
    sumCardsTopRow[1] = createCell('', 's', { fill: { fgColor: { rgb: 'EFF6FF' } }, border: { top: { style: 'thin', color: { rgb: 'BFDBFE' } }, right: { style: 'thin', color: { rgb: 'BFDBFE' } } } });

    // Card 2: Total Salary
    sumCardsTopRow[2] = createCell('Total Salary', 's', {
      font: { name: 'Calibri', sz: 8.5, color: { rgb: '475569' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      fill: { fgColor: { rgb: 'F0FDF4' } },
      border: cardTopBorder('BBF7D0')
    });
    sumCardsTopRow[3] = createCell('', 's', { fill: { fgColor: { rgb: 'F0FDF4' } }, border: { top: { style: 'thin', color: { rgb: 'BBF7D0' } }, right: { style: 'thin', color: { rgb: 'BBF7D0' } } } });

    // Card 3: Paid Amount
    sumCardsTopRow[4] = createCell('Paid Amount', 's', {
      font: { name: 'Calibri', sz: 8.5, color: { rgb: '475569' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      fill: { fgColor: { rgb: 'F0FDF4' } },
      border: cardTopBorder('BBF7D0')
    });
    sumCardsTopRow[5] = createCell('', 's', { fill: { fgColor: { rgb: 'F0FDF4' } }, border: { top: { style: 'thin', color: { rgb: 'BBF7D0' } }, right: { style: 'thin', color: { rgb: 'BBF7D0' } } } });

    // Card 4: Remaining Amount
    sumCardsTopRow[6] = createCell('Remaining Amount', 's', {
      font: { name: 'Calibri', sz: 8.5, color: { rgb: '475569' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      fill: { fgColor: { rgb: 'FEF2F2' } },
      border: cardTopBorder('FECACA')
    });
    sumCardsTopRow[7] = createCell('', 's', { fill: { fgColor: { rgb: 'FEF2F2' } }, border: { top: { style: 'thin', color: { rgb: 'FECACA' } }, right: { style: 'thin', color: { rgb: 'FECACA' } } } });

    // Remarks Body Top
    const remarksMsg = options.remarks || `Salary for the month of ${monthText}`;
    sumCardsTopRow[8] = createCell(remarksMsg, 's', {
      font: { name: 'Calibri', sz: 9, color: { rgb: '334155' } },
      alignment: { horizontal: 'left', vertical: 'center' },
      fill: { fgColor: { rgb: 'FFFFFF' } },
      border: { left: { style: 'thin', color: { rgb: 'BAE6FD' } }, right: { style: 'thin', color: { rgb: 'BAE6FD' } } }
    });
    for (let c = 9; c <= 11; c++) {
      sumCardsTopRow[c] = createCell('', 's', { fill: { fgColor: { rgb: 'FFFFFF' } }, border: { right: c === 11 ? { style: 'thin', color: { rgb: 'BAE6FD' } } : undefined } });
    }

    aoa.push(sumCardsTopRow);
    merges.push({ s: { r: currentRowIndex, c: 0 }, e: { r: currentRowIndex, c: 1 } });
    merges.push({ s: { r: currentRowIndex, c: 2 }, e: { r: currentRowIndex, c: 3 } });
    merges.push({ s: { r: currentRowIndex, c: 4 }, e: { r: currentRowIndex, c: 5 } });
    merges.push({ s: { r: currentRowIndex, c: 6 }, e: { r: currentRowIndex, c: 7 } });
    merges.push({ s: { r: currentRowIndex, c: 8 }, e: { r: currentRowIndex, c: 11 } });
    rowHeights.push({ hpt: 19 });
    currentRowIndex++;

    // =========================================================================
    // SUMMARY CARDS (Bottom Row: Values)
    // =========================================================================
    const cardBottomBorder = (color: string) => ({
      bottom: { style: 'thin', color: { rgb: color } },
      left: { style: 'thin', color: { rgb: color } },
      right: { style: 'thin', color: { rgb: color } }
    });

    const sumCardsBottomRow: any[] = new Array(12).fill(null);
    // Card 1: Total Employees count
    sumCardsBottomRow[0] = createCell(summary.totalEmployees, 'n', {
      font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: '1D4ED8' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      fill: { fgColor: { rgb: 'EFF6FF' } },
      border: cardBottomBorder('BFDBFE')
    });
    sumCardsBottomRow[1] = createCell('', 's', { fill: { fgColor: { rgb: 'EFF6FF' } }, border: { bottom: { style: 'thin', color: { rgb: 'BFDBFE' } }, right: { style: 'thin', color: { rgb: 'BFDBFE' } } } });

    // Card 2: Total Salary amount
    sumCardsBottomRow[2] = createCell(formatINR(summary.totalSalary), 's', {
      font: { name: 'Calibri', sz: 12.5, bold: true, color: { rgb: '15803D' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      fill: { fgColor: { rgb: 'F0FDF4' } },
      border: cardBottomBorder('BBF7D0')
    });
    sumCardsBottomRow[3] = createCell('', 's', { fill: { fgColor: { rgb: 'F0FDF4' } }, border: { bottom: { style: 'thin', color: { rgb: 'BBF7D0' } }, right: { style: 'thin', color: { rgb: 'BBF7D0' } } } });

    // Card 3: Paid Amount
    sumCardsBottomRow[4] = createCell(formatINR(summary.paidAmount), 's', {
      font: { name: 'Calibri', sz: 12.5, bold: true, color: { rgb: '15803D' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      fill: { fgColor: { rgb: 'F0FDF4' } },
      border: cardBottomBorder('BBF7D0')
    });
    sumCardsBottomRow[5] = createCell('', 's', { fill: { fgColor: { rgb: 'F0FDF4' } }, border: { bottom: { style: 'thin', color: { rgb: 'BBF7D0' } }, right: { style: 'thin', color: { rgb: 'BBF7D0' } } } });

    // Card 4: Remaining Amount
    sumCardsBottomRow[6] = createCell(formatINR(summary.remainingAmount), 's', {
      font: { name: 'Calibri', sz: 12.5, bold: true, color: { rgb: 'DC2626' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      fill: { fgColor: { rgb: 'FEF2F2' } },
      border: cardBottomBorder('FECACA')
    });
    sumCardsBottomRow[7] = createCell('', 's', { fill: { fgColor: { rgb: 'FEF2F2' } }, border: { bottom: { style: 'thin', color: { rgb: 'FECACA' } }, right: { style: 'thin', color: { rgb: 'FECACA' } } } });

    // Remarks Body Bottom
    sumCardsBottomRow[8] = createCell('', 's', {
      fill: { fgColor: { rgb: 'FFFFFF' } },
      border: {
        bottom: { style: 'thin', color: { rgb: 'BAE6FD' } },
        left: { style: 'thin', color: { rgb: 'BAE6FD' } },
        right: { style: 'thin', color: { rgb: 'BAE6FD' } }
      }
    });
    for (let c = 9; c <= 11; c++) {
      sumCardsBottomRow[c] = createCell('', 's', {
        fill: { fgColor: { rgb: 'FFFFFF' } },
        border: {
          bottom: { style: 'thin', color: { rgb: 'BAE6FD' } },
          right: c === 11 ? { style: 'thin', color: { rgb: 'BAE6FD' } } : undefined
        }
      });
    }

    aoa.push(sumCardsBottomRow);
    merges.push({ s: { r: currentRowIndex, c: 0 }, e: { r: currentRowIndex, c: 1 } });
    merges.push({ s: { r: currentRowIndex, c: 2 }, e: { r: currentRowIndex, c: 3 } });
    merges.push({ s: { r: currentRowIndex, c: 4 }, e: { r: currentRowIndex, c: 5 } });
    merges.push({ s: { r: currentRowIndex, c: 6 }, e: { r: currentRowIndex, c: 7 } });
    merges.push({ s: { r: currentRowIndex, c: 8 }, e: { r: currentRowIndex, c: 11 } });
    rowHeights.push({ hpt: 26 });
    currentRowIndex++;

    // =========================================================================
    // DATE ROW (Right aligned)
    // =========================================================================
    const dateRow: any[] = new Array(12).fill(null);
    dateRow[10] = createCell(`Date : ${formatDateDDMMYYYY(options.toDate)}`, 's', {
      font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '334155' } },
      alignment: { horizontal: 'right', vertical: 'center' }
    });
    aoa.push(dateRow);
    merges.push({ s: { r: currentRowIndex, c: 10 }, e: { r: currentRowIndex, c: 11 } });
    rowHeights.push({ hpt: 22 });
    currentRowIndex++;

    // =========================================================================
    // GAP ROW BEFORE SIGNATURES
    // =========================================================================
    aoa.push(new Array(12).fill(null));
    rowHeights.push({ hpt: 12 });
    currentRowIndex++;

    // =========================================================================
    // SIGNATURES ROW
    // =========================================================================
    const sigRow: any[] = new Array(12).fill(null);
    sigRow[0] = createCell('Prepared By  ________________________', 's', {
      font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '1E293B' } },
      alignment: { horizontal: 'left', vertical: 'center' }
    });
    sigRow[4] = createCell('Checked By  _________________________', 's', {
      font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '1E293B' } },
      alignment: { horizontal: 'center', vertical: 'center' }
    });
    sigRow[8] = createCell('Authorized Signature  ________________', 's', {
      font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: '1E293B' } },
      alignment: { horizontal: 'right', vertical: 'center' }
    });

    aoa.push(sigRow);
    merges.push({ s: { r: currentRowIndex, c: 0 }, e: { r: currentRowIndex, c: 3 } });
    merges.push({ s: { r: currentRowIndex, c: 4 }, e: { r: currentRowIndex, c: 7 } });
    merges.push({ s: { r: currentRowIndex, c: 8 }, e: { r: currentRowIndex, c: 11 } });
    rowHeights.push({ hpt: 24 });

    // 2. Convert to Worksheet
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // 3. Set Merges
    ws['!merges'] = merges;

    // 4. Set Column Widths (matching reference proportions)
    ws['!cols'] = [
      { wch: 7 },  // S.No
      { wch: 14 }, // Employee ID
      { wch: 20 }, // Name
      { wch: 19 }, // Designation
      { wch: 13 }, // Present Days
      { wch: 13 }, // Absent Days
      { wch: 12 }, // Half Days
      { wch: 18 }, // Salary (Present Days)
      { wch: 14 }, // Incentives
      { wch: 14 }, // Advance
      { wch: 18 }, // Total Salary
      { wch: 13 }  // Status
    ];

    // 5. Set Row Heights
    ws['!rows'] = rowHeights;

    // 6. Append Worksheet and Write File
    const sheetName = 'Salary Report';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const safeMonthName = monthText.replace(/[^a-zA-Z0-9_-]/g, '_');
    const outFileName = options.fileName || `Salary_Report_${safeMonthName}.xlsx`;

    XLSX.writeFile(wb, outFileName);
  }
}
