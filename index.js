// Kettu/Vendetta IIFE plugin — FakeRoles
// No imports. All APIs from vendetta global injected by Kettu eval context.
// eval wrapper: vendetta=>{ return <this file> }

(function () {
  "use strict";

  // ── pulled from vendetta global at load time ───────────────────────────────
  var _patcher, _findByStoreName, _storage, _React, _RN;
  var _patches = [];

  // ── stores ─────────────────────────────────────────────────────────────────
  var UserStore, GuildMemberStore, GuildStore, SelectedGuildStore;

  // ── helpers ────────────────────────────────────────────────────────────────
  function roleColor(raw) {
    if (!raw) return "#99aab5";
    return "#" + raw.toString(16).padStart(6, "0");
  }

  function getSortedRoles(guildId) {
    var guild = GuildStore && GuildStore.getGuild && GuildStore.getGuild(guildId);
    if (!guild || !guild.roles) return [];
    return Object.values(guild.roles)
      .filter(function (r) { return r.id !== guildId; })
      .sort(function (a, b) { return b.position - a.position; });
  }

  // ── Settings component (pure RN, no Discord Form components) ───────────────
  function Settings() {
    var useState = _React.useState;
    var View = _RN.View, Text = _RN.Text, TouchableOpacity = _RN.TouchableOpacity,
        ScrollView = _RN.ScrollView, Modal = _RN.Modal, StyleSheet = _RN.StyleSheet;

    var _pickerState = useState(null);
    var pickerGuild = _pickerState[0], setPickerGuild = _pickerState[1];

    var guilds = [];
    if (GuildStore && GuildStore.getGuilds) {
      guilds = Object.values(GuildStore.getGuilds())
        .sort(function (a, b) { return a.name.localeCompare(b.name); });
    }

    var currentGuildId = SelectedGuildStore && SelectedGuildStore.getGuildId
      ? SelectedGuildStore.getGuildId() : null;

    function fakeCount(gid) {
      var fr = _storage.fakeRoles;
      return (fr && fr[gid] && fr[gid].length) || 0;
    }

    // ── RolePicker modal ─────────────────────────────────────────────────────
    function RolePicker(props) {
      var gid = props.guildId;
      var fr = (_storage.fakeRoles && _storage.fakeRoles[gid]) || [];
      var _selState = useState(fr.slice());
      var selected = _selState[0], setSelected = _selState[1];

      var roles = getSortedRoles(gid);
      var guildName = (GuildStore && GuildStore.getGuild && GuildStore.getGuild(gid))
        ? GuildStore.getGuild(gid).name : gid;

      function toggle(id) {
        var idx = selected.indexOf(id);
        var next = selected.slice();
        if (idx >= 0) next.splice(idx, 1);
        else next.push(id);
        setSelected(next);
      }

      function save() {
        if (!_storage.fakeRoles) _storage.fakeRoles = {};
        _storage.fakeRoles[gid] = selected.slice();
        props.onClose();
      }

      return _React.createElement(Modal, {
        visible: true,
        transparent: true,
        animationType: "slide",
        onRequestClose: props.onClose
      },
        _React.createElement(View, { style: S.overlay },
          _React.createElement(View, { style: S.sheet },
            _React.createElement(Text, { style: S.sheetTitle }, "Fake Roles"),
            _React.createElement(Text, { style: S.sheetSub }, guildName),
            _React.createElement(ScrollView, { style: { maxHeight: 400 } },
              roles.map(function (role) {
                var color = roleColor(role.color);
                var on = selected.indexOf(role.id) >= 0;
                return _React.createElement(TouchableOpacity, {
                  key: role.id,
                  style: [S.roleRow, on ? S.roleRowOn : null],
                  onPress: function () { toggle(role.id); }
                },
                  _React.createElement(View, { style: [S.dot, { backgroundColor: color }] }),
                  _React.createElement(Text, { style: [S.roleName, { color: on ? color : "#b5bac1" }] }, role.name),
                  on ? _React.createElement(Text, { style: S.check }, "✓") : null
                );
              })
            ),
            _React.createElement(View, { style: S.btnRow },
              _React.createElement(TouchableOpacity, { style: S.btnGhost, onPress: function () { setSelected([]); } },
                _React.createElement(Text, { style: S.btnGhostTxt }, "Clear")
              ),
              _React.createElement(TouchableOpacity, { style: S.btnGhost, onPress: props.onClose },
                _React.createElement(Text, { style: S.btnGhostTxt }, "Cancel")
              ),
              _React.createElement(TouchableOpacity, { style: S.btnPrimary, onPress: save },
                _React.createElement(Text, { style: S.btnPrimaryTxt }, "Save")
              )
            )
          )
        )
      );
    }

    // ── main settings render ─────────────────────────────────────────────────
    return _React.createElement(View, { style: S.settingsRoot },
      _React.createElement(Text, { style: S.settingsTitle }, "FakeRoles"),
      _React.createElement(Text, { style: S.settingsSub },
        "Pick a server and choose roles to show on your profile. Only you see this."
      ),
      currentGuildId
        ? _React.createElement(TouchableOpacity, {
            style: S.quickBtn,
            onPress: function () { setPickerGuild(currentGuildId); }
          },
            _React.createElement(Text, { style: S.quickBtnTxt }, "✏️  Edit roles for current server")
          )
        : null,
      _React.createElement(Text, { style: S.sectionLabel }, "ALL SERVERS"),
      _React.createElement(ScrollView, null,
        guilds.map(function (guild) {
          var count = fakeCount(guild.id);
          return _React.createElement(TouchableOpacity, {
            key: guild.id,
            style: S.guildRow,
            onPress: function () { setPickerGuild(guild.id); }
          },
            _React.createElement(View, { style: S.guildInfo },
              _React.createElement(Text, { style: S.guildName }, guild.name),
              count > 0
                ? _React.createElement(Text, { style: S.guildBadge },
                    count + " role" + (count !== 1 ? "s" : "") + " faked"
                  )
                : null
            ),
            _React.createElement(Text, { style: S.guildArrow }, "›")
          );
        })
      ),
      pickerGuild
        ? _React.createElement(RolePicker, {
            guildId: pickerGuild,
            onClose: function () { setPickerGuild(null); }
          })
        : null
    );
  }

  // ── styles ─────────────────────────────────────────────────────────────────
  var S;
  function initStyles(StyleSheet) {
    S = StyleSheet.create({
      overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" },
      sheet: { backgroundColor: "#1e1f22", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 36, maxHeight: "80%" },
      sheetTitle: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 2 },
      sheetSub: { color: "#72767d", fontSize: 13, marginBottom: 12 },
      roleRow: { flexDirection: "row", alignItems: "center", paddingVertical: 11, paddingHorizontal: 10, borderRadius: 10, marginBottom: 3 },
      roleRowOn: { backgroundColor: "rgba(255,255,255,0.06)" },
      dot: { width: 13, height: 13, borderRadius: 6, marginRight: 11 },
      roleName: { flex: 1, fontSize: 15, fontWeight: "500" },
      check: { color: "#57f287", fontSize: 16, fontWeight: "700" },
      btnRow: { flexDirection: "row", marginTop: 14, justifyContent: "flex-end", gap: 8 },
      btnGhost: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: "#2b2d31" },
      btnGhostTxt: { color: "#b5bac1", fontSize: 15, fontWeight: "600" },
      btnPrimary: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, backgroundColor: "#5865f2" },
      btnPrimaryTxt: { color: "#fff", fontSize: 15, fontWeight: "700" },
      settingsRoot: { flex: 1, backgroundColor: "#111214", padding: 16 },
      settingsTitle: { color: "#fff", fontSize: 22, fontWeight: "800", marginBottom: 4 },
      settingsSub: { color: "#72767d", fontSize: 13, lineHeight: 18, marginBottom: 16 },
      quickBtn: { backgroundColor: "#5865f2", borderRadius: 12, padding: 14, alignItems: "center", marginBottom: 20 },
      quickBtnTxt: { color: "#fff", fontSize: 15, fontWeight: "700" },
      sectionLabel: { color: "#72767d", fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginBottom: 8 },
      guildRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#1e1f22", borderRadius: 12, padding: 14, marginBottom: 6 },
      guildInfo: { flex: 1 },
      guildName: { color: "#dcddde", fontSize: 15, fontWeight: "600" },
      guildBadge: { color: "#57f287", fontSize: 12, marginTop: 2 },
      guildArrow: { color: "#72767d", fontSize: 20 }
    });
  }

  // ── plugin export ───────────────────────────────────────────────────────────
  return {
    onLoad: function (vendetta) {
      // grab APIs from the injected vendetta global
      _patcher = vendetta.patcher;
      _findByStoreName = vendetta.metro.findByStoreName;
      _storage = vendetta.plugin.storage;
      _React = vendetta.metro.common.React;
      _RN = vendetta.metro.common.ReactNative;

      if (!_storage.fakeRoles) _storage.fakeRoles = {};

      // init styles now that RN is available
      initStyles(_RN.StyleSheet);

      // resolve stores
      UserStore = _findByStoreName("UserStore");
      GuildMemberStore = _findByStoreName("GuildMemberStore");
      GuildStore = _findByStoreName("GuildStore");
      SelectedGuildStore = _findByStoreName("SelectedGuildStore");

      if (!GuildMemberStore) {
        console.warn("[FakeRoles] GuildMemberStore not found");
        return;
      }

      // core patch — inject fake roles into getMember for self only
      var unpatch = _patcher.after("getMember", GuildMemberStore, function (args, result) {
        if (!result) return result;
        var me = UserStore && UserStore.getCurrentUser && UserStore.getCurrentUser();
        if (!me || args[1] !== me.id) return result;

        var fakeIds = _storage.fakeRoles && _storage.fakeRoles[args[0]];
        if (!fakeIds || fakeIds.length === 0) return result;

        var existing = result.roles || [];
        var merged = existing.concat(
          fakeIds.filter(function (id) { return existing.indexOf(id) < 0; })
        );
        return Object.assign({}, result, { roles: merged });
      });

      _patches.push(unpatch);
      console.log("[FakeRoles] loaded");
    },

    onUnload: function () {
      _patches.forEach(function (u) { try { u && u(); } catch (_) {} });
      _patches.length = 0;
      console.log("[FakeRoles] unloaded");
    },

    Settings: Settings
  };
})();
