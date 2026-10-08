import { createGame } from './game-harness.mjs';

// Run the game's real spawning, gravity, damage, skills, rewards, and shop logic.
// Bots substitute bounded manual collection, not passive physics or upgrade effects.
const profiles = {
  casual: { interval: 1.7, throwRate: .25, shopping: 25, bias: [1.2, .8, 1, 1.15, 1.2] },
  steady: { interval: 1.1, throwRate: .5, shopping: 20, bias: [1.15, 1.1, 1, 1, 1.2] },
  skilled: { interval: .7, throwRate: .85, shopping: 14, bias: [1, 1.25, .9, 1.1, 1.2] },
};
const baseWeight = {
  junk2: 1.8, rate: 1.45, trade: 1.5, gas: 1.45, fw: 1.6, salvage: .8, junk3: 1.3, research: .85, luck: .7,
  big: 1.65, start: 1.1, precision: 1, combo: 1.1, pull: 1.3, carry: 1.15, fusion: 1.1, core: 1.15,
  delay: 1.35, hawk: 1, shield: 1.25, shield2: 1.1, chrono: 1, solar: 1.25, resonance: .85, breach: .75,
  zap: 1.6, cap: 1.55, sat: 1.3, collector: 1.3, magnet: 1.25, chain: 1, sat2: 1.05, zap2: .95,
};
export function simulate(profileName, seed = 1, maxRounds = 180) {
  const game = createGame(seed);
  const profile = profiles[profileName];
  const weights = Object.fromEntries(Object.entries(baseWeight).map(([k,v]) => [k,v]));
  game.evaluate(`const botProfile=${JSON.stringify(profile)};const botWeights=${JSON.stringify(weights)};`);
  return game.evaluate(`(()=>{
    let seconds=0, purchases=0, history=[];
    for(let round=1;round<=${maxRounds};round++){
      startRound();let manualClock=0, elapsed=0;
      while(state==='play'&&elapsed<360){
        const dt=1/60;elapsed+=dt;manualClock+=dt;
        if(manualClock>=botProfile.interval){
          manualClock=0;
          const target=items.filter(i=>!i.dead&&i.state==='loose'&&i.type!=='ember')
            .sort((a,b)=>itemVal(b)-itemVal(a))[0];
          if(target){if(target.manualOnly)target.state='held';target.thrown=Math.random()<botProfile.throwRate;target.x=HOLE.x;target.y=HOLE.y;consume(target);}
        }
        if(lv('zap')&&skill.cd<=0){
          const drone=phase==='doom'?drones.find(d=>d.alive):null;
          if(drone)castGravity(drone.x,drone.y);
          else {const source=boxes.slice().sort((a,b)=>FUEL[b.type].val-FUEL[a.type].val)[0];if(source)castGravity(source.x,source.y-6);}
        }
        tickGame(dt);
      }
      seconds+=elapsed;
      history.push({round,seconds:Math.round(seconds),peak:Math.round(peak),credits:Math.floor(save.pts),collected:runCollected,stage:runStage,phase,state});
      if(state==='win')return {profile:${JSON.stringify(profileName)},seed:${seed},won:true,rounds:round,minutes:+(seconds/60).toFixed(1),purchases,upgrades:{...save.lv},history};
      if(state==='play')throw Error('Round did not terminate');
      seconds+=botProfile.shopping;
      for(let guard=0;guard<120;guard++){
        const options=NODES.filter(n=>nodeState(n)==='full'&&lv(n.id)<n.max&&save.pts>=cost(n));
        if(!options.length)break;
        options.sort((a,b)=>{
          const score=n=>(botWeights[n.id]*botProfile.bias[n.lane]*(lv(n.id)===0?1.35:1)/(1+.6*lv(n.id)))/Math.pow(cost(n),.35);
          return score(b)-score(a);
        });
        if(!buyNode(options[0].id))throw Error('Purchase rejected');
        purchases++;
      }
    }
    return {profile:${JSON.stringify(profileName)},seed:${seed},won:false,minutes:+(seconds/60).toFixed(1),purchases,upgrades:{...save.lv},history};
  })()`);
}
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const seeds = Number(process.argv[2] || 3);
  const output = [];
  for (const name of Object.keys(profiles)) {
    for (let seed = 1; seed <= seeds; seed++) {
      const result = simulate(name, seed);
      output.push(result);
      console.log(JSON.stringify({profile:name,seed,won:result.won,rounds:result.rounds,minutes:result.minutes,purchases:result.purchases,last:result.history.at(-1)}));
    }
  }
  if (process.argv.includes('--details')) console.log(JSON.stringify(output, null, 2));
}
