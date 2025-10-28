import { NextResponse } from 'next/server';
import nodemailer from "nodemailer";

// --- CORS Configuration ---
const FRONTEND_ORIGIN = process.env.NODE_ENV === "development"
  ? "http://localhost:3000"
  : "https://cohessionafrica.com/"; 

const corsHeaders = {
  'Access-Control-Allow-Origin': FRONTEND_ORIGIN, 
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type', 
};


export async function POST(request: Request) {
    let formData;

    try {
        formData = await request.json();
    } catch (e) {
        return NextResponse.json(
            { error: "Invalid JSON body" }, 
            { status: 400, headers: corsHeaders } 
        );
    }

    const { 
        firstName, 
        lastName, 
        email, 
        phone,
        topic,
        message, 
        referenceNumber 
    } = formData;

    if (!firstName || !email || !topic || !message) {
        return NextResponse.json(
            { error: "Missing required fields (First Name, Email, Topic, or Message)" }, 
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

        await transporter.sendMail({
            from: process.env.SMTP_FROM,
            replyTo: email,
            to: process.env.SMTP_TO,
            subject: `New Inquiry: ${topic}`, 
            text: `
New contact form submission:

Reference Number: ${referenceNumber || "N/A"}
Name: ${firstName} ${lastName}
Email: ${email}
Phone: ${phone || "N/A"}
Topic: ${topic}

Message:
${message}
`,
        });

        return NextResponse.json(
            { success: true, message: "Thank you for reaching out to Cohession Africa. We will get back to you shortly" }, 
            { status: 200, headers: corsHeaders } 
        );
        
    } catch (err) {
        console.error("Email error:", err);
        // Error response
        return NextResponse.json(
            { error: "Failed to send email" }, 
            { status: 500, headers: corsHeaders } 
        );
    }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}