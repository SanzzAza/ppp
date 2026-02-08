# DramaCina Frontend

Struktur file setelah dirapikan:

```text
.
├── index.html
├── css/
│   └── style.css
└── js/
    └── app.js
```

## Catatan pengecekan singkat
- HTML sudah dipisah dari CSS/JS agar lebih mudah maintenance.
- Seluruh fungsi JavaScript tetap global agar kompatibel dengan `onclick` inline di markup.
- Endpoint API eksternal tetap sama seperti kode asal.
