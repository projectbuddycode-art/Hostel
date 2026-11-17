import { Footer, Header } from "@/components/chrome";
import { getSession } from "@/lib/auth/guard";
import { site } from "@/lib/config";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <>
      <Header user={session ? { name: session.name, role: session.role } : null} />
      <main id="content">{children}</main>
      <Footer email={site.email} phone={site.phone} instagram={site.instagram} />
    </>
  );
}
