import { useState, useEffect } from 'react';

const DICT_URL = 'https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt';

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
          if (trimmed.length >= 3 && trimmed.length <= 10) {
            wordSet.add(trimmed);
          }
        });
        setWords(wordSet);
        setLoading(false);
      })
      .catch(() => {
        // Fallback: small set of common words
        const fallback = new Set([
          'the','and','for','are','but','not','you','all','can','had','her','was','one','our','out',
          'day','get','has','him','his','how','its','may','new','now','old','see','way','who','boy',
          'did','cat','dog','run','big','top','red','use','say','she','two','let','put','end','too',
          'any','act','age','ago','air','ask','bad','bag','bed','bit','box','car','cup','cut','dry',
          'ear','eat','egg','eye','far','fat','few','fly','fun','god','got','gun','guy','hat','hit',
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
          'tube','tune','turn','twin','type','unit','upon','used','user','vast','very','vote','wage',
          'wait','wake','walk','wall','want','warm','warn','wash','wave','weak','wear','week','well',
          'went','were','west','what','when','whom','wide','wife','wild','will','wind','wine','wing',
          'wire','wise','wish','with','wood','word','wore','work','worn','wrap','yard','yeah','year',
          'zero','zone','able','also','area','army','away','baby','back','ball','band','bank','base',
          'bath','bean','bear','beat','been','beer','bell','belt','bend','best','bill','bind','bird',
          'bite','blow','blue','blur','boat','body','bold','bomb','bond','bone','book','boom','boot',
          'born','boss','both','bowl','burn','busy','calm','came','camp','card','care','case','cash',
          'cast','cell','chat','chip','city','clap','clay','clip','club','clue','coal','coat','code',
          'coin','cold','come','cook','cool','cope','copy','core','corn','cost','crew','crop','dare',
          'dark','data','date','dawn','dead','deaf','deal','dear','debt','deck','deep','deer','deny',
          'desk','dial','diet','dirt','dish','disk','dock','does','done','door','dose','down','draw',
          'drew','drop','drug','drum','dual','dull','dump','dust','duty','each','earn','ease','east',
          'easy','edge','edit','else','euro','even','ever','evil','exam','exit','face','fact','fade',
          'fail','fair','fake','fall','fame','farm','fast','fate','fear','feat','feed','feel','feet',
          'fell','felt','file','fill','film','find','fine','fire','firm','fish','fist','five','flag',
          'flat','fled','flew','flip','flow','fold','folk','food','fool','foot','ford','fore','fork',
          'form','fort','foul','four','free','from','fuel','full','fund','fury','fuss','gain','game',
          'gang','gate','gave','gaze','gear','gene','gift','girl','give','glad','glow','glue','goal',
          'goes','gold','golf','gone','good','grab','gray','grew','grey','grid','grip','grow','gulf',
          'hail','hair','half','hall','halt','hand','hang','hard','harm','hate','haul','have','head',
          'heal','heap','hear','heat','heel','held','hell','help','here','hero','hide','high','hill',
          'hint','hire','hold','hole','holy','home','hook','hope','horn','host','hour','huge','hull',
          'hung','hunt','hurt','idea','inch','into','iron','item','jack','jail','join','joke','jump',
          'jury','just','keen','keep','kept','kick','kill','kind','king','knee','knew','knit','knot',
          'know','lack','lady','laid','lake','lamp','land','lane','last','late','lawn','lead','leaf',
          'lean','left','lend','lens','less','lied','life','lift','like','limb','lime','line','link',
          'lion','lips','list','live','load','loan','lock','logo','lone','long','look','lord','lose',
          'loss','lost','loud','love','luck','lung','made','mail','main','make','male','mall','many',
          'mark','mask','mass','mate','meal','mean','meat','meet','melt','menu','mere','mess','mild',
          'mile','milk','mill','mind','mine','miss','mode','mood','moon','more','most','moth','move',
          'much','must','myth','nail','name','navy','near','neat','neck','need','nest','next','nice',
          'nine','node','none','noon','norm','nose','note','noun','okay','once','only','onto','open',
          'oral','over','pace','pack','page','paid','pain','pair','pale','palm','pant','park','part',
          'pass','past','path','peak','peer','pine','pink','pipe','plan','play','plea','plot','plug',
          'plus','poem','poet','pole','poll','pond','pool','poor','pope','pork','port','pose','post',
          'pour','pray','prey','pure','quit','race','rack','rage','raid','rail','rank','rare','rate',
          'rear','rely','rent','ripe','rise','risk','road','role','roll','roof','room','root','rope',
          'rose','rough','round','route','royal','ruin','sake','same','sand','sang','save','scan',
          'seal','seat','seed','seek','self','sell','send','sept','set','shed','ship','shoe','shop',
          'shot','show','shut','sick','side','sigh','sign','silk','sing','sink','slip','slot','slow',
          'snap','snow','soak','soar','sock','soft','soil','sole','some','song','soon','sort','soul',
          'sour','span','spec','spin','spot','star','stay','stem','step','stir','stop','such','suit',
          'sure','swim','tail','take','tale','talk','tall','tank','tape','task','team','tear','teen',
          'tell','temp','tend','tent','term','test','text','than','that','them','then','thin','this',
          'thus','tick','tide','tidy','tied','tier','till','time','tiny','tips','tire','told','toll',
          'tone','took','tool','tops','tore','torn','toss','tour','town','trap','tray','tree','trim',
          'trio','trip','true','tube','tuck','tune','turn','twin','type','ugly','undo','unit','upon',
          'urge','used','user','vain','vale','vary','vast','verb','very','vice','view','vine','visa',
          'void','volt','vote','wade','wage','wait','wake','walk','wall','want','ward','warm','warn',
          'wash','vast','wave','weak','wealth','weapon','wear','weave','weed','week','weigh','weird',
          'well','went','were','west','what','wheat','wheel','where','which','while','white','whole',
          'whose','wide','wife','wild','will','wind','wine','wing','wire','wise','wish','with','woke',
          'wolf','woman','women','won','wood','wool','word','wore','work','world','worm','worn','worry',
          'worse','worst','worth','would','wound','wrap','wrist','write','wrong','wrote','yard','year',
          'yield','young','your','youth','zero','zone',
          'apple','beach','brain','bread','break','bring','brown','build','carry','catch','cause',
          'chain','chair','cheap','check','chess','child','china','claim','class','clean','clear',
          'climb','clock','close','cloud','coach','coast','color','count','court','cover','crash',
          'cream','crime','cross','crowd','cycle','dance','death','delay','depth','devil','dirty',
          'doubt','dozen','draft','drain','drama','drank','drawn','dream','dress','drink','drive',
          'dying','eager','early','earth','eight','elect','empty','enemy','enjoy','enter','equal',
          'error','event','every','exact','exist','extra','faith','false','fancy','fault','feast',
          'fence','fever','fewer','fiber','field','fifth','fifty','fight','final','first','fixed',
          'flash','flesh','float','flood','floor','flour','fluid','focus','force','forth','found',
          'frame','frank','fraud','fresh','front','fruit','fully','funny','ghost','giant','given',
          'glass','globe','glory','going','grace','grade','grain','grand','grant','graph','grass',
          'grave','great','green','greet','grief','gross','group','grown','guard','guess','guide',
          'guilt','happy','harsh','heart','heavy','hence','honey','honor','horse','hotel','house',
          'human','humor','ideal','image','imply','index','inner','input','issue','ivory','joint',
          'jones','judge','juice','knock','known','label','labor','large','laser','later','laugh',
          'layer','learn','least','leave','legal','level','light','limit','liver','local','loose',
          'lover','lower','lucky','lunch','magic','major','maker','march','match','maybe','mayor',
          'media','mercy','metal','meter','might','minor','minus','model','money','month','moral',
          'motor','mount','mouse','mouth','moved','movie','music','nerve','never','newly','night',
          'noise','north','noted','novel','nurse','ocean','offer','often','opera','orbit','order',
          'other','ought','outer','owner','paint','panel','panic','paper','party','patch','pause',
          'peace','penny','phase','phone','photo','piano','piece','pilot','pitch','pizza','place',
          'plain','plane','plant','plate','plaza','plead','point','pound','power','press','price',
          'pride','prime','print','prior','prize','proof','proud','prove','pupil','queen','query',
          'quest','queue','quick','quiet','quite','quote','radar','radio','raise','range','rapid',
          'ratio','reach','react','ready','reign','relax','reply','right','rival','river','robot',
          'roman','rough','round','route','royal','rural','sadly','saint','salad','sauce','scale',
          'scene','scope','score','sense','serve','seven','shade','shaft','shake','shall','shame',
          'shape','share','sharp','shelf','shell','shift','shine','shirt','shock','shoot','shore',
          'short','shout','sight','since','sixth','sixty','skill','skull','slave','sleep','slice',
          'slide','slope','smart','smell','smile','smoke','snake','solar','solid','solve','sorry',
          'sound','south','space','spare','speak','speed','spend','spent','spite','split','spoke',
          'spray','squad','stack','staff','stage','stain','stake','stall','stamp','stand','stare',
          'start','state','steal','steam','steel','steep','steer','stick','stiff','still','stock',
          'stone','stood','store','storm','story','stove','strip','stuck','study','stuff','style',
          'sugar','super','surge','swear','sweep','sweet','swing','sword','table','taste','teach',
          'teeth','thank','theme','thick','thing','think','third','those','three','threw','throw',
          'thumb','tight','tired','title','today','token','tooth','topic','total','touch','tough',
          'tower','trace','track','trade','trail','train','trait','treat','trend','trial','tribe',
          'trick','troop','truck','truly','trump','trunk','trust','truth','tumor','twice','twist',
          'ultra','uncle','under','union','unite','unity','until','upper','urban','usage','usual',
          'valid','value','video','virus','visit','vital','vivid','vocal','voice','voter','waste',
          'watch','water','weave','wheel','where','which','while','white','whole','whose','woman',
          'women','world','worry','worse','worst','worth','would','wound','write','wrong','wrote',
          'youth',
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
