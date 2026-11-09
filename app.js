import * as THREE from './vendor/three.module.js';

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const state={name:'Elaris Moonwhisper',ancestry:'Sylvan',build:46,height:52,age:30,skin:0,face:0,hairStyle:2,hairColor:0,eye:0,ear:78,mark:'Moon runes',garment:0,robe:0,aura:0,auraPower:55,relic:0};
const skinColors=['#e9c5ad','#d5a58a','#bd8062','#86563f','#e0ba91','#9b765f'];
const hairColors=['#171418','#b89c6d','#75443b','#c2beb9','#4f302d','#596c5b','#30384b'];
const eyeColors=['#8aa58c','#8197a8','#b59a62','#927991','#a8c0bb','#aa684e'];
const robeColors=['#292d2a','#303242','#49272e','#59452f','#293841','#384034','#453449'];
const auraColors=['#86a88e','#8ea8c0','#a78ab6','#c19b68','#a66d75'];
const renderer=new THREE.WebGLRenderer({canvas:$('#world'),antialias:true,alpha:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x17231b,.045);
const camera=new THREE.PerspectiveCamera(33,innerWidth/innerHeight,.1,80);camera.position.set(0,0.12,8.5);camera.lookAt(0,0,0);
scene.add(new THREE.HemisphereLight(0xc9e2d4,0x443222,2.1));
const key=new THREE.DirectionalLight(0xffe6c5,3.2);key.position.set(-3.5,5,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-4;key.shadow.camera.right=4;key.shadow.camera.top=5;key.shadow.camera.bottom=-4;scene.add(key);
const fill=new THREE.PointLight(0xa6d5bd,42,12,2);fill.position.set(3,1.2,3);scene.add(fill);
const rim=new THREE.PointLight(0x8bc4a8,55,14,2);rim.position.set(-2.2,2.3,-2);scene.add(rim);
const goldLight=new THREE.PointLight(0xe4b872,30,7,2);goldLight.position.set(1,-.2,2);scene.add(goldLight);
const floor=new THREE.Mesh(new THREE.CircleGeometry(5,80),new THREE.MeshStandardMaterial({color:0x18251d,roughness:.93,metalness:.08}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.63;floor.receiveShadow=true;scene.add(floor);
const plinth=new THREE.Mesh(new THREE.CylinderGeometry(.9,.98,.12,64),new THREE.MeshStandardMaterial({color:0x314033,metalness:.44,roughness:.38}));plinth.position.set(0,-1.57,0);plinth.castShadow=true;plinth.receiveShadow=true;scene.add(plinth);
const plinthRing=new THREE.Mesh(new THREE.TorusGeometry(.86,.012,8,90),new THREE.MeshBasicMaterial({color:0xc9ae71}));plinthRing.rotation.x=Math.PI/2;plinthRing.position.y=-1.50;scene.add(plinthRing);
// An illuminated moon gate and layered silhouettes give the atelier its enchanted depth.
const gate=new THREE.Mesh(new THREE.TorusGeometry(1.95,.045,12,90,Math.PI),new THREE.MeshStandardMaterial({color:0x566d59,emissive:0x243b2b,emissiveIntensity:.65,metalness:.38,roughness:.42}));gate.position.set(0,.27,-2.5);scene.add(gate);
const gateBase=new THREE.Mesh(new THREE.TorusGeometry(1.94,.012,6,90,Math.PI),new THREE.MeshBasicMaterial({color:0xc4b67f,transparent:true,opacity:.62}));gateBase.position.set(0,.27,-2.49);scene.add(gateBase);
for(let i=0;i<2;i++){const x=i?2.45:-2.45;const tree=new THREE.Mesh(new THREE.ConeGeometry(.68,3.8,7),new THREE.MeshStandardMaterial({color:i?0x263e30:0x1d3328,roughness:1}));tree.position.set(x,-.3,-1.5);scene.add(tree);const tr=new THREE.Mesh(new THREE.CylinderGeometry(.08,.14,1.4,8),new THREE.MeshStandardMaterial({color:0x332c20,roughness:1}));tr.position.set(x,-1.25,-1.5);scene.add(tr)}
const stars=new THREE.Group();scene.add(stars);for(let i=0;i<100;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(Math.random()*.018+.006,6,5),new THREE.MeshBasicMaterial({color:i%4===0?0xe9d290:0xb8d3b0,transparent:true,opacity:.25+Math.random()*.6}));m.position.set((Math.random()-.5)*8,Math.random()*5-1.6,-1.8-Math.random()*3);m.userData.phase=Math.random()*6.28;stars.add(m)}
const floaters=new THREE.Group();scene.add(floaters);for(let i=0;i<28;i++){const g=new THREE.Group();const p=new THREE.Mesh(new THREE.OctahedronGeometry(.025+Math.random()*.025,0),new THREE.MeshBasicMaterial({color:[0xb2d9a4,0xd4bc7d,0xabc8df][i%3],transparent:true,opacity:.68}));g.add(p);g.position.set((Math.random()-.5)*4,Math.random()*4-1.5,(Math.random()-.5)*1.8);g.userData={phase:Math.random()*6.28,speed:.3+Math.random()*.65,origin:g.position.clone()};floaters.add(g)}
const root=new THREE.Group();scene.add(root);let actor=new THREE.Group();root.add(actor);let auraGroup=new THREE.Group();scene.add(auraGroup);let time=0,autoRotate=true,dragging=false,prevX=0,prevY=0,targetRot=0,targetTilt=0,zoom=8.5;
const mat=(color,roughness=.65,metalness=.02,extras={})=>new THREE.MeshStandardMaterial({color,roughness,metalness,...extras});
function mesh(geo,material,parent=actor,pos=[0,0,0],scale=[1,1,1]){const m=new THREE.Mesh(geo,material);m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function ball(parent,pos,scale,color,rough=.7,metal=0){return mesh(new THREE.SphereGeometry(1,28,20),mat(color,rough,metal),parent,pos,scale)}
function line(parent,points,color,r=.009,material=null){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return mesh(new THREE.TubeGeometry(curve,Math.max(14,points.length*7),r,7,false),material||mat(color,.35,.42),parent)}
function limb(parent,a,b,r1,r2,color){const d=new THREE.Vector3(...b).sub(new THREE.Vector3(...a));const m=mesh(new THREE.CylinderGeometry(r2,r1,d.length(),20),mat(color,.74),parent);m.position.set((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m}
function garmentPoints(variant){return variant===1?[[.18,.7],[.3,.28],[.29,-.12],[.39,-.35],[.62,-1.34],[.54,-1.4],[.18,-1.39]]:variant===2?[[.18,.68],[.34,.3],[.31,-.1],[.5,-.35],[.7,-1.33],[.6,-1.4],[.18,-1.38]]:[[.18,.7],[.31,.27],[.29,-.16],[.43,-.35],[.61,-1.34],[.53,-1.4],[.18,-1.39]]}
const faceProfiles=[{head:[.32,.4,.27],cheek:[.1,.065,.045],eye:[.091,.055,.033],jaw:.31},{head:[.3,.42,.26],cheek:[.112,.069,.046],eye:[.086,.05,.032],jaw:.285},{head:[.35,.4,.29],cheek:[.11,.075,.05],eye:[.094,.056,.035],jaw:.34},{head:[.31,.42,.265],cheek:[.095,.058,.042],eye:[.086,.048,.03],jaw:.36}]
function makeActor(){
 actor.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material.dispose()}});root.remove(actor);actor=new THREE.Group();root.add(actor);
 const age=Math.max(0,Math.min(1,(state.age-28)/72)), face=faceProfiles[state.face]||faceProfiles[0];
 const ancestryTint={Revenant:'#aaa99f',Dwarven:'#bd9070',Orc:'#75846a',Vampire:'#ded0c4'}[state.ancestry];
 const skinColor=ancestryTint?new THREE.Color(skinColors[state.skin]).lerp(new THREE.Color(ancestryTint),.36):skinColors[state.skin];
 const skin=mat(skinColor,.76),gold=mat('#bda36d',.3,.65),robe=mat(robeColors[state.robe],.62,.12),dark=mat('#201e25',.48),hair=mat(hairColors[state.hairColor],.38,.04),eye=mat(eyeColors[state.eye],.3,.12,{emissive:new THREE.Color(eyeColors[state.eye]),emissiveIntensity:.18}),white=mat('#e6ded1',.36),lip=mat('#805953',.58),cloth=mat('#c5a873',.7);
 const ancestryScale=state.ancestry==='Dwarven'?1.09:state.ancestry==='Orc'?1.07:1;const width=(1+(state.build-50)*.0026)*ancestryScale,height=(1+(state.height-50)*.0032)*(state.ancestry==='Dwarven'?.88:1);actor.scale.set(width,height,width);
 // boots, legs, and layered robe silhouette
 for(const s of [-1,1]){ball(actor,[s*.18,-1.42,.09],[.145,.22,.21],dark,.5);ball(actor,[s*.18,-1.53,.2],[.16,.09,.28],mat('#342d29',.55,.09));limb(actor,[s*.17,-.55,0],[s*.17,-1.38,.03],.15,.095,skin);}
 const robeGroup=new THREE.Group();actor.add(robeGroup);const pts=garmentPoints(state.garment).map(([r,y])=>new THREE.Vector2(r,y));const gown=mesh(new THREE.LatheGeometry(pts,48),robe,robeGroup,[0,0,0]);gown.material.side=THREE.DoubleSide;
 // golden center seam and embroidered hems
 line(robeGroup,[[0,.54,.24],[0,.25,.34],[0,-.18,.34],[0,-.6,.46],[0,-1.34,.57]],'#d5bd85',.008,gold);
 for(let s of [-1,1]){line(robeGroup,[[s*.34,-.88,.37],[s*.4,-.98,.37],[s*.47,-1.08,.38],[s*.53,-1.18,.36],[s*.58,-1.27,.34]],'#d5bd85',.009,gold);}
 // bodice, shoulders and flowing sleeves
 ball(actor,[0,.24,.02],[.3,.43,.2],robeColors[state.robe],.62,.06);
 ball(actor,[0,-.1,.035],[.33,.16,.19],mat('#7d6443',.48,.24));
 mesh(new THREE.TorusGeometry(.31,.022,8,44),gold,actor,[0,-.08,.03],[1,.52,.7]);
 for(const s of [-1,1]){ball(actor,[s*.26,.48,0],[.18,.15,.19],robeColors[state.robe],.48,.13);limb(actor,[s*.29,.44,0],[s*.42,-.22,.04],.14,.095,robeColors[state.robe]);ball(actor,[s*.42,-.22,.04],[.105,.12,.1],skin);limb(actor,[s*.42,-.18,.04],[s*.48,-.62,.12],.095,.075,skin);ball(actor,[s*.49,-.65,.12],[.09,.12,.09],skin);ball(actor,[s*.49,-.57,.14],[.11,.05,.09],gold,.28,.7)}
 // neck and expressive face
 limb(actor,[0,.54,0],[0,.78,0],.115,.11,skin);ball(actor,[0,1.06,0],face.head,skin);
  // Jaw and cheek planes give each face silhouette a distinct, less doll-like profile.
  ball(actor,[0,.9,.025],[face.jaw*.68,.16,.225],skin);
 // cheek planes and nose bridge
 for(const s of [-1,1])ball(actor,[s*.18,.99,.207],face.cheek,skin,.82);
 ball(actor,[0,1.04,.268],[.045,.085,.045],skin);ball(actor,[0,.98,.303],[.045,.028,.038],mat('#b68470',.72));
 ball(actor,[0,.86,.27],[.083,.022,.025],lip);line(actor,[[-.075,.86,.277],[0,.85,.285],[.075,.86,.277]],'#713e3b',.006);
 for(const s of [-1,1]){const eyeScale=1-age*.16;ball(actor,[s*.116,1.105,.232],[face.eye[0]*eyeScale,face.eye[1]*eyeScale,face.eye[2]],white,.28);ball(actor,[s*.116,1.105,.257],[.033,.043,.018],eye,.24,.08);ball(actor,[s*.116,1.105,.274],[.014,.028,.008],dark,.22);ball(actor,[s*.125,1.122,.281],[.009,.009,.006],white,.2);line(actor,[[s*.2,1.17,.23],[s*.14,1.19,.25],[s*.08,1.18,.25]],'#44312d',.014,mat(hairColors[state.hairColor],.4));}
 if(age>.18){const wrinkle=mat('#765d50',.9,0,{transparent:true,opacity:.12+age*.18});for(const s of [-1,1]){line(actor,[[s*.21,1.075,.23],[s*.245,1.065,.225],[s*.27,1.05,.21]],'#765d50',.004+age*.003,wrinkle);line(actor,[[s*.105,1.19,.235],[s*.14,1.205,.234],[s*.175,1.19,.23]],'#765d50',.004+age*.003,wrinkle);}line(actor,[[-.12,.91,.251],[0,.895,.275],[.12,.91,.251]],'#765d50',.004+age*.003,wrinkle);}
  // pointed ears become longer with the ear slider
 const earLength=.11+state.ear*.0038;for(const s of [-1,1]){const ear=mesh(new THREE.ConeGeometry(.095,earLength,20),skin,actor,[s*.335,1.08,0]);ear.rotation.z=s===1?-Math.PI/2:Math.PI/2;ear.rotation.x=Math.PI/2;ball(actor,[s*.33,1.08,.055],[.07,.08,.04],skin);}
 // hair cap, fringe, braids and crown silhouette vary by style
 ball(actor,[0,1.34,-.005],[.337,.25,.3],hair,.38,.06);
 const fringeCount=state.hairStyle===0?3:state.hairStyle===1?5:4;for(let i=0;i<fringeCount;i++){const x=(i-(fringeCount-1)/2)*.13;const lock=ball(actor,[x,1.29,.22],[.085,.12,.08],hair,.33,.06);lock.rotation.z=-x*.55;}
 if(state.hairStyle===0){for(let s of [-1,1]){ball(actor,[s*.32,.94,-.02],[.09,.38,.09],hair,.35,.05);ball(actor,[s*.32,.66,-.02],[.06,.08,.07],gold,.28,.7)}}
 if(state.hairStyle===1){for(let s of [-1,1]){ball(actor,[s*.28,1.34,-.06],[.16,.16,.16],hair,.33,.05);ball(actor,[s*.31,1.34,.07],[.1,.1,.1],gold,.25,.7)}}
 if(state.hairStyle===2||state.hairStyle===3){for(let s of [-1,1]){ball(actor,[s*.29,.83,-.025],[.09,.49,.09],hair,.36,.04);for(let j=0;j<4;j++)ball(actor,[s*.29,.55+j*.15,.06],[.045,.06,.045],j%2?hair:gold,.34,.25)}}
 if(state.hairStyle===4){ball(actor,[0,1.53,-.01],[.22,.2,.22],hair,.34,.05);mesh(new THREE.TorusGeometry(.23,.025,8,30),gold,actor,[0,1.44,.01]);}
 if(state.hairStyle===5){for(let s of [-1,1])ball(actor,[s*.34,1.4,-.01],[.15,.13,.14],hair,.33,.06);}
 if(state.hairStyle===6){for(let s of [-1,1]){ball(actor,[s*.3,.79,-.16],[.12,.62,.09],hair,.36,.04);ball(actor,[s*.3,.19,-.16],[.075,.1,.07],gold,.28,.7);}for(let i=0;i<5;i++)ball(actor,[(i-2)*.11,.61,-.065],[.045,.39,.07],hair,.4,.03);}
 if(state.hairStyle===7){for(let i=0;i<18;i++){const a=i/18*Math.PI*2;const y=.97+(i%3)*.17;const r=.32;ball(actor,[Math.cos(a)*r,y,Math.sin(a)*.27],[.105,.11,.105],hair,.39,.04);}for(let i=0;i<5;i++)ball(actor,[(i-2)*.12,1.47,.02],[.11,.1,.1],hair,.39,.04);}
 if(state.hairStyle===8){const sweep=ball(actor,[.1,1.34,.2],[.29,.12,.1],hair,.33,.05);sweep.rotation.z=-.42;const lock=ball(actor,[.27,1.2,.2],[.1,.18,.08],hair,.34,.05);lock.rotation.z=-.38;}
 if(state.hairStyle===9){for(let s of [-1,1]){ball(actor,[s*.3,.76,-.07],[.095,.65,.1],hair,.34,.05);ball(actor,[s*.3,.23,-.065],[.07,.1,.075],gold,.28,.65);}}
 if(state.hairStyle===10){for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const petal=ball(actor,[Math.cos(a)*.18,1.51,Math.sin(a)*.16],[.075,.19,.055],hair,.34,.04);petal.rotation.z=-Math.cos(a)*.48;}ball(actor,[0,1.55,.18],[.085,.08,.04],gold,.27,.65);}
 if(state.hairStyle===11){ball(actor,[0,1.57,-.12],[.19,.18,.16],hair,.33,.05);for(let s of [-1,1]){ball(actor,[s*.31,.8,-.12],[.09,.57,.09],hair,.35,.04);ball(actor,[s*.31,.27,-.11],[.065,.08,.065],gold,.28,.7);}}
 // fine crown and moonstone circlet
 mesh(new THREE.TorusGeometry(.25,.014,7,40),gold,actor,[0,1.29,.135],[1,.63,.35]);const jewel=mat('#a9d5bd',.2,.3,{emissive:0x274938,emissiveIntensity:.6});ball(actor,[0,1.43,.235],[.055,.075,.025],jewel,.2,.4);ball(actor,[0,1.43,.26],[.023,.031,.012],mat('#e8d19b',.18,.4));
 // rune marks and facial glow
 if(state.mark!=='None'){const markMat=new THREE.MeshBasicMaterial({color:state.ancestry==='Draconic'?0xd47e61:0xc5d7a4,transparent:true,opacity:.86});for(const s of [-1,1]){const x=s*.19;for(let i=0;i<3;i++){const b=mesh(new THREE.SphereGeometry(.012,8,6),markMat,actor,[x+s*i*.018,1.0+i*.035,.26]);}if(state.mark==='Moon runes')mesh(new THREE.SphereGeometry(.02,8,6),markMat,actor,[s*.23,1.18,.242]);}}
 // delicate collar and charms
 line(actor,[[-.23,.57,.07],[-.12,.47,.18],[0,.43,.21],[.12,.47,.18],[.23,.57,.07]],'#d8c38b',.012,gold);ball(actor,[0,.405,.22],[.038,.06,.027],jewel,.2,.3);
 if(state.garment===1){const cape=mesh(new THREE.ConeGeometry(.61,1.42,32,1,true),mat(robeColors[state.robe],.8,0,{side:THREE.DoubleSide}),actor,[0,-.02,-.16]);cape.rotation.x=Math.PI;cape.scale.set(1,.8,.42);}
 if(state.garment===2){for(const s of [-1,1]){const shoulder=mesh(new THREE.SphereGeometry(1,20,14),gold,actor,[s*.29,.48,.02],[.2,.12,.2]);shoulder.rotation.z=s*.2;for(let i=0;i<3;i++)ball(actor,[s*(.3+i*.035),.5-i*.055,.17],[.012,.025,.012],mat('#f0d699',.25,.5));}}
 // relic staff / floating orb / moon blade
 if(state.relic===0){const staffMat=mat('#806644',.45,.25);limb(actor,[.62,-1.2,-.01],[.69,.67,-.05],.035,.025,staffMat);line(actor,[[.69,.43,-.05],[.61,.62,-.05],[.69,.81,-.05],[.79,.62,-.05],[.69,.43,-.05]],'#cfb67e',.019,gold);ball(actor,[.69,.62,-.05],[.09,.11,.08],jewel,.2,.4);for(let i=0;i<3;i++)ball(actor,[.58+i*.1,-.5-i*.18,-.005],[.022,.03,.02],gold,.28,.6)}
 if(state.relic===1){const orb=ball(actor,[.68,.22,.18],[.16,.16,.16],jewel,.18,.3);const hoop=mesh(new THREE.TorusGeometry(.2,.014,7,32),gold,actor,[.68,.22,.18]);hoop.rotation.y=.7;}
 if(state.relic===2){limb(actor,[.65,-.7,.1],[.68,.42,.1],.035,.025,gold);const blade=mesh(new THREE.ConeGeometry(.11,.58,5),mat('#c3d7cf',.18,.75,{emissive:0x1c5547,emissiveIntensity:.35}),actor,[.68,.63,.1]);}
 // Ancestry signatures: silhouette details make each lineage readable at a glance.
  if(state.ancestry==='Celestial'){const halo=mesh(new THREE.TorusGeometry(.23,.018,8,48),gold,actor,[0,1.77,-.03]);halo.rotation.x=Math.PI/2;for(let i=0;i<6;i++){const a=i*Math.PI/3;ball(actor,[Math.cos(a)*.25,1.77,Math.sin(a)*.25-.03],[.025,.025,.025],mat('#fff0bc',.2,.25));}}
  if(state.ancestry==='Draconic'){for(const s of [-1,1]){const horn=mesh(new THREE.ConeGeometry(.075,.35,12),mat('#6a5548',.36,.2),actor,[s*.22,1.57,-.035]);horn.rotation.z=s*.48;ball(actor,[s*.24,1.43,.05],[.018,.025,.018],mat('#d58b63',.3,.12));}}
  if(state.ancestry==='Fae'){for(const s of [-1,1]){const wing=mesh(new THREE.SphereGeometry(1,20,16),new THREE.MeshStandardMaterial({color:0xb7d9ca,roughness:.27,metalness:.08,transparent:true,opacity:.4,side:THREE.DoubleSide}),actor,[s*.48,.38,-.16],[.27,.48,.055]);wing.rotation.z=s*.48;line(actor,[[s*.34,.25,-.1],[s*.55,.42,-.09],[s*.67,.72,-.1]],'#c5dec9',.007,mat('#c5dec9',.25,.25));}}
  if(state.ancestry==='Sylvan'){for(const s of [-1,1]){const leaf=mesh(new THREE.SphereGeometry(1,16,12),mat('#819b69',.55,.08),actor,[s*.28,1.48,.01],[.07,.2,.04]);leaf.rotation.z=-s*.48;}}
  if(state.ancestry==='Orc'){for(const s of [-1,1]){const tusk=mesh(new THREE.ConeGeometry(.043,.16,12),mat('#d7c8a9',.44),actor,[s*.14,.83,.3]);tusk.rotation.z=Math.PI+s*.18;}ball(actor,[0,1.19,.224],[.25,.075,.075],skin,.9);}
  if(state.ancestry==='Vampire'){for(const s of [-1,1]){const fang=mesh(new THREE.ConeGeometry(.025,.105,12),mat('#eee5d9',.3),actor,[s*.045,.84,.29]);fang.rotation.z=Math.PI;} }
  if(state.ancestry==='Dwarven'){ball(actor,[0,.76,.24],[.19,.19,.15],hair,.85);ball(actor,[0,.63,.18],[.16,.22,.13],hair,.85);for(const s of [-1,1]){ball(actor,[s*.13,.87,.27],[.085,.06,.055],hair,.8);ball(actor,[s*.16,.55,.18],[.065,.16,.075],hair,.8);}}
  if(state.ancestry==='Revenant'){const spectral=mat('#a8c9bd',.25,.1,{emissive:0x527b70,emissiveIntensity:.7});for(const s of [-1,1]){line(actor,[[s*.21,1.12,.245],[s*.25,1.05,.24],[s*.22,.99,.245],[s*.28,.95,.23]],'#a8c9bd',.009,spectral);ball(actor,[s*.116,1.105,.26],[.038,.047,.021],spectral,.2,.1);}}
  // glowing aura ring and motes reflect the chosen affinity
 auraGroup.clear();const ac=auraColors[state.aura];const auraMat=new THREE.MeshBasicMaterial({color:ac,transparent:true,opacity:.13+state.auraPower*.003,side:THREE.DoubleSide});const ring=mesh(new THREE.TorusGeometry(1.14,.012+state.auraPower*.00015,8,96),new THREE.MeshBasicMaterial({color:ac,transparent:true,opacity:.36+state.auraPower*.004}),auraGroup,[0,-.22,-.15]);ring.rotation.x=Math.PI/2;const halo=mesh(new THREE.TorusGeometry(1.4,.007,6,90),new THREE.MeshBasicMaterial({color:ac,transparent:true,opacity:.15+state.auraPower*.002}),auraGroup,[0,-.22,-.16]);halo.rotation.x=Math.PI/2;
 for(let i=0;i<46;i++){const a=i/46*Math.PI*2;const r=.65+Math.random()*.77;const p=mesh(new THREE.SphereGeometry(.012+Math.random()*.018,7,6),new THREE.MeshBasicMaterial({color:ac,transparent:true,opacity:.2+state.auraPower*.006}),auraGroup,[Math.cos(a)*r,(Math.random()*2.9)-1.4,Math.sin(a)*r*.35-.2]);p.userData={phase:Math.random()*6.28,r,a};}
}

const names={Sylvan:'WILDBLOOD',Celestial:'STAR-TOUCHED',Draconic:'ASHENBORN',Fae:'GLOAM-KIN',Revenant:'HOLLOWED',Dwarven:'STONEKIN',Orc:'IRONBLOOD',Vampire:'NIGHTBORN'};
const faceNames=['Heart','Angular','Soft','Weathered'];
const hairNames=['Loose waves','Twin buns','Braided falls','Crown braid','High knot','Pixie crop','Moon veil','Wild curls','Side sweep','Long straight','Petal crown','Half-up'];
const marks=['Moon runes','Starlight','Freckles','None'];
const garments=[['Hunter’s coat','A weathered longcoat'],['Mourning mantle','A shadowed traveling cloak'],['Church vestments','Ceremonial hunter regalia']];
const relics=['Hunter’s cane','Grave lantern','Moon-silver blade'];
function makeSwatches(id,colors,key){const el=$('#'+id);el.innerHTML='';colors.forEach((c,i)=>{const b=document.createElement('button');b.className='swatch'+(state[key]===i?' selected':'');b.style.background=c;b.title=`${key.replace(/[A-Z]/g,m=>' '+m.toLowerCase())} ${i+1}`;b.setAttribute('aria-label',b.title);b.addEventListener('click',()=>{state[key]=i;makeSwatches(id,colors,key);makeActor()});el.append(b)})}
function buildOptions(){
 makeSwatches('skinSwatches',skinColors,'skin');makeSwatches('hairSwatches',hairColors,'hairColor');makeSwatches('eyeSwatches',eyeColors,'eye');makeSwatches('robeSwatches',robeColors,'robe');
  const fo=$('#faceOptions');fo.innerHTML='';faceNames.forEach((n,i)=>{const b=document.createElement('button');b.className='face-choice'+(state.face===i?' selected':'');b.innerHTML=`<span class="face-glyph">${['♡','◇','◡','⌁'][i]}</span><span>${n}</span>`;b.setAttribute('aria-pressed',state.face===i);b.addEventListener('click',()=>{state.face=i;buildOptions();makeActor()});fo.append(b)});
 const hs=$('#hairStyles');hs.innerHTML='';hairNames.forEach((n,i)=>{const b=document.createElement('button');b.className='style-choice'+(i===state.hairStyle?' selected':'');b.textContent=['〰','♧','≋','⌁','♛','✦','◌','❋','⌒','│','❀','♢'][i];b.title=n;b.setAttribute('aria-label',n);b.addEventListener('click',()=>{state.hairStyle=i;buildOptions();makeActor()});hs.append(b)});
 const mo=$('#markOptions');mo.innerHTML='';marks.forEach(n=>{const b=document.createElement('button');b.className='pill'+(state.mark===n?' selected':'');b.textContent=n;b.addEventListener('click',()=>{state.mark=n;buildOptions();makeActor()});mo.append(b)});
 const gl=$('#garments');gl.innerHTML='';garments.forEach(([n,d],i)=>{const b=document.createElement('button');b.className='garment'+(state.garment===i?' selected':'');b.innerHTML=`${n}<span>${d}</span>`;b.addEventListener('click',()=>{state.garment=i;buildOptions();makeActor()});gl.append(b)});
 const ao=$('#auraOptions');ao.innerHTML='';['Verdant','Frost','Dream','Solar','Rose'].forEach((n,i)=>{const b=document.createElement('button');b.className='aura'+(state.aura===i?' selected':'');b.innerHTML=`<span style="color:${auraColors[i]}">✦</span> ${n}`;b.addEventListener('click',()=>{state.aura=i;buildOptions();makeActor()});ao.append(b)});
 const ro=$('#relicOptions');ro.innerHTML='';relics.forEach((n,i)=>{const b=document.createElement('button');b.className='relic'+(state.relic===i?' selected':'');b.textContent=['♧','◉','✧'][i]+' '+n;b.addEventListener('click',()=>{state.relic=i;buildOptions();makeActor()});ro.append(b)});
}
function updateRangeFill(el){const min=+el.min,max=+el.max,val=+el.value,pct=((val-min)/(max-min))*100;el.style.background=`linear-gradient(90deg,#c1a86f 0 ${pct}%,#485248 ${pct}% 100%)`}
function setRange(id,value,key,labelId,text){const el=$('#'+id);el.value=value;$('#'+labelId).textContent=text(value);updateRangeFill(el);el.addEventListener('input',()=>{state[key]=+el.value;$('#'+labelId).textContent=text(state[key]);updateRangeFill(el);if(['build','height','age','ear','auraPower'].includes(key))makeActor()})}
function setup(){
 buildOptions();
 const ancestry=$$('.choice[data-ancestry]');ancestry.forEach(b=>b.addEventListener('click',()=>{state.ancestry=b.dataset.ancestry;ancestry.forEach(x=>x.classList.toggle('selected',x===b));$('#originLabel').textContent=state.ancestry.toUpperCase();$('#roleLabel').textContent=names[state.ancestry];makeActor()}));
 $$('.tab').forEach(t=>t.addEventListener('click',()=>{$$('.tab').forEach(x=>x.classList.toggle('active',x===t));$$('.tab-content').forEach(x=>x.classList.toggle('active',x.dataset.panel===t.dataset.tab))}));
 $('#nameInput').addEventListener('input',e=>{state.name=e.target.value.trim()||'Nameless Wanderer';renderName()});
 setRange('buildSlider',state.build,'build','physiqueValue',v=>v<30?'Petite':v>70?'Powerful':'Graceful');setRange('heightSlider',state.height,'height','heightValue',v=>v<35?'Short':v>70?'Tall':'Balanced');setRange('ageSlider',state.age,'age','ageValue',v=>v<20?'Youthful':v>78?'Elder':'Ageless');setRange('earSlider',state.ear,'ear','earValue',v=>v<30?'Round':v>70?'Elven':'Tapered');setRange('auraSlider',state.auraPower,'auraPower','auraValue',v=>v<30?'Subtle':v>72?'Radiant':'Luminous');
 $('#rotateBtn').addEventListener('click',()=>{autoRotate=!autoRotate;$('#rotateBtn').classList.toggle('active',autoRotate)});$('#zoomIn').addEventListener('click',()=>zoom=Math.max(5.2,zoom-.55));$('#zoomOut').addEventListener('click',()=>zoom=Math.min(11,zoom+.55));$('#randomBtn').addEventListener('click',randomize);$('#resetBtn').addEventListener('click',reset);$('#shareBtn').addEventListener('click',exportPortrait);
 const canvas=$('#world');canvas.addEventListener('pointerdown',e=>{dragging=true;prevX=e.clientX;prevY=e.clientY;canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';autoRotate=false;$('#rotateBtn').classList.remove('active')});canvas.addEventListener('pointermove',e=>{if(!dragging)return;targetRot+=(e.clientX-prevX)*.008;targetTilt=Math.max(-.25,Math.min(.25,targetTilt+(e.clientY-prevY)*.003));prevX=e.clientX;prevY=e.clientY});const stop=()=>{dragging=false;canvas.style.cursor='grab'};canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(5.2,Math.min(11,zoom+Math.sign(e.deltaY)*.35))},{passive:false});canvas.style.cursor='grab';
 makeActor();renderName();$('#originLabel').textContent=state.ancestry.toUpperCase();$('#roleLabel').textContent=names[state.ancestry];
}
function renderName(){const parts=(state.name||'').trim().split(/\s+/);$('#heroName').innerHTML=parts.length>1?`${escapeHTML(parts.slice(0,-1).join(' '))} <i>${escapeHTML(parts.at(-1))}</i>`:escapeHTML(parts[0]||'Nameless Wanderer')}
function escapeHTML(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
let toastTimer;function toast(text){const el=$('#toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2100)}

const defaultState={name:'Elaris Moonwhisper',ancestry:'Sylvan',build:46,height:52,age:30,face:0,skin:0,hairStyle:2,hairColor:0,eye:0,ear:78,mark:'Moon runes',garment:0,robe:0,aura:0,auraPower:55,relic:0};
const rangeLabels=[
 ['buildSlider','physiqueValue',v=>v<30?'Petite':v>70?'Powerful':'Graceful'],
 ['heightSlider','heightValue',v=>v<35?'Short':v>70?'Tall':'Balanced'],
 ['ageSlider','ageValue',v=>v<20?'Youthful':v>78?'Elder':'Ageless'],
 ['earSlider','earValue',v=>v<30?'Round':v>70?'Elven':'Tapered'],
 ['auraSlider','auraValue',v=>v<30?'Subtle':v>72?'Radiant':'Luminous']
];
function syncControls(){
 rangeLabels.forEach(([slider,label,text])=>{const input=$('#'+slider);input.value=state[{buildSlider:'build',heightSlider:'height',ageSlider:'age',earSlider:'ear',auraSlider:'auraPower'}[slider]];$('#'+label).textContent=text(+input.value);updateRangeFill(input)});
 $$('.choice[data-ancestry]').forEach(b=>b.classList.toggle('selected',b.dataset.ancestry===state.ancestry));
 $('#originLabel').textContent=state.ancestry.toUpperCase();$('#roleLabel').textContent=names[state.ancestry];
}
function randomize(){
 state.ancestry=['Sylvan','Celestial','Draconic','Fae','Revenant','Dwarven','Orc','Vampire'][Math.floor(Math.random()*8)];state.face=Math.floor(Math.random()*faceNames.length);state.build=Math.floor(Math.random()*101);state.height=Math.floor(Math.random()*101);state.age=Math.floor(Math.random()*101);state.skin=Math.floor(Math.random()*skinColors.length);state.hairStyle=Math.floor(Math.random()*hairNames.length);state.hairColor=Math.floor(Math.random()*hairColors.length);state.eye=Math.floor(Math.random()*eyeColors.length);state.ear=Math.floor(Math.random()*101);state.mark=marks[Math.floor(Math.random()*marks.length)];state.garment=Math.floor(Math.random()*garments.length);state.robe=Math.floor(Math.random()*robeColors.length);state.aura=Math.floor(Math.random()*auraColors.length);state.auraPower=25+Math.floor(Math.random()*76);state.relic=Math.floor(Math.random()*relics.length);
 syncControls();buildOptions();makeActor();toast('A new legend takes shape.');
}
function reset(){
 Object.assign(state,defaultState);$('#nameInput').value=state.name;syncControls();buildOptions();renderName();makeActor();toast('Your original legend is restored.');
}
function exportPortrait(){
 renderer.render(scene,camera);renderer.domElement.toBlob(blob=>{if(!blob){toast('Portrait could not be created.');return}const link=document.createElement('a');link.download=`${(state.name||'mythweaver').toLowerCase().replace(/[^a-z0-9]+/g,'-')}-portrait.png`;link.href=URL.createObjectURL(blob);link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);toast('Portrait saved to your device.')},'image/png');
}
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.fov=w<650?38:33;camera.updateProjectionMatrix()}
window.addEventListener('resize',resize);
function animate(){
 requestAnimationFrame(animate);time+=.016;if(autoRotate&&!dragging)targetRot+=.0025;root.rotation.y+=(targetRot-root.rotation.y)*.055;root.rotation.x+=(targetTilt-root.rotation.x)*.055;root.position.y=Math.sin(time*1.35)*.025;camera.position.z+=(zoom-camera.position.z)*.08;camera.lookAt(0,.05,0);
 stars.children.forEach(s=>{s.material.opacity=.2+(Math.sin(time*1.2+s.userData.phase)+1)*.25});floaters.children.forEach(f=>{f.position.y=f.userData.origin.y+Math.sin(time*f.userData.speed+f.userData.phase)*.18;f.rotation.y=time*.4});auraGroup.rotation.y=time*.12;auraGroup.children.slice(2).forEach(p=>{p.position.y=Math.sin(time*1.2+p.userData.phase)*1.25;p.position.x=Math.cos(p.userData.phase+time*.25)*p.userData.r;p.position.z=Math.sin(p.userData.phase+time*.25)*p.userData.r*.4-.2});renderer.render(scene,camera);
}
setup();animate();
