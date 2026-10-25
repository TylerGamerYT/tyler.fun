-- Seed: the 12 hand-made example accounts, taken from users/<name>/index.html (bio, avatar, badges shown on the page).
-- Every account is role 'user', UNCLAIMED (no password, no GitHub link) => nobody can log in as them until you hand them over.
-- Staff/Admin/Verified badges are carried over as DISPLAY badges only; they confer no permissions (permissions come from `role`).
-- Safe to re-run: INSERT OR IGNORE. Edit the INSERTs below before applying if you want different roles/bios.

-- tyler.fun
INSERT OR IGNORE INTO users (id, username, username_lc, display_name, email, email_lc, email_verified, password_hash, role, banned, ban_reason, bio, avatar_emoji, unclaimed, created_at, updated_at)
VALUES ('legacy-tyler.fun', 'tyler.fun', 'tyler.fun', 'tyler.fun', NULL, NULL, 0, NULL, 'user', 0, NULL, 'The official tyler.fun account. A collection of weird, fun, and interactive web experiments. Built by Tyler, tested by the crew. More games always coming.', 't.fun', 1, CAST(strftime('%s','now') AS INTEGER), CAST(strftime('%s','now') AS INTEGER));
INSERT OR IGNORE INTO badge_grants (user_id, badge, granted_by, granted_at, displayed) VALUES ('legacy-tyler.fun', 'staff', 'legacy-migration', CAST(strftime('%s','now') AS INTEGER), 1);
INSERT OR IGNORE INTO badge_grants (user_id, badge, granted_by, granted_at, displayed) VALUES ('legacy-tyler.fun', 'verified', 'legacy-migration', CAST(strftime('%s','now') AS INTEGER), 1);

-- yoiashley
INSERT OR IGNORE INTO users (id, username, username_lc, display_name, email, email_lc, email_verified, password_hash, role, banned, ban_reason, bio, avatar_emoji, unclaimed, created_at, updated_at)
VALUES ('legacy-yoiashley', 'yoiashley', 'yoiashley', 'Ashley', NULL, NULL, 0, NULL, 'user', 0, NULL, '', '✨', 1, CAST(strftime('%s','now') AS INTEGER), CAST(strftime('%s','now') AS INTEGER));
INSERT OR IGNORE INTO badge_grants (user_id, badge, granted_by, granted_at, displayed) VALUES ('legacy-yoiashley', 'member', 'legacy-migration', CAST(strftime('%s','now') AS INTEGER), 1);

-- tawsif
INSERT OR IGNORE INTO users (id, username, username_lc, display_name, email, email_lc, email_verified, password_hash, role, banned, ban_reason, bio, avatar_emoji, unclaimed, created_at, updated_at)
VALUES ('legacy-tawsif', 'tawsif', 'tawsif', 'Tawsif', NULL, NULL, 0, NULL, 'user', 0, NULL, '', '🌙', 1, CAST(strftime('%s','now') AS INTEGER), CAST(strftime('%s','now') AS INTEGER));
INSERT OR IGNORE INTO badge_grants (user_id, badge, granted_by, granted_at, displayed) VALUES ('legacy-tawsif', 'tawsif', 'legacy-migration', CAST(strftime('%s','now') AS INTEGER), 1);
INSERT OR IGNORE INTO badge_grants (user_id, badge, granted_by, granted_at, displayed) VALUES ('legacy-tawsif', 'member', 'legacy-migration', CAST(strftime('%s','now') AS INTEGER), 1);

-- staff
INSERT OR IGNORE INTO users (id, username, username_lc, display_name, email, email_lc, email_verified, password_hash, role, banned, ban_reason, bio, avatar_emoji, unclaimed, created_at, updated_at)
VALUES ('legacy-staff', 'staff', 'staff', 'Staff', NULL, NULL, 0, NULL, 'user', 0, NULL, 'tyler.fun staff • Helping with general questions and keeping things smooth.', '👥', 1, CAST(strftime('%s','now') AS INTEGER), CAST(strftime('%s','now') AS INTEGER));
INSERT OR IGNORE INTO badge_grants (user_id, badge, granted_by, granted_at, displayed) VALUES ('legacy-staff', 'staff', 'legacy-migration', CAST(strftime('%s','now') AS INTEGER), 1);

