export const generateEmailHTML = ({
  name,
  resetLink,
}: {
  name: string;
  resetLink: string;
}) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="margin: auto; max-width: 600px; background-color: #ffffff; padding: 20px;">
    <tr>
      <td>
        <h2 style="color: #333;">Hi ${name},</h2>
        <p style="font-size: 16px; color: #555;">
          We received a request to reset your password. Click the button below to set a new password:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #007BFF; color: white; text-decoration: none; border-radius: 5px; font-size: 16px;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 14px; color: #777;">
          If you didn’t request this, you can safely ignore this email.
        </p>
        <p style="font-size: 14px; color: #777;">
          This link will expire in 30 minutes for your security.
        </p>
        <hr style="margin: 40px 0; border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #999; text-align: center;">
          &copy; ${new Date().getFullYear()} Your Company. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;
