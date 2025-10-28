import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// --- Configuration ---
const FRONTEND_ORIGIN = process.env.NODE_ENV === "development"
  ? "http://localhost:3000"
  : "https://cohesionafrica.com";
const COHESION_LOGO_URL =
  "https://cohesionafrica.com/assets/cohesion_logo-C7iedy-3.png";

const corsHeaders = {
  "Access-Control-Allow-Origin": FRONTEND_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};


const generateConfirmationHtml = (
  name: string,
  reference: string,
  subject: string
): string => {
  const primaryColor = "#1D4ED8";

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
      
      <div style="padding: 20px; text-align: center; background-color: #F8FAFC; border-bottom: 1px solid #E5E7EB;">
          <img src="${COHESION_LOGO_URL}" alt="Cohession Logo" style="max-height: 50px; display: block; margin: 0 auto;">
      </div>

      <div style="padding: 30px;">
          <h1 style="font-size: 24px; color: ${primaryColor}; margin-top: 0;">${subject}</h1>
          
          <p>Hello ${name},</p>
          
          <p>Thank you for reaching out to Cohession Africa. We've successfully received your submission, which we'll review shortly. Your reference number is: <strong>${reference}</strong>.</p>
          <p>We aim to respond to all inquiries within 24-48 business hours. Please use the reference number above if you need to follow up on your submission.</p>

          <p>
            Best regards,
            <br>
            The Cohession Africa Team
          </p>
      </div>

      <div style="padding: 20px; text-align: center; font-size: 12px; color: #9CA3AF; background-color: #F8FAFC; border-top: 1px solid #E5E7EB;">
          This is an automated confirmation.
      </div>
    </div>
  `;
};

export async function POST(request: Request) {
  let confirmationData;

  try {
    confirmationData = await request.json();
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: corsHeaders }
    );
  }

  const { recipientEmail, recipientName, reference, subject } =
    confirmationData;

  if (!recipientEmail || !recipientName || !reference || !subject) {
    return NextResponse.json(
      {
        error:
          "Missing required fields for confirmation email (recipientEmail, recipientName, reference, or subject)",
      },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const htmlContent = generateConfirmationHtml(
      recipientName,
      reference,
      subject
    );

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: recipientEmail,
      subject: subject,
      html: htmlContent,
      text: `Hello ${recipientName},\n\nThank you for reaching out to Cohession Africa. We've received your message. Your Reference Number is: ${reference}.\n\nWe aim to respond within 24-48 business hours.\n\nBest regards,\nThe Cohession Africa Team`,
    });

    return NextResponse.json(
      { success: true, message: "Confirmation email sent successfully" },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("Confirmation email error:", err);
    return NextResponse.json(
      { error: "Failed to send confirmation email" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}
