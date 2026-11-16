// language: JavaScript (React Native)
// target: KettuTweak / Bunny / Vendetta — iOS Discord mod plugin
// entry: onLoad → patches GuildMemberStore.getMember for current user only
// UI: Settings tab → pick guild → pick roles → save to persistent storage

import { storage } from "@vendetta/plugin";
import { findByStoreName, findByDisplayName, findByProps } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { React, ReactNative as RN } from "@vendetta/metro/common";

const { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet, Switch } = RN;

// ── Storage init ──────────────────────────────────────────────────────────────
// shape: { fakeRoles: { [guildId]: string[] } }
if (!storage.fakeRoles) storage.fakeRoles = {};

// ── Lazy store refs (resolved on onLoad) ─────────────────────────────────────
let UserStore, GuildMemberStore, GuildStore, SelectedGuildStore;

// ── Active patch handles ──────────────────────────────────────────────────────
const _patches = [];

// ── Helpers ───────────────────────────────────────────────────────────────────
function roleColor(raw) {
  if (!raw) return "#99aab5";
  return "#" + raw.toString(16).padStart(6, "0");
}

function getSortedRoles(guildId) {
  const guild = GuildStore?.getGuild?.(guildId);
  if (!guild) return [];
  return Object.values(guild.roles)
    .filter((r) => r.id !== guildId) // exclude @everyone
    .sort((a, b) => b.position - a.position);
}

