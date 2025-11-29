Expert Generator Server (Node.js)
================================

Isi paket:
- server.js : contoh server Express yang menerima image + metadata dan memanggil OpenAI.
- prompts/ : prompt system + user template (bahasa Indonesia) yang menyertakan arahan untuk referensi hukum/standar.
- Dockerfile : untuk containerisasi.
- package.json : dependencies.

Langkah deploy cepat (Railway / Render / VPS):
1. Siapkan repo dan upload isi folder ini.
2. Set ENV: OPENAI_API_KEY (dan optional OPENAI_MODEL).
3. Deploy (Railway/Render: pilih Node service, auto-detect). Port default 8080.
4. Setelah deploy, di client (HTML), set window.generateExpertOnline to call https://YOUR_HOST/api/generate-expert.

Keamanan & Privasi:
- Jangan simpan gambar di server kecuali perlu. Jika perlu, simpan terenkripsi.
- Selalu gunakan HTTPS.
- Beri tahu user bahwa foto akan dikirim ke server/AI.

Integrasi client:
Contoh client hook (di HTML):
```js
window.generateExpertOnline = async function(blobOrFile, selectedIds, metadata){
  const fd = new FormData();
  fd.append('image', blobOrFile, 'photo.jpg');
  fd.append('metadata', JSON.stringify(metadata || {}));
  const res = await fetch('https://YOUR_SERVER_DOMAIN/api/generate-expert', { method:'POST', body:fd });
  if(!res.ok) throw new Error('server error');
  return await res.json(); // { text, meta }
};
```

Tambahan (opsional):
- Untuk akurasi visual terbaik, tambahkan microservice Python yang menjalankan BLIP (image caption) dan YOLO/Detectron (deteksi objek domain-spesifik), lalu kirim hasilnya di field 'detected_objects' di metadata.
