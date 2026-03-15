import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { settings } from '../../../db/schema';

export interface CompanyInfo {
  name: string;
  gstin: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  bankName?: string;
  bankAccount?: string;
  bankIfsc?: string;
  invoiceTerms?: string;
  sgstSharingRate: number; // default 50
  igstSharingRate: number; // default 100
}

export interface Address {
  name?: string | null;
  gstin?: string | null;
  line1?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  phone?: string | null;
}

export interface TableColumn {
  header: string;
  width?: number; // pt - if omitted, engine auto-sizes
  minWidth?: number; // default: 28
  maxWidth?: number; // default: 240
  align?: 'left' | 'right' | 'center';
  key: string;
  format?: (val: any) => string;
  paddingLeft?: number;
  paddingRight?: number;
}

export interface ReportMeta {
  title: string;
  number: string;
  date: string;
  extraMeta?: { label: string; value: string }[];
}

export async function fetchCompanyInfo(db: LibSQLDatabase<any>): Promise<CompanyInfo> {
  const rows = await db.select().from(settings).all();
  const s = Object.fromEntries(rows.map((r: any) => [r.key, r.value]));

  return {
    name: s['company_name'] ?? 'Your Company',
    gstin: s['company_gstin'] ?? '',
    addressLine1: s['company_address_line1'] ?? '',
    city: s['company_city'] ?? '',
    state: s['company_state'] ?? '',
    postalCode: s['company_postal_code'] ?? '',
    phone: s['company_phone'] ?? '',
    bankName: s['bank_name'] ?? '',
    bankAccount: s['bank_account'] ?? '',
    bankIfsc: s['bank_ifsc'] ?? '',
    invoiceTerms: s['invoice_terms'] ?? '',
    sgstSharingRate: Number(s['sgst_sharing_rate'] ?? 50),
    igstSharingRate: Number(s['igst_sharing_rate'] ?? 100),
  };
}
