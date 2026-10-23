import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { rootCertificates } from 'tls';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendPasswordResetEmail(to: string, resetLink: string) {
    const host = process.env.SMTP_HOST;

    // Without SMTP configured (local dev), log the link instead of sending.
    if (!host) {
      this.logger.warn(`SMTP_HOST not set. Password reset link for ${to}: ${resetLink}`);
      return;
    }

    // Optional extra CA, for networks/antivirus that re-sign SMTP TLS with their own root.
    const caFile = process.env.SMTP_CA_FILE;
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
      tls: caFile ? { ca: [...rootCertificates, readFileSync(caFile, 'utf8')] } : undefined,
    });

    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject: 'Reset your AnythingDoor password',
      text: `Use the link below to reset your password. It expires in 1 hour.\n\n${resetLink}\n\nIf you did not request this, you can ignore this email.`,
      html: `<p>Use the link below to reset your password. It expires in 1 hour.</p><p><a href="${resetLink}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`,
    });
    this.logger.log(`Password reset email sent to ${to} (accepted: ${info.accepted.length})`);
  }
}
