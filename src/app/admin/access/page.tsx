"use client";

import { FormEvent, useEffect, useState } from "react";

type UserRole = "user" | "admin";

type AdminUser = {
  id: string;
  email?: string;
  role: UserRole;
  lastSignInAt?: string | null;
};

export default function AdminAccessPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/users");
      const payload = (await response.json()) as {
        users?: AdminUser[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load users.");
      }

      setUsers(payload.users ?? []);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error ? fetchError.message : "Unable to load users."
      );
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Please enter an email address.");
      return;
    }

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: normalizedEmail,
        role,
      }),
    });

    const payload = (await response.json()) as { message?: string; error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Unable to update role.");
      return;
    }

    setStatus(payload.message ?? "Role updated.");
    setEmail("");
    await loadUsers();
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Access management</h1>
        <p className="text-sm text-foreground/70">
          Assign admin access to signed-in users by email. Users must sign in with
          Google once before they can be assigned a role.
        </p>
      </header>

      <section className="rounded-xl border border-border p-4">
        <h2 className="mb-4 text-lg font-semibold">Assign role</h2>
        <form className="grid gap-3 md:grid-cols-[1fr_auto_auto]" onSubmit={onSubmit}>
          <input
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2"
            required
          />
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as UserRole)}
            className="rounded-md border border-border bg-background px-3 py-2"
          >
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
          <button
            type="submit"
            className="rounded-md bg-black px-4 py-2 text-white"
          >
            Save role
          </button>
        </form>

        {status ? <p className="mt-3 text-sm text-green-700">{status}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </section>

      <section className="rounded-xl border border-border p-4">
        <h2 className="mb-4 text-lg font-semibold">Current users</h2>
        {isLoading ? (
          <p className="text-sm text-foreground/70">Loading users…</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-foreground/70">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-2 font-semibold">Email</th>
                  <th className="px-2 py-2 font-semibold">Role</th>
                  <th className="px-2 py-2 font-semibold">Last sign in</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border/60">
                    <td className="px-2 py-2">{user.email ?? "—"}</td>
                    <td className="px-2 py-2">{user.role}</td>
                    <td className="px-2 py-2">
                      {user.lastSignInAt
                        ? new Date(user.lastSignInAt).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
