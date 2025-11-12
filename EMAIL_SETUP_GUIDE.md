# Email Configuration Guide

## Overview

MixLab uses **Brevo (formerly Sendinblue)** for email delivery. This service works with any email address without needing user-specific configuration. Once set up, OTP emails will work for all users.

## Why Brevo?

✅ **Free tier** - 300 emails/day free  
✅ **Works with any domain** - No per-user configuration needed  
✅ **Reliable** - Professional email service  
✅ **Easy setup** - Single API key configuration  
✅ **Scalable** - Grows with your application  

## Setup Instructions

### Step 1: Create a Brevo Account

1. Go to https://www.brevo.com
2. Click "Sign up free"
3. Fill in your details:
   - Email address
   - Password
   - Company name (MixLab Studio)
   - Company size (select appropriate)
4. Click "Create my account"
5. Verify your email

### Step 2: Get Your API Key

1. Log in to your Brevo dashboard: https://app.brevo.com
2. Click on your **profile icon** (top right) → **My Account**
3. Click on **API**
4. In the **SMTP & API** section, click on **Create new key**
5. Name it something like "MixLab OTP" (optional)
6. Select **SMTP & API** access
7. Click **Generate**
8. **Copy the API Key** (it starts with `xkeysib-`)

### Step 3: Update Your .env File

1. Open or create the `.env` file in your project root
2. Add these lines:

```env
BREVO_API_KEY=xkeysib-your-api-key-here
SENDER_EMAIL=noreply@yourdomain.com
```

Replace:
- `xkeysib-your-api-key-here` with your actual Brevo API key
- `noreply@yourdomain.com` with your email (can be any address)

**Example:**
```env
BREVO_API_KEY=xkeysib-1a2b3c4d5e6f7g8h9i0j
SENDER_EMAIL=noreply@mixlab.studio
```

### Step 4: Install Required Dependency

Make sure `axios` is installed:

```bash
npm install axios
```

If it's already installed, you'll see a message that it's already there.

### Step 5: Restart Your Backend Server

```bash
# Stop the current server (Ctrl+C)
# Then start it again:
node server.js
```

### Step 6: Test Email Sending

1. Go to your registration page
2. Fill in the form with your email address
3. Click "Register"
4. You should see: "OTP sent to your email"
5. Check your email inbox for the OTP code
6. Enter it on the OTP verification page

## Verification

### Checking if Email Was Sent

1. Log in to your Brevo dashboard
2. Go to **Contacts** or **Campaigns**
3. Look for "Sent" statistics
4. You can see delivery status there

### Free Tier Limits

- **300 emails per day** free
- For production with more users, consider upgrading
- Paid plans start at €20/month for 20,000 emails/month

## Troubleshooting

### "BREVO_API_KEY not configured" Error
- Check that `BREVO_API_KEY` is in your `.env` file
- Verify the API key is correct (starts with `xkeysib-`)
- Restart the server after updating `.env`

### Email Not Sending
- Check backend logs for detailed error
- Verify API key is correct
- Ensure you're not exceeding free tier limits (300/day)
- Check spam/junk folder

### Email Sent But Not Received
- Check your Brevo dashboard for delivery status
- Verify recipient email address is correct
- Check spam filters
- Wait a few seconds - emails take time to deliver

### "Invalid API Key" Error
- Copy the API key again from your Brevo account
- Make sure there are no extra spaces or characters
- Verify the key is for SMTP & API access
- If still having issues, generate a new API key

## Features Now Available

With Brevo configured, your application can:
- ✅ Send OTP emails for registration
- ✅ Send password reset OTP emails
- ✅ Work with any email domain
- ✅ Support unlimited users
- ✅ Track email delivery status

## Next Steps

1. **Monitor Usage**: Check your Brevo dashboard regularly to see email statistics
2. **Customize Email Template**: Edit email HTML in `utils/emailService.js`
3. **Add Email Verification**: Mark emails as verified in your database
4. **Set Up Sender Identity**: In Brevo, configure your sender name and email
5. **Upgrade When Needed**: If you exceed 300/day, consider a paid plan

## Adding Additional Email Features

Once Brevo is set up, you can easily add:
- Welcome emails
- Password change notifications
- Account deletion confirmations
- Newsletter system
- Promotional emails

## Support

- **Brevo Help**: https://support.brevo.com
- **API Documentation**: https://developers.brevo.com
- **Community Forum**: https://community.brevo.com

## Important Notes

- **Keep your API key secret** - Don't commit it to version control
- **Use environment variables** - Always store sensitive data in .env
- **Monitor your limits** - Free tier has 300 emails/day limit
- **Test thoroughly** - Verify emails reach users' inboxes

---

**That's it!** Your email system is now set up and will work for any user without additional configuration.

### Step-by-Step Setup

#### 1. Enable 2-Factor Authentication (if not already enabled)
1. Go to https://myaccount.google.com/security
2. Scroll down to "How you sign in to Google"
3. Click on "2-Step Verification"
4. Follow the prompts to enable 2FA

#### 2. Generate an App Password
1. Go to https://myaccount.google.com/apppasswords
2. If prompted to sign in, do so
3. Select "Mail" from the dropdown
4. Select "Windows Computer" (or your device type)
5. Click "Generate"
6. Google will display a 16-character password like: `xxxx xxxx xxxx xxxx`
7. **Copy this password** (you'll need it for the next step)

#### 3. Configure Your .env File
1. Open the `.env` file in your project root (create it if it doesn't exist)
2. Add these lines:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
```

Replace:
- `your-email@gmail.com` with your actual Gmail address
- `xxxx xxxx xxxx xxxx` with the 16-character App Password you copied (you can keep or remove spaces)

#### 4. Restart Your Backend Server
```bash
# Stop the current server (Ctrl+C)
# Then start it again:
node server.js
```

#### 5. Test Email Sending
1. Go to the registration page
2. Fill in the registration form
3. Click "Register"
4. You should see: "OTP sent to your email"
5. Check the email address you registered with for the OTP code

### Troubleshooting

#### "Failed to send OTP" Error
- Verify EMAIL_USER and EMAIL_PASSWORD are correctly set in .env
- Ensure 2-Factor Authentication is enabled
- Make sure you're using the App Password, not your regular password
- Check that you copied the entire 16-character password correctly

#### "Invalid login" Error (535 error)
- This means your credentials are incorrect
- Double-check your Gmail address
- Regenerate your App Password and try again
- Ensure spaces are handled correctly (remove them if uncertain)

#### Email Not Receiving OTP
- Check spam/junk folder
- Verify the email address is correct
- Check backend logs for detailed error messages
- Wait a few seconds - email delivery can take time

### Security Notes
- **Never** use your main Gmail password for applications
- Always use an App Password for third-party apps
- Keep your App Password private
- Regenerate App Password if you suspect it's been compromised

### Using a Different Email Provider
If you want to use a different email provider instead of Gmail, update the emailService.js file with your provider's SMTP settings.

### Support
If you continue to have issues:
1. Check the backend terminal logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure your Gmail account has all the security requirements met
