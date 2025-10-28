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

// --- Email Content Helper ---
const generateEmailText = (data: Record<string, any>, formType: string): string => {
    let details = '';

    if (formType === 'SOLO') {
        details = `
Name: ${data.name}
Date of Birth: ${data.dob}
Position: ${data.position}
Category: ${data.category}
Gender: ${data.gender}
City: ${data.city}
`;
    } else if (formType === 'TEAM') {
        details = `
Team Name: ${data.teamName}
Category: ${data.category}
Gender: ${data.gender}
City: ${data.city}
Manager Name: ${data.managerName}
Manager Email: ${data.email}
Manager Phone: ${data.phone}
`;
    } else if (formType === 'COACH') {
        details = `
Name: ${data.name}
Certifications: ${data.certs || 'N/A'}
Experience (Years): ${data.exp || 'N/A'}
City: ${data.city}
Email: ${data.email}
Phone: ${data.phone}
`;
    } else if (formType === 'OTHER') {
        details = `
Role: ${data.category} (Volunteer/Sponsor/Media)
Name/Organization: ${data.name}
Email: ${data.email}
Phone: ${data.phone}
`;
    }

    return `
=== New Tournament Registration: ${formType} ===

Reference Number: ${data.referenceNumber}

${details}
`;
};


export async function POST(request: Request) {
    let registrationData;

    try {
        registrationData = await request.json();
    } catch (e) {
        return NextResponse.json(
            { error: "Invalid JSON body" }, 
            { status: 400, headers: corsHeaders }
        );
    }

    const { email, referenceNumber, formType } = registrationData;

    // Basic Validation: Ensure email and form type are present
    if (!email || !referenceNumber || !formType) {
        return NextResponse.json(
            { error: "Missing required fields (email, referenceNumber, or formType)" }, 
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

        // Generate email body based on form type
        const emailText = generateEmailText(registrationData, formType);

        await transporter.sendMail({
            from: process.env.SMTP_FROM,
            replyTo: email,
            to: process.env.SMTP_TO, // Internal Email
            subject: `New Tournament Registration: ${formType} (Ref: ${referenceNumber})`, 
            text: emailText,
        });

        return NextResponse.json(
            { success: true, message: "Registration email sent successfully" }, 
            { status: 200, headers: corsHeaders }
        );
        
    } catch (err) {
        console.error("Tournament registration email error:", err);
        return NextResponse.json(
            { error: "Failed to send registration email" }, 
            { status: 500, headers: corsHeaders }
        );
    }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}