"use client";

import Link from "next/link";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { Footer } from "@/components/landing/Footer";
import { useThemedLogoSrc } from "@/hooks/useThemedLogoSrc";

const LAST_UPDATED = "12 juillet 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold mb-3">{title}</h2>
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}

/**
 * Politique de confidentialité — contenu en français uniquement (pas de
 * next-intl) : c'est une notice RGPD/CNIL, spécifique à la juridiction
 * française, pas une surface produit bilingue. Rédigée à partir de la base
 * factuelle de COMPLIANCE.md (racine du repo) — à tenir à jour au même
 * rythme que ce document technique. Reste un prérequis avant mise en
 * production réelle : relecture par un juriste/DPO (cf. COMPLIANCE.md §1.6).
 */
export default function PrivacyPage() {
  const logoSrc = useThemedLogoSrc();

  return (
    <div className="bg-background min-h-screen">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src={logoSrc} alt="Mana Chain" className="h-6 w-auto object-contain" />
          </Link>
          <AnimatedThemeToggler className="p-2 rounded-lg bg-card/50 backdrop-blur-md border border-border hover:bg-accent transition-colors text-foreground" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Politique de confidentialité</h1>
        <p className="text-sm text-muted-foreground mb-10">Dernière mise à jour : {LAST_UPDATED}</p>

        <Section title="1. Qui sommes-nous">
          <p>
            Mana Chain est une plateforme permettant à des marques de proposer des badges de
            soutien (tokens) et des billets d&apos;événements sous forme de crypto-actifs. Le
            responsable du traitement des données décrites ci-dessous est l&apos;éditeur de la
            plateforme Mana Chain.
          </p>
        </Section>

        <Section title="2. Données que nous traitons">
          <p>Selon votre usage de la plateforme, nous traitons :</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Email, prénom, nom, nom d&apos;utilisateur, tranche d&apos;âge (création de compte)</li>
            <li>Mot de passe, jamais stocké en clair (haché avec bcrypt)</li>
            <li>Adresse de portefeuille blockchain (wallet), une fois lié à votre compte</li>
            <li>Avatar de profil, si vous choisissez d&apos;en téléverser un</li>
            <li>Email et informations de candidature, si vous demandez la création d&apos;une marque</li>
            <li>Logo et médias de marque, pour les comptes marque</li>
          </ul>
          <p>
            Nous ne collectons jamais votre mot de passe en clair, ni de moyen de paiement
            traditionnel (les achats se font en cryptomonnaie via votre portefeuille).
          </p>
        </Section>

        <Section title="3. Pourquoi nous traitons ces données">
          <p>
            Principalement pour l&apos;exécution du contrat qui nous lie à vous : créer et
            sécuriser votre compte, vous permettre d&apos;acheter des badges/billets, lier votre
            portefeuille à vos achats, instruire une candidature de marque. Le téléversement
            volontaire d&apos;un avatar ou de médias repose sur votre consentement.
          </p>
        </Section>

        <Section title="4. Adresse de portefeuille blockchain">
          <p>
            Une adresse blockchain (« 0x... ») est une donnée à caractère personnel dès lors
            qu&apos;elle est reliée à votre compte — c&apos;est la position de la CNIL et du
            Comité européen de la protection des données (EDPB) : une adresse on-chain est
            pseudonyme, pas anonyme. Nous la traitons avec le même niveau de protection que
            votre email, et nous ne l&apos;affichons jamais publiquement sans lien avec une
            action que vous avez explicitement effectuée sur la plateforme (achat, billet).
          </p>
        </Section>

        <Section title="5. Sécurité de votre compte">
          <ul className="list-disc list-inside space-y-1">
            <li>Mot de passe haché (bcrypt), jamais stocké ni journalisé en clair</li>
            <li>Mot de passe d&apos;au moins 12 caractères avec un chiffre et un caractère spécial</li>
            <li>Rappel par email tous les 60 jours pour vous inviter à renouveler votre mot de passe (non bloquant, vous restez libre de l&apos;ignorer)</li>
            <li>Authentification à deux facteurs (TOTP) disponible en option depuis votre profil</li>
            <li>Limitation du nombre de tentatives de connexion pour prévenir les attaques par force brute</li>
            <li>Jetons de session courte durée (15 minutes) avec renouvellement automatique, révocables à tout moment (déconnexion, changement de mot de passe)</li>
            <li>Tokens de réinitialisation de mot de passe et de vérification d&apos;email hachés en base, jamais stockés en clair</li>
          </ul>
        </Section>

        <Section title="6. Ce qui se passe sur la blockchain et sur IPFS">
          <p>
            Aucune donnée directement identifiante (email, nom, nom d&apos;utilisateur) n&apos;est
            jamais écrite sur la blockchain : seule votre adresse de portefeuille y apparaît,
            comme pour toute transaction Ethereum/Avalanche. Les avatars et logos de marque sont
            hébergés sur IPFS (via notre prestataire Pinata) : une fois publié, un contenu IPFS
            est public et peut être répliqué par d&apos;autres nœuds du réseau — le retrait d&apos;un
            fichier de notre côté ne garantit pas sa suppression sur des copies déjà faites par
            des tiers. C&apos;est pourquoi nous vous recommandons de n&apos;y déposer que des
            visuels que vous acceptez de rendre publics.
          </p>
          <p>
            Pour la même raison, une transaction blockchain (achat, transfert) ne peut
            techniquement pas être effacée une fois confirmée — c&apos;est une propriété
            inhérente à toute blockchain publique. Le droit à l&apos;effacement (section 8)
            s&apos;applique à ce que nous contrôlons réellement : le lien entre votre identité et
            votre adresse dans notre base de données.
          </p>
        </Section>

        <Section title="7. Qui reçoit vos données (sous-traitants)">
          <p>Certains prestataires traitent des données en notre nom, pour des finalités précises :</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Dynamic Labs</strong> — connexion de portefeuille (adresse publique, email selon la méthode choisie), hébergé aux États-Unis</li>
            <li><strong>Pinata</strong> — hébergement des fichiers sur IPFS (avatars, logos, médias)</li>
            <li><strong>Resend</strong> — envoi des emails transactionnels (vérification de compte, réinitialisation de mot de passe, notifications), hébergé aux États-Unis</li>
            <li><strong>Sentry</strong> — suivi des erreurs techniques, pour nous permettre de corriger les bugs de la plateforme</li>
          </ul>
          <p>
            Les transferts hors Union européenne s&apos;appuient sur les garanties prévues par le
            RGPD (clauses contractuelles types ou équivalent).
          </p>
        </Section>

        <Section title="8. Vos droits">
          <p>
            Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification,
            d&apos;effacement, de limitation, d&apos;opposition et de portabilité sur vos données.
            Vous pouvez :
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Modifier votre profil directement depuis votre espace <Link href="/profile" className="underline hover:text-foreground">Profil</Link></li>
            <li>Supprimer votre compte depuis votre espace Profil (anonymisation immédiate de vos données)</li>
            <li>Nous contacter pour toute autre demande relative à vos données</li>
          </ul>
          <p>
            Vous disposez également du droit d&apos;introduire une réclamation auprès de la CNIL
            (Commission nationale de l&apos;informatique et des libertés,{" "}
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
              www.cnil.fr
            </a>).
          </p>
        </Section>

        <Section title="9. Cookies">
          <p>
            Nous utilisons un unique cookie, strictement nécessaire au fonctionnement du site :
            la mémorisation de votre langue préférée (français/anglais). Ce cookie ne nécessite
            pas de consentement au titre de la réglementation ePrivacy (finalité strictement
            fonctionnelle, à votre demande). Votre session de connexion n&apos;est pas stockée
            dans un cookie mais dans le stockage local de votre navigateur.
          </p>
        </Section>

        <Section title="10. Nature des crypto-actifs">
          <p>
            La plateforme fonctionne aujourd&apos;hui sur un réseau de test (Avalanche Fuji) avec
            une monnaie de test sans valeur réelle. Aucune transaction actuelle n&apos;implique de
            contrepartie financière réelle.
          </p>
        </Section>
      </main>

      <Footer />
    </div>
  );
}
