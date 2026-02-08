# DramaCina Frontend

Struktur file hasil pemisahan kode:

```text
.
├── index.html
├── css/
│   └── style.css
└── js/
    └── app.js
```

## Ringkasan pengecekan
- Struktur sudah dipisah antara tampilan (`index.html`), style (`css/style.css`), dan logika aplikasi (`js/app.js`).
- Source data sekarang mendukung 3 provider: **Melolo**, **FlickReels**, dan **DramaBox**.
- Fitur list/search memakai mekanisme **Load More** agar lebih ringan saat render awal.
