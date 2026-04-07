import { useState, useEffect } from 'react';

// Use ENABLE word list - curated for word games, no abbreviations/proper nouns
const DICT_URL = 'https://raw.githubusercontent.com/dolph/dictionary/master/enable1.txt';

// Common proper names to filter out (lowercase)
const BLOCKED_NAMES = new Set([
  'alan','alex','amy','anna','ben','bob','carl','dan','dave','ed','emma',
  'fred','gary','hal','ian','jack','jane','jim','joe','john','kate','ken',
  'lee','lisa','mark','mary','max','mike','nick','pat','paul','pete','ray',
  'rob','ron','roy','sam','sue','ted','tim','tom','will',
]);

export function useDictionary() {
  const [words, setWords] = useState<Set<string> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(DICT_URL)
      .then((res) => res.text())
      .then((text) => {
        const wordSet = new Set<string>();
        text.split(/\r?\n/).forEach((w) => {
          const trimmed = w.trim().toLowerCase();
          // Only accept words that are 3-10 chars, purely alphabetic
          if (
            trimmed.length >= 3 &&
            trimmed.length <= 10 &&
            /^[a-z]+$/.test(trimmed) &&
            !BLOCKED_NAMES.has(trimmed)
          ) {
            wordSet.add(trimmed);
          }
        });
        setWords(wordSet);
        setLoading(false);
      })
      .catch(() => {
        // Fallback: common words
        const fallback = new Set([
          'the','and','for','are','but','not','you','all','can','had','her','was','one','our','out',
          'day','get','has','him','his','how','its','may','new','now','old','see','way','who','boy',
          'did','cat','dog','run','big','top','red','use','say','she','two','let','put','end','too',
          'any','act','age','ago','air','ask','bad','bag','bed','bit','box','car','cup','cut','dry',
          'ear','eat','egg','eye','far','fat','few','fly','fun','got','gun','guy','hat','hit',
          'hot','ice','ill','job','key','kid','lay','led','leg','lie','lot','low','map','mix','nor',
          'nut','odd','oil','pay','pen','pet','pie','pin','pop','pot','pull','push','rain','read',
          'rest','rich','ride','ring','rise','road','rock','roll','roof','room','root','rope','rose',
          'rule','rush','safe','sail','salt','sand','sang','save','seat','seed','seek','seem','seen',
          'self','sell','send','sent','ship','shop','shot','show','shut','sick','side','sign','sing',
          'sink','site','size','skin','slip','slow','snap','snow','soft','soil','sold','some','song',
          'soon','sort','soul','spin','spot','star','stay','step','stop','such','suit','sure','swim',
          'tail','take','tale','talk','tall','tank','tape','task','team','tear','tell','tend','term',
          'test','text','than','that','them','then','they','thin','this','thus','tied','till','time',
          'tiny','told','tone','took','tool','tops','tour','town','trap','tree','trim','trip','true',
          'tube','tune','turn','twin','type','unit','upon','used','vast','very','vote','wage',
          'wait','wake','walk','wall','want','warm','warn','wash','wave','weak','wear','week','well',
          'went','were','west','what','when','whom','wide','wife','wild','will','wind','wine','wing',
          'wire','wise','wish','with','wood','word','wore','work','worn','wrap','yard','yeah','year',
          'zero','zone','able','also','area','army','away','baby','back','ball','band','bank','base',
          'been','beer','bell','belt','bend','best','bill','bind','bird','bite','blow','blue','blur',
          'boat','body','bold','bomb','bond','bone','book','boom','boot','born','boss','both','bowl',
          'burn','busy','calm','came','camp','card','care','case','cash','cast','cell','chat','chip',
          'city','clap','clay','clip','club','clue','coal','coat','code','coin','cold','come','cook',
          'cool','cope','copy','core','corn','cost','crew','crop','dare','dark','data','date','dawn',
          'dead','deaf','deal','dear','debt','deck','deep','deer','deny','desk','dial','diet','dirt',
          'dish','disk','dock','does','done','door','dose','down','draw','drew','drop','drug','drum',
          'dual','dull','dump','dust','duty','each','earn','ease','east','easy','edge','edit','else',
          'even','ever','evil','exam','exit','face','fact','fade','fail','fair','fake','fall','fame',
          'farm','fast','fate','fear','feat','feed','feel','feet','fell','felt','file','fill','film',
          'find','fine','fire','firm','fish','fist','five','flag','flat','fled','flew','flip','flow',
          'fold','folk','food','fool','foot','fork','form','fort','foul','four','free','from','fuel',
          'full','fund','fury','fuss','gain','game','gang','gate','gave','gaze','gear','gene','gift',
          'girl','give','glad','glow','glue','goal','goes','gold','golf','gone','good','grab','gray',
          'grew','grey','grid','grip','grow','gulf','hail','hair','half','hall','halt','hand','hang',
          'hard','harm','hate','haul','have','head','heal','heap','hear','heat','heel','held','hell',
          'help','here','hero','hide','high','hill','hint','hire','hold','hole','holy','home','hook',
          'hope','horn','host','hour','huge','hull','hung','hunt','hurt','idea','inch','into','iron',
          'item','jail','join','joke','jump','jury','just','keen','keep','kept','kick','kill','kind',
          'king','knee','knew','knit','knot','know','lack','lady','laid','lake','lamp','land','lane',
          'last','late','lawn','lead','leaf','lean','left','lend','lens','less','lied','life','lift',
          'like','limb','lime','line','link','lion','lips','list','live','load','loan','lock','lone',
          'long','look','lord','lose','loss','lost','loud','love','luck','lung','made','mail','main',
          'make','male','mall','many','mask','mass','mate','meal','mean','meat','meet','melt','menu',
          'mere','mess','mild','mile','milk','mill','mind','mine','miss','mode','mood','moon','more',
          'most','moth','move','much','must','myth','nail','name','navy','near','neat','neck','need',
          'nest','next','nice','nine','node','none','noon','norm','nose','note','noun','okay','once',
          'only','onto','open','oral','over','pace','pack','page','paid','pain','pair','pale','palm',
          'park','part','pass','past','path','peak','peer','pine','pink','pipe','plan','play','plea',
          'plot','plug','plus','poem','poet','pole','poll','pond','pool','poor','pork','port','pose',
          'post','pour','pray','prey','pure','quit','race','rack','rage','raid','rail','rank','rare',
          'rate','rear','rely','rent','ripe','rise','risk','road','role','roll','roof','room','root',
          'rope','rose','round','route','ruin','sake','same','sand','sang','save','scan','seal','seat',
          'seed','seek','self','sell','send','shed','ship','shoe','shop','shot','show','shut','sick',
          'side','sigh','sign','silk','sing','sink','slip','slot','slow','snap','snow','soak','soar',
          'sock','soft','soil','sole','some','song','soon','sort','soul','sour','span','spin','spot',
          'star','stay','stem','step','stir','stop','such','suit','sure','swim','tail','take','tale',
          'talk','tall','tank','tape','task','team','tear','teen','tell','tend','tent','term','test',
          'text','than','that','them','then','thin','this','thus','tick','tide','tidy','tied','tier',
          'till','time','tiny','tips','tire','told','toll','tone','took','tool','tops','tore','torn',
          'toss','tour','town','trap','tray','tree','trim','trio','trip','true','tube','tuck','tune',
          'turn','twin','type','ugly','undo','unit','upon','urge','used','vain','vary','vast','verb',
          'very','vice','view','vine','void','volt','vote','wade','wage','wait','wake','walk','wall',
          'want','ward','warm','warn','wash','wave','weak','wear','weed','week','well','went','were',
          'west','what','when','whom','wide','wife','wild','will','wind','wine','wing','wire','wise',
          'wish','with','woke','wolf','wood','wool','word','wore','work','worm','worn','wrap','yard',
          'year','zero','zone',
        ]);
        setWords(fallback);
        setLoading(false);
      });
  }, []);

  const isValidWord = (word: string): boolean => {
    if (!words) return false;
    return words.has(word.toLowerCase());
  };

  return { isValidWord, loading, wordCount: words?.size ?? 0 };
}
