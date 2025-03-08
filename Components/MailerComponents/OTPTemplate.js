export function OTPTemplate(fullName, otp) {
    console.log(fullName, otp);
    return `
   <html>
    <head>
    <title>OTP Verification</title>
    
    </head>
    <body>
      <div class="container">
        <p>Dear <strong>${fullName}</strong>,</p>
        <p>Welcome to Orlian Services!</p>
        <p>To complete your registration and verify your account, please enter the following One-Time Password (OTP) on the verification page:</p>
        <h3>Your OTP Code: <strong>${otp}</strong></h3>
        <p>This code is valid for the next <strong>10 minutes</strong>. Please make sure to use it before it expires.</p>
        <p>If you did not request this, please disregard this email.</p>
        <p>Thank you for joining Eco Fleet Services! We are excited to have you on board.</p>
        <p class="footer">Best regards,<br>The Orlian Services Team</p>
      </div>
    </body>
  </html>
   `;
  }