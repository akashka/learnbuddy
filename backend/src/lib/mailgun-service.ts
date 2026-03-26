/**
 * Mailgun email service - sends templated emails via Mailgun API.
 * Templates are stored in NotificationTemplate (channel=email) and support {{variable}} substitution.
 */
import Mailgun from 'mailgun.js';
import FormData from 'form-data';
import connectDB from '@/lib/db';
import { NotificationTemplate } from '@/lib/models/NotificationTemplate';

type MailgunClient = { messages: { create: (domain: string, data: object) => Promise<unknown> } };
let mailgunClient: MailgunClient | null = null;

function getMailgunClient(): MailgunClient | null {
  if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
    return null;
  }
  if (!mailgunClient) {
    const MailgunFactory = new Mailgun(FormData);
    mailgunClient = MailgunFactory.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY,
      url: process.env.MAILGUN_EU === 'true' ? 'https://api.eu.mailgun.net' : undefined,
    }) as MailgunClient;
  }
  return mailgunClient;
}

function substituteVariables(str: string, vars: Record<string, string>): string {
  let result = str;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value ?? ''));
  }
  return result;
}

export interface SendTemplatedEmailOptions {
  to: string;
  templateCode: string;
  variables?: Record<string, string>;
}

/**
 * Send an email using a NotificationTemplate (channel=email, code=templateCode).
 * Variables like {{name}}, {{studentName}} are substituted.
 * If Mailgun is not configured, logs to console in development.
 */
export async function sendTemplatedEmail(options: SendTemplatedEmailOptions): Promise<{ sent: boolean; error?: string }> {
  const { to, templateCode, variables = {} } = options;
  if (!to?.trim()) return { sent: false, error: 'No recipient' };

  try {
    await connectDB();
    const template = await NotificationTemplate.findOne({
      channel: 'email',
      code: templateCode,
      isActive: true,
    }).lean();

    if (!template) {
      console.warn(`[Mailgun] No active email template found for code: ${templateCode}`);
      return { sent: false, error: `Template ${templateCode} not found` };
    }

    const appUrl = process.env.APP_URL || process.env.VITE_APP_WEBSITE_URL || process.env.BACKEND_URL || 'https://guruchakra.com';
    const logoUrl = template.logoUrl || 'https://guruchakra.com/logo.svg';
    const year = String(new Date().getFullYear());

    const baseVars: Record<string, string> = {
      ...variables,
      appUrl,
      logoUrl,
      year,
    };

    const subject = substituteVariables(template.subject || '', baseVars);
    let html = '';
    if (template.headerHtml) html += substituteVariables(template.headerHtml, baseVars);
    if (template.bodyHtml) html += substituteVariables(template.bodyHtml, baseVars);
    if (template.footerHtml) html += substituteVariables(template.footerHtml, baseVars);

    const client = getMailgunClient();
    const domain = process.env.MAILGUN_DOMAIN;
    const fromEmail = process.env.EMAIL_FROM || `GuruChakra <hello@${domain || 'guruchakra.com'}>`;

    if (!client || !domain) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Mailgun] (not configured) Would send to ${to}:`, { subject, templateCode });
      }
      return { sent: false, error: 'Mailgun not configured' };
    }

    await client.messages.create(domain, {
      from: fromEmail,
      to: [to],
      subject,
      html,
    });

    return { sent: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Mailgun] Failed to send ${templateCode} to ${to}:`, msg);
    return { sent: false, error: msg };
  }
}

/**
 * Check if Mailgun is configured and ready to send.
 */
export function isMailgunConfigured(): boolean {
  return !!(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN);
}
