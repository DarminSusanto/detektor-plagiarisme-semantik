Detektor Plagiarisme Semantik

Sebuah aplikasi web full-stack yang mendeteksi plagiarisme semantik. Aplikasi ini tidak hanya mencocokkan kata-per-kata, tetapi juga memahami makna (semantik) dari teks, memungkinkannya menemukan konten yang telah diparafrase.

Teknologi Utama: React.js FastAPI Python Sentence-BERT

Daftar Anggota Kelompok

Kelompok 3

DARMIN SUSANTO (221111398)
MALCOLM MARCANTHONY TAN (221110609)
ADEN KESUMA (221111805)

Link Lengkap di OneDrive (Video dan Kode Project) :
https://mikroskilacid-my.sharepoint.com/:f:/g/personal/221111398_students_mikroskil_ac_id/EmbqaEA8vxFAvVGaQVyeZz8BO2xLYv1rsERXYkC6Eo8DOg?e=VPTkju

URL Video Penjelasan : 
Link OneDrive : https://mikroskilacid-my.sharepoint.com/:v:/g/personal/221111398_students_mikroskil_ac_id/EXGpPB0HIFpHjvrDwn5QbEUBfNjr9ZlrKnbMDQbQ-sFcDg?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJPbmVEcml2ZUZvckJ1c2luZXNzIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXciLCJyZWZlcnJhbFZpZXciOiJNeUZpbGVzTGlua0NvcHkifX0&e=uIZIaG

Link Google Drive : https://drive.google.com/file/d/1pBjFEvfejZGD6S0sgUMEeZtj2QiKz1Dc/view?usp=sharing


🚀 URL Aplikasi Live

Saat ini, aplikasi ini dikonfigurasi untuk dijalankan di lingkungan lokal.

Frontend (UI): http://localhost:3000

Backend (API): http://localhost:8000

🧭 Petunjuk Penggunaan Aplikasi

Aplikasi ini memiliki dua mode utama yang dapat dipilih di bagian atas:

1. Bandingkan Dua Teks

Fitur ini digunakan untuk membandingkan dua teks secara langsung.

Klik tab "Bandingkan Dua Teks".

Anda akan melihat dua kotak input. Masukkan teks Anda di "Teks Pertama" dan "Teks Kedua".

Anda dapat memasukkan teks dengan dua cara:

Ketik Langsung: Tempel atau ketik teks Anda ke dalam textarea.

Unggah File: Jika textarea kosong, tombol "Unggah File" akan muncul. Klik tombol ini untuk mengunggah file .txt atau .docx. Teks dari file akan otomatis diekstrak dan dimasukkan ke textarea.

Klik tombol "Bandingkan Teks".

Hasilnya akan muncul di bawah sebagai satu skor persentase "Tingkat Kemiripan".

2. Cek dengan Corpus

Fitur ini digunakan untuk membandingkan satu teks dengan database (corpus) yang berisi ribuan artikel.

Klik tab "Cek dengan Corpus".

Masukkan teks yang ingin Anda periksa di kotak input (bisa via ketik atau unggah file).

Klik tombol "Cek dengan Corpus".

Hasil akan muncul dalam dua bagian:

Skor Plagiarisme Rata-Rata: Skor rata-rata dari 5 dokumen teratas di corpus yang paling mirip dengan teks Anda.

Lihat Rincian Perbandingan: Sebuah dropdown yang bisa Anda klik untuk melihat tabel rincian. Tabel ini menunjukkan artikel mana dari corpus yang terdeteksi mirip, skornya, dan pratinjau teksnya.

⚙️ Instalasi & Menjalankan Proyek (Lokal)

NOTE (PENTING) : Jika tidak ingin menggunakan venv (virtual enviroment) -> ketikkan "deactivate" di terminal

Untuk menjalankan proyek ini di komputer Anda, Anda perlu menjalankan dua server: Backend (API) dan Frontend (UI).

Prasyarat

Node.js & npm: Diperlukan untuk menjalankan Frontend React.

Python 3.8+ & pip: Diperlukan untuk menjalankan Backend FastAPI.

1. 📂 Backend (FastAPI)

Buka Terminal dan navigasikan ke folder backend Anda.

Buat Virtual Environment (venv):

python -m venv venv


Aktifkan venv:

Di Windows (PowerShell):

.\venv\Scripts\Activate


Di macOS/Linux:

source venv/bin/activate


Instal semua library Python yang dibutuhkan:

pip install "fastapi[all]" uvicorn sentence-transformers torch pandas python-docx


Siapkan Corpus (Database):

Unduh file .csv corpus Anda (misalnya, medium_articles_1.csv dan medium_articles_2.csv).

Letakkan file-file CSV tersebut di dalam folder backend, di lokasi yang sama dengan file main.py.

Jalankan Server Backend:

python -m uvicorn main:app --reload


Server Anda sekarang berjalan di http://localhost:8000. Biarkan terminal ini tetap terbuka.

2. 🖥️ Frontend (React)

Buka Terminal KEDUA (biarkan terminal backend tetap berjalan).

Navigasikan ke folder frontend Anda (misalnya, plagiarism-frontend).

Instal semua modul Node.js:

npm install


(Hanya perlu dijalankan sekali saat pertama kali setup).

Jalankan Server Frontend:

npm start


Aplikasi web akan otomatis terbuka di browser Anda pada alamat http://localhost:3000.
