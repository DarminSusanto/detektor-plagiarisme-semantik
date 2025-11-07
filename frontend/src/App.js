import React, { useState, useRef } from 'react';
import axios from 'axios';
import './App.css'; // Pastikan ini ada
import {
  FileCheck,
  GitCompareArrows,
  Search,
  Loader2,
  AlertTriangle,
  UploadCloud,
  ChevronDown, // <-- Ikon baru untuk dropdown
} from 'lucide-react';

// URL Backend API Anda
const API_URL = "http://localhost:8000";

// Komponen Header
const Header = () => (
  <header className="header">
    <div className="header-content">
      <FileCheck className="header-icon" aria-hidden="true" />
      <div>
        <h1 className="header-title">Detektor Plagiarisme Semantik</h1>
        <p className="header-subtitle">
          Analisis kemiripan berdasarkan makna (Sentence-BERT).
        </p>
      </div>
    </div>
  </header>
);

// Komponen Footer
const Footer = () => (
  <footer className="footer">
    Didukung oleh FastAPI, React, dan Sentence-Transformers.
  </footer>
);

// Komponen Skor (untuk hasil perbandingan)
const SimilarityScore = ({ score }) => {
  const getScoreColor = () => {
    if (score >= 70) return 'score-high';
    if (score >= 40) return 'score-medium';
    return 'score-low';
  };

  return (
    <div className="similarity-result">
      <h3 className="result-title">Tingkat Kemiripan</h3>
      <div className={`result-score ${getScoreColor()}`}>
        {score.toFixed(2)}%
      </div>
    </div>
  );
};

// =================================================================
// BARU: Komponen Skor Rata-Rata (untuk Corpus)
// =================================================================
const OverallScore = ({ score }) => {
  const getScoreColor = () => {
    if (score >= 70) return 'score-high';
    if (score >= 40) return 'score-medium';
    return 'score-low';
  };

  return (
    <div className="overall-score-wrapper">
      <h3 className="result-title">Skor Plagiarisme Rata-Rata</h3>
      <p>(Berdasarkan 5 dokumen teratas yang paling mirip)</p>
      <div className={`result-score ${getScoreColor()}`}>
        {score.toFixed(2)}%
      </div>
    </div>
  );
};


