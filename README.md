# FacturaPro

Application SaaS de génération de factures professionnelles.

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 19 + Vite |
| Styles | Tailwind CSS v4 |
| Auth & BDD | Supabase (PostgreSQL + RLS) |
| Storage | Supabase Storage |
| PDF | jsPDF + jspdf-autotable |
| Routing | React Router v7 |
| Icônes | Lucide React |
| Déploiement | Cloudflare Pages |

## Fonctionnalités

- Authentification (inscription / connexion) via Supabase Auth
- **Dashboard** — CA du mois, stats par statut, graphique 6 mois
- **Factures** — création, édition, duplication, statuts (brouillon/envoyée/payée/retard)
- **PDF** — génération et téléchargement de factures professionnelles
- **Aperçu temps réel** — preview HTML pendant la saisie
- **Clients** — CRUD complet avec historique et total facturé
- **Paramètres** — profil entreprise, logo, préfixe, pied de page
- **Page publique** — partage d'une facture via URL (`/facture/:id`)
- Design responsive (sidebar mobile / desktop)

## Installation locale

```bash
# 1. Cloner le repo
git clone https://github.com/votre-username/facturapro.git
cd facturapro

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
# Créer .env.local avec :
# VITE_SUPABASE_URL=https://xxxx.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJ...

# 4. Configurer Supabase (voir SETUP_GUIDE.md)

# 5. Lancer en développement
npm run dev
```

## Déploiement Cloudflare Pages

1. Connectez votre repo GitHub à Cloudflare Pages
2. Commande de build : `npm run build`
3. Dossier de sortie : `dist`
4. Ajoutez les variables d'environnement dans les paramètres Cloudflare

## Structure du projet

```
src/
├── components/
│   ├── layout/      Sidebar, Header, Layout
│   ├── invoice/     InvoiceForm, InvoicePreview, InvoiceCard, InvoiceList, InvoicePDF
│   ├── clients/     ClientCard, ClientForm, ClientList
│   └── ui/          Button, Input, Modal, Badge, Table
├── pages/           Login, Dashboard, Invoices, NewInvoice, Clients, Settings, PublicInvoice
├── hooks/           useAuth, useInvoices, useClients
└── lib/             supabase, pdfGenerator, invoiceHelpers
```
