// Leaf Evolve - data. Real-life figures are approximate (size, mass, speed, bite/strike force, armor).
// Game stats are DERIVED from these numbers in engine.js (log-compressed so skill can beat size).
(function(){
const S = (o)=>o;
// id, name, art, mass kg, len m, top speed km/h, bite/strike force N (approx), armor 0-10, habitat, sp special, ai style, fact
const SPECIES = {
 meerkat:{n:'Meerkat',art:'meerkat',mass:0.75,len:0.3,spd:32,bite:20,arm:2,hab:'desert',sp:'sprint',ai:'kiter',fact:'Meerkats live in tight family mobs and take turns standing guard.'},
 gila:{n:'Gila Monster',art:'gila',mass:0.7,len:0.45,spd:5,bite:60,arm:4,hab:'desert',sp:'venom',ai:'ambush',fact:'One of the few venomous lizards. It is slow, but its jaws hold on tight.'},
 wolfpup:{n:'Wolf Pup',art:'wolf',mass:10,len:0.75,spd:35,bite:500,arm:1,hab:'forest',sp:'sprint',ai:'pack',fact:'Wolf pups learn hunting by play-fighting inside the pack.',scale:0.62},
 youngcroc:{n:'Young Croc',art:'croc',mass:12,len:1.5,spd:14,bite:1800,arm:5,hab:'wetland',sp:'roll',ai:'grappler',fact:'Baby crocs already have a powerful snap and tough armored scales.',scale:0.5},
 honey_badger:{n:'Honey Badger',art:'honey_badger',mass:12,len:0.75,spd:30,bite:400,arm:6,hab:'savanna',sp:'frenzy',ai:'berserk',fact:'Its loose, thick skin lets it twist around and bite even when gripped.'},
 fox:{n:'Red Fox',art:'fox',mass:6,len:0.9,spd:50,bite:300,arm:1,hab:'forest',sp:'pounce',ai:'kiter',fact:'Foxes pounce from above to catch prey hidden in grass or snow.'},
 porcupine:{n:'Porcupine',art:'porcupine',mass:10,len:0.8,spd:6,bite:200,arm:7,hab:'forest',sp:'quills',ai:'defender',fact:'Up to 30,000 quills; it backs into trouble and never charges.'},
 tas_devil:{n:'Tasmanian Devil',art:'tas_devil',mass:8,len:0.7,spd:13,bite:1200,arm:1,hab:'forest',sp:'frenzy',ai:'berserk',fact:'Strongest bite for its size of any living mammal.'},
 wolverine:{n:'Wolverine',art:'wolverine',mass:14,len:0.9,spd:48,bite:800,arm:3,hab:'arctic',sp:'frenzy',ai:'berserk',fact:'Famously fierce; it can drive much bigger predators off a kill.'},
 cassowary:{n:'Cassowary',art:'cassowary',mass:55,len:1.6,spd:50,bite:1500,arm:2,hab:'jungle',sp:'kick',ai:'charger',fact:'Big dagger-like claws; a powerful kicker from the Australian rainforest.'},
 ostrich:{n:'Ostrich',art:'ostrich',mass:120,len:2.0,spd:70,bite:2500,arm:1,hab:'savanna',sp:'kick',ai:'kiter',fact:'The fastest two-legged runner, with a kick that can drive off lions.'},
 kangaroo:{n:'Red Kangaroo',art:'kangaroo',mass:70,len:1.5,spd:56,bite:2500,arm:1,hab:'desert',sp:'kick',ai:'kiter',fact:'Boxes with its arms and kicks hard with both hind legs, balancing on its tail.'},
 komodo:{n:'Komodo Dragon',art:'komodo',mass:70,len:2.5,spd:20,bite:600,arm:5,hab:'jungle',sp:'venom',ai:'ambush',fact:'The largest lizard: venom glands in its jaw, plus serrated teeth.'},
 wolf:{n:'Grey Wolf',art:'wolf',mass:40,len:1.4,spd:56,bite:1500,arm:1.5,hab:'forest',sp:'pounce',ai:'pack',fact:'Wolves circle, feint and test opponents before committing.'},
 alphawolf:{n:'Alpha Wolf',art:'wolf',mass:55,len:1.6,spd:56,bite:1800,arm:2,hab:'forest',sp:'pounce',ai:'pack',fact:'The breeding male leads the pack; big, strong and experienced.',scale:1.1},
 swiftwolf:{n:'Hunter Wolf',art:'wolf',mass:38,len:1.4,spd:64,bite:1400,arm:1,hab:'arctic',sp:'sprint',ai:'kiter',fact:'A lean pack runner that can chase prey for miles at 40+ km/h.',scale:0.98},
 cheetah:{n:'Cheetah',art:'cheetah',mass:50,len:1.3,spd:110,bite:1000,arm:1,hab:'savanna',sp:'sprint',ai:'kiter',fact:'The fastest land animal: 0 to 100 km/h in about 3 seconds, but it tires quickly.'},
 jaguar:{n:'Jaguar',art:'jaguar',mass:90,len:1.7,spd:80,bite:6900,arm:1.5,hab:'jungle',sp:'pounce',ai:'ambush',fact:'Strongest bite of the big cats; it can crack turtle shells.'},
 lion:{n:'Lion',art:'lion',mass:190,len:2.5,spd:80,bite:4200,arm:2,hab:'savanna',sp:'pounce',ai:'ambush',fact:'Lions sprint in short bursts and tire quickly.'},
 tiger:{n:'Tiger',art:'tiger',mass:220,len:2.8,spd:65,bite:4500,arm:2,hab:'jungle',sp:'pounce',ai:'ambush',fact:'The largest cat; a solitary ambush hunter with huge forepaws.'},
 gorilla:{n:'Silverback Gorilla',art:'gorilla',mass:170,len:1.7,spd:40,bite:4000,arm:3,hab:'jungle',sp:'roar',ai:'bluffer',fact:'Chest-beating is mostly a bluff; real fights are rare.'},
 grizzly:{n:'Grizzly Bear',art:'grizzly',mass:270,len:2.2,spd:56,bite:8000,arm:3,hab:'forest',sp:'swipe',ai:'brawler',fact:'A swipe from those 10 cm claws can break a moose\u2019s back.'},
 polar:{n:'Polar Bear',art:'polar',mass:450,len:2.5,spd:40,bite:7000,arm:3,hab:'arctic',sp:'swipe',ai:'brawler',fact:'The largest land carnivore; excellent stamina and a thick fat layer.'},
 hippo:{n:'Hippopotamus',art:'hippo',mass:1500,len:4.0,spd:30,bite:8100,arm:6,hab:'wetland',sp:'gape',ai:'charger',fact:'Kills more people in Africa than lions, with a huge gape and thick hide.'},
 rhino:{n:'White Rhino',art:'rhino',mass:2000,len:3.8,spd:50,bite:9000,arm:8,hab:'savanna',sp:'gore',ai:'charger',fact:'Its horn is keratin, like fingernails. It charges but turns slowly.'},
 elephant:{n:'African Elephant',art:'elephant',mass:5000,len:6.0,spd:40,bite:12000,arm:7,hab:'savanna',sp:'trample',ai:'charger',fact:'The largest land animal; it warns first with ears wide and trunk raised.'},
 anaconda:{n:'Green Anaconda',art:'green_anaconda',mass:100,len:5.0,spd:8,bite:1000,arm:2,hab:'wetland',sp:'constrict',ai:'ambush',fact:'A constrictor: it squeezes until its prey cannot breathe.'},
 cobra:{n:'King Cobra',art:'king_cobra',mass:6,len:3.0,spd:20,bite:100,arm:1,hab:'jungle',sp:'venom',ai:'striker',fact:'Can raise a third of its body off the ground; venom is strong enough to kill an elephant.'},
 croc:{n:'Nile Crocodile',art:'croc',mass:400,len:4.0,spd:17,bite:16000,arm:8,hab:'wetland',sp:'roll',ai:'grappler',fact:'Spins its whole body (the death roll) to tear off pieces of prey.'},
 saltcroc:{n:'Saltwater Crocodile',art:'croc',mass:800,len:5.0,spd:17,bite:16400,arm:8,hab:'wetland',sp:'roll',ai:'grappler',fact:'Largest living reptile; bite force measured at 16,000+ newtons.',scale:1.15}
};
// Evolution lines. Each form: next = list of evolutions with DNA cost.
const LINES = {
 mammal:{n:'Small Mammal',blurb:'From meerkat to big cat or bear. Choose your path.',start:'meerkat',
  evo:{meerkat:[['honey_badger',120]],honey_badger:[['jaguar',300],['grizzly',300]],jaguar:[['lion',600],['tiger',600]],grizzly:[['polar',600]]}},
 canine:{n:'Wolf Pack',blurb:'Wolf pup to grey wolf, then lead the pack or run it down.',start:'wolfpup',
  evo:{wolfpup:[['wolf',120]],wolf:[['alphawolf',300],['swiftwolf',300]],alphawolf:[],swiftwolf:[]}},
 reptile:{n:'Lizard to Dragon',blurb:'Gila monster to Komodo dragon, then constrictor or venom.',start:'gila',
  evo:{gila:[['komodo',120]],komodo:[['anaconda',300],['cobra',300]]}},
 croc:{n:'Croc Line',blurb:'Young croc to Nile croc to saltwater giant. Death roll!',start:'youngcroc',
  evo:{youngcroc:[['croc',120]],croc:[['saltcroc',300]]}}
};
const HABITATS = {
 forest:{n:'Forest',c:'#2e4a2b'},savanna:{n:'Savanna',c:'#8a6a2c'},jungle:{n:'Jungle',c:'#1f4d2f'},
 arctic:{n:'Arctic',c:'#5a7a8a'},wetland:{n:'Wetland',c:'#3a5a4a'},desert:{n:'Desert',c:'#9a6a3a'}
};
const SPECIALS = {
 sprint:{label:'SPRINT',desc:'Burst of speed + stamina refill'},
 venom:{label:'VENOM',desc:'Quick bite that poisons over time'},
 roll:{label:'DEATH ROLL',desc:'Grab and spin: grapple minigame'},
 frenzy:{label:'FRENZY',desc:'Fast, tough and angry for 4s'},
 pounce:{label:'POUNCE',desc:'Leap and pin: grapple minigame'},
 quills:{label:'QUILLS',desc:'Spikes hurt anyone who hits you'},
 kick:{label:'KICK',desc:'Fast, hard kick'},
 swipe:{label:'BEAR SWIPE',desc:'Huge sweeping swipe, knocks back'},
 roar:{label:'CHEST POUND',desc:'Roar that drains opponent stamina'},
 gape:{label:'GAPE BITE',desc:'Slow but crushing bite'},
 gore:{label:'GORE',desc:'Horn charge, heavy knockback'},
 trample:{label:'CHARGE!',desc:'Elephant charge, huge knockback'},
 constrict:{label:'CONSTRICT',desc:'Coil and squeeze: grapple minigame'}
};
window.LE_DATA={SPECIES,LINES,HABITATS,SPECIALS};
})();
