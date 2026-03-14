import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteUser, getAllUsers, updateUserRole } from "../api/admin.api";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { ActionIconButton, DeleteIcon } from "../components/ui/AdminActions";
import { splitPersonName } from "../utils/personName";

export default function Users() {
  const { user, token, loading: authLoading } = useContext(AuthContext);
  const { tr } = useLanguage();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return users;

    return users.filter((entry) => {
      const parsedName = splitPersonName(entry);
      const fields = [entry.name, parsedName.firstName, parsedName.lastName, entry.email, entry.phone]
        .map((value) => String(value || "").toLowerCase());

      return fields.some((value) => value.includes(normalizedQuery));
    });
  }, [users, searchQuery]);

  useEffect(() => {
    if (authLoading) return;

    if (!user || !token) {
      navigate("/login");
      return;
    }

    if (user.role !== "ADMIN") {
      setMessage(tr("Acces refuse : administrateur uniquement", "Access denied: admin only"));
      return;
    }

    async function fetchUsers() {
      try {
        const data = await getAllUsers(token);
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        setMessage(err.response?.data?.error || tr("Erreur lors du chargement des utilisateurs", "Error while loading users"));
      }
    }

    fetchUsers();
  }, [authLoading, token, user, navigate, tr]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const updatedUser = await updateUserRole(token, userId, newRole);
      setUsers((prev) => prev.map((entry) => (entry.id === userId ? updatedUser : entry)));
      setMessage(tr("Role mis a jour avec succes.", "Role updated successfully."));
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la mise a jour du role", "Error while updating role"));
    }
  };

  const handleDelete = async (userId) => {
    try {
      await deleteUser(token, userId);
      setUsers((prev) => prev.filter((entry) => entry.id !== userId));
      setMessage(tr("Utilisateur supprime.", "User deleted."));
    } catch (err) {
      setMessage(err.response?.data?.error || tr("Erreur lors de la suppression", "Error while deleting"));
    }
  };

  if (authLoading) return <p>{tr("Chargement du contexte utilisateur...", "Loading user context...")}</p>;

  const totalUsers = users.length;
  const visibleUsers = filteredUsers.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-saffron">
            {tr("Infos clients", "Customer details")}
          </p>
          <h2 className="text-2xl font-bold text-white">{tr("Clients", "Customers")}</h2>
          <p className="mt-1 max-w-2xl text-sm text-stone-300">
            {tr(
              "Recherche rapide par nom, prenom, numero ou email pour retrouver un client sans perdre de temps.",
              "Quick search by last name, first name, phone number or email to find a customer fast."
            )}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
            {tr("Clients visibles", "Visible customers")}
          </p>
          <p className="mt-2 text-3xl font-bold text-white">{visibleUsers}</p>
          <p className="mt-1 text-xs text-stone-400">
            {tr("Sur", "Out of")} {totalUsers}
          </p>
        </div>
      </div>

      {message && (
        <p className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-stone-200">{message}</p>
      )}

      <div className="grid gap-2 sm:max-w-xl">
        <label htmlFor="users-search" className="text-xs font-semibold uppercase tracking-wide text-stone-300">
          {tr("Recherche client", "Customer search")}
        </label>
        <input
          id="users-search"
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={tr(
            "Rechercher par nom, prenom, numero ou email",
            "Search by last name, first name, phone number or email"
          )}
        />
      </div>

      <div className="grid gap-3">
        {filteredUsers.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-5 text-sm text-stone-300">
            {tr("Aucun utilisateur trouve.", "No users found.")}
          </div>
        ) : (
          filteredUsers.map((entry) => {
            const parsedName = splitPersonName(entry);
            const displayName =
              [parsedName.lastName, parsedName.firstName].filter(Boolean).join(" ") ||
              entry.name ||
              "-";

            return (
              <article
                key={entry.id}
                className="rounded-xl border border-white/10 bg-black/20 p-4 transition hover:border-white/20 hover:bg-black/30"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 space-y-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                        {tr("Client", "Customer")}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-white">{displayName}</h3>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3">
                      <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                          {tr("Nom prenom", "Name")}
                        </p>
                        <p className="mt-1 text-sm text-stone-100">{displayName}</p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                          {tr("Numero", "Phone")}
                        </p>
                        <p className="mt-1 text-sm text-stone-100">{entry.phone || "-"}</p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                          {tr("Email", "Email")}
                        </p>
                        <p className="mt-1 break-all text-sm text-stone-100">{entry.email || "-"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="min-w-[220px] space-y-3">
                    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                        {tr("Role", "Role")}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">{entry.role}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {entry.role === "CLIENT" ? (
                        <button onClick={() => handleRoleChange(entry.id, "ADMIN")}>
                          {tr("Promouvoir admin", "Promote to admin")}
                        </button>
                      ) : (
                        <button onClick={() => handleRoleChange(entry.id, "CLIENT")}>
                          {tr("Retrograder client", "Demote to client")}
                        </button>
                      )}
                      <ActionIconButton
                        onClick={() => handleDelete(entry.id)}
                        label={tr("Supprimer utilisateur", "Delete user")}
                        variant="danger"
                      >
                        <DeleteIcon />
                      </ActionIconButton>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
