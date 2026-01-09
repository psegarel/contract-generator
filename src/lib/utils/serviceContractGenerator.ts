import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import type { ContractData } from '../schemas/contract';
import { companyConfig } from '../config/company';
import { translateToVietnamese } from './translate';
import { formatCurrency } from './formatting';
import { generateContractNumber } from './contractHelpers';

export const generateServiceContract = async (data: ContractData): Promise<Blob> => {
	try {
		// Load the service contract template
		const response = await fetch('/service-contract-template.docx');
		if (!response.ok) {
			throw new Error(`Failed to load template: ${response.statusText}`);
		}
		const templateArrayBuffer = await response.arrayBuffer();
		if (templateArrayBuffer.byteLength === 0) {
			throw new Error('Template file is empty');
		}

		const zip = new PizZip(templateArrayBuffer);
		const doc = new Docxtemplater(zip, {
			paragraphLoop: true,
			linebreaks: true
		});

		// Calculations
		const netFee = data.netFee;
		const taxRate = data.taxRate / 100;
		// Formula: Gross = Net / (1 - TaxRate)
		// Tax = Gross - Net
		const grossFee = Math.round(netFee / (1 - taxRate));
		const taxAmount = grossFee - netFee;

		// Contract Number: Date + Initials + Timestamp
		const contractNumber = generateContractNumber(data.clientName);

		// Translate fields
		const jobNameVN = await translateToVietnamese(data.jobName);
		const jobContentVN = await translateToVietnamese(data.jobContent);

		// Render the document
		doc.render({
			contractNumber,
			companyName: companyConfig.name,
			companyAddressLine1: companyConfig.addressLine1,
			companyAddressLine2: companyConfig.addressLine2,
			companyWard: companyConfig.ward,
			companyCity: companyConfig.city,
			companyTaxCode: companyConfig.taxCode,
			companyRepresentative: companyConfig.representative,
			companyFunction: companyConfig.function,
			companyRepresentativePhone: companyConfig.representativePhone,
			companyRepresentativeEmail: companyConfig.representativeEmail,
			clientName: data.clientName,
			clientEmail: data.clientEmail,
			clientAddress: data.clientAddress,
			clientPhone: data.clientPhone,
			clientIdDocument: data.clientIdDocument,
			clientTaxId: data.clientTaxId || 'N/A',
			bankName: data.bankName,
			accountNumber: data.accountNumber,
			jobName: data.jobName,
			jobNameVN,
			eventName: data.eventName,
			numberOfPerformances: data.numberOfPerformances,
			eventLocation: data.eventLocation,
			firstPerformanceTime: data.firstPerformanceTime,
			jobContent: data.jobContent,
			jobContentVN,
			netFee: formatCurrency(netFee),
			taxRate: data.taxRate,
			taxAmount: formatCurrency(taxAmount),
			grossFee: formatCurrency(grossFee),
			startDate: data.startDate,
			endDate: data.endDate
		});

		const blob = doc.getZip().generate({
			type: 'blob',
			mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
		});

		return blob;
	} catch (error) {
		console.error('Generator Error:', error);
		throw error;
	}
};
