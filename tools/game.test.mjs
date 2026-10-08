import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from './game-harness.mjs';

test('33 reachable evolutions, unique locations, no first-campaign universe locks', () => {
  const g=createGame();
  assert.equal(g.evaluate('NODES.length'),33);
  assert.equal(g.evaluate("NODES.filter(n=>!n.req).length"),4);
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
  assert.equal(g.evaluate('save.version'),6);
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
  assert.equal(pts,123+21+260+35+60+100+160+240+360+600);
  assert.equal(g.evaluate('save.claims.length'),5);
  assert.equal(g.evaluate('save.wins'),1);
  g.evaluate('winGame()');
  assert.equal(g.evaluate('save.pts'),pts);
  g.evaluate('peak=WIN_SIZE;runMoney=0;settleRun()');
  assert.equal(g.evaluate('save.claims.length'),5);
  assert.equal(g.evaluate('save.pts')-pts,22+260+35);
});

test('solar phase has a time limit and crossing the goal without another item still wins', () => {
  const g=createGame();
  g.evaluate("startRound();phase='sun';size=WIN_SIZE+100;boxes=[];items=[];update(.05)");
  assert.ok(g.evaluate('sunSwallow')>0);
  g.evaluate('for(let i=0;i<40;i++)tickGame(.05)');
  assert.equal(g.evaluate('state'),'win');
  const other=createGame();
  other.evaluate("startRound();phase='sun';size=300;sunT=SUN_LIMIT;update(.05)");
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
