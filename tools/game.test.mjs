import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from './game-harness.mjs';

test('33 reachable evolutions, unique locations, no first-campaign universe locks', () => {
  const g=createGame();
  assert.equal(g.evaluate('NODES.length'),33);
  assert.equal(g.evaluate("NODES.filter(n=>!n.req).length"),5);
  assert.equal(g.evaluate('new Set(Object.values(POS).map(p=>p.join(","))).size'),33);
  assert.equal(g.evaluate(`NODES.every(n=>{
    const visited=new Set();let current=n;
    while(current.req){if(visited.has(current.id)||!NODE_BY_ID[current.req])return false;visited.add(current.id);current=NODE_BY_ID[current.req];}
    return !n.uniReq && n.max>=2;
  })`),true);
});

test('old saves retain currency, skins, owned upgrades and remain usable after branch changes', () => {
  const g=createGame(1,{pts:321,round:9,lv:{gas:2,junk3:2,zap2:1},best:505,gems:17,skins:{cat:1},skin:'cat',uni:0});
  assert.equal(g.evaluate('save.pts'),321);
  assert.equal(g.evaluate('save.gems'),17);
  assert.equal(g.evaluate('lv("gas")'),2);
  assert.equal(g.evaluate('nodeState(NODE_BY_ID.gas)'), 'full');
  assert.equal(g.evaluate('nodeState(NODE_BY_ID.junk3)'), 'full');
  assert.equal(g.evaluate('save.skin'), 'cat');
  assert.equal(g.evaluate('save.playSeconds'),0);
  assert.equal(g.evaluate('save.version'),9);
  g.evaluate('persist()');
  assert.equal(JSON.parse(g.storage.get('holeGameV5')).pts,321);
});

test('every purchased material source contributes, including sources beyond eight slots', () => {
  const g=createGame();
  const values=g.evaluate(`save.lv={junk2:4,junk3:3,gas:3,fw:3,cap:3};buildBoxes();JSON.stringify(boxes.map(b=>({type:b.type,count:b.count,interval:boxItv(b)})))`);
  const boxes=JSON.parse(values);
  assert.equal(boxes.length,4);
  assert.equal(boxes.reduce((sum,b)=>sum+b.count,0),20);
  assert.equal(boxes.find(b=>b.type==='cap').count,3);
  g.evaluate('save.lv={junk2:1};buildBoxes()');
  const before=g.evaluate('boxItv(boxes[0])');
  g.evaluate('save.lv.junk2=2;buildBoxes()');
  assert.ok(g.evaluate('boxItv(boxes[0])')<before);
});

test('UFO needs three basic shots, cooldown is enforced, armor penetration works', () => {
  const g=createGame();
  g.evaluate("save.lv.zap=1;startRound();phase='doom';drones=[{x:480,y:96,alive:true,hp:3}]");
  assert.equal(g.evaluate('castGravity(480,96)'),true);
  assert.equal(g.evaluate('drones[0].hp'),2);
  assert.equal(g.evaluate('drones[0].alive'),true);
  assert.equal(g.evaluate('castGravity(480,96)'),false);
  g.evaluate('skill.cd=0;save.lv.breach=2');
  assert.equal(g.evaluate('castGravity(480,96)'),true);
  assert.equal(g.evaluate('drones[0].alive'),false);
  g.evaluate('skill.cd=0');
  assert.equal(g.evaluate('castGravity(20,20)'),false);
  assert.equal(g.evaluate('skill.cd'),0);
});

test('precision rewards actual throws and combo expires without erasing lifetime progress', () => {
  const g=createGame();
  g.evaluate("save.lv={precision:2,combo:2};startRound();consume({state:'loose',type:'junk',x:480,y:322,thrown:true})");
  assert.ok(Math.abs(g.evaluate('size')-(12+4*1.2))<1e-9);
  assert.ok(Math.abs(g.evaluate('runMoney')-3*1.2)<1e-9);
  g.evaluate("roundTime=1;consume({state:'loose',type:'junk',x:480,y:322})");
  assert.equal(g.evaluate('comboCount'),2);
  g.evaluate("roundTime=4;consume({state:'loose',type:'junk',x:480,y:322})");
  assert.equal(g.evaluate('comboCount'),1);
  assert.equal(g.evaluate('runCollected'),3);
});

