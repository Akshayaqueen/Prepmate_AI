import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform } from 'react-native';

type Screen = 'login' | 'home' | 'setup' | 'session' | 'results';

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [name, setName] = useState('');

  if (screen === 'login') {
    return (
      <View style={s.safe}>
        <View style={s.loginTop}>
          <View style={s.logo}><Text style={{fontSize:40}}>🎯</Text></View>
          <Text style={s.brand}>PrepMate AI</Text>
          <Text style={s.tag}>Master interviews with AI</Text>
          <View style={s.pills}>
            <View style={s.pill}><Text style={s.pillT}>😰 Anxiety Meter</Text></View>
            <View style={s.pill}><Text style={s.pillT}>⭐ STAR Score</Text></View>
          </View>
        </View>
        <View style={s.form}>
          <TextInput style={s.inp} placeholder="Your name" value={name} onChangeText={setName}/>
          <TouchableOpacity style={s.btn} onPress={()=>setScreen('home')}>
            <Text style={s.btnT}>Get Started →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (screen === 'home') {
    return (
      <View style={s.safe}>
        <ScrollView contentContainerStyle={s.pad}>
          <Text style={s.h1}>Hey, {name||'there'} 👋</Text>
          <Text style={s.sub}>Ready to ace your interview?</Text>
          <View style={s.streak}>
            <Text style={{fontSize:32}}>🔥</Text>
            <View><Text style={s.streakN}>0</Text><Text style={s.muted}>Day Streak</Text></View>
            <View style={s.sep}/>
            <View><Text style={s.lvl}>Lv.1</Text><Text style={s.muted}>0 XP</Text></View>
            <View style={s.sep}/>
            <View><Text style={s.sesN}>0</Text><Text style={s.muted}>Sessions</Text></View>
          </View>
          <TouchableOpacity style={s.cta} onPress={()=>setScreen('setup')}>
            <Text style={{fontSize:26}}>🎤</Text>
            <View style={{flex:1}}>
              <Text style={s.ctaTitle}>Start Practice Session</Text>
              <Text style={s.ctaSub}>AI interview with real-time feedback</Text>
            </View>
            <Text style={{color:'#fff',fontSize:22}}>→</Text>
          </TouchableOpacity>
          <View style={s.tags}>
            <View style={s.ftag}><Text style={s.ftagT}>😰 Anxiety Meter</Text></View>
            <View style={s.ftag}><Text style={s.ftagT}>⭐ STAR Score</Text></View>
            <View style={s.ftag}><Text style={s.ftagT}>✨ AI Rewrite</Text></View>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (screen === 'setup') {
    return (
      <View style={s.safe}>
        <ScrollView contentContainerStyle={s.pad}>
          <Text style={s.h2}>Choose Your Interviewer</Text>
          {[
            {e:'😊',n:'Friendly Coach',d:'Warm, encouraging follow-ups'},
            {e:'🔥',n:'Tough Challenger',d:'Challenges your thinking'},
            {e:'⚙️',n:'Technical Griller',d:'Deep-dives into details'},
          ].map((p,i)=>(
            <TouchableOpacity key={i} style={s.pcard} onPress={()=>setScreen('session')}>
              <Text style={{fontSize:30}}>{p.e}</Text>
              <View style={{flex:1}}><Text style={s.pname}>{p.n}</Text><Text style={s.muted}>{p.d}</Text></View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={()=>setScreen('home')}><Text style={s.back}>← Back</Text></TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (screen === 'session') {
    return (
      <View style={s.safe}>
        <ScrollView contentContainerStyle={s.pad}>
          <View style={s.qcard}>
            <View style={s.qbadge}><Text style={s.qbadgeT}>Behavioral</Text></View>
            <Text style={s.qtext}>Tell me about a time you led a project under a tight deadline. What was the outcome?</Text>
          </View>
          <View style={s.metrics}>
            <View style={s.mbox}><Text style={s.mval}>142</Text><Text style={s.muted}>WPM</Text></View>
            <View style={s.mbox}><Text style={s.mval}>3</Text><Text style={s.muted}>Fillers</Text></View>
            <View style={[s.mbox,{borderColor:'#FF9100'}]}><Text style={[s.mval,{color:'#FF9100'}]}>32</Text><Text style={s.muted}>Anxiety</Text></View>
          </View>
          <View style={s.anxBox}>
            <Text style={s.anxLbl}>😌 Anxiety Meter</Text>
            <View style={s.anxBg}><View style={{height:'100%',width:'32%',backgroundColor:'#4CAF50',borderRadius:5}}/></View>
            <View style={s.anxRow}><Text style={s.muted}>Calm</Text><Text style={s.muted}>Nervous</Text></View>
          </View>
          <TouchableOpacity style={s.btn} onPress={()=>setScreen('results')}>
            <Text style={s.btnT}>End Session →</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={s.safe}>
      <ScrollView contentContainerStyle={s.pad}>
        <Text style={s.h2}>Session Complete! 🎉</Text>
        <View style={s.circle}><Text style={s.circleN}>72</Text><Text style={s.muted}>Confidence</Text></View>
        <View style={s.catBadge}><Text style={s.catT}>Competent</Text></View>

        <View style={s.card}>
          <Text style={s.cardH}>⭐ STAR Score: 68/100</Text>
          {[['📍 Situation','20/25'],['🎯 Task','18/25'],['⚡ Action','22/25'],['📊 Result','8/25']].map(([l,v],i)=>(
            <View key={i} style={s.starRow}><Text style={i===3?{color:'#F44336'}:{}}>{l}</Text><Text style={s.starV}>{v}</Text></View>
          ))}
        </View>

        <View style={s.card}>
          <Text style={s.cardH}>✨ AI Answer Rewriter</Text>
          <Text style={s.muted}>Your answer, restructured better:</Text>
          <View style={s.improved}>
            <Text style={s.impT}>"In my final semester, our team had 3 weeks to deliver a full-stack app. I took ownership of backend architecture, delegated frontend, ran daily standups. Shipped on time with 95% test coverage."</Text>
          </View>
          <Text style={s.check}>✓ Added quantified results</Text>
          <Text style={s.check}>✓ Stronger action verbs</Text>
          <Text style={s.check}>✓ Better STAR structure</Text>
        </View>

        <View style={s.xpBox}><Text style={s.xpT}>+20 XP earned! 🎮</Text></View>
        <TouchableOpacity style={s.btn} onPress={()=>setScreen('home')}>
          <Text style={s.btnT}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#F5F7FA'},
  pad:{padding:20,paddingTop:50},
  loginTop:{flex:1,justifyContent:'center',alignItems:'center',paddingTop:80},
  logo:{width:80,height:80,borderRadius:20,backgroundColor:'#6C63FF',justifyContent:'center',alignItems:'center',marginBottom:16},
  brand:{fontSize:36,fontWeight:'800',color:'#6C63FF'},
  tag:{fontSize:15,color:'#6B7280',marginTop:6},
  pills:{flexDirection:'row',gap:8,marginTop:20},
  pill:{backgroundColor:'#EEF0FF',paddingHorizontal:12,paddingVertical:5,borderRadius:16},
  pillT:{fontSize:12,color:'#6C63FF'},
  form:{backgroundColor:'#fff',borderTopLeftRadius:24,borderTopRightRadius:24,padding:24,paddingTop:28},
  inp:{borderWidth:1,borderColor:'#E5E7EB',borderRadius:12,padding:16,fontSize:16,marginBottom:12},
  btn:{backgroundColor:'#6C63FF',borderRadius:12,padding:16,alignItems:'center',marginTop:12},
  btnT:{color:'#fff',fontSize:16,fontWeight:'700'},
  h1:{fontSize:28,fontWeight:'800',color:'#1A1D26'},
  h2:{fontSize:24,fontWeight:'800',color:'#1A1D26',marginBottom:20,textAlign:'center'},
  sub:{fontSize:15,color:'#6B7280',marginTop:4,marginBottom:24},
  muted:{fontSize:11,color:'#9CA3AF'},
  streak:{flexDirection:'row',alignItems:'center',backgroundColor:'#fff',borderRadius:16,padding:18,gap:14,marginBottom:20},
  streakN:{fontSize:26,fontWeight:'800',color:'#FF6B35'},
  lvl:{fontSize:26,fontWeight:'800',color:'#6C63FF'},
  sesN:{fontSize:22,fontWeight:'700',color:'#1A1D26'},
  sep:{width:1,height:36,backgroundColor:'#E5E7EB'},
  cta:{flexDirection:'row',alignItems:'center',backgroundColor:'#6C63FF',borderRadius:16,padding:18,gap:12,marginBottom:12},
  ctaTitle:{fontSize:16,fontWeight:'700',color:'#fff'},
  ctaSub:{fontSize:12,color:'rgba(255,255,255,0.8)'},
  tags:{flexDirection:'row',gap:8},
  ftag:{backgroundColor:'#EEF0FF',paddingHorizontal:11,paddingVertical:5,borderRadius:14},
  ftagT:{fontSize:11,color:'#6C63FF'},
  pcard:{flexDirection:'row',alignItems:'center',backgroundColor:'#fff',borderRadius:14,padding:16,gap:12,marginBottom:10,borderWidth:1.5,borderColor:'#E5E7EB'},
  pname:{fontSize:16,fontWeight:'700',color:'#1A1D26'},
  back:{color:'#6C63FF',fontWeight:'600',textAlign:'center',marginTop:16,fontSize:15},
  qcard:{backgroundColor:'#fff',borderRadius:16,padding:18,marginBottom:18},
  qbadge:{alignSelf:'flex-start',backgroundColor:'#EEF0FF',paddingHorizontal:10,paddingVertical:4,borderRadius:8,marginBottom:10},
  qbadgeT:{fontSize:12,fontWeight:'600',color:'#6C63FF'},
  qtext:{fontSize:17,fontWeight:'600',color:'#1A1D26',lineHeight:24},
  metrics:{flexDirection:'row',gap:8,marginBottom:16},
  mbox:{flex:1,backgroundColor:'#fff',borderRadius:12,padding:12,alignItems:'center',borderWidth:1.5,borderColor:'#E5E7EB'},
  mval:{fontSize:22,fontWeight:'800',color:'#6C63FF'},
  anxBox:{backgroundColor:'#fff',borderRadius:14,padding:14,marginBottom:18},
  anxLbl:{fontSize:14,fontWeight:'600',marginBottom:8},
  anxBg:{height:10,backgroundColor:'#F3F4F6',borderRadius:5,overflow:'hidden'},
  anxRow:{flexDirection:'row',justifyContent:'space-between',marginTop:4},
  circle:{width:130,height:130,borderRadius:65,backgroundColor:'#EEF0FF',justifyContent:'center',alignItems:'center',alignSelf:'center',marginBottom:10,borderWidth:4,borderColor:'#2979FF30'},
  circleN:{fontSize:44,fontWeight:'800',color:'#2979FF'},
  catBadge:{alignSelf:'center',backgroundColor:'#2979FF15',paddingHorizontal:14,paddingVertical:5,borderRadius:16,marginBottom:20},
  catT:{color:'#2979FF',fontWeight:'700',fontSize:14},
  card:{backgroundColor:'#fff',borderRadius:14,padding:16,marginBottom:14},
  cardH:{fontSize:16,fontWeight:'700',marginBottom:10,color:'#1A1D26'},
  starRow:{flexDirection:'row',justifyContent:'space-between',paddingVertical:7,borderBottomWidth:1,borderBottomColor:'#F3F4F6'},
  starV:{fontWeight:'700',color:'#6C63FF'},
  improved:{backgroundColor:'#E8F5E9',borderRadius:10,padding:12,borderLeftWidth:3,borderLeftColor:'#4CAF50',marginTop:8,marginBottom:10},
  impT:{fontSize:14,color:'#1B5E20',lineHeight:20},
  check:{fontSize:13,color:'#4CAF50',marginVertical:1},
  xpBox:{backgroundColor:'#EEF0FF',borderRadius:12,padding:14,alignItems:'center',marginBottom:14},
  xpT:{fontSize:16,fontWeight:'700',color:'#6C63FF'},
});
