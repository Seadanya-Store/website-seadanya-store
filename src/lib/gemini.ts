import { GoogleGenAI } from '@google/genai';
import type { Product } from '../types';

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY as string,
});

const buildSystemInstruction = (products: Product[]): string => {
  const productList = products
    .map(
      (p) =>
        `- ${p.title} (${p.category}) | Harga: Rp ${p.price.toLocaleString('id-ID')}` +
        `${p.discount ? ` | Diskon: ${p.discount}%` : ''}` +
        ` | Stok: ${p.stock ?? 'N/A'}`
    )
    .join('\n');

  return (
    'Kamu adalah "Sea", customer service resmi dari SEADANYA STORE - ' +
    'toko gadget premium yang menjual produk Apple, Android, Mac, Laptop, dan aksesori.\n\n' +
    'PERAN & GAYA BICARA:\n' +
    '- Selalu jawab dalam Bahasa Indonesia yang ramah, sopan, dan profesional.\n' +
    '- Gunakan sapaan "Kak" kepada pelanggan.\n' +
    '- Singkat, padat, jelas (maks 3-4 kalimat per balasan kecuali diminta detail).\n\n' +
    'LAYANAN YANG KAMI TAWARKAN:\n' +
    '1. Trade-In Center - Tukar tambah gadget lama jadi baru.\n' +
    '2. Buy-Back Program - Kami membeli gadget bekas Anda dengan harga kompetitif.\n' +
    '3. Seadanya Pre-Owned - Unit second berkualitas dengan garansi toko.\n' +
    '4. Care & Repair - Servis profesional dengan suku cadang orisinal.\n\n' +
    'METODE PEMBAYARAN:\n' +
    '- BCA Virtual Account (No. Rek: 7741062520 a.n. Viqri Firmansyah)\n' +
    '- Mandiri Virtual Account (No. Rek: 1310025111396 a.n. Junaedi)\n' +
    '- COD (Cash on Delivery)\n\n' +
    'PENGIRIMAN:\n' +
    '- JNE Reguler, J&T Express, SiCepat HALU (Rp 125.000, sudah termasuk packing kayu & asuransi)\n\n' +
    'KATALOG PRODUK SAAT INI:\n' +
    (productList || '(katalog sedang dimuat)') + '\n\n' +
    'ATURAN PENTING:\n' +
    '- Jika produk tidak ada di katalog, katakan "Mohon maaf Kak, produk tersebut sedang tidak tersedia."\n' +
    '- Jika ditanya hal di luar Seadanya Store, arahkan kembali dengan sopan.\n' +
    '- Untuk konfirmasi pembayaran, arahkan ke WhatsApp: https://wa.me/085861969844\n' +
    '- Jangan pernah menyebut bahwa kamu adalah AI atau bot.'
  );
};

export async function askGemini(
  history: { sender: 'user' | 'seller'; text: string }[],
  userMessage: string,
  products: Product[]
): Promise<string> {
  const contents = [
    ...history.map((m) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    })),
    { role: 'user', parts: [{ text: userMessage }] },
  ];

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents,
    config: {
      systemInstruction: buildSystemInstruction(products),
      temperature: 0.7,
      maxOutputTokens: 400,
    },
  });

  return response.text ?? 'Maaf Kak, saya sedang kesulitan menjawab. Coba lagi ya 🙏';
}