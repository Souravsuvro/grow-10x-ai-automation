import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Shell, Panel } from "@/components/shell";
import { createClient, listClients } from "@/lib/grow/api";

export const Route = createFileRoute("/clients")({
  loader: () => listClients(),
  component: ClientsPage,
});

function ClientsPage() {
  const clients = Route.useLoaderData();
  const router = useRouter();
  const save = useServerFn(createClient);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(form: FormData) {
    setPending(true);
    setError("");
    try {
      await save({
        data: {
          business_name: String(form.get("business_name") ?? ""),
          business_category: String(form.get("business_category") ?? ""),
          audience: String(form.get("audience") ?? ""),
          locations: String(form.get("locations") ?? ""),
          brand_voice: String(form.get("brand_voice") ?? ""),
          platforms: String(form.get("platforms") ?? ""),
        },
      });
      await router.invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setPending(false);
    }
  }

  return (
    <Shell>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Studios">
          <ul className="space-y-4">
            {clients.map((client) => (
              <li key={client.id} className="border-b border-line pb-4 last:border-0">
                <p className="font-display text-2xl">{client.business_name}</p>
                <p className="text-sm text-muted">
                  {client.business_category} · {client.locations}
                </p>
                <p className="mt-1 text-sm text-fg">{client.audience}</p>
                <p className="mt-1 text-sm text-sage">{client.brand_voice}</p>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Add a studio">
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void onSubmit(new FormData(event.currentTarget));
              event.currentTarget.reset();
            }}
          >
            <Field name="business_name" label="Business" placeholder="Northline Dental" />
            <Field name="business_category" label="Category" placeholder="Dental care" />
            <Field name="audience" label="Audience" placeholder="Working adults" />
            <Field name="locations" label="Locations" placeholder="Austin, TX" />
            <Field name="brand_voice" label="Voice" placeholder="Calm and specific" />
            <Field name="platforms" label="Platforms" placeholder="linkedin,instagram" />
            {error && <p className="text-sm text-brass">{error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="min-h-11 rounded-full bg-brass px-4 text-sm font-medium text-ink disabled:opacity-60"
            >
              {pending ? "Saving" : "Save studio"}
            </button>
          </form>
        </Panel>
      </div>
    </Shell>
  );
}

function Field({ name, label, placeholder }: { name: string; label: string; placeholder: string }) {
  return (
    <label className="grid gap-1 text-sm text-muted">
      {label}
      <input
        name={name}
        required
        placeholder={placeholder}
        className="min-h-11 rounded-lg border border-line bg-bg px-3 text-fg outline-none focus:border-brass"
      />
    </label>
  );
}