test('expired objects yield salvage and an automatic collector actually captures objects', () => {
  const g=createGame();
  g.evaluate("save.lv={salvage:2};startRound();boxes=[];items=[{type:'junk',state:'loose',x:14,y:456,vx:0,vy:0,t:20,rest:0}];update(.05)");
  assert.ok(Math.abs(g.evaluate('runRecycled')-.72)<1e-9);
  assert.ok(Math.abs(g.evaluate('runMoney')-.72)<1e-9);
  assert.equal(g.evaluate('items.length'),0);
  g.evaluate("save.lv={collector:1};startRound();boxes=[];items=[{type:'junk',state:'loose',x:14,y:456,vx:0,vy:0,t:0,rest:0}];collectorClock=5;update(.05)");
  assert.equal(g.evaluate('items[0].state'),'fly');
  g.evaluate('for(let i=0;i<10;i++)update(.05)');
  assert.equal(g.evaluate('runCollected'),1);
});

test('final round banks earnings, milestones pay only once and win settlement cannot repeat', () => {
  const g=createGame();
  g.evaluate('startRound();runMoney=123.7;peak=WIN_SIZE;survivedDoom=true;winGame()');
  const pts=g.evaluate('save.pts');
  assert.equal(pts,123+21+1680+35+60+100+180+280+420+650+600);
  assert.equal(g.evaluate('save.claims.length'),6);
  assert.equal(g.evaluate('save.wins'),1);
  g.evaluate('winGame()');
  assert.equal(g.evaluate('save.pts'),pts);
  g.evaluate('peak=WIN_SIZE;runMoney=0;settleRun()');
  assert.equal(g.evaluate('save.claims.length'),6);
  assert.equal(g.evaluate('save.pts')-pts,22+1680+35);
});

test('solar phase has a time limit and crossing the goal without another item still wins', () => {
  const g=createGame();
  g.evaluate("startRound();runStage=4;phase='sun';size=WIN_SIZE;boxes=[];items=[];update(.05)");
  assert.ok(g.evaluate('sunSwallow')>0);
  g.evaluate('for(let i=0;i<40;i++)tickGame(.05)');
  assert.equal(g.evaluate('state'),'win');
  const other=createGame();
  other.evaluate("startRound();runStage=4;phase='sun';size=300;sunT=SUN_LIMIT;update(.05)");
  assert.equal(other.evaluate('state'),'roundEnd');
});

test('hit effects do not freeze gameplay; active time excludes pause', () => {
  const g=createGame();
  g.evaluate('startRound();hitstop=1;tickGame(.05)');
  assert.equal(g.evaluate('roundTime'),.05);
  assert.equal(g.evaluate('save.playSeconds'),.05);
  g.evaluate('pauseGame();tickGame(1)');
  assert.equal(g.evaluate('save.playSeconds'),.05);
});

test('research changes purchase price and failed purchases cannot spend currency', () => {
  const g=createGame();
  const original=g.evaluate('cost(NODE_BY_ID.big)');
  g.evaluate('save.lv.research=3');
  assert.ok(g.evaluate('cost(NODE_BY_ID.big)')<original);
  assert.equal(g.evaluate('buyNode("big")'),false);
  assert.equal(g.evaluate('save.pts'),0);
  g.evaluate('save.pts=1000');
  assert.equal(g.evaluate('buyNode("big")'),true);
  const pts=g.evaluate('save.pts');
  assert.equal(g.evaluate('buyNode("core")'),false);
  assert.equal(g.evaluate('save.pts'),pts);
});


test('a hidden selection is cleared after progress is reset', () => {
  const g=createGame();
  g.evaluate("save.lv.core=1;selId='core';renderShop();save=freshSave();renderShop()");
  assert.equal(g.evaluate('selId'),null);
  assert.equal(g.evaluate("$('ndName').textContent"),'Chọn nâng cấp');
  assert.equal(g.evaluate("$('treeBox').scrollTop"),0);
});


