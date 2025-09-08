# 🏠 Stellar Stake House

![Stellar Stake House Logo](./frontend/src/assets/logo.svg)

A revolutionary staking platform on the Stellar network that allows users to stake tokens and earn rewards securely and transparently.

## 🌐 Language / Idioma

- **English** (Default)
- [Português (Brasil)](./README.pt-br.md)

## 📚 Complete Documentation

- [📋 Quick Verification](./QUICK-VERIFICATION.md) - System status check
- [🚀 Deployment Tutorial](./DEPLOYMENT-TUTORIAL.md) - Complete deployment guide
- [🗄️ Supabase Guide](./SUPABASE-GUIDE.md) - Database configuration
- [⚙️ Contract Deployment Guide](./CONTRACT-DEPLOYMENT-GUIDE.md) - Smart contracts setup
- [📊 Complete Integration Analysis](./COMPLETE-INTEGRATION-ANALYSIS.md) - Technical analysis

## 🌟 Features

- ✅ **Secure Staking**: Staking system based on Stellar Soroban smart contracts
- ✅ **Automatic Rewards**: Automatic reward distribution based on daily snapshots
- ✅ **Intuitive Interface**: Modern and responsive dashboard with integrated logo
- ✅ **Multi-Wallet Support**: Support for Freighter, Albedo, and passkey authentication
- ✅ **Total Transparency**: Complete history of transactions and rewards
- ✅ **Pool Marketplace**: Project owners can create custom reward pools
- ✅ **Real-time Analytics**: Detailed metrics and real-time performance insights
- ✅ **Soroban Smart Contracts**: Decentralized and secure execution on testnet
- ✅ **Advanced Pool System**: Pool creation and management with configurable APY
- ✅ **Complete Blockchain Integration**: Directly connected to deployed Stellar contracts
- ✅ **Modern Interface**: Responsive UI built with React and TailwindCSS
- ✅ **Advanced Security**: Implementation of security best practices
- ✅ **Multi-language Support**: English (default) and Portuguese (Brazil)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Stellar wallet (Freighter or Albedo)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/stellar-stake-house.git
cd stellar-stake-house

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your configurations

# Start development servers
npm run dev
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3002
- **Database**: Supabase (configured)

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Supabase      │
│   React + Vite  │◄──►│  Node.js + API  │◄──►│   PostgreSQL    │
│   Port: 3000    │    │   Port: 3002    │    │   Cloud DB      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Stellar Network │    │ Soroban Contract│    │   Analytics     │
│ Testnet/Mainnet │    │ Pool Management │    │   Dashboard     │
│ Freighter/Albedo│    │ CCSDD...HSXY    │    │   Real-time     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Router** - Navigation
- **Lucide React** - Icons
- **i18n** - Internationalization

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **Supabase** - Database and authentication
- **Stellar SDK** - Blockchain integration

### Blockchain
- **Stellar Network** - Blockchain platform
- **Soroban** - Smart contracts
- **Freighter/Albedo** - Wallet integration

## 📱 Features Overview

### For Users
- Connect Stellar wallets (Freighter, Albedo, Passkey)
- Stake tokens in available pools
- Earn proportional rewards
- View detailed analytics and history
- Multi-language interface

### For Project Owners
- Create custom reward pools
- Manage pool parameters (APY, duration, rewards)
- Monitor pool performance
- Access advanced analytics

### For Developers
- Complete REST API
- Smart contract integration
- Comprehensive documentation
- Multi-environment support

## 🔧 Configuration

### Environment Variables

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3002
VITE_STELLAR_NETWORK=testnet
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_POOL_REWARDS_CONTRACT_ID=CCSDDTQSALKJQ2SXXBS2VUSYD74QDHG22KFZRHMHTOCWDCMKO7JVHSXY
```

#### Backend (.env)
```env
PORT=3002
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STELLAR_NETWORK=testnet
POOL_REWARDS_CONTRACT_ID=CCSDDTQSALKJQ2SXXBS2VUSYD74QDHG22KFZRHMHTOCWDCMKO7JVHSXY
```

## 🧪 Testing

```bash
# Run frontend tests
cd frontend
npm test

# Run backend tests
cd backend
npm test

# Run integration tests
npm run test:integration
```

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Or deploy to Netlify
netlify deploy --prod
```

### Backend (Railway/Heroku)
```bash
# Deploy to Railway
railway deploy

# Or deploy to Heroku
git push heroku main
```

## 📊 Current Status

- ✅ **Frontend**: 100% functional with multi-language support
- ✅ **Backend**: All APIs working correctly
- ✅ **Database**: Supabase configured and operational
- ✅ **Smart Contracts**: Deployed on Stellar testnet
- ✅ **Documentation**: Complete and updated
- ✅ **Internationalization**: English and Portuguese support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: [Coming Soon]
- **Documentation**: [GitHub Wiki]
- **Smart Contract**: [Stellar Expert](https://stellar.expert/explorer/testnet/contract/CCSDDTQSALKJQ2SXXBS2VUSYD74QDHG22KFZRHMHTOCWDCMKO7JVHSXY)
- **Support**: [GitHub Issues]

## 🙏 Acknowledgments

- Stellar Development Foundation
- Soroban smart contracts platform
- React and Vite communities
- All contributors and testers

---

**Built with ❤️ on the Stellar Network**

*Last updated: January 2024*