// ── Role Picker Modal ─────────────────────────────────────────────────────────
function RolePicker({ guildId, visible, onClose }) {
  const [pending, setPending] = React.useState(
    () => new Set(storage.fakeRoles[guildId] ?? [])
  );

  // Reset pending when guild changes or modal reopens
  React.useEffect(() => {
    if (visible) setPending(new Set(storage.fakeRoles[guildId] ?? []));
  }, [guildId, visible]);

  const roles = getSortedRoles(guildId);
  const guildName = GuildStore?.getGuild?.(guildId)?.name ?? "Unknown Server";

  const toggle = (id) => {
    setPending((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const save = () => {
    storage.fakeRoles[guildId] = [...pending];
    onClose();
  };

  const clear = () => {
    setPending(new Set());
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={S.overlay}>
        <View style={S.sheet}>
          {/* Header */}
          <View style={S.sheetHeader}>
            <Text style={S.sheetTitle}>Fake Roles</Text>
            <Text style={S.sheetSub} numberOfLines={1}>
              {guildName}
            </Text>
          </View>

          {roles.length === 0 ? (
            <Text style={S.empty}>No roles found in this server.</Text>
          ) : (
            <ScrollView style={S.list} showsVerticalScrollIndicator={false}>
              {roles.map((role) => {
                const color = roleColor(role.color);
                const on = pending.has(role.id);
                return (
                  <TouchableOpacity
                    key={role.id}
                    style={[S.roleRow, on && S.roleRowOn]}
                    onPress={() => toggle(role.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[S.dot, { backgroundColor: color }]} />
                    <Text style={[S.roleName, { color: on ? color : "#b5bac1" }]}>
                      {role.name}
                    </Text>
                    {on && <Text style={S.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Buttons */}
          <View style={S.btnRow}>
            <TouchableOpacity style={S.btnGhost} onPress={clear}>
              <Text style={S.btnGhostTxt}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={S.btnGhost} onPress={onClose}>
              <Text style={S.btnGhostTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={S.btnPrimary} onPress={save}>
              <Text style={S.btnPrimaryTxt}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Settings Page (exposed as plugin settings) ────────────────────────────────
function Settings() {
  const [pickerGuild, setPickerGuild] = React.useState(null);

  // All guilds the user is in
  const guilds = React.useMemo(() => {
    const raw = GuildStore?.getGuilds?.() ?? {};
    return Object.values(raw).sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Auto-select current guild as a shortcut
  const currentGuildId = SelectedGuildStore?.getGuildId?.();

  const fakeCount = (guildId) =>
    (storage.fakeRoles[guildId] ?? []).length;

  return (
    <View style={S.settingsRoot}>
      <Text style={S.settingsTitle}>FakeRoles</Text>
      <Text style={S.settingsSub}>
        Select a server and pick which roles to fake on your profile card. Display only — only you see this.
      </Text>

      {currentGuildId && (
        <TouchableOpacity
          style={S.quickBtn}
          onPress={() => setPickerGuild(currentGuildId)}
        >
          <Text style={S.quickBtnTxt}>
            ✏️ Edit roles for current server
          </Text>
        </TouchableOpacity>
      )}

      <Text style={S.sectionLabel}>ALL SERVERS</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {guilds.map((guild) => {
          const count = fakeCount(guild.id);
          return (
            <TouchableOpacity
              key={guild.id}
              style={S.guildRow}
              onPress={() => setPickerGuild(guild.id)}
            >
              <View style={S.guildInfo}>
                <Text style={S.guildName}>{guild.name}</Text>
                {count > 0 && (
                  <Text style={S.guildBadge}>
                    {count} role{count !== 1 ? "s" : ""} faked
                  </Text>
                )}
              </View>
              <Text style={S.guildArrow}>›</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {pickerGuild && (
        <RolePicker
          guildId={pickerGuild}
          visible={!!pickerGuild}
          onClose={() => setPickerGuild(null)}
        />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  // Modal
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#1e1f22",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 36,
    maxHeight: "80%",
  },
  sheetHeader: { marginBottom: 12 },
  sheetTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  sheetSub: { color: "#72767d", fontSize: 13, marginTop: 2 },
  list: { flexGrow: 0 },
  empty: { color: "#72767d", textAlign: "center", marginVertical: 24 },
  roleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 3,
  },
  roleRowOn: { backgroundColor: "rgba(255,255,255,0.06)" },
  dot: { width: 13, height: 13, borderRadius: 6.5, marginRight: 11 },
  roleName: { flex: 1, fontSize: 15, fontWeight: "500" },
  checkmark: { color: "#57f287", fontSize: 16, fontWeight: "700" },
  btnRow: {
    flexDirection: "row",
    marginTop: 14,
    gap: 8,
    justifyContent: "flex-end",
  },
  btnGhost: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#2b2d31",
  },
  btnGhostTxt: { color: "#b5bac1", fontSize: 15, fontWeight: "600" },
  btnPrimary: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#5865f2",
  },
  btnPrimaryTxt: { color: "#fff", fontSize: 15, fontWeight: "700" },

  // Settings
  settingsRoot: { flex: 1, backgroundColor: "#111214", padding: 16 },
  settingsTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  settingsSub: {
    color: "#72767d",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  quickBtn: {
    backgroundColor: "#5865f2",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  quickBtnTxt: { color: "#fff", fontSize: 15, fontWeight: "700" },
  sectionLabel: {
    color: "#72767d",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  guildRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1f22",
    borderRadius: 12,
    padding: 14,
    marginBottom: 6,
  },
  guildInfo: { flex: 1 },
  guildName: { color: "#dcddde", fontSize: 15, fontWeight: "600" },
  guildBadge: {
    color: "#57f287",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  guildArrow: { color: "#72767d", fontSize: 20 },
});

// ── Plugin export ─────────────────────────────────────────────────────────────
export default {
  onLoad() {
    // Resolve stores
    UserStore = findByStoreName("UserStore");
    GuildMemberStore = findByStoreName("GuildMemberStore");
    GuildStore = findByStoreName("GuildStore");
    SelectedGuildStore = findByStoreName("SelectedGuildStore");

    if (!GuildMemberStore) {
      console.warn("[FakeRoles] GuildMemberStore not found — patch skipped");
      return;
    }

    // Core patch: getMember intercept
    // When Discord fetches the current user's membership in any guild,
    // we merge in fake roles from storage before the data hits any renderer.
    _patches.push(
      after("getMember", GuildMemberStore, ([guildId, userId], result) => {
        if (!result) return result;

        const me = UserStore?.getCurrentUser?.();
        if (!me || userId !== me.id) return result; // only spoof self

        const fakeIds = storage.fakeRoles[guildId];
        if (!fakeIds || fakeIds.length === 0) return result;

        // Merge & deduplicate — real roles stay, fake ones stack on top
        const merged = [...new Set([...(result.roles ?? []), ...fakeIds])];
        return { ...result, roles: merged };
      })
    );

    console.log("[FakeRoles] loaded — getMember patched");
  },

  onUnload() {
    _patches.forEach((u) => { try { u?.(); } catch (_) {} });
    _patches.length = 0;
    console.log("[FakeRoles] unloaded — patches cleared");
  },

  settings: Settings,
};