test('evolution parents genuinely fork rather than forming four chains', () => {
  const g=createGame();
  assert.ok(g.evaluate('Object.values(CHILDREN).filter(children=>children.length>=2).length')>=8);
  assert.equal(g.evaluate('NODE_BY_ID.gas.req'),'junk2');
  assert.equal(g.evaluate('NODE_BY_ID.sat.req'),'zap');
  assert.equal(g.evaluate('NODE_BY_ID.breach.req'),'shield');
});

test('one button use auto-collects, Q shares this action, and locked skill explains why', () => {
  const g=createGame();
  g.evaluate('startRound()');
  assert.equal(g.evaluate('useGravity()'),false);
  assert.ok(g.evaluate("$('toast').textContent.includes('Mở Tia trọng lực')"));
  assert.equal(g.evaluate("$('skillBtn').style.display"),'flex');
  g.evaluate('save.lv.zap=1;updateHud()');
  assert.equal(g.evaluate('useGravity()'),true);
  assert.equal(g.evaluate("items.filter(i=>i.state==='fly').length"),5);
  assert.equal(g.evaluate('useGravity()'),false);
  g.evaluate("skill.cd=0;phase='doom';drones=[{x:480,y:96,hp:3,alive:true}]");
  assert.equal(g.evaluate('useGravity()'),true);
  assert.equal(g.evaluate('drones[0].hp'),2);
});

test('damaging UFO armor immediately weakens its drain', () => {
  const healthy=createGame(), damaged=createGame();
  for(const game of [healthy,damaged])game.evaluate("startRound();phase='doom';size=200;boxes=[];items=[];drones=[{x:480,y:96,hp:3,alive:true}]");
  damaged.evaluate('drones[0].hp=2');
  healthy.evaluate('update(.05)');damaged.evaluate('update(.05)');
  assert.ok(damaged.evaluate('size')>healthy.evaluate('size'));
});

test('early runs have quick encounters while repeated upgrades get more expensive', () => {
  const g=createGame();
  assert.equal(g.evaluate('DOOM_BASE'),24);
  assert.ok(g.evaluate('DOOM_BASE+DOOM_DELAY*NODE_BY_ID.delay.max')<=36);
  g.evaluate("startRound();for(let i=0;i<12;i++)consume({state:'loose',type:'junk',x:480,y:322});endRound('doom')");
  assert.equal(g.evaluate('buyNode("zap")'),false);
  g.evaluate('save.pts=1000;buyNode("zap")');
  assert.ok(g.evaluate('cost(NODE_BY_ID.zap)')>=230);
});


test('completed legacy goal remains claimed when campaign target changes', () => {
  const g=createGame(1,{claims:[100,400,1000,2400,6500],best:6500,pts:100});
  assert.equal(g.evaluate('save.claims.length'),6);
  assert.ok(g.evaluate('save.claims.includes(WIN_SIZE)'));
  g.evaluate('peak=WIN_SIZE;runMoney=0;survivedDoom=false');
  assert.equal(g.evaluate('settleRun().milestoneBonus'),0);
});


test('energy goals travel through five regions without stopping or settling the live run',()=>{
 const g=createGame();g.evaluate("startRound();runMoney=51;const carried={state:'loose',type:'junk',x:20,y:400,vx:0,vy:0,t:0,rest:0};items=[carried]");
 for(let stage=1;stage<5;stage++){
   g.evaluate('travel=0;size=currentGoal();finishMap()');
   assert.equal(g.evaluate('runStage'),stage);assert.equal(g.evaluate('state'),'play');
   assert.equal(g.evaluate('save.round'),1);assert.equal(g.evaluate('save.pts'),0);
   assert.equal(g.evaluate('items[0]===carried'),true);
 }
 assert.equal(g.evaluate('phase'),'sun');assert.equal(g.evaluate('runMoney'),51+90+170+300+480);
 g.evaluate("endRound('sun');startRound()");
 assert.equal(g.evaluate('runStage'),0);assert.equal(g.evaluate('save.stage'),4);assert.equal(g.evaluate('size'),12);
 assert.equal(g.evaluate('phase'),'grow');
});

