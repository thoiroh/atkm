// Structure complète pour ATK Bash Component
// À créer dans : src/app/shared/components/atk-bash/

/*
📁 src/app/shared/components/atk-bash/
├── 📄 index.ts                          // Barrel export
├── 📄 atk-bash.interfaces.ts            // Types et interfaces
├── 📄 atk-bash.service.ts               // Service de gestion
├── 📄 atk-bash.component.ts             // Composant principal
├── 📄 atk-bash.component.html           // Template
├── 📄 atk-bash.component.css            // Styles
├── 📄 atk-bash-config.factory.ts        // Factory pour les configs
└── 📁 pipes/
    ├── 📄 balance-format.pipe.ts        // Formatage des balances crypto
    ├── 📄 crypto-precision.pipe.ts      // Précision crypto adaptative
    └── 📄 status-badge.pipe.ts          // Badges de statut

📁 src/assets/config/bash-configs/
├── 📄 bash.config.json                  // Config principale
├── 📄 bash.config.binance.json          // Config spécifique Binance
└── 📄 bash.config.ibkr.json             // Config future IBKR
*/

// ========================================
// 1. index.ts - Barrel export
// ========================================
export * from './atk-bash.interfaces';
export * from './atk-bash.service';
export * from './atk-bash.component';
export * from './atk-bash-config.factory';
export * from '@shared/pipes/balance-format.pipe';
export * from '@shared/pipes/crypto-precision.pipe';
export * from '@shared/pipes/status-badge.pipe';
