import { NextResponse } from "next/server";
import { Resend } from "resend";

const ACTIVATION_BASE_URL = "https://quote.gummynology.com/activate";
const FROM_EMAIL = "Gummynology <info@gummify.us>";
const SUBJECT = "Your Gummynology Quote System Access Has Been Approved";

type SendAccessEmailRequest = {
  email?: string;
  first_name?: string;
  activation_token?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildEmailHtml(firstName: string, activationLink: string) {
  const safeFirstName = escapeHtml(firstName || "there");
  const safeActivationLink = escapeHtml(activationLink);

  return `
    <div style="margin:0;background:#f7f6f1;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;">
        <tr>
          <td style="padding:32px 32px 20px;border-bottom:1px solid #e4e4e7;">
            <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#065f46;">Gummynology Quote System</p>
            <h1 style="margin:0;font-size:26px;line-height:1.25;color:#09090b;">Access approved</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px 32px;">
            <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">Hello ${safeFirstName},</p>
            <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">
              Your access request for the Gummynology Quote System has been approved. Please activate your access using the secure link below.
            </p>
            <p style="margin:28px 0;">
              <a href="${safeActivationLink}" style="display:inline-block;background:#065f46;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 22px;border-radius:2px;">
                Activate Quote System Access
              </a>
            </p>
            <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#52525b;">
              This link is for account activation. After activation, you can continue into the quote system and begin preparing structured manufacturing quote requests.
            </p>
            <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#52525b;">
              If the button does not open, copy and paste this link into your browser:<br />
              <a href="${safeActivationLink}" style="color:#065f46;word-break:break-all;">${safeActivationLink}</a>
            </p>
            <p style="margin:28px 0 0;font-size:15px;line-height:1.6;">
              Gummynology LLC<br />
              Supplement Manufacturing Quote Team
            </p>
          </td>
        </tr>
      </table>
    </div>
  `;
}

function buildEmailText(firstName: string, activationLink: string) {
  return `Hello ${firstName || "there"},

Your access request for the Gummynology Quote System has been approved.

Please activate your access using this link:
${activationLink}

This link is for account activation. After activation, you can continue into the quote system and begin preparing structured manufacturing quote requests.

Gummynology LLC
Supplement Manufacturing Quote Team`;
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY is not configured." },
      { status: 500 },
    );
  }

  let payload: SendAccessEmailRequest;

  try {
    payload = (await request.json()) as SendAccessEmailRequest;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const email = payload.email?.trim();
  const firstName = payload.first_name?.trim() || "";
  const activationToken = payload.activation_token?.trim();

  if (!email || !activationToken) {
    return NextResponse.json(
      { error: "email and activation_token are required." },
      { status: 400 },
    );
  }

  const resend = new Resend(apiKey);
  const activationLink = `${ACTIVATION_BASE_URL}?token=${encodeURIComponent(
    activationToken,
  )}`;

  const { data, error } = await resend.emails
    .send({
      from: FROM_EMAIL,
      to: email,
      subject: SUBJECT,
      html: buildEmailHtml(firstName, activationLink),
      text: buildEmailText(firstName, activationLink),
    })
    .catch((sendError: unknown) => ({
      data: null,
      error:
        sendError instanceof Error
          ? sendError
          : new Error("Unable to send activation email."),
    }));

  if (error) {
    return NextResponse.json(
      { error: error.message || "Unable to send activation email." },
      { status: 502 },
    );
  }

  return NextResponse.json({ id: data?.id || null, sent: true });
}
