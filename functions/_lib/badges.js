// Single source of truth for roles, badges and who may do what.
// Everything here is PURE (no I/O) so it can be unit-tested.

export const ROLES = ['user', 'support', 'staff', 'admin', 'owner'];
export const roleRank = (r) => ROLES.indexOf(r);

/*
 kind:
   auto       – the server grants it itself (nobody can hand it out by hand)
   role       – derived from the user's role (kept in sync by syncRoleBadges)
   moderation – set only by the ban action
   granted    – staff/admin/owner grants it manually; minRole is the lowest role allowed to
*/
export const BADGES = {
  member:         { label: 'Member',         kind: 'auto' },
  email_verified: { label: 'Email Verified', kind: 'auto' },
  banned:         { label: 'Banned',         kind: 'moderation', alwaysShown: true },
  staff:          { label: 'Staff',          kind: 'role', fromRole: 'staff' },
  admin:          { label: 'Admin',          kind: 'role', fromRole: 'admin' },
  verified:       { label: 'Verified',       kind: 'granted', minRole: 'admin' },
  contributor:    { label: 'Contributor',    kind: 'granted', minRole: 'staff' },
  fish:           { label: 'Fish',           kind: 'granted', minRole: 'admin' },
  tawsif:         { label: 'Tawsif',         kind: 'granted', minRole: 'admin' },
  tyler:          { label: 'Tyler',          kind: 'granted', minRole: 'owner' },
};
export const BADGE_IDS = Object.keys(BADGES);

// What a normal user may ever hold. This is the "regular users only get these two" rule.
export const SELF_EARNABLE = ['member', 'email_verified'];

const rank = (u) => roleRank(u?.role);

/** Badges a user with this role should hold because of the role alone. */
export function roleBadgesFor(role) {
  const r = roleRank(role);
  return BADGE_IDS.filter((id) => BADGES[id].kind === 'role' && r >= roleRank(BADGES[id].fromRole));
}

/** Can `actor` hand `badge` to `target` by hand? Returns {ok, reason}. */
export function canGrantBadge(actor, target, badge) {
  const def = BADGES[badge];
  if (!def) return { ok: false, reason: 'unknown_badge' };
  if (def.kind !== 'granted') return { ok: false, reason: 'badge_not_manually_grantable' };
  if (actor.banned) return { ok: false, reason: 'actor_banned' };
  if (rank(actor) < roleRank(def.minRole)) return { ok: false, reason: 'insufficient_role' };
  if (actor.id === target.id && actor.role !== 'owner') return { ok: false, reason: 'cannot_grant_self' };
  return { ok: true };
}

export function canRevokeBadge(actor, target, badge) {
  const g = canGrantBadge(actor, target, badge);
  if (!g.ok) return g;
  if (actor.role !== 'owner' && rank(actor) <= rank(target)) return { ok: false, reason: 'target_outranks_actor' };
  return { ok: true };
}

export function canBan(actor, target) {
  if (actor.banned) return { ok: false, reason: 'actor_banned' };
  if (rank(actor) < roleRank('staff')) return { ok: false, reason: 'insufficient_role' };
  if (actor.id === target.id) return { ok: false, reason: 'cannot_target_self' };
  if (target.role === 'owner') return { ok: false, reason: 'target_is_owner' };
  if (rank(actor) <= rank(target)) return { ok: false, reason: 'target_outranks_actor' };
  return { ok: true };
}

export function canSetRole(actor, target, newRole) {
  if (!ROLES.includes(newRole)) return { ok: false, reason: 'unknown_role' };
  if (actor.banned) return { ok: false, reason: 'actor_banned' };
  if (rank(actor) < roleRank('admin')) return { ok: false, reason: 'insufficient_role' };
  if (actor.id === target.id) return { ok: false, reason: 'cannot_target_self' };
  if (actor.role === 'owner') return { ok: true };
  // admins: may only manage people strictly below them and only hand out roles strictly below admin
  if (rank(target) >= rank(actor)) return { ok: false, reason: 'target_outranks_actor' };
  if (roleRank(newRole) >= rank(actor)) return { ok: false, reason: 'role_too_high' };
  return { ok: true };
}

/**
 * Users choose what to SHOW, but only from what they HOLD.
 * Returns { ok, rejected[] }.
 */
export function validateDisplaySelection(heldIds, requestedIds) {
  const held = new Set(heldIds);
  const rejected = requestedIds.filter((id) => !BADGES[id] || !held.has(id));
  return { ok: rejected.length === 0, rejected };
}

/** Edit another user's profile fields (display name / bio / avatar). Owner: anyone. Admin: only people below them. */
export function canManageUser(actor, target) {
  if (actor.banned) return { ok: false, reason: 'actor_banned' };
  if (rank(actor) < roleRank('admin')) return { ok: false, reason: 'insufficient_role' };
  if (actor.role === 'owner') return { ok: true };
  if (actor.id === target.id) return { ok: true };
  if (rank(target) >= rank(actor)) return { ok: false, reason: 'target_outranks_actor' };
  return { ok: true };
}

/**
 * Hand a migrated (unclaimed) account to a real person via a one-time claim link.
 * Whoever claims it inherits that account's existing role, so staff+ accounts may only be released by the owner.
 */
export function canIssueClaim(actor, target) {
  if (actor.banned) return { ok: false, reason: 'actor_banned' };
  if (rank(actor) < roleRank('admin')) return { ok: false, reason: 'insufficient_role' };
  if (!target.unclaimed) return { ok: false, reason: 'not_an_unclaimed_account' };
  if (target.banned) return { ok: false, reason: 'target_banned' };
  if (rank(target) >= roleRank('staff') && actor.role !== 'owner') return { ok: false, reason: 'owner_only_for_staff_accounts' };
  return { ok: true };
}
