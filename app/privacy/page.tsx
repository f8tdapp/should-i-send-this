import type { Metadata } from "next";
import LegalPage, { LegalSection } from "../components/legal-page";

export const metadata: Metadata = { title: "Privacy Policy | BetweenLines AI", description: "How BetweenLines AI handles submitted messages and feedback." };

export default function PrivacyPage() {
  return <LegalPage eyebrow="Privacy" title="Privacy Policy" summary="BetweenLines AI is designed for private, pre-send communication guidance. This page explains what the service needs to process and the limits of that privacy promise.">
    <LegalSection title="What you submit"><p>You choose whether to paste a draft message into BetweenLines AI. The service analyzes the text you voluntarily submit to produce a communication read and, when useful, an optional rewrite.</p><p>Do not paste highly sensitive information, illegal material, emergency information, medical, legal or financial details, account credentials, trade secrets, or confidential information about another person.</p></LegalSection>
    <LegalSection title="How message text is handled"><p>We do not intentionally store raw message text in an application database. The text must still be transmitted to and processed by the service and its providers to generate a result. We do not make an absolute promise that submitted text can never appear in temporary, security, infrastructure, or provider systems outside the app&apos;s direct storage logic.</p></LegalSection>
    <LegalSection title="Feedback and analytics"><p>Feedback requests do not include raw message text, rewrite text, quote text, optional context, or full analysis text. Feedback uses allowlisted labels and derived metadata only, such as bounded scores, classification labels, rewrite visibility, and a rounded message-length range.</p><p>The app may collect limited, derived usage information needed to understand performance and improve the service. It is not intended to include the raw draft or full analysis.</p></LegalSection>
    <LegalSection title="Service providers"><p>Third-party services may process data to provide BetweenLines AI. These may include OpenAI for AI analysis and Vercel for hosting, performance, and related infrastructure. Those providers operate under their own terms, privacy practices, security controls, and retention settings.</p></LegalSection>
    <LegalSection title="Your choices"><p>You do not have to submit a message or feedback. Remove names, contact details, identifying facts, and sensitive context when they are not needed for the communication read.</p></LegalSection>
    <LegalSection title="Questions"><p>For privacy questions, contact <a className="font-semibold underline underline-offset-4" href="mailto:hello@betweenlines.ai">hello@betweenlines.ai</a>.</p></LegalSection>
  </LegalPage>;
}
