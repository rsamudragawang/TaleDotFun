# Installation Guide

Welcome to **TaleDotFun**! Follow these steps to set up the project locally for development or testing.

---

## Prerequisites

- **Node.js** (v16+ recommended): [Download Node.js](https://nodejs.org/)
- **Yarn** or **npm**: [Yarn](https://yarnpkg.com/) | [npm](https://www.npmjs.com/)
- **Solana CLI**: [Install Guide](https://docs.solana.com/cli/install-solana-cli-tools)
- **Anchor CLI**: [Install Guide](https://book.anchor-lang.com/chapter_2/installation.html)
- **MongoDB** (local or Atlas): [MongoDB Download](https://www.mongodb.com/try/download/community)
- **Pinata Account** (for IPFS): [Pinata](https://pinata.cloud/)
- **Vercel Account** (for deployment): [Vercel](https://vercel.com/)

---

## 1. Clone the Repository

```bash
git clone https://github.com/yourusername/taledotfun.git
cd taledotfun
```

---

## 2. Install Dependencies

### Frontend
```bash
cd app
npm install # or yarn install
```

### Backend
```bash
cd ../backend
npm install # or yarn install
```

---

## 3. Environment Variables

### Frontend (`app/.env` or `app/.env.local`)
```
VITE_RPC_ENDPOINT=https://api.devnet.solana.com
VITE_APP_AUTH_API_URL=http://localhost:3000/api
```

### Backend (`backend/.env`)
```
MONGODB_URI=mongodb://localhost:27017/taledotfun
JWT_SECRET=your_jwt_secret
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_API_KEY=your_pinata_secret
```

---

## 4. Running the Backend

```bash
cd backend
npm run dev # or yarn dev
```
- The backend should run on [http://localhost:3000](http://localhost:3000)

---

## 5. Running the Frontend

```bash
cd app
npm run dev # or yarn dev
```
- The frontend should run on [http://localhost:5173](http://localhost:5173) (Vite default)

---

## 6. Deploying

- **Frontend:** Deploy the `app` folder to [Vercel](https://vercel.com/) (recommended) or your preferred static host.
- **Backend:** Deploy the `backend` folder to Vercel, Heroku, or your preferred Node.js host.
- **Solana Programs:** Deploy using Anchor CLI to your chosen Solana cluster (devnet/mainnet).

---

## Troubleshooting
- **Solana CLI Issues:** Ensure your CLI is on the correct version and your wallet is funded (devnet SOL).
- **MongoDB Connection:** Make sure MongoDB is running locally or update the URI for Atlas.
- **CORS/Proxy Issues:** Adjust CORS settings in the backend if accessing from a different domain.
- **.env Not Loaded:** Double-check your environment variable files and restart the dev servers after changes.

---

## Useful Links
- [Solana Docs](https://docs.solana.com/)
- [Anchor Book](https://book.anchor-lang.com/)
- [Metaplex Docs](https://docs.metaplex.com/)
- [PrimeVue Docs](https://primevue.org/)
- [Vercel Docs](https://vercel.com/docs)
- [Pinata Docs](https://docs.pinata.cloud/)

---

## Need Help?
Open an issue or contact the maintainer for support. 