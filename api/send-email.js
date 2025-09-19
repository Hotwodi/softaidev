// Simple serverless handler for sending contact form emails via Resend
// Works on Vercel/Netlify (Node 18+). Expects RESEND_API_KEY in env.

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.resend.com',
  port: 465,
  secure: true,
  auth: {
    user: 'resend',
    pass: process.env.RESEND_API_KEY,
  },
});

export async function sendContactEmail({ name, email, message }) {
  return transporter.sendMail({
    from: 'SoftAIDev <customersupport@softaidev.com>',
    to: 'customersupport@softaidev.com',
    subject: `Contact form from ${name}`,
    html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p>${message.replace(/\n/g,'<br>')}</p>`,
  });
}
