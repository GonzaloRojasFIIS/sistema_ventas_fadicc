import { Resend } from 'resend';

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY || 're_EjcBcPvW_68c1rh3D9Pxq1yUJnxHCq14o');

export interface EmailAttachment {
  filename: string;
  content: string; // base64
}

export async function enviarEmail({
  to,
  subject,
  html,
  attachments,
}: {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}): Promise<{ success: boolean; error?: string; id?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: 'FADICC <onboarding@resend.dev>',
      to,
      subject,
      html,
      attachments,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error('Email send error:', err);
    return { success: false, error: err?.message || 'Error desconocido al enviar email' };
  }
}

export async function enviarProformaEmail({
  to,
  proformaCodigo,
  clienteNombre,
  representanteNombre,
  pdfBase64,
}: {
  to: string;
  proformaCodigo: string;
  clienteNombre: string;
  representanteNombre: string;
  pdfBase64?: string;
}): Promise<{ success: boolean; error?: string; id?: string }> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: linear-gradient(135deg, #f97316, #fbbf24); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">FADICC S.A.</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 4px 0 0;">Equipamiento Gastronómico Industrial</p>
      </div>
      <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; background: #fff;">
        <p style="font-size: 16px;">Estimado/a <strong>${clienteNombre}</strong>,</p>
        <p>Adjunto encontrará la proforma <strong>${proformaCodigo}</strong> preparada por ${representanteNombre}.</p>
        <p style="background: #fef3c7; padding: 12px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 16px 0;">
          <strong>Estado:</strong> Pendiente de aprobación<br>
          <strong>Válida por:</strong> 15 días calendario
        </p>
        <p>Si tiene alguna consulta o desea negociar los términos, no dude en contactarnos.</p>
        <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 14px; margin: 0;">
            <strong>FADICC S.A.</strong><br>
            Av. Javier Prado Este 505, San Isidro<br>
            Lima, Perú<br>
            Tel: +51 912 449 977
          </p>
        </div>
      </div>
    </div>
  `;

  const attachments = pdfBase64
    ? [{ filename: `${proformaCodigo}.pdf`, content: pdfBase64 }]
    : undefined;

  return enviarEmail({ to, subject: `Proforma ${proformaCodigo} - FADICC`, html, attachments });
}

export async function enviarCatalogoEmail({
  to,
  clienteNombre,
  productos,
  pdfBase64,
}: {
  to: string;
  clienteNombre: string;
  productos: { nombre: string; sku: string; precio: number }[];
  pdfBase64?: string;
}): Promise<{ success: boolean; error?: string; id?: string }> {
  const productosHtml = productos
    .map(
      (p) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px; font-size: 14px;">${p.nombre}</td>
        <td style="padding: 10px; font-family: monospace; font-size: 13px; color: #64748b;">${p.sku}</td>
        <td style="padding: 10px; text-align: right; font-weight: 600;">S/ ${p.precio.toFixed(2)}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: linear-gradient(135deg, #f97316, #fbbf24); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">FADICC S.A.</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 4px 0 0;">Equipamiento Gastronómico Industrial</p>
      </div>
      <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; background: #fff;">
        <p style="font-size: 16px;">Estimado/a <strong>${clienteNombre}</strong>,</p>
        <p>Adjunto encontrará nuestro catálogo de productos personalizado.</p>
        
        <h3 style="margin-top: 24px; font-size: 16px; color: #1e293b;">Productos destacados</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
              <th style="padding: 10px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b;">Producto</th>
              <th style="padding: 10px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b;">SKU</th>
              <th style="padding: 10px; text-align: right; font-size: 12px; text-transform: uppercase; color: #64748b;">Precio</th>
            </tr>
          </thead>
          <tbody>
            ${productosHtml}
          </tbody>
        </table>

        <p style="margin-top: 24px;">¿Interesado en algún producto? Responda a este correo o contáctenos por WhatsApp para coordinar una visita.</p>
        
        <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 14px; margin: 0;">
            <strong>FADICC S.A.</strong><br>
            Av. Javier Prado Este 505, San Isidro<br>
            Lima, Perú<br>
            Tel: +51 912 449 977
          </p>
        </div>
      </div>
    </div>
  `;

  const attachments = pdfBase64
    ? [{ filename: 'catalogo-fadicc.pdf', content: pdfBase64 }]
    : undefined;

  return enviarEmail({ to, subject: 'Catálogo FADICC - Equipamiento Gastronómico', html, attachments });
}
