import QRCode from 'qrcode';
import CryptoJS from 'crypto-js';

const QR_SECRET = process.env.QR_SECRET_KEY || 'default-secret-key-change-in-production';

export function generateSessionCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generateQrToken() {
  return CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Base64url);
}

export function signQrData(data) {
  const jsonString = JSON.stringify(data);
  const signature = CryptoJS.HmacSHA256(jsonString, QR_SECRET).toString(CryptoJS.enc.Hex);
  
  return {
    data,
    signature,
    timestamp: Date.now()
  };
}

export function verifyQrData(signedData) {
  try {
    const { data, signature, timestamp } = signedData;
    const jsonString = JSON.stringify(data);
    const expectedSignature = CryptoJS.HmacSHA256(jsonString, QR_SECRET).toString(CryptoJS.enc.Hex);
    
    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid signature' };
    }

    const now = Date.now();
    const age = now - timestamp;
    const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
    
    if (age > MAX_AGE) {
      return { valid: false, error: 'QR code expired' };
    }

    return { valid: true, data };
  } catch (error) {
    return { valid: false, error: 'Verification failed' };
  }
}

export async function generateDataQrCode(sessionData) {
  try {
    const signedData = signQrData({
      type: 'attendance',
      session_id: sessionData.id,
      session_code: sessionData.session_code,
      subject: sessionData.subject,
      teacher_name: sessionData.teacher_name,
      session_date: sessionData.session_date,
      start_time: sessionData.start_time
    });

    const jsonString = JSON.stringify(signedData);
    const qrDataUrl = await QRCode.toDataURL(jsonString, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'M'
    });

    return {
      qrDataUrl,
      signedData,
      rawData: jsonString
    };
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

export function parseQrData(qrString) {
  try {
    const signedData = JSON.parse(qrString);
    const verification = verifyQrData(signedData);
    
    if (!verification.valid) {
      return { valid: false, error: verification.error };
    }

    return { valid: true, data: verification.data };
  } catch (error) {
    return { valid: false, error: 'Invalid QR data format' };
  }
}
