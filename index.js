(function(vendetta) {
  var _p = vendetta.patcher;
  var _s = vendetta.plugin.storage;
  var _fbs = vendetta.metro.findByStoreName;
  var React = vendetta.metro.common.React;
  var RN = vendetta.metro.common.ReactNative;

  if (!_s.fakeRoles) _s.fakeRoles = {};

  var UserStore = _fbs("UserStore");
  var GuildMemberStore = _fbs("GuildMemberStore");
  var GuildStore = _fbs("GuildStore");
  var SelectedGuildStore = _fbs("SelectedGuildStore");

  var S = RN.StyleSheet.create({
    overlay:{flex:1,backgroundColor:"rgba(0,0,0,0.65)",justifyContent:"flex-end"},
    sheet:{backgroundColor:"#1e1f22",borderTopLeftRadius:20,borderTopRightRadius:20,padding:16,paddingBottom:36},
    title:{color:"#fff",fontSize:20,fontWeight:"700",marginBottom:2},
    sub:{color:"#72767d",fontSize:13,marginBottom:12},
    list:{maxHeight:400},
    row:{flexDirection:"row",alignItems:"center",paddingVertical:11,paddingHorizontal:10,borderRadius:10,marginBottom:3},
    rowOn:{backgroundColor:"rgba(255,255,255,0.06)"},
    dot:{width:13,height:13,borderRadius:6,marginRight:11},
    rname:{flex:1,fontSize:15,fontWeight:"500"},
    check:{color:"#57f287",fontSize:16,fontWeight:"700"},
    btns:{flexDirection:"row",marginTop:14,justifyContent:"flex-end",gap:8},
    ghost:{paddingVertical:10,paddingHorizontal:16,borderRadius:10,backgroundColor:"#2b2d31"},
    ghostTxt:{color:"#b5bac1",fontSize:15,fontWeight:"600"},
    primary:{paddingVertical:10,paddingHorizontal:20,borderRadius:10,backgroundColor:"#5865f2"},
    primaryTxt:{color:"#fff",fontSize:15,fontWeight:"700"},
    root:{flex:1,backgroundColor:"#111214",padding:16},
    stitle:{color:"#fff",fontSize:22,fontWeight:"800",marginBottom:4},
    ssub:{color:"#72767d",fontSize:13,lineHeight:18,marginBottom:16},
    qbtn:{backgroundColor:"#5865f2",borderRadius:12,padding:14,alignItems:"center",marginBottom:20},
    qbtnTxt:{color:"#fff",fontSize:15,fontWeight:"700"},
    sec:{color:"#72767d",fontSize:11,fontWeight:"700",letterSpacing:0.8,marginBottom:8},
    grow:{flexDirection:"row",alignItems:"center",backgroundColor:"#1e1f22",borderRadius:12,padding:14,marginBottom:6},
    gi:{flex:1},
    gn:{color:"#dcddde",fontSize:15,fontWeight:"600"},
    gb:{color:"#57f287",fontSize:12,marginTop:2},
    ga:{color:"#72767d",fontSize:20}
  });

  function rc(raw){return raw?"#"+raw.toString(16).padStart(6,"0"):"#99aab5";}

  function getRoles(gid){
    var g=GuildStore&&GuildStore.getGuild&&GuildStore.getGuild(gid);
    if(!g||!g.roles)return[];
    return Object.values(g.roles).filter(function(r){return r.id!==gid;}).sort(function(a,b){return b.position-a.position;});
  }

  function Picker(props){
    var gid=props.guildId;
    var init=(_s.fakeRoles&&_s.fakeRoles[gid])||[];
    var ss=React.useState(init.slice());
    var sel=ss[0],setSel=ss[1];
    var roles=getRoles(gid);
    var gname=(GuildStore&&GuildStore.getGuild&&GuildStore.getGuild(gid)&&GuildStore.getGuild(gid).name)||gid;
    function tog(id){var n=sel.slice();var i=n.indexOf(id);if(i>=0)n.splice(i,1);else n.push(id);setSel(n);}
    function save(){if(!_s.fakeRoles)_s.fakeRoles={};_s.fakeRoles[gid]=sel.slice();props.onClose();}
    var V=RN.View,T=RN.Text,TO=RN.TouchableOpacity,SC=RN.ScrollView,M=RN.Modal;
    return React.createElement(M,{visible:true,transparent:true,animationType:"slide",onRequestClose:props.onClose},
      React.createElement(V,{style:S.overlay},
        React.createElement(V,{style:S.sheet},
          React.createElement(T,{style:S.title},"Fake Roles"),
          React.createElement(T,{style:S.sub},gname),
          React.createElement(SC,{style:S.list},
            roles.map(function(r){
              var c=rc(r.color);var on=sel.indexOf(r.id)>=0;
              return React.createElement(TO,{key:r.id,style:[S.row,on?S.rowOn:null],onPress:function(){tog(r.id);}},
                React.createElement(V,{style:[S.dot,{backgroundColor:c}]}),
                React.createElement(T,{style:[S.rname,{color:on?c:"#b5bac1"}]},r.name),
                on?React.createElement(T,{style:S.check},"✓"):null
              );
            })
          ),
          React.createElement(V,{style:S.btns},
            React.createElement(TO,{style:S.ghost,onPress:function(){setSel([]);}},React.createElement(T,{style:S.ghostTxt},"Clear")),
            React.createElement(TO,{style:S.ghost,onPress:props.onClose},React.createElement(T,{style:S.ghostTxt},"Cancel")),
            React.createElement(TO,{style:S.primary,onPress:save},React.createElement(T,{style:S.primaryTxt},"Save"))
          )
        )
      )
    );
  }

  function Settings(){
    var V=RN.View,T=RN.Text,TO=RN.TouchableOpacity,SC=RN.ScrollView;
    var ps=React.useState(null);var pg=ps[0],setPg=ps[1];
    var guilds=GuildStore&&GuildStore.getGuilds?Object.values(GuildStore.getGuilds()).sort(function(a,b){return a.name.localeCompare(b.name);}):[];
    var cur=SelectedGuildStore&&SelectedGuildStore.getGuildId?SelectedGuildStore.getGuildId():null;
    function fc(gid){return(_s.fakeRoles&&_s.fakeRoles[gid]&&_s.fakeRoles[gid].length)||0;}
    return React.createElement(V,{style:S.root},
      React.createElement(T,{style:S.stitle},"FakeRoles"),
      React.createElement(T,{style:S.ssub},"Pick a server, choose roles to show on your profile. Display only."),
      cur?React.createElement(TO,{style:S.qbtn,onPress:function(){setPg(cur);}},React.createElement(T,{style:S.qbtnTxt},"✏️  Edit roles for current server")):null,
      React.createElement(T,{style:S.sec},"ALL SERVERS"),
      React.createElement(SC,null,
        guilds.map(function(guild){
          var cnt=fc(guild.id);
          return React.createElement(TO,{key:guild.id,style:S.grow,onPress:function(){setPg(guild.id);}},
            React.createElement(V,{style:S.gi},
              React.createElement(T,{style:S.gn},guild.name),
              cnt>0?React.createElement(T,{style:S.gb},cnt+" role"+(cnt!==1?"s":"")+" faked"):null
            ),
            React.createElement(T,{style:S.ga},"›")
          );
        })
      ),
      pg?React.createElement(Picker,{guildId:pg,onClose:function(){setPg(null);}}):null
    );
  }

  var ups=[];
  if(GuildMemberStore){
    ups.push(_p.after("getMember",GuildMemberStore,function(args,res){
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
    onUnload:function(){ups.forEach(function(u){try{u&&u();}catch(_){}});ups.length=0;},
    Settings:Settings
  };
})
