import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({
  to,
  subject,
  productId,
  firstName,
  lastName,
  rating,
  comment,
}) => {
  const senderEmail = "onboarding@resend.dev";
  const appName = "Advanced Reviews";

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Product Review Notification</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }
            .container {
                width: 100%;
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                padding: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
                background-color: #4CAF50;
                color: #ffffff;
                padding: 10px 0;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
            }
            .content {
                margin: 20px 0;
            }
            .content p {
                margin: 10px 0;
                font-size: 16px;
            }
            .footer {
                text-align: center;
                padding: 10px 0;
                font-size: 14px;
                color: #666666;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>New Product Review Submitted</h1>
            </div>
            <div class="content">
                <p>Hello Admin,</p>
                <p>A new review has been submitted for the product with ID <strong>${productId}</strong>.</p>
                <p><strong>Reviewer:</strong> ${firstName} ${lastName}</p>
                <p><strong>Rating:</strong> ${rating}</p>
                <p><strong>Comment:</strong> ${comment}</p>
                <p>Best regards,</p>
                <p>${appName}</p>
            </div>
            <div class="footer">
                &copy; ${new Date().getFullYear()} Your Company. All rights reserved.
            </div>
        </div>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: senderEmail, // Replace with your sender email
      to,
      subject,
      html: emailHtml,
    });

    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

export default sendEmail;
