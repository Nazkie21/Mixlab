import axios from 'axios';

// Brevo (Sendinblue) API configuration
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'noreply@mixlab.studio';
const SENDER_NAME = 'MixLab Studio';

// Validate Brevo API key on startup
if (!BREVO_API_KEY) {
  console.warn('⚠️ WARNING: BREVO_API_KEY not configured in .env file');
  console.warn('Email sending will not work until configured.');
}

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send email using Brevo API
const sendEmailViaBrevo = async (recipientEmail, subject, htmlContent) => {
  try {
    if (!BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY is not configured');
    }

    console.log('📧 Preparing to send email via Brevo...');
    console.log(`   To: ${recipientEmail}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Sender: ${SENDER_EMAIL}`);
    console.log(`   API Key loaded: ${BREVO_API_KEY ? 'Yes' : 'No'}`);

    const response = await axios.post(
      BREVO_API_URL,
      {
        sender: {
          name: SENDER_NAME,
          email: SENDER_EMAIL
        },
        to: [
          {
            email: recipientEmail,
            name: 'MixLab User'
          }
        ],
        subject: subject,
        htmlContent: htmlContent,
        replyTo: {
          email: SENDER_EMAIL,
          name: SENDER_NAME
        }
      },
      {
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✓ Email sent successfully via Brevo!');
    console.log(`   Message ID: ${response.data.messageId}`);
    return { success: true, messageId: response.data.messageId };
  } catch (error) {
    console.error('✗ Error sending email via Brevo:');
    console.error(`   Status: ${error.response?.status}`);
    console.error(`   Message: ${error.response?.data?.message || error.message}`);
    console.error(`   Full Error: ${JSON.stringify(error.response?.data || error.message)}`);
    throw error;
  }
};

// Send OTP email for registration
const sendRegistrationOTPEmail = async (email, otp) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #bfa45b; margin: 0;">MixLab Studio</h2>
        <p style="color: #999; margin: 5px 0 0 0;">Professional Music Production</p>
      </div>
      
      <h2 style="color: #bfa45b; text-align: center;">Email Verification</h2>
      <p style="font-size: 16px; color: #333; text-align: center;">Welcome to MixLab Studio!</p>
      <p style="font-size: 14px; color: #666; text-align: center;">Your verification code is:</p>
      
      <div style="background-color: #bfa45b; padding: 20px; text-align: center; font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 30px 0; color: #000; border-radius: 8px;">
        ${otp}
      </div>
      
      <p style="font-size: 14px; color: #666; text-align: center;">This code expires in 10 minutes.</p>
      <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">If you didn't sign up for MixLab Studio, please ignore this email.</p>
      
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
      <p style="font-size: 11px; color: #999; text-align: center;">© 2025 MixLab Studio. All rights reserved.</p>
    </div>
  `;

  return sendEmailViaBrevo(email, 'MixLab Studio - Email Verification', htmlContent);
};

// Send OTP email for password reset
const sendOTPEmail = async (email, otp) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #bfa45b; margin: 0;">MixLab Studio</h2>
        <p style="color: #999; margin: 5px 0 0 0;">Professional Music Production</p>
      </div>
      
      <h2 style="color: #bfa45b; text-align: center;">Password Reset</h2>
      <p style="font-size: 16px; color: #333; text-align: center;">Reset your password</p>
      <p style="font-size: 14px; color: #666; text-align: center;">Your password reset code is:</p>
      
      <div style="background-color: #bfa45b; padding: 20px; text-align: center; font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 30px 0; color: #000; border-radius: 8px;">
        ${otp}
      </div>
      
      <p style="font-size: 14px; color: #666; text-align: center;">This code expires in 10 minutes.</p>
      <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">If you didn't request this password reset, please ignore this email.</p>
      
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
      <p style="font-size: 11px; color: #999; text-align: center;">© 2025 MixLab Studio. All rights reserved.</p>
    </div>
  `;

  return sendEmailViaBrevo(email, 'MixLab Studio - Password Reset', htmlContent);
};

export { generateOTP, sendOTPEmail, sendRegistrationOTPEmail, sendEmailViaBrevo };