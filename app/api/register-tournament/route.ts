import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// --- CORS Configuration ---
const FRONTEND_ORIGIN =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://cohessionafrica.com/";

// Define headers needed for the *main* POST request success
const successHeaders = {
  "Access-Control-Allow-Origin": FRONTEND_ORIGIN,
  // Note: Only list the methods for the main request here, OPTIONS is handled separately below
  "Access-Control-Allow-Methods": "POST",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Define headers needed for the *OPTIONS preflight* request success
const corsPreflightHeaders = {
  "Access-Control-Allow-Origin": FRONTEND_ORIGIN,
  // Must explicitly allow both POST and OPTIONS for the preflight check
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  // Optional: allows caching the preflight result for a duration (e.g., 24 hours)
  "Access-Control-Max-Age": "86400",
};

// --- Email Content Helper ---
const generateEmailText = (
  data: Record<string, any>,
  formType: string
): string => {
  let details = "";

  if (formType === "SOLO") {
    details = `
Name: ${data.name}
Date of Birth: ${data.dob}
Position: ${data.position}
Category: ${data.category}
Gender: ${data.gender}
City: ${data.city}
`;
  } else if (formType === "TEAM") {
    details = `
Team Name: ${data.teamName}
Category: ${data.category}
Gender: ${data.gender}
City: ${data.city}
Manager Name: ${data.managerName}
Manager Email: ${data.email}
Manager Phone: ${data.phone}
`;
  } else if (formType === "COACH") {
    details = `
Name: ${data.name}
Certifications: ${data.certs || "N/A"}
Experience (Years): ${data.exp || "N/A"}
City: ${data.city}
Email: ${data.email}
Phone: ${data.phone}
`;
  } else if (formType === "OTHER") {
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

/**
 * @name POST
 * @description Handles the tournament registration submission and sends an email.
 */
export async function POST(request: Request) {
  let registrationData;

  try {
    registrationData = await request.json();
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: successHeaders }
    );
  }

  const { email, referenceNumber, formType } = registrationData;

  // Basic Validation: Ensure email and form type are present
  if (!email || !referenceNumber || !formType) {
    return NextResponse.json(
      {
        error: "Missing required fields (email, referenceNumber, or formType)",
      },
      { status: 400, headers: successHeaders }
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
      { status: 200, headers: successHeaders }
    );
  } catch (err) {
    console.error("Tournament registration email error:", err);
    return NextResponse.json(
      { error: "Failed to send registration email" },
      { status: 500, headers: successHeaders }
    );
  }
}

/**
 * @name OPTIONS
 * @description Handles the CORS preflight request (required for non-simple cross-origin requests).
 */
export async function OPTIONS() {
  // Respond with a 204 No Content and the critical CORS preflight headers
  return new NextResponse(null, { status: 204, headers: corsPreflightHeaders });
}
