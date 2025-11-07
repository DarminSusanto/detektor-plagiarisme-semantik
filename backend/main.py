# =================================================================
# Import Library
# =================================================================
import uvicorn
import os
import io
import pandas as pd
import docx # Untuk membaca file .docx
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer, util
import torch # Pastikan torch terinstal

# =Z================================================================
# Model & Konfigurasi
# =================================================================

# Tentukan device (gunakan GPU jika tersedia)
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Menggunakan device: {DEVICE}")

# Muat model ke device yang dipilih
print("Memuat model Sentence Transformer...")
# Gunakan 'all-MiniLM-L6-v2' untuk keseimbangan kecepatan dan akurasi
model = SentenceTransformer('all-MiniLM-L6-v2', device=DEVICE)
print("Model berhasil dimuat.")

# =================================================================
# Fungsi untuk Memuat Corpus dari File CSV
# =================================================================

def load_corpus_from_csvs():
    """Membaca dan menggabungkan data dari dua file CSV."""
    corpus_data = {}
    files_to_load = ['medium_articles_1.csv', 'medium_articles_2.csv']
    
    for filename in files_to_load:
        if not os.path.exists(filename):
            print(f"PERINGATAN: File corpus '{filename}' tidak ditemukan. Melewatkan.")
            continue
        
        try:
            # Baca CSV menggunakan pandas
            df = pd.read_csv(filename)
            
            # Tentukan kolom teks (bisa 'text' atau 'Body')
            text_column = None
            if 'text' in df.columns:
                text_column = 'text'
            elif 'Body' in df.columns:
                text_column = 'Body'
            
            if text_column is None:
                print(f"PERINGATAN: Tidak ditemukan kolom 'text' or 'Body' di {filename}. Melewatkan.")
                continue

            # Ambil kolom judul (jika ada) atau gunakan nama file
            title_column = 'title' if 'title' in df.columns else 'Title'
            
            # Loop melalui baris dan tambahkan ke corpus
            for index, row in df.iterrows():
                # Pastikan teks adalah string yang valid
                doc_text = str(row.get(text_column, ''))
                if pd.isna(doc_text) or not doc_text.strip():
                    continue # Lewati teks kosong

                # Buat nama dokumen yang unik
                doc_name = str(row.get(title_column, f"{filename}_{index}"))
                if pd.isna(doc_name):
                    doc_name = f"{filename}_{index}"
                    
                # Pastikan nama unik
                original_doc_name = doc_name
                count = 1
                while doc_name in corpus_data:
                    doc_name = f"{original_doc_name}_{count}"
                    count += 1
                
                corpus_data[doc_name] = doc_text

            print(f"Berhasil memuat {len(df)} baris (artikel) dari '{filename}'")
            
        except Exception as e:
            print(f"ERROR: Gagal memuat atau memproses {filename}: {e}")

    # Fallback jika tidak ada file CSV yang dimuat
    if not corpus_data:
        print("PERINGATAN: Tidak ada corpus CSV yang dimuat. Menggunakan corpus bawaan.")
        corpus_data = {
            "Fallback_A": "This is a default document.",
            "Fallback_B": "Please add 'medium_articles_1.csv' or 'medium_articles_2.csv'."
        }
        
    return corpus_data

# Muat dan Encode Corpus saat Startup
CORPUS = load_corpus_from_csvs()
print("Meng-encode corpus...")
corpus_names = list(CORPUS.keys())
corpus_texts = list(CORPUS.values())
# Encode ke device yang dipilih
corpus_embeddings = model.encode(corpus_texts, convert_to_tensor=True, device=DEVICE)
print(f"Corpus berhasil di-encode (jumlah total: {len(corpus_names)})")


