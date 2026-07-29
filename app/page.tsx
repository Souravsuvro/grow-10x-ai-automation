import Link from "next/link";
import { listClients, listContent, listDrafts } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [clients, content, drafts] = await Promise.all([
    listClients(),
    listContent(),
    listDrafts(),
  ]);

  const ready = content.filter((c) => c.status === "ready").length;
  const scheduled = content.filter((c) => c.status === "scheduled").length;
  const failed = content.filter((c) => c.status === "failed").length;

  return (
    <div className="stack">
      <div>
        <h1>Dashboard</h1>
        <p className="lede">
          Local-first content automation: manage clients, repurpose with Grok,
          schedule through Postiz (or n8n).
        </p>
      </div>

      <div className="grid">
        <div className="card">
          <p>Clients</p>
          <div className="stat">{clients.length}</div>
        </div>
        <div className="card">
          <p>Source items</p>
          <div className="stat">{content.length}</div>
        </div>
        <div className="card">
          <p>Drafts</p>
          <div className="stat">{drafts.length}</div>
        </div>
        <div className="card">
          <p>Ready / Scheduled / Failed</p>
          <div className="stat" style={{ fontSize: "1.2rem" }}>
            {ready} / {scheduled} / {failed}
          </div>
        </div>
      </div>

      <div className="row">
        <Link className="btn" href="/clients">
          Manage clients
        </Link>
        <Link className="btn secondary" href="/content/new">
          Add source content
        </Link>
        <Link className="btn secondary" href="/content">
          View pipeline
        </Link>
      </div>

      <div className="card">
        <h2>Pipeline</h2>
        <ol className="muted" style={{ margin: 0, paddingLeft: "1.2rem" }}>
          <li>Create a client with brand voice + Postiz integration IDs</li>
          <li>Submit source content (blog, transcript, brief)</li>
          <li>Repurpose with Grok (or fire the n8n webhook)</li>
          <li>Review drafts and schedule to Postiz</li>
        </ol>
      </div>

      {content.slice(0, 8).length > 0 && (
        <div className="card">
          <h2>Recent content</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {content
                .slice()
                .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                .slice(0, 8)
                .map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Link href={`/content/${item.id}`}>{item.title}</Link>
                    </td>
                    <td>
                      <span className={`badge ${item.status}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="muted mono">
                      {new Date(item.updatedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
