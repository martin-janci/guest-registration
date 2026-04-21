import QRCode from 'qrcode';

interface Options {
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export async function renderQrSvg(
  payload: string,
  opts: Options = {},
): Promise<string> {
  if (!payload) throw new Error('QR payload must be a non-empty string');
  return QRCode.toString(payload, {
    type: 'svg',
    margin: opts.margin ?? 1,
    errorCorrectionLevel: opts.errorCorrectionLevel ?? 'M',
  });
}