# =================================================================
# Inisialisasi FastAPI & CORS
# =================================================================
app = FastAPI(
    title="Plagiarism Detection API",
    description="API untuk deteksi plagiarisme semantik (v6).",
    version="6.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Izinkan frontend React
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =================================================================
# Model Pydantic (Validasi Request Body)
# =================================================================
class TextInput(BaseModel):
    text: str

class CompareInput(BaseModel):
    text1: str
    text2: str

# =================================================================
# Fungsi Helper (Pembaca File)
# =================================================================

async def read_file_contents(file: UploadFile):
    """Membaca isi file .txt atau .docx dari UploadFile."""
    if file.filename.endswith(".docx"):
        try:
            # Baca file .docx dari memori
            file_bytes = await file.read()
            doc = docx.Document(io.BytesIO(file_bytes))
            return "\n".join([p.text for p in doc.paragraphs if p.text])
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Gagal memproses file .docx: {e}")
    elif file.filename.endswith(".txt"):
        try:
            # Baca file .txt
            contents = await file.read()
            return contents.decode("utf-8")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Gagal memproses file .txt: {e}")
    else:
        raise HTTPException(status_code=400, detail="Format file tidak didukung. Harap unggah .txt atau .docx")

# =================================================================
# Endpoint API
# =================================================================

@app.get("/")
def read_root():
    return {"status": "API Deteksi Plagiarisme Aktif", "device": DEVICE}

@app.post("/api/extract-text")
async def extract_text_from_file(file: UploadFile = File(...)):
    """
    Endpoint untuk mengunggah file (.txt atau .docx) dan mengekstrak teksnya.
    Mengembalikan teks mentah sebagai JSON.
    """
    text = await read_file_contents(file)
    return {"text": text}

@app.post("/api/compare-text")
async def compare_text_endpoint(input_data: CompareInput):
    """
    Membandingkan dua teks dan mengembalikan skor kemiripan.
    """
    if not input_data.text1 or not input_data.text2:
        raise HTTPException(status_code=400, detail="Kedua teks tidak boleh kosong")
        
    try:
        embeddings = model.encode(
            [input_data.text1, input_data.text2], 
            convert_to_tensor=True, 
            device=DEVICE
        )
        cosine_score = util.cos_sim(embeddings[0], embeddings[1]).item()
        similarity_percentage = max(0, cosine_score * 100) # Pastikan tidak negatif
        
        return {"similarity": similarity_percentage}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal membandingkan teks: {e}")


@app.post("/api/check-text")
async def check_text_endpoint(input_data: TextInput):
    """
    Membandingkan satu teks dengan corpus.
    Mengembalikan skor rata-rata (top 5) dan daftar rincian.
    """
    if not input_data.text:
        raise HTTPException(status_code=400, detail="Teks tidak boleh kosong")
        
    try:
        query_embedding = model.encode(
            input_data.text, 
            convert_to_tensor=True, 
            device=DEVICE
        )
        
        # Cari 5 dokumen teratas untuk efisiensi
        top_k = min(5, len(corpus_names))
        
        hits = util.semantic_search(
            query_embedding, 
            corpus_embeddings.to(DEVICE), 
            top_k=top_k
        )
        
        # Format hasil
        results = []
        total_score = 0
        
        # hits[0] karena kita hanya punya 1 query
        if not hits or not hits[0]:
             return {"average_score": 0, "results": []}

        for hit in hits[0]:
            doc_name = corpus_names[hit['corpus_id']]
            doc_text = corpus_texts[hit['corpus_id']]
            score = hit['score'] * 100
            total_score += score
            
            results.append({
                "document_name": doc_name,
                "similarity": score,
                "preview_text": doc_text[:150] + "..." # Ambil 150 karakter pertama
            })
        
        # Hitung rata-rata
        average_score = total_score / len(hits[0]) if hits[0] else 0
            
        return {"average_score": average_score, "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal mengecek corpus: {e}")
# =================================================================
# Menjalankan Server
# =================================================================
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)



# Cara Run = copy : python -m uvicorn main:app --reload #