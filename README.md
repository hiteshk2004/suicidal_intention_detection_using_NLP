# Suicidal Intention Detection System

A comprehensive Mental Health Assessment tool utilizing Advanced NLP (BERT, RoBERTa, DistilBERT) and Google Gemini AI to detect suicidal ideation and provide immediate crisis intervention.

## 🌟 Features

*   **Dual-Core Analysis**: Combines specific BERT-based suicide detection with the empathetic reasoning of Google Gemini.
*   **Real-Time Assessment**: Interactive React-based frontend for user assessment.
*   **Crisis Intervention**: Immediate detection of high-risk patterns.
*   **Automated Alerts**: Integration with WhatsApp (via `pywhatkit`) to notify guardians in critical situations.
*   **Indian Helpline Support**: Direct integration with AASRA (91-9820466726).

## 🛠️ Tech Stack

### Frontend
*   **React 18** (TypeScript)
*   **Tailwind CSS** (Styling)
*   **Lucide React** (Icons)
*   **Recharts** (Data Visualization)

### Backend (Python)
*   **PyTorch**: Deep learning framework.
*   **Transformers (Hugging Face)**: BERT/RoBERTa model implementation.
*   **Gradio**: Standalone Python UI for local testing.
*   **Flask**: API server for backend communication.
*   **PyWhatKit**: Automation for WhatsApp alerts.

## 🚀 Getting Started

### 1. Web Application (Frontend)
The web interface is built with React.
```bash
npm install
npm start
```

### 2. Python Backend & Automation
To enable real BERT analysis and WhatsApp alerts, you must run the Python environment.

**Prerequisites:**
*   Python 3.8+
*   GPU recommended (CUDA) but works on CPU.

**Installation:**
```bash
pip install -r requirements.txt
```

**Running the Standalone App:**
```bash
python gradio_app.py
```

**Running the API Server:**
```bash
python backend/api.py
```

## ⚠️ Medical Disclaimer
This tool is for **educational and supportive purposes only**. It is **not** a diagnostic tool. In case of emergency, please contact local emergency services immediately.
