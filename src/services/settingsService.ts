import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTION_NAME = 'settings';
const BUSINESS_DOC_ID = 'business';
const INVOICE_DOC_ID = 'invoice';

export interface BusinessDetails {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  gstNumber: string;
}

export interface InvoiceSettings {
  enableTax: boolean;
  defaultTaxPercent: number;
  enableDiscount: boolean;
  enableAdditionalCharges: boolean;
  quotationPrefix: string;
  invoicePrefix: string;
  ticketPrefix: string;
  defaultPaymentTerms: number;
  termsAndConditions: string;
}

const defaultBusinessDetails: BusinessDetails = {
  companyName: '',
  address: '',
  phone: '',
  email: '',
  gstNumber: '',
};

const defaultInvoiceSettings: InvoiceSettings = {
  enableTax: true,
  defaultTaxPercent: 18,
  enableDiscount: true,
  enableAdditionalCharges: false,
  quotationPrefix: 'QT',
  invoicePrefix: 'INV',
  ticketPrefix: 'TKT',
  defaultPaymentTerms: 15,
  termsAndConditions: '',
};

export const settingsService = {
  async getBusinessDetails(): Promise<BusinessDetails> {
    try {
      const docRef = doc(db, COLLECTION_NAME, BUSINESS_DOC_ID);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        return defaultBusinessDetails;
      }

      const data = snapshot.data();
      return {
        companyName: data.companyName || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        gstNumber: data.gstNumber || '',
      };
    } catch (error) {
      console.error('Error fetching business details:', error);
      throw error;
    }
  },

  async saveBusinessDetails(details: BusinessDetails): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, BUSINESS_DOC_ID);
      await setDoc(docRef, {
        ...details,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving business details:', error);
      throw error;
    }
  },

  async getInvoiceSettings(): Promise<InvoiceSettings> {
    try {
      const docRef = doc(db, COLLECTION_NAME, INVOICE_DOC_ID);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        return defaultInvoiceSettings;
      }

      const data = snapshot.data();
      return {
        enableTax: data.enableTax ?? true,
        defaultTaxPercent: data.defaultTaxPercent ?? 18,
        enableDiscount: data.enableDiscount ?? true,
        enableAdditionalCharges: data.enableAdditionalCharges ?? false,
        quotationPrefix: data.quotationPrefix || 'QT',
        invoicePrefix: data.invoicePrefix || 'INV',
        ticketPrefix: data.ticketPrefix || 'TKT',
        defaultPaymentTerms: data.defaultPaymentTerms ?? 15,
        termsAndConditions: data.termsAndConditions || '',
      };
    } catch (error) {
      console.error('Error fetching invoice settings:', error);
      throw error;
    }
  },

  async saveInvoiceSettings(settings: InvoiceSettings): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, INVOICE_DOC_ID);
      await setDoc(docRef, {
        ...settings,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving invoice settings:', error);
      throw error;
    }
  },
};

export default settingsService;
