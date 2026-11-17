import type { Metadata } from "next";
import { PageIntro } from "@/components/editorial";

export const metadata: Metadata = { title: "Privacy Policy", description: "What THE HOSTELS collects and why.", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return (
    <>
      <PageIntro kicker="Privacy" title="What we keep, and why." lede="This policy describes the dining desk as built. It should be reviewed by counsel before a public launch." film="breakfast" start={8} layout="split" />
      <article className="mx-auto max-w-3xl space-y-5 px-5 py-16 text-base leading-8 text-ink/80">
        <p>We collect the name, email, phone, password, delivery address, dietary preferences, allergies and order history you give us. Passwords are hashed. Full card numbers are not stored here; when Razorpay is configured, card data is handled by Razorpay.</p>
        <p>Dietary and allergy notes are used to show warnings and to print them on the kitchen ticket. They are not sold. WhatsApp messages are sent only if you opt in and a template is configured. Email is sent only when mail delivery is configured. Otherwise the notice stays in your account.</p>
        <p>Staff can see the records they need to cook, pack, deliver or support a membership. Customers can see their own records. Access is checked on the server.</p>
        <p>You may ask the dining desk to correct your profile, close your account, or export the orders attached to it. Write through the contact page. Some records, including payments and audit logs, are kept for accounting and dispute handling.</p>
      </article>
    </>
  );
}
