import nodemailer from 'nodemailer';

/**
 * Creates a Nodemailer transporter using credentials from .env
 * Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS in your .env file.
 * For quick testing, you can use a Gmail App Password or Ethereal (https://ethereal.email).
 */
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false, // true for port 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendPasswordResetEmail = async (
  toEmail: string,
  firstName: string,
  resetToken: string
): Promise<void> => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"DoctorOnCall Security" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: '🔐 Password Reset Request — DoctorOnCall',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Password Reset</title>
      </head>
      <body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="520" cellpadding="0" cellspacing="0"
                style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 40px rgba(0,0,0,0.08);">

                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#70C0FA 0%,#3b82f6 100%);padding:40px 48px;text-align:center;">
                    <div style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">DoctorOnCall</div>
                    <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">
                      Security Notice
                    </p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:48px;">
                    <p style="font-size:22px;font-weight:800;color:#0f172a;margin:0 0 8px;">Hi ${firstName} 👋</p>
                    <p style="font-size:15px;color:#64748b;line-height:1.7;margin:0 0 32px;">
                      We received a request to reset the password for your DoctorOnCall account. 
                      Click the button below to choose a new password. This link expires in <strong style="color:#0f172a;">1 hour</strong>.
                    </p>

                    <div style="text-align:center;margin:0 0 32px;">
                      <a href="${resetUrl}"
                        style="display:inline-block;background:linear-gradient(135deg,#70C0FA 0%,#3b82f6 100%);
                               color:#ffffff;font-size:14px;font-weight:800;text-decoration:none;
                               padding:16px 40px;border-radius:14px;letter-spacing:0.5px;
                               box-shadow:0 8px 24px rgba(112,192,250,0.4);">
                        Reset My Password
                      </a>
                    </div>

                    <p style="font-size:12px;color:#94a3b8;line-height:1.8;margin:0 0 16px;">
                      Or copy and paste this link into your browser:
                    </p>
                    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;
                                padding:12px 16px;font-size:11px;color:#70C0FA;word-break:break-all;font-family:monospace;">
                      ${resetUrl}
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#f8fafc;padding:24px 48px;border-top:1px solid #f1f5f9;">
                    <p style="font-size:11px;color:#94a3b8;margin:0;line-height:1.8;text-align:center;">
                      If you didn't request this, you can safely ignore this email — your password won't change.<br/>
                      © ${new Date().getFullYear()} DoctorOnCall. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};
