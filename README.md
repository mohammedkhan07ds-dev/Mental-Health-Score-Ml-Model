# 🧠 Mental Health Score Prediction — Machine Learning

A machine learning web application designed to predict mental health scores based on user-provided parameters. The project combines a web-based frontend with a Python backend that serves a trained machine learning model.

> **Development Status:** The frontend is still under development. The interface and user experience may continue to change as new improvements are implemented.

## 🚀 Live Application

- **Frontend:** Hosted on Vercel
- **Backend API:** Hosted on Render

*Add your actual Vercel frontend URL and Render backend URL above when available.*

## ✨ Features

- Machine learning-based mental health score prediction
- Interactive web interface for entering prediction parameters
- Python backend for processing requests and generating predictions
- Integration between the frontend and backend through API requests
- Responsive UI design with ongoing frontend improvements

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | Python, FastAPI |
| Machine Learning | Scikit-learn |
| Model Storage | Pickle (`.pkl`) |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
| Version Control | Git and GitHub |

## 📂 Project Structure

```text
Mental-Health-Score-ML-Model/
├── Frontend/
│   ├── Index.html
│   ├── Script.js
│   └── Style.css
├── main.py
├── Mental_Health_Model.pkl
├── ML_PROJECT.ipynb
├── requirements.txt
└── README.md
```

*Note: Update the filenames in this structure if your actual GitHub files use different capitalization or names.*

## ⚙️ How It Works

1. The user opens the frontend website hosted on Vercel.
2. The user enters the required parameters.
3. The frontend sends the input data to the backend API hosted on Render.
4. The backend validates and processes the inputs.
5. The trained machine learning model generates a prediction.
6. The backend returns the result to the frontend for display.

## 💻 Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/mohammedkhan07ds-dev/Mental-Health-Score-ML-Model.git
cd Mental-Health-Score-ML-Model
```

### 2. Create a virtual environment

```bash
python -m venv .venv
```

Activate it on Windows:

```bash
.venv\Scripts\activate
```

### 3. Install dependencies

```bash
python -m pip install -r requirements.txt
```

### 4. Start the backend

```bash
uvicorn main:app --reload
```

If your FastAPI application uses a different ASGI application variable, adjust the command accordingly.

The backend will typically be available at:

`http://127.0.0.1:8000`

If enabled, explore the API documentation at:

`http://127.0.0.1:8000/docs`

### 5. Open the frontend

Open the frontend HTML file in your browser or use a local development server. Ensure the JavaScript API URL points to your locally running backend.

## 🌐 Deployment

### Frontend — Vercel

The frontend is deployed on Vercel. HTML, CSS, and JavaScript files provide the user interface and communicate with the backend API.

### Backend — Render

The backend is deployed on Render. It hosts the FastAPI application, loads the trained machine learning model, and processes prediction requests.

**Important:** Configure the backend's CORS settings to allow requests from the deployed Vercel domain. Keep private credentials and server-side configuration out of frontend code.

## 🔮 Future Improvements

- Continue refining the frontend design and responsiveness
- Improve form validation and error handling
- Enhance loading indicators and prediction result presentation
- Improve API reliability and deployment performance
- Add model evaluation details and project documentation

## ⚠️ Disclaimer

This project is intended for educational and machine learning demonstration purposes. Its predictions are not a clinical diagnosis and should not replace professional mental health assessment or advice.

## 👨‍💻 Developer

**Mohammed Khan**

- Email: [mohammedkhan07ds@gmail.com](mailto:mohammedkhan07ds@gmail.com)
- LinkedIn: [Mohammed Khan](https://www.linkedin.com/in/mohammed-khan-670114422/)

Interested in AI, machine learning, and building practical software projects.

> "Great ideas start with curiosity, become reality through code, and grow when we build together."

**Let's connect, collaborate, and build cool things together!**

---

*Built with curiosity and a passion for AI.* and should not be used as a substitute for professional medical advice. Consult a qualified healthcare professional for medical concerns.

---

⭐ If you find this project interesting, consider giving the repository a star!
