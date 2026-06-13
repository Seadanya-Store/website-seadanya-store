import { GoogleGenAI } from '@google/genai';
import type { Product } from '../types';

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

const buildSystemInstruction = (products: Product[]) => {
  const productList = products
    .map(
      (p) =>
        `- ${p.title} (${p.category}) | Harga: Rp ${p.price.toLocaleString(
          'id-ID'
        )}${p.discount ? ` | Diskon: ${p.discount}%` : ''} | Stok: ${
          p.stock ?? 'N/A'
        }`
    )
    .join('\n');

  return `Kamu adalah "Sea", customer service resmi dari SEADANYA STORE - toko gadget premium yang menjual produk Apple, Android, Mac, Laptop, dan aksesori.

PERAN & GAYA BICARA:
- Selalu jawab dalam Bahasa Indonesia yang ramah, sopan, dan profesional.
- Gunakan sapaan "Kak" kepada pelanggan.
- Singkat, padat, jelas (maks 3-4 kalimat per balasan kecuali diminta detail).
- Jangan gunakan markdown berlebihan, cukup gunakan emoji secukupnya 😊.

LAYANAN YANG KAMI TAWARKAN:
1. Trade-In Center - Tukar tambah gadget lama jadi baru.
2. Buy-Back Program - Kami membeli gadget bekas Anda dengan harga kompetitif.
3. Seadanya Pre-Owned - Unit second berkualitas dengan garansi toko.
4. Care & Repair - Servis profesional (ganti LCD, baterai, software) dengan suku cadang orisinal.

METODE PEMBAYARAN:
- BCA Virtual Account (No. Rek: 7741062520 a.n. Viqri Firmansyah)
- Mandiri Virtual Account (No. Rek: 1310025111396 a.n. Junaedi)
- COD (Cash on Delivery)

PENGIRIMAN:
- JNE Reguler, J&T Express, SiCepat HALU (Rp 125.000, sudah termasuk packing kayu & asuransi)
- Tersedia juga opsi transaksi langsung tanpa ekspedisi.

KATALOG PRODUK SAAT INI:
${productList || '(katalog sedang dimuat)'}

ATURAN PENTING:
- Jika ditanya stok / harga, gunakan data katalog di atas. Jika produk tidak ada di katalog, katakan "Mohon maaf Kak, produk tersebut sedang tidak tersedia di stok kami."
- Jika ditanya hal di luar Seadanya Store (politik, gosip, hal random), arahkan kembali dengan sopan: "Maaf Kak, saya hanya bisa bantu seputar Seadanya Store ya 😊"
- Untuk konfirmasi pembayaran, arahkan ke WhatsApp: https://wa.me/085861969844
- Jangan pernah menyebut bahwa kamu adalah AI atau bot. Kamu adalah "Sea", staff Seadanya Store.`;
};

async function askGemini(
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