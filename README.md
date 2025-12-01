# **Visionary Captions**

**Visionary Captions** is a **React + TypeScript** web application that lets users upload **images** or **sign-language videos** and view automatically generated **English captions**.  
It acts as a modern, responsive **frontend UI** for a separate machine‑learning backend that performs image and sign‑language captioning.

---

## ✨ **Features**

- **Upload media**: Select or drag‑and‑drop images and videos.  
- **Instant preview**: See the uploaded media directly in the browser.  
- **Caption generation**: Send files to a captioning API (image + sign language) and display the returned English captions.  
- **Modern UI**: Built with **Vite**, **React**, **TypeScript**, **Tailwind CSS**, and **shadcn‑ui**.  

---

## 🧱 **Tech Stack**

- **Framework:** React  
- **Language:** TypeScript  
- **Bundler / Dev Server:** Vite  
- **Styling:** Tailwind CSS, PostCSS  
- **UI Components:** shadcn‑ui + custom components  
- **Configuration Files:** `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`  

> 🔎 **Note:** This repository is focused on the **frontend**.  
> The captioning logic (image + sign language) should run in a **backend service** that exposes HTTP APIs.

---

## 📂 **Project Structure**

visionary-captions/   
├── public/ # Static assets     
├── src/ # React + TypeScript source   
├── index.html # Root HTML file     
├── package.json     
├── package-lock.json / bun.lockb     
├── tailwind.config.ts     
├── postcss.config.js     
├── tsconfig.json    
├── tsconfig.app.json      
├── tsconfig.node.json      
├── vite.config.ts   
└── README.md    


**Example `src/` layout** (adapt to your repo):

src/    
├── components/ # Reusable UI components     
├── pages/ # Main pages / routes    
├── hooks/ # Custom React hooks      
├── lib/ # API helpers, utilities    
└── main.tsx # App entry point



---

## 🚀 **Getting Started**

### ✅ Prerequisites

- **Node.js** (LTS recommended)  
- **npm** (or bun/pnpm, depending on your setup)

### 💻 Installation

git clone https://github.com/Yashwanthvarakuti/visionary-captions.git
cd visionary-captions

npm install # or: bun install

text

### 🔐 Environment Variables

Create a `.env` file in the project root and add:

VITE_API_BASE_URL=https://your-backend-url.com

text

In React, access it as:

const baseURL = import.meta.env.VITE_API_BASE_URL;

text

---

## 🧑‍💻 **Development**

npm run dev

text

Open the printed URL (usually `http://localhost:5173/`) in your browser.

---

## 📦 **Build and Preview**

npm run build
npm run preview

text

The optimized static files will be generated in the `dist/` directory.

---

## 🌐 **Connecting to the Captioning Backend**

Expected backend endpoints (change to match your API):

- `POST /api/caption/image` – accepts an **image file** and returns a caption.  
- `POST /api/caption/sign` – accepts a **sign‑language video** and returns a caption/translation.  

In your API helper (for example `src/lib/api.ts`):

- Read `VITE_API_BASE_URL`.  
- Send a `FormData` object containing the uploaded file.  
- Parse the JSON response and display the `caption` (or equivalent) field.

---

## 🚢 **Deployment**

1. Run `npm run build`.  
2. Deploy the `dist/` folder to Vercel, Netlify, GitHub Pages, or any static host.  
3. Ensure `VITE_API_BASE_URL` points to the live backend and CORS is configured correctly.

---

## 🧭 **Roadmap**

- Better loading states and error handling for long caption requests.  
- Support for multiple caption suggestions per media item.  
- History of processed images/videos and captions.  
- Optional authentication and user‑specific caption collections.

---