-- angle
INSERT OR IGNORE INTO users (id, username, username_lc, display_name, email, email_lc, email_verified, password_hash, role, banned, ban_reason, bio, avatar_emoji, unclaimed, created_at, updated_at)
VALUES ('legacy-angle', 'angle', 'angle', 'Angle', NULL, NULL, 0, NULL, 'user', 0, NULL, '', '📐', 1, CAST(strftime('%s','now') AS INTEGER), CAST(strftime('%s','now') AS INTEGER));
INSERT OR IGNORE INTO badge_grants (user_id, badge, granted_by, granted_at, displayed) VALUES ('legacy-angle', 'member', 'legacy-migration', CAST(strftime('%s','now') AS INTEGER), 1);

-- Tyler
INSERT OR IGNORE INTO users (id, username, username_lc, display_name, email, email_lc, email_verified, password_hash, role, banned, ban_reason, bio, avatar_emoji, unclaimed, created_at, updated_at)
VALUES ('legacy-tyler', 'Tyler', 'tyler', 'Tyler', NULL, NULL, 0, NULL, 'user', 0, NULL, 'Made tyler.fun. Building weird, fun, and interactive web experiments inspired by neal.fun. Probably procrastinating on the next game right now.', NULL, 1, CAST(strftime('%s','now') AS INTEGER), CAST(strftime('%s','now') AS INTEGER));
INSERT OR IGNORE INTO badge_grants (user_id, badge, granted_by, granted_at, displayed) VALUES ('legacy-tyler', 'tyler', 'legacy-migration', CAST(strftime('%s','now') AS INTEGER), 1);
INSERT OR IGNORE INTO badge_grants (user_id, badge, granted_by, granted_at, displayed) VALUES ('legacy-tyler', 'admin', 'legacy-migration', CAST(strftime('%s','now') AS INTEGER), 1);
INSERT OR IGNORE INTO badge_grants (user_id, badge, granted_by, granted_at, displayed) VALUES ('legacy-tyler', 'staff', 'legacy-migration', CAST(strftime('%s','now') AS INTEGER), 1);
INSERT OR IGNORE INTO badge_grants (user_id, badge, granted_by, granted_at, displayed) VALUES ('legacy-tyler', 'verified', 'legacy-migration', CAST(strftime('%s','now') AS INTEGER), 1);
INSERT OR IGNORE INTO badge_grants (user_id, badge, granted_by, granted_at, displayed) VALUES ('legacy-tyler', 'email_verified', 'legacy-migration', CAST(strftime('%s','now') AS INTEGER), 1);
INSERT OR IGNORE INTO badge_grants (user_id, badge, granted_by, granted_at, displayed) VALUES ('legacy-tyler', 'member', 'legacy-migration', CAST(strftime('%s','now') AS INTEGER), 1);

-- Fish
INSERT OR IGNORE INTO users (id, username, username_lc, display_name, email, email_lc, email_verified, password_hash, role, banned, ban_reason, bio, avatar_emoji, unclaimed, created_at, updated_at)
VALUES ('legacy-fish', 'Fish', 'fish', 'Fish', NULL, NULL, 0, NULL, 'user', 0, NULL, 'Official tester of tyler.fun. Finds the bugs so you don''t have to. Probably the reason half the games got fixed.', '🐟', 1, CAST(strftime('%s','now') AS INTEGER), CAST(strftime('%s','now') AS INTEGER));
INSERT OR IGNORE INTO badge_grants (user_id, badge, granted_by, granted_at, displayed) VALUES ('legacy-fish', 'fish', 'legacy-migration', CAST(strftime('%s','now') AS INTEGER), 1);
INSERT OR IGNORE INTO badge_grants (user_id, badge, granted_by, granted_at, displayed) VALUES ('legacy-fish', 'staff', 'legacy-migration', CAST(strftime('%s','now') AS INTEGER), 1);
INSERT OR IGNORE INTO badge_grants (user_id, badge, granted_by, granted_at, displayed) VALUES ('legacy-fish', 'verified', 'legacy-migration', CAST(strftime('%s','now') AS INTEGER), 1);
INSERT OR IGNORE INTO badge_grants (user_id, badge, granted_by, granted_at, displayed) VALUES ('legacy-fish', 'member', 'legacy-migration', CAST(strftime('%s','now') AS INTEGER), 1);

