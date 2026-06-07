import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY || 're_EjcBcPvW_68c1rh3D9Pxq1yUJnxHCq14o');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, subject, html, attachments } = body;

    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'Faltan campos obligatorios: to, subject, html' }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: 'FADICC <onboarding@resend.dev>',
      to,
      subject,
      html,
      attachments,
    });

    if (error) {
      console.error('Resend API error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: any) {
    console.error('API /api/enviar-email error:', err);
    return NextResponse.json({ error: err?.message || 'Error interno' }, { status: 500 });
  }
}
