import { Link } from 'react-router-dom'
import { Receipt, ArrowLeft } from 'lucide-react'

const LAST_UPDATE = '27 mai 2026'
const APP_NAME = 'FacturaPro'
const CONTACT_EMAIL = 'prevostdylan2106@gmail.com'
const HEBERGEUR = 'Supabase Inc. (AWS eu-west-1 — Irlande, Union Européenne)'

function Section({ id, title, children }) {
  return (
    <section id={id} className="mb-8">
      <h2 className="text-base font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">{title}</h2>
      <div className="space-y-3 text-sm text-gray-600 leading-relaxed">{children}</div>
    </section>
  )
}

export default function CGU() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Receipt size={15} className="text-white" />
            </div>
            <span className="font-bold text-gray-900">{APP_NAME}</span>
          </div>
          <Link
            to="/login"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={14} /> Retour
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">

          {/* Title */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Conditions Générales d'Utilisation &amp; Politique de Confidentialité
            </h1>
            <p className="text-sm text-gray-400 mt-1">Dernière mise à jour : {LAST_UPDATE}</p>
          </div>

          {/* Sommaire */}
          <div className="bg-gray-50 rounded-xl p-4 mb-8 text-xs text-gray-500 space-y-1">
            <p className="font-semibold text-gray-700 mb-2">Sommaire</p>
            {[
              ['#art1', '1. Objet'],
              ['#art2', '2. Accès au service'],
              ['#art3', '3. Description du service'],
              ['#art4', '4. Obligations de l\'utilisateur'],
              ['#art5', '5. Propriété intellectuelle'],
              ['#art6', '6. Limitation de responsabilité'],
              ['#art7', '7. Données personnelles (RGPD)'],
              ['#art8', '8. Sous-traitance des données'],
              ['#art9', '9. Durée et résiliation'],
              ['#art10', '10. Droit applicable'],
            ].map(([href, label]) => (
              <a key={href} href={href} className="block hover:text-indigo-600 transition-colors">{label}</a>
            ))}
          </div>

          {/* ── CGU ── */}
          <Section id="art1" title="Article 1 — Objet">
            <p>
              Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») régissent l'accès et
              l'utilisation de l'application <strong>{APP_NAME}</strong>, accessible en ligne, proposée par
              son éditeur (ci-après « l'Éditeur »).
            </p>
            <p>
              En créant un compte, l'utilisateur reconnaît avoir lu, compris et accepté sans réserve
              les présentes CGU dans leur intégralité.
            </p>
          </Section>

          <Section id="art2" title="Article 2 — Accès au service">
            <p>
              Le service est accessible via Internet. L'utilisateur est responsable de son matériel,
              de sa connexion Internet et de la confidentialité de ses identifiants de connexion.
            </p>
            <p>
              L'Éditeur se réserve le droit de suspendre l'accès au service pour maintenance ou en cas
              de violation des présentes CGU, sans préavis ni indemnité.
            </p>
          </Section>

          <Section id="art3" title="Article 3 — Description du service">
            <p>
              {APP_NAME} est un logiciel de facturation en ligne permettant notamment de :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Créer, gérer et envoyer des factures et devis</li>
              <li>Gérer un carnet de clients</li>
              <li>Générer des PDF conformes à la réglementation française</li>
              <li>Suivre les paiements et les relances</li>
            </ul>
            <p>
              L'Éditeur se réserve le droit de faire évoluer les fonctionnalités à tout moment.
            </p>
          </Section>

          <Section id="art4" title="Article 4 — Obligations de l'utilisateur">
            <p>L'utilisateur s'engage à :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Fournir des informations exactes lors de la création de son compte</li>
              <li>Ne pas utiliser le service à des fins illicites ou frauduleuses</li>
              <li>Ne pas tenter de pirater, contourner ou perturber le service</li>
              <li>Ne pas céder, revendre ou sous-licencier l'accès au service à des tiers</li>
              <li>
                S'assurer de la conformité légale des factures et documents qu'il émet — la
                responsabilité de leur contenu lui incombe entièrement
              </li>
            </ul>
          </Section>

          <Section id="art5" title="Article 5 — Propriété intellectuelle">
            <p>
              L'ensemble des éléments constituant le service {APP_NAME} (code source, design, logo,
              textes, fonctionnalités) sont la propriété exclusive de l'Éditeur et sont protégés par
              les lois françaises et internationales relatives à la propriété intellectuelle.
            </p>
            <p>
              Toute reproduction, modification, distribution ou exploitation sans autorisation écrite
              préalable de l'Éditeur est strictement interdite.
            </p>
          </Section>

          <Section id="art6" title="Article 6 — Limitation de responsabilité">
            <p>
              Le service est fourni <strong>« en l'état »</strong>, sans garantie d'aucune sorte,
              expresse ou implicite.
            </p>
            <p>
              L'Éditeur ne saurait être tenu responsable :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Des erreurs ou omissions dans les documents générés par l'utilisateur</li>
              <li>
                De la non-conformité fiscale ou légale des factures émises (l'utilisateur est seul
                responsable du respect de ses obligations légales)
              </li>
              <li>Des pertes de données liées à des défaillances techniques indépendantes de sa volonté</li>
              <li>Des interruptions temporaires de service pour maintenance</li>
              <li>
                De tout préjudice indirect, perte d'exploitation, perte de chiffre d'affaires ou perte
                de données résultant de l'utilisation ou de l'impossibilité d'utiliser le service
              </li>
            </ul>
            <p>
              En tout état de cause, la responsabilité de l'Éditeur ne pourra excéder le montant
              versé par l'utilisateur au cours des 12 derniers mois précédant le sinistre.
            </p>
          </Section>

          {/* ── RGPD ── */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-1">
              Politique de confidentialité — RGPD
            </p>
            <p className="text-xs text-indigo-600">
              Conformément au Règlement Général sur la Protection des Données (UE) 2016/679 et à la
              loi Informatique et Libertés.
            </p>
          </div>

          <Section id="art7" title="Article 7 — Données personnelles (RGPD)">
            <p className="font-medium text-gray-700">7.1 Responsable du traitement</p>
            <p>
              L'Éditeur de {APP_NAME} est responsable du traitement de vos données personnelles.
              Contact : <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600 underline">{CONTACT_EMAIL}</a>
            </p>

            <p className="font-medium text-gray-700 mt-4">7.2 Données collectées</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Données de compte :</strong> adresse email, mot de passe (chiffré)</li>
              <li>
                <strong>Données de profil :</strong> nom, prénom, raison sociale, adresse, SIRET, numéro
                de TVA, logo
              </li>
              <li>
                <strong>Données métier :</strong> factures, devis, avoirs, informations clients (noms,
                adresses, emails, SIRET)
              </li>
              <li><strong>Données techniques :</strong> logs de connexion, adresse IP</li>
            </ul>

            <p className="font-medium text-gray-700 mt-4">7.3 Finalités du traitement</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Fourniture et amélioration du service de facturation</li>
              <li>Authentification et sécurité des comptes</li>
              <li>Gestion de la relation client</li>
              <li>Respect des obligations légales</li>
            </ul>

            <p className="font-medium text-gray-700 mt-4">7.4 Durée de conservation</p>
            <p>
              Les données sont conservées pendant toute la durée d'activité du compte, puis pendant
              <strong> 10 ans</strong> à compter de la clôture pour respecter les obligations comptables
              et fiscales françaises (art. L. 123-22 Code de commerce).
            </p>

            <p className="font-medium text-gray-700 mt-4">7.5 Vos droits</p>
            <p>
              Conformément au RGPD, vous disposez des droits suivants sur vos données :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Accès</strong> — obtenir une copie de vos données</li>
              <li><strong>Rectification</strong> — corriger des données inexactes</li>
              <li><strong>Effacement</strong> — demander la suppression de votre compte et données</li>
              <li><strong>Portabilité</strong> — recevoir vos données dans un format structuré (CSV)</li>
              <li><strong>Opposition</strong> — vous opposer à certains traitements</li>
            </ul>
            <p>
              Pour exercer ces droits : <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600 underline">{CONTACT_EMAIL}</a>.
              Réponse sous 30 jours. En cas de litige, vous pouvez saisir la{' '}
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">CNIL</a>.
            </p>
          </Section>

          <Section id="art8" title="Article 8 — Sous-traitance des données (DPA)">
            <p>
              En tant que fournisseur du service, l'Éditeur agit en qualité de{' '}
              <strong>sous-traitant</strong> au sens du RGPD pour les données des clients de l'utilisateur.
              L'utilisateur est le <strong>responsable du traitement</strong> de ces données.
            </p>

            <p className="font-medium text-gray-700 mt-4">Hébergement des données</p>
            <p>
              Les données sont hébergées par : <strong>{HEBERGEUR}</strong>.
              Les données restent dans l'Union Européenne, conformément au RGPD.
            </p>

            <p className="font-medium text-gray-700 mt-4">Engagements de l'Éditeur (sous-traitant)</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Ne traiter les données que sur instruction documentée de l'utilisateur</li>
              <li>Garantir la confidentialité des personnes autorisées à traiter les données</li>
              <li>Mettre en œuvre les mesures de sécurité appropriées (chiffrement, accès restreint)</li>
              <li>Ne pas sous-traiter sans accord préalable de l'utilisateur</li>
              <li>
                Aider l'utilisateur à répondre aux demandes d'exercice des droits des personnes concernées
              </li>
              <li>Supprimer toutes les données à la fin de la relation contractuelle, sur demande</li>
            </ul>

            <p className="font-medium text-gray-700 mt-4">Engagements de l'utilisateur (responsable du traitement)</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                S'assurer d'avoir une base légale pour traiter les données personnelles de ses propres
                clients (consentement, contrat, etc.)
              </li>
              <li>Informer ses propres clients de l'utilisation de {APP_NAME}</li>
            </ul>
          </Section>

          <Section id="art9" title="Article 9 — Durée et résiliation">
            <p>
              Les présentes CGU sont conclues pour une durée indéterminée à compter de la création du
              compte.
            </p>
            <p>
              L'utilisateur peut résilier à tout moment en supprimant son compte depuis les paramètres
              de l'application ou en contactant{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600 underline">{CONTACT_EMAIL}</a>.
            </p>
            <p>
              L'Éditeur se réserve le droit de résilier unilatéralement l'accès en cas de violation
              des présentes CGU, avec ou sans préavis selon la gravité.
            </p>
          </Section>

          <Section id="art10" title="Article 10 — Droit applicable et juridiction compétente">
            <p>
              Les présentes CGU sont soumises au <strong>droit français</strong>.
            </p>
            <p>
              En cas de litige, les parties s'engagent à rechercher une solution amiable avant toute
              action judiciaire. À défaut, les tribunaux français seront seuls compétents.
            </p>
          </Section>

          {/* Footer */}
          <div className="pt-6 border-t border-gray-100 text-xs text-gray-400 text-center space-y-1">
            <p>© 2026 {APP_NAME} — Tous droits réservés</p>
            <p>Contact : <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-gray-600">{CONTACT_EMAIL}</a></p>
          </div>
        </div>
      </div>
    </div>
  )
}