-- Support
INSERT OR IGNORE INTO users (id, username, username_lc, display_name, email, email_lc, email_verified, password_hash, role, banned, ban_reason, bio, avatar_emoji, unclaimed, created_at, updated_at)
VALUES ('legacy-support', 'Support', 'support', 'Support', NULL, NULL, 0, NULL, 'user', 0, NULL, 'tyler.fun support • Bug reports, questions, and technical help. Fish approved.', '🎧', 1, CAST(strftime('%s','now') AS INTEGER), CAST(strftime('%s','now') AS INTEGER));
INSERT OR IGNORE INTO badge_grants (user_id, badge, granted_by, granted_at, displayed) VALUES ('legacy-support', 'staff', 'legacy-migration', CAST(strftime('%s','now') AS INTEGER), 1);
INSERT OR IGNORE INTO badge_grants (user_id, badge, granted_by, granted_at, displayed) VALUES ('legacy-support', 'verified', 'legacy-migration', CAST(strftime('%s','now') AS INTEGER), 1);

-- Guest
INSERT OR IGNORE INTO users (id, username, username_lc, display_name, email, email_lc, email_verified, password_hash, role, banned, ban_reason, bio, avatar_emoji, unclaimed, created_at, updated_at)
VALUES ('legacy-guest', 'Guest', 'guest', 'Guest', NULL, NULL, 0, NULL, 'user', 0, NULL, 'Just browsing. Not logged in. Don''t mind me.', NULL, 1, CAST(strftime('%s','now') AS INTEGER), CAST(strftime('%s','now') AS INTEGER));

-- Ban
INSERT OR IGNORE INTO users (id, username, username_lc, display_name, email, email_lc, email_verified, password_hash, role, banned, ban_reason, bio, avatar_emoji, unclaimed, created_at, updated_at)
VALUES ('legacy-ban', 'Ban', 'ban', 'Ban', NULL, NULL, 0, NULL, 'user', 1, 'Example account demonstrating the Banned badge', '', '🔨', 1, CAST(strftime('%s','now') AS INTEGER), CAST(strftime('%s','now') AS INTEGER));
INSERT OR IGNORE INTO badge_grants (user_id, badge, granted_by, granted_at, displayed) VALUES ('legacy-ban', 'banned', 'legacy-migration', CAST(strftime('%s','now') AS INTEGER), 1);
INSERT OR IGNORE INTO badge_grants (user_id, badge, granted_by, granted_at, displayed) VALUES ('legacy-ban', 'member', 'legacy-migration', CAST(strftime('%s','now') AS INTEGER), 1);

-- Admin
INSERT OR IGNORE INTO users (id, username, username_lc, display_name, email, email_lc, email_verified, password_hash, role, banned, ban_reason, bio, avatar_emoji, unclaimed, created_at, updated_at)
VALUES ('legacy-admin', 'Admin', 'admin', 'Admin', NULL, NULL, 0, NULL, 'user', 0, NULL, 'Official tyler.fun admin account. Big updates and important announcements only.', '🛡️', 1, CAST(strftime('%s','now') AS INTEGER), CAST(strftime('%s','now') AS INTEGER));
INSERT OR IGNORE INTO badge_grants (user_id, badge, granted_by, granted_at, displayed) VALUES ('legacy-admin', 'admin', 'legacy-migration', CAST(strftime('%s','now') AS INTEGER), 1);
INSERT OR IGNORE INTO badge_grants (user_id, badge, granted_by, granted_at, displayed) VALUES ('legacy-admin', 'staff', 'legacy-migration', CAST(strftime('%s','now') AS INTEGER), 1);
INSERT OR IGNORE INTO badge_grants (user_id, badge, granted_by, granted_at, displayed) VALUES ('legacy-admin', 'verified', 'legacy-migration', CAST(strftime('%s','now') AS INTEGER), 1);

-- Aaban
INSERT OR IGNORE INTO users (id, username, username_lc, display_name, email, email_lc, email_verified, password_hash, role, banned, ban_reason, bio, avatar_emoji, unclaimed, created_at, updated_at)
VALUES ('legacy-aaban', 'Aaban', 'aaban', 'Aaban', NULL, NULL, 0, NULL, 'user', 0, NULL, '', '⚡', 1, CAST(strftime('%s','now') AS INTEGER), CAST(strftime('%s','now') AS INTEGER));
INSERT OR IGNORE INTO badge_grants (user_id, badge, granted_by, granted_at, displayed) VALUES ('legacy-aaban', 'member', 'legacy-migration', CAST(strftime('%s','now') AS INTEGER), 1);