test('a passed UFO never travels without enough energy, and region timeout ends a run',()=>{
 const g=createGame();g.evaluate("startRound();phase='doom';doomT=doomDuration();size=120;drones=[];update(.01)");
 assert.equal(g.evaluate('runStage'),0);assert.equal(g.evaluate('phase'),'grow');
 g.evaluate('regionTime=REGION_LIMIT;update(.01)');assert.equal(g.evaluate('state'),'roundEnd');
});

test('travel during a hand capture preserves another held item and only pays exploration once',()=>{
 const g=createGame();g.evaluate("save.lv.carry=2;startRound();size=currentGoal();grabbed={type:'junk',state:'held',x:20,y:150};items=[grabbed];finishMap()");
 assert.equal(g.evaluate('grabbed===items[0]'),true);assert.equal(g.evaluate('items[0].state'),'held');
 assert.equal(g.evaluate('size'),420);assert.equal(g.evaluate('finishMap()'),false);
 assert.equal(g.evaluate('runMoney'),90);
 g.evaluate("endRound('doom');startRound();size=currentGoal();finishMap()");assert.equal(g.evaluate('runMoney'),0);
});

test('black-hole radius reflects progress instead of saturating at low mass', () => {
 const g=createGame();g.evaluate('startRound();runStage=4;size=500');const small=g.evaluate('holeR()');
 g.evaluate('size=5000');const medium=g.evaluate('holeR()');g.evaluate('size=WIN_SIZE');const ready=g.evaluate('holeR()');
 assert.ok(small<medium&&medium<ready);assert.ok(medium<95&&ready>95);assert.ok(ready<=104);
});

test('fireworks have bounded colored trails, drag, gravity and finite lifetime', () => {
 const g=createGame();g.evaluate('startRound();boxes=[];items=[];burstFirework(200,200,120)');
 assert.equal(g.evaluate('fireworks.length'),32);assert.equal(g.evaluate('fireworks[0].hue'),120);
 const vx=g.evaluate('fireworks[0].vx');g.evaluate('update(.1)');assert.ok(g.evaluate('fireworks[0].vx')<vx);
 g.evaluate('for(let i=0;i<50;i++)burstFirework(200,200,i*20)');assert.ok(g.evaluate('fireworks.length')<=420);
 g.evaluate('for(let i=0;i<90;i++)update(.02)');assert.equal(g.evaluate('fireworks.length'),0);
});

test('solar warning reports real drain and upgrades reduce it', () => {
 const g=createGame();g.evaluate("startRound();runStage=4;phase='sun';size=2000;updateHud()");
 assert.ok(g.evaluate("$('solarHint').textContent.includes('Mặt Trời rút')"));
 const before=g.evaluate('solarDrain()');g.evaluate('save.lv.solar=3');assert.ok(g.evaluate('solarDrain()')<before);
});


test('shop recommends defenses after UFO and radiation resistance after solar failure', () => {
 const g=createGame();g.evaluate("save.pts=5000;save.lastFailure='doom';save.lv.delay=1");
 assert.equal(g.evaluate('recommendedUpgrade().id'),'shield');
 g.evaluate("save.lastFailure='sun';save.lv.chrono=1");assert.equal(g.evaluate('recommendedUpgrade().id'),'solar');
});

test('locked future cards explain their prerequisite without spending credits', () => {
 const g=createGame();g.evaluate("save.pts=5000;selNode('core')");
 assert.equal(g.evaluate('selId'),'core');assert.equal(g.evaluate("$('buyBtn').disabled"),true);
 assert.ok(g.evaluate("$('ndFrom').textContent.includes(NODE_BY_ID[NODE_BY_ID.core.req].name)"));
 assert.equal(g.evaluate('save.pts'),5000);
});

