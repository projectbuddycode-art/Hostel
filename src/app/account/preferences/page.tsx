import type { Metadata } from "next";
import { dietaryOptions } from "@/lib/config";
import { Notice } from "@/components/editorial";
import { requireUser } from "@/lib/auth/guard";
import { parseList } from "@/lib/json";
import { savePreferencesAction } from "@/server/actions";

export const metadata: Metadata = { title: "Preferences", robots: { index: false } };

export default async function PreferencesPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const query = await searchParams;
  const user = await requireUser();
  const selected = parseList(user.profile?.dietaryPreferences);
  return (
    <section className="max-w-xl">
      <Notice notice={query.notice} error={query.error} />
      <h1 className="font-serif text-5xl text-navy">Preferences</h1>
      <form action={savePreferencesAction} className="mt-6 space-y-4">
        <fieldset>
          <legend className="text-sm">Diet</legend>
          <div className="mt-2 space-y-2">
            {dietaryOptions.map((option) => (
              <label key={option.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="dietary" value={option.id} defaultChecked={selected.includes(option.id)} /> {option.label}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block text-sm">Allergies, separated by commas
          <textarea className="field mt-1" name="allergies" defaultValue={user.profile?.allergies || ""} />
        </label>
        <label className="block text-sm">Usual spice
          <select className="field mt-1" name="spicePreference" defaultValue={user.profile?.spicePreference || "medium"}>
            <option>mild</option><option>medium</option><option>hot</option>
          </select>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="whatsappOptIn" defaultChecked={user.profile?.whatsappOptIn} />
          WhatsApp updates when a template is configured.
        </label>
        <button className="btn btn-navy" type="submit">Save preferences</button>
      </form>
    </section>
  );
}