// Komponen Tabel (untuk hasil corpus)
const CorpusTable = ({ results }) => (
  <div className="corpus-result-wrapper">
    {/* Judul ini dipindah ke <summary> */}
    {/* <h3 className="result-title">Hasil Pengecekan Terhadap Corpus</h3> */}
    <div className="table-container">
      <table className="result-table">
        <thead>
          <tr>
            <th>Dokumen</th>
            <th>Kemiripan</th>
            <th>Pratinjau Teks (150 karakter pertama)</th>
          </tr>
        </thead>
        <tbody>
          {/* Filter untuk hanya menampilkan skor di atas ambang batas tertentu, misal 20% */}
          {results.filter(item => item.similarity > 20).map((item) => (
            <tr key={item.document_name}>
              <td className="table-cell-doc">{item.document_name}</td>
              <td
                className={`table-cell-score ${
                  item.similarity >= 70
                    ? 'score-high'
                    : item.similarity >= 40
                    ? 'score-medium'
                    : 'score-low'
                }`}
              >
                {item.similarity.toFixed(2)}%
              </td>
              <td className="table-cell-preview">{item.preview_text}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Komponen Input Gabungan (Textarea + Tombol Upload)
const CombinedInput = ({ text, setText, onFileChange, fileInputRef, placeholder }) => (
  <div className="combined-input-wrapper">
    <textarea
      className="text-input"
      value={text}
      onChange={(e) => setText(e.target.value)}
      placeholder={text ? "" : placeholder} // Sembunyikan placeholder jika ada teks
    />
    {/* Tombol Upload Overlay, hanya muncul jika textarea kosong */}
    {!text && (
      <div className="upload-button-overlay">
        <button
          type="button"
          className="upload-button"
          onClick={() => fileInputRef.current.click()}
        >
          <UploadCloud className="icon" />
          Unggah File
        </button>
        <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>
          (.txt atau .docx)
        </span>
        {/* Input file yang tersembunyi */}
        <input
          type="file"
          ref={fileInputRef}
          className="file-input-hidden"
          accept=".txt,.docx"
          onChange={onFileChange}
        />
      </div>
    )}
  </div>
);

// Komponen Aplikasi Utama
function App() {
  const [mode, setMode] = useState('compare'); // 'compare' or 'check'
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(null); // null, 'extract', 'check'
  const [error, setError] = useState('');

  // Refs untuk input file yang tersembunyi
  const fileInputRef1 = useRef(null);
  const fileInputRef2 = useRef(null);

  // Fungsi untuk menangani perubahan file (TXT atau DOCX)
  const handleFileChange = async (event, setText) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setLoading('extract'); // Set status loading ekstraksi
    setError('');
    setResult(null);

    try {
      const response = await axios.post(`${API_URL}/api/extract-text`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setText(response.data.text);
    } catch (err) {
      console.error('Error extracting text:', err);
      setError(
        err.response?.data?.detail || 'Gagal mengekstrak teks dari file.'
      );
    } finally {
      setLoading(null);
      // Reset input file agar bisa upload file yang sama lagi
      if (event.target) event.target.value = null;
    }
  };

  // Fungsi untuk membandingkan dua teks
  const handleCompare = async () => {
    if (!text1 || !text2) {
      setError('Harap isi kedua kolom teks.');
      return;
    }
    setLoading('check');
    setError('');
    setResult(null);

    try {
      const response = await axios.post(`${API_URL}/api/compare-text`, {
        text1: text1,
        text2: text2,
      });
      setResult({ type: 'compare', data: response.data });
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(null);
    }
  };

  // Fungsi untuk mengecek teks dengan corpus
  const handleCheck = async () => {
    if (!text1) {
      setError('Harap isi kolom teks.');
      return;
    }
    setLoading('check');
    setError('');
    setResult(null);

    try {
      const response = await axios.post(`${API_URL}/api/check-text`, {
        text: text1,
      });
      // Set hasil dengan data baru (termasuk average_score)
      setResult({ type: 'check', data: response.data });
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(null);
    }
  };

  // Handler error API terpusat
  const handleApiError = (err) => {
    console.error('API Error:', err);
    if (err.response) {
      setError(`Gagal: ${err.response.data.detail || err.response.statusText}`);
    } else if (err.request) {
      setError('Gagal: Tidak dapat terhubung ke server. Pastikan server berjalan.');
    } else {
      setError(`Gagal: Terjadi kesalahan. ${err.message}`);
    }
  };

  // Fungsi untuk menghitung kata
  const countWords = (str) => {
    if (!str.trim()) return 0;
    return str.trim().split(/\s+/).length;
  };

  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        <div className="card">
          <div className="card-content">
            {/* Pemilih Mode */}
            <div className="mode-selector-wrapper">
              <div className="mode-selector">
                <button
                  className={`mode-button ${mode === 'compare' ? 'active' : ''}`}
                  onClick={() => {
                    setMode('compare');
                    setResult(null);
                    setError('');
                  }}
                >
                  <GitCompareArrows className="icon" />
                  Bandingkan Dua Teks
                </button>
                <button
                  className={`mode-button ${mode === 'check' ? 'active' : ''}`}
                  onClick={() => {
                    setMode('check');
                    setResult(null);
                    setError('');
                  }}
                >
                  <Search className="icon" />
                  Cek dengan Corpus
                </button>
              </div>
            </div>

            {/* Area Input */}
            <div className={mode === 'compare' ? 'input-grid' : 'input-grid-single'}>
              {/* Teks Input 1 */}
              <div className="text-input-wrapper">
                <CombinedInput
                  text={text1}
                  setText={setText1}
                  onFileChange={(e) => handleFileChange(e, setText1)}
                  fileInputRef={fileInputRef1}
                  placeholder={
                    mode === 'compare'
                      ? 'Tempel teks pertama di sini...'
                      : 'Tempel teks yang ingin dicek di sini...'
                  }
                />
                <span className="word-count">Jumlah Kata: {countWords(text1)}</span>
              </div>

              {/* Teks Input 2 (Hanya mode 'compare') */}
              {mode === 'compare' && (
                <div className="text-input-wrapper">
                  <CombinedInput
                    text={text2}
                    setText={setText2}
                    onFileChange={(e) => handleFileChange(e, setText2)}
                    fileInputRef={fileInputRef2}
                    placeholder="Tempel teks kedua di sini..."
                  />
                  <span className="word-count">Jumlah Kata: {countWords(text2)}</span>
                </div>
              )}
            </div>

            {/* Tombol Aksi */}
            <div className="action-button-wrapper">
              <button
                className="action-button"
                onClick={mode === 'compare' ? handleCompare : handleCheck}
                disabled={loading !== null}
              >
                {loading === 'extract' && (
                  <>
                    <Loader2 className="icon-spin" /> Menganalisis File...
                  </>
                )}
                {loading === 'check' && (
                  <>
                    <Loader2 className="icon-spin" /> Memeriksa Kemiripan...
                  </>
                )}
                {loading === null && (
                  <>
                    {mode === 'compare' ? 'Bandingkan Teks' : 'Cek dengan Corpus'}
                  </>
                )}
              </button>
            </div>

            {/* Tampilan Error */}
            {error && (
              <div className="error-message">
                <AlertTriangle className="icon" />
                <div>
                  <span className="error-title">Terjadi Kesalahan</span>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {/* Tampilan Hasil */}
            {result && (
              <>
                {/* Hasil Mode Compare */}
                {result.type === 'compare' && (
                  <SimilarityScore score={result.data.similarity} />
                )}
                
                {/* Hasil Mode Check (BARU) */}
                {result.type === 'check' && (
                  <div className="check-results">
                    {/* 1. Tampilkan Skor Rata-Rata */}
                    <OverallScore score={result.data.average_score} />
                    
                    {/* 2. Tampilkan Dropdown untuk Rincian */}
                    <details className="result-dropdown">
                      <summary>
                        Lihat Rincian Perbandingan
                        <ChevronDown className="icon dropdown-icon" />
                      </summary>
                      <CorpusTable results={result.data.results} />
                    </details>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default App;

