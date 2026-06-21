import type { Metadata } from "next";
import LegalPage, { LegalSection } from "../components/legal-page";

export const metadata: Metadata = { title: "Disclaimer | BetweenLines AI", description: "Important limits of BetweenLines AI communication guidance." };

export default function DisclaimerPage() {
  return <LegalPage eyebrow="Important information" title="Disclaimer" summary="BetweenLines AI can help you reflect on wording before you send it. It cannot make the decision for you.">
    <LegalSection title="Communication guidance only"><p>The app offers a possible reading of how your words may come across. It is a reflection tool, not a decision-maker or a way to read another person&apos;s mind.</p></LegalSection>
    <LegalSection title="No professional advice"><p>Results are not legal, medical, mental health, therapy, relationship, employment, safety, financial, or other professional advice. Ask a qualified professional when the situation calls for one.</p></LegalSection>
    <LegalSection title="No emergency use"><p>Do not use or rely on BetweenLines AI in an emergency, crisis, or dangerous situation. Contact local emergency services or suitable urgent support.</p></LegalSection>
    <LegalSection title="No guarantee of outcome"><p>People interpret messages differently. The app cannot guarantee how a recipient will understand, feel about, or respond to anything you send.</p></LegalSection>
    <LegalSection title="You are responsible for what you send"><p>Read every suggestion, keep what is useful, and change or ignore what is not. The choice to send a message—and its consequences—remains yours.</p></LegalSection>
    <LegalSection title="AI can be wrong"><p>AI can miss context, misunderstand tone, or produce inaccurate and unsuitable suggestions. Use your own judgment and verify anything important.</p></LegalSection>
    <LegalSection title="Do not paste highly sensitive information"><p>Avoid passwords, financial or medical details, legal documents, trade secrets, emergency information, illegal material, or confidential information about you or anyone else. Remove identifying details whenever they are unnecessary.</p></LegalSection>
  </LegalPage>;
}
