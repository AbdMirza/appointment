const { Resend } = require('resend');
const ejs = require('ejs');
const path = require('path');

let resend = null;
let isReady = false;

/**
 * Initialize the email service with Resend.
 */
const initEmailService = async () => {
    if (isReady) return;

    if (process.env.RESEND_API_KEY) {
        resend = new Resend(process.env.RESEND_API_KEY);
        isReady = true;
        console.log('✅ Email: Using Resend API');
    } else {
        console.warn('⚠️ Email: RESEND_API_KEY not found. Emails will not be sent.');
    }
};

initEmailService();

const sendEmail = async (to, subject, templateName, context, customFromName = null) => {
    if (!isReady) await initEmailService();
    if (!isReady) return null;

    try {
        const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.ejs`);
        const html = await ejs.renderFile(templatePath, context);
        const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';
        const fromName = customFromName || process.env.EMAIL_FROM_NAME || 'Appointment System';

        const { data, error } = await resend.emails.send({
            from: `${fromName} <${from}>`,
            to: [to],
            subject: customFromName ? `[${customFromName}] ${subject}` : subject,
            html,
        });

        if (error) throw error;
        console.log(`📧 Email sent via Resend: "${subject}" → ${to}`);
        return data;
    } catch (error) {
        console.error('❌ Error sending email via Resend:');
        console.error(`   Message: ${error.message}`);
        
        if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.length < 10) {
            console.warn('   ⚠️ Warning: RESEND_API_KEY seems too short. Check your .env file.');
        }
    }
};

module.exports = { sendEmail };