test('preview purchases bypass money but preserve wallet, prerequisites and rank limits',()=>{
 const g=createGame();g.evaluate('previewMoney=true;save.pts=13');
 assert.equal(g.evaluate("buyNode('core')"),false);
 assert.equal(g.evaluate("buyNode('research')"),true);
 assert.equal(g.evaluate('save.pts'),13);
 g.evaluate("while(buyNode('research')){};previewMoney=false");
 assert.equal(g.evaluate("lv('research')"),4);
 assert.equal(g.evaluate("buyNode('junk2')"),false);
 assert.equal(g.evaluate('save.pts'),13);
});
test('early discount reaches 60 percent while successive ranks still become more expensive',()=>{
 const g=createGame();const original=g.evaluate('cost(NODE_BY_ID.junk2)');
 assert.equal(g.evaluate('nodeState(NODE_BY_ID.research)'), 'full');
 g.evaluate('save.lv.research=4');assert.equal(g.evaluate('cost(NODE_BY_ID.junk2)'),Math.round(original*.4));
 g.evaluate('save.lv.junk2=1');assert.ok(g.evaluate('cost(NODE_BY_ID.junk2)')>original);
});
test('rare objects ignore automatic capture, require held consumption and persist discoveries once',()=>{
 const g=createGame();g.evaluate("startRound();save.lv={collector:3,sat:3,cap:1};spawnSpaceObject('meteor');const rare=items.at(-1);rare.x=HOLE.x;rare.y=HOLE.y;rare.vx=0;rare.vy=0;collectorClock=5;tickGame(.1);consume(rare)");
 assert.equal(g.evaluate('rare.state'),'loose');assert.equal(g.evaluate('save.discoveries.meteor'),undefined);
 g.evaluate("rare.state='held';consume(rare);consume(rare)");
 assert.equal(g.evaluate('save.discoveries.meteor'),1);assert.ok(g.evaluate('holePulse')<=.85);assert.ok(g.evaluate('runMoney')>=24);
 assert.equal(JSON.parse(g.storage.get('holeGameV5')).discoveries.meteor,1);
 g.evaluate('renderCollection()');assert.ok(g.evaluate("$('collectionGrid').innerHTML.includes('undiscovered')"));
});

test('twelve specimens are distributed across all five regions and existing discoveries survive',()=>{
 const g=createGame(1,{version:8,discoveries:{meteor:2,relic:1},stage:2,lv:{start:4,carry:3},best:20000});
 assert.equal(g.evaluate('SPACE_OBJECTS.length'),12);assert.equal(g.evaluate('new Set(SPACE_OBJECTS.map(o=>o.id)).size'),12);
 assert.equal(g.evaluate('new Set(SPACE_OBJECTS.map(o=>o.stage)).size'),5);
 g.evaluate('startRound()');assert.equal(g.evaluate('runStage'),0);assert.equal(g.evaluate('size'),52);
 assert.equal(g.evaluate('save.discoveries.meteor'),2);assert.equal(g.evaluate('save.discoveries.relic'),1);
});

test('schema nine claims survive reload without turning the penultimate milestone into victory',()=>{
 const g=createGame(1,{version:9,claims:[100,400,2400,8500,24000],stage:3});
 assert.equal(g.evaluate('save.claims.includes(WIN_SIZE)'),false);assert.equal(g.evaluate('save.claims.includes(24000)'),true);
 g.evaluate('peak=WIN_SIZE;runMoney=0;survivedDoom=false');assert.equal(g.evaluate('settleRun().milestoneBonus'),650);
});

test('abandoning a flight cannot consume unpaid exploration rewards or settle the run twice',()=>{
 const g=createGame();g.evaluate('startRound();size=currentGoal();finishMap();startRound();size=currentGoal();finishMap()');
 assert.equal(g.evaluate('runMoney'),90);assert.equal(g.evaluate('save.mapClaims.length'),0);
 g.evaluate("endRound('doom')");const balance=g.evaluate('save.pts');
 assert.ok(g.evaluate('save.mapClaims.includes(0)'));
 g.evaluate("endRound('doom')");assert.equal(g.evaluate('save.pts'),balance);
});
