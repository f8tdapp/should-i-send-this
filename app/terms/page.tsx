import type { Metadata } from "next";
import LegalPage, { LegalSection } from "../components/legal-page";

export const metadata: Metadata = { title: "Terms of Use | BetweenLines AI", description: "Plain-English pre-launch terms for using BetweenLines AI." };

export default function TermsPage() {
  return <LegalPage eyebrow="Terms" title="Terms of Use" summary="These terms describe responsible use of BetweenLines AI and the judgment that remains with you.">
    <LegalSection title="Communication guidance only"><p>BetweenLines AI offers communication guidance based on the text you submit. It does not send messages for you. You are responsible for reviewing the result and for every message you choose to send.</p></LegalSection>
    <LegalSection title="No professional advice"><p>The service is not legal, medical, mental health, therapy, relationship, employment, safety, financial, or other professional advice. It is not a substitute for a qualified professional who understands your circumstances.</p></LegalSection>
    <LegalSection title="Outputs and outcomes"><p>AI outputs can be incomplete, imperfect, or inaccurate. BetweenLines AI cannot know another person&apos;s thoughts and does not guarantee how anyone will interpret or respond to a message. Use your own judgment, check important details, and adapt suggestions to your intent.</p></LegalSection>
    <LegalSection title="Responsible use"><p>You must not use the service for unlawful, harmful, abusive, threatening, harassing, deceptive, or emergency purposes, or to violate another person&apos;s rights.</p></LegalSection>
    <LegalSection title="Urgent or dangerous situations"><p>Do not rely on BetweenLines AI in an emergency, urgent safety situation, or where someone may be at risk. Contact local emergency services, a trusted person, or an appropriately qualified professional instead.</p></LegalSection>
    <LegalSection title="Changes to the service"><p>The service, its features, access limits, and these pre-launch terms may be changed, limited, suspended, or discontinued. Material legal wording should be reviewed before public launch and updated when the service changes.</p></LegalSection>
    <LegalSection title="Contact"><p>Questions can be sent to <a className="font-semibold underline underline-offset-4" href="mailto:hello@betweenlinesai.com">hello@betweenlinesai.com</a>.</p></LegalSection>
  </LegalPage>;
}
