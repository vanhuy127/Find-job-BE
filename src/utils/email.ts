import { transporter } from "@/config/mail.config";

export const MAIL_OPTIONS = {
  FORGOT_PASSWORD: (resetLink: string, expiryTime: string) =>
    `<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Đặt lại mật khẩu</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:30px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.08);">
            <tr>
              <td style="padding:24px 28px;border-bottom:1px solid #eef2f6;">
                <h1 style="margin:0;font-size:20px;color:#0f1724;">Đặt lại mật khẩu</h1>
              </td>
            </tr>

            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 18px 0;color:#475569;font-size:15px;line-height:1.5;">
                  Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấn nút bên dưới để tạo mật khẩu mới. Liên kết sẽ hết hạn vào <strong>${expiryTime}</strong>.
                </p>

                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;">
                  <tr>
                    <td align="center">
                      <a href="${resetLink}" target="_blank" style="display:inline-block;padding:12px 22px;border-radius:6px;background:#06b6d4;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">
                        Đặt lại mật khẩu
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 12px 0;color:#475569;font-size:14px;">
                  Nếu nút không hoạt động, sao chép và dán đường dẫn sau vào trình duyệt của bạn:
                </p>
                <p style="word-break:break-all;margin:0 0 18px 0;color:#0f1724;font-size:13px;">
                  <a href="${resetLink}" target="_blank" style="color:#0f1724;text-decoration:underline;">${resetLink}</a>
                </p>

                <hr style="border:none;border-top:1px solid #eef2f6;margin:18px 0;" />

                <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.4;">
                  Nếu bạn không yêu cầu thay đổi mật khẩu, bạn có thể bỏ qua email này.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
};

export const sendEmail = async (to: string, subject: string, html: string) => {
  return await transporter.sendMail({
    to: to,
    subject: subject,
    html: html,
  });
};
