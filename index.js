(function(vendetta) {
  var _p = vendetta.patcher || vendetta.api && vendetta.api.patcher;
  var _s = vendetta.plugin.storage;
  var _fbs = vendetta.metro.findByStoreName;
  var _fbp = vendetta.metro.findByProps;
  var React = vendetta.metro.common.React;
  var RN = vendetta.metro.common.ReactNative;

  if (!_s.fakeRoles) _s.fakeRoles = {};

  var UserStore = _fbs("UserStore");
  var GuildMemberStore = _fbs("GuildMemberStore");
  var GuildStore = _fbs("GuildStore");
  var SelectedGuildStore = _fbs("SelectedGuildStore");

  var ups = [];

  // ── styles ──────────────────────────────────────────────────────────────────
  var S = RN.StyleSheet.create({
    overlay:{flex:1,backgroundColor:"rgba(0,0,0,0.72)",justifyContent:"flex-end"},
    sheet:{backgroundColor:"#1e1f22",borderTopLeftRadius:20,borderTopRightRadius:20,padding:16,paddingBottom:40},
    title:{color:"#fff",fontSize:19,fontWeight:"700",marginBottom:2},
    sub:{color:"#72767d",fontSize:13,marginBottom:14},
    list:{maxHeight:420},
    row:{flexDirection:"row",alignItems:"center",paddingVertical:12,paddingHorizontal:10,borderRadius:10,marginBottom:3},
    rowOn:{backgroundColor:"rgba(255,255,255,0.07)"},
    dot:{width:13,height:13,borderRadius:7,marginRight:12},
    rname:{flex:1,fontSize:15,fontWeight:"500",color:"#dcddde"},
    rnameOn:{color:"#fff"},
    check:{color:"#57f287",fontSize:16,fontWeight:"700"},
    btns:{flexDirection:"row",marginTop:16,gap:8,justifyContent:"flex-end"},
    ghost:{paddingVertical:11,paddingHorizontal:18,borderRadius:10,backgroundColor:"#2b2d31"},
    ghostT:{color:"#b5bac1",fontSize:15,fontWeight:"600"},
    save:{paddingVertical:11,paddingHorizontal:22,borderRadius:10,backgroundColor:"#5865f2"},
    saveT:{color:"#fff",fontSize:15,fontWeight:"700"}
  });

  // ── helpers ──────────────────────────────────────────────────────────────────
  function rc(raw){return raw?"#"+raw.toString(16).padStart(6,"0"):"#99aab5";}

  function getRoles(gid){
    var g=GuildStore&&GuildStore.getGuild&&GuildStore.getGuild(gid);
    if(!g||!g.roles)return[];
    return Object.values(g.roles)
      .filter(function(r){return r.id!==gid;})
      .sort(function(a,b){return b.position-a.position;});
  }

  // ── role picker modal ────────────────────────────────────────────────────────
  function Picker(props){
    var gid=props.guildId;
    var init=(_s.fakeRoles&&_s.fakeRoles[gid])||[];
    var ss=React.useState(init.slice());
    var sel=ss[0],setSel=ss[1];
    var roles=getRoles(gid);
    var gname=(GuildStore&&GuildStore.getGuild&&GuildStore.getGuild(gid)&&GuildStore.getGuild(gid).name)||gid;

    function tog(id){
      var n=sel.slice();
      var i=n.indexOf(id);
      if(i>=0)n.splice(i,1);else n.push(id);
      setSel(n);
    }
    function save(){
      if(!_s.fakeRoles)_s.fakeRoles={};
      _s.fakeRoles[gid]=sel.slice();
      props.onClose();
    }

    var V=RN.View,T=RN.Text,TO=RN.TouchableOpacity,SC=RN.ScrollView,M=RN.Modal;
    return React.createElement(M,{visible:true,transparent:true,animationType:"slide",onRequestClose:props.onClose},
      React.createElement(V,{style:S.overlay},
        React.createElement(V,{style:S.sheet},
          React.createElement(T,{style:S.title},"Fake Roles — "+gname),
          React.createElement(T,{style:S.sub},(sel.length)+" selected · tap to toggle"),
          React.createElement(SC,{style:S.list},
            roles.map(function(r){
              var c=rc(r.color);
              var on=sel.indexOf(r.id)>=0;
              return React.createElement(TO,{key:r.id,style:[S.row,on?S.rowOn:null],onPress:function(){tog(r.id);}},
                React.createElement(V,{style:[S.dot,{backgroundColor:c}]}),
                React.createElement(T,{style:[S.rname,on?S.rnameOn:null]},r.name),
                on?React.createElement(T,{style:S.check},"✓"):null
              );
            })
          ),
          React.createElement(V,{style:S.btns},
            React.createElement(TO,{style:S.ghost,onPress:function(){setSel([]);}},
              React.createElement(T,{style:S.ghostT},"Clear")
            ),
            React.createElement(TO,{style:S.ghost,onPress:props.onClose},
              React.createElement(T,{style:S.ghostT},"Cancel")
            ),
            React.createElement(TO,{style:S.save,onPress:save},
              React.createElement(T,{style:S.saveT},"Save")
            )
          )
        )
      )
    );
  }

  // ── modal mount — wraps ErrorBoundary so it renders above everything ─────────
  var _pickerGuild = null;
  var _setPickerGuild = null;

  function ModalHost(){
    var st=React.useState(null);
    _pickerGuild=st[0]; _setPickerGuild=st[1];
    if(!_pickerGuild)return null;
    return React.createElement(Picker,{
      guildId:_pickerGuild,
      onClose:function(){_setPickerGuild&&_setPickerGuild(null);}
    });
  }

  function openPicker(gid){
    if(_setPickerGuild)_setPickerGuild(gid);
  }

  // hook ErrorBoundary to mount our modal host above the whole app
  var ErrorBoundary = _fbp("ErrorBoundary");
  if(ErrorBoundary){
    var EB = ErrorBoundary.ErrorBoundary || ErrorBoundary;
    if(EB&&EB.prototype&&EB.prototype.render){
      var _owner = null;
      ups.push(_p.after("render", EB.prototype, function(args, res){
        if(!res)return res;
        // only one instance owns the modal host
        if(_owner===null)_owner=this;
        if(_owner!==this)return res;
        return React.createElement(React.Fragment,null,
          res,
          React.createElement(ModalHost,null)
        );
      }));
    }
  }

  // ── patch showSimpleActionSheet to inject "Edit Fake Roles" row ──────────────
  // fires when tapping Message/Call/Video on a profile card
  var ActionSheetUtils = _fbp("showSimpleActionSheet");
  if(ActionSheetUtils){
    ups.push(_p.before("showSimpleActionSheet", ActionSheetUtils, function(args){
      var opts = args[0];
      if(!opts||!opts.options)return;

      // only inject on profile sheets (they have a header with userId/guildId)
      var hdr = opts.header;
      if(!hdr)return;

      // pull userId out of whatever shape the header carries
      var userId = hdr.userId || (hdr.user && hdr.user.id);
      if(!userId)return;

      var me = UserStore&&UserStore.getCurrentUser&&UserStore.getCurrentUser();
      // inject on any user profile — or restrict to self: if(userId!==me.id)return;
      if(!me||userId!==me.id)return;

      var guildId = SelectedGuildStore&&SelectedGuildStore.getGuildId&&SelectedGuildStore.getGuildId();
      if(!guildId)return;

      var existing = (_s.fakeRoles&&_s.fakeRoles[guildId])||[];
      var label = existing.length>0
        ? "✏️ Edit Fake Roles ("+existing.length+" active)"
        : "✏️ Add Fake Roles";

      opts.options.push({
        label: label,
        onPress: function(){ openPicker(guildId); }
      });
    }));
  }

  // ── core getMember patch — injects fake role IDs display-side ────────────────
  if(GuildMemberStore){
    ups.push(_p.after("getMember", GuildMemberStore, function(args, res){
      if(!res)return res;
      var me=UserStore&&UserStore.getCurrentUser&&UserStore.getCurrentUser();
      if(!me||args[1]!==me.id)return res;
      var fake=_s.fakeRoles&&_s.fakeRoles[args[0]];
      if(!fake||!fake.length)return res;
      var ex=res.roles||[];
      return Object.assign({},res,{roles:ex.concat(fake.filter(function(id){return ex.indexOf(id)<0;}))});
    }));
  }

  return {
    onLoad:function(){},
    onUnload:function(){
      _owner=null;_pickerGuild=null;_setPickerGuild=null;
      ups.forEach(function(u){try{u&&u();}catch(_){}});
      ups.length=0;
    },
    Settings:function(){
      return React.createElement(RN.View,{style:{flex:1,backgroundColor:"#111214",padding:20}},
        React.createElement(RN.Text,{style:{color:"#fff",fontSize:18,fontWeight:"700",marginBottom:8}},"FakeRoles"),
        React.createElement(RN.Text,{style:{color:"#72767d",fontSize:14,lineHeight:21}},
          "Tap your own profile picture in a server → long press a message or tap yourself in the member list → you'll see \"✏️ Add Fake Roles\" in the action sheet.\n\nSaved roles show up on your profile card instantly."
        )
      );
    }
  };
})
