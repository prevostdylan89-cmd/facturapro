# Guide de configuration Supabase

## 1. Créer votre projet Supabase

Rendez-vous sur [supabase.com](https://supabase.com) et créez un nouveau projet.

## 2. Récupérer les clés API

Dans **Project Settings → API** :
- Copiez l'**URL** du projet
- Copiez la clé **anon / public**

Renseignez-les dans `.env.local` :
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## 3. Exécuter le script SQL

1. Ouvrez le **SQL Editor** dans votre dashboard Supabase
2. Cliquez sur **New query**
3. Copiez-collez intégralement le contenu du fichier `supabase_setup.sql`
4. Cliquez sur **Run**

Ce script crée :
- Les tables `profiles`, `clients`, `invoices`, `invoice_items`, `invoice_settings`
- Les politiques RLS sur toutes les tables
- Le trigger d'auto-création de profil à l'inscription
- La fonction `get_next_invoice_number` pour la numérotation automatique
- Le bucket de stockage `logos` pour les logos d'entreprise

## 4. Vérifier la configuration

Après exécution du script, vérifiez dans **Table Editor** que les tables suivantes existent :
- `profiles`
- `clients`
- `invoices`
- `invoice_items`
- `invoice_settings`

Dans **Storage**, vérifiez que le bucket **logos** est présent et public.

## 5. Configuration de l'authentification

Dans **Authentication → Email** :
- Activez **Confirm email** selon vos besoins
- Pour un environnement de développement, vous pouvez désactiver la confirmation email

## 6. Variables d'environnement pour Cloudflare Pages

Si vous déployez sur Cloudflare Pages :
1. Allez dans **Settings → Environment variables**
2. Ajoutez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
3. Redéployez

## Résolution des problèmes courants

**"relation does not exist"** → Le script SQL n'a pas été exécuté ou a échoué partiellement.

**"new row violates row-level security"** → Assurez-vous d'être connecté (auth.uid() non null).

**Logo ne s'upload pas** → Vérifiez que le bucket `logos` est bien créé et public dans Storage.

**Numérotation ne fonctionne pas** → Vérifiez que la fonction `get_next_invoice_number` est bien créée (SQL Editor → Functions).
