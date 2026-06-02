const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');

/**
 * Generate an invoice PDF for a payment
 * @param {Object} payment - Payment object with booking and user details
 * @returns {Promise<string>} - Path to the generated PDF
 */
const generateInvoicePDF = async (payment) => {
    const doc = new PDFDocument({ margin: 50 });
    const invoiceNumber = `INV-${payment.id.substring(0, 8).toUpperCase()}`;
    const fileName = `${invoiceNumber}.pdf`;
    const filePath = path.join(__dirname, '../../public/invoices', fileName);

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Header
        doc.fillColor('#444444')
           .fontSize(20)
           .text('INVOICE', 50, 50);

        doc.fontSize(10)
           .text(`Invoice Number: ${invoiceNumber}`, 50, 80)
           .text(`Date: ${format(new Date(), 'PPP')}`, 50, 95)
           .moveDown();

        // Business Info (Mock for now, should come from business model)
        doc.text('Appointment System Inc.', 400, 50, { align: 'right' })
           .text('123 Business Road', 400, 65, { align: 'right' })
           .text('New York, NY 10001', 400, 80, { align: 'right' })
           .moveDown();

        // Divider
        doc.strokeColor('#aaaaaa')
           .lineWidth(1)
           .moveTo(50, 150)
           .lineTo(550, 150)
           .stroke();

        // Customer Info
        doc.fontSize(12)
           .text('Bill To:', 50, 170);
        doc.fontSize(10)
           .text(payment.booking.user.name, 50, 185)
           .text(payment.booking.user.email, 50, 200)
           .moveDown();

        // Item Table
        const tableTop = 250;
        doc.fontSize(10)
           .text('Description', 50, tableTop, { bold: true })
           .text('Date', 250, tableTop, { bold: true })
           .text('Amount', 450, tableTop, { bold: true, align: 'right' });

        doc.strokeColor('#eeeeee')
           .moveTo(50, tableTop + 15)
           .lineTo(550, tableTop + 15)
           .stroke();

        const rowTop = tableTop + 30;
        doc.text(payment.booking.service.name, 50, rowTop)
           .text(format(new Date(payment.booking.startTime), 'PPP'), 250, rowTop)
           .text(`$${payment.amount.toFixed(2)}`, 450, rowTop, { align: 'right' });

        // Totals
        const totalTop = rowTop + 50;
        doc.strokeColor('#aaaaaa')
           .moveTo(350, totalTop)
           .lineTo(550, totalTop)
           .stroke();

        doc.fontSize(12)
           .text('Total:', 350, totalTop + 15)
           .text(`$${payment.amount.toFixed(2)}`, 450, totalTop + 15, { align: 'right' });

        // Footer
        doc.fontSize(10)
           .fillColor('#777777')
           .text('Thank you for your business!', 50, 700, { align: 'center', width: 500 });

        doc.end();

        stream.on('finish', () => resolve(fileName));
        stream.on('error', reject);
    });
};

module.exports = {
    generateInvoicePDF,
};
