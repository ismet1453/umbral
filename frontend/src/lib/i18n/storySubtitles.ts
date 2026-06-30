import type { Locale, Messages, StorySubtitleCue } from "@/lib/i18n/types";

export const VO5_PART2_AT_MS = 10_000;

/** vo_1 — page1 */
const VO1: Record<Locale, string> = {
  en:
    "When some worlds lose their light... they die in silence. Others... burn their own children, to keep a false sun alive.",
  tr:
    "Bazı dünyalar ışığını kaybedince... sessizlikte ölür. Diğerleri... sahte bir güneşi ayakta tutmak için kendi çocuklarını yakar.",
  ru:
    "Когда миры теряют свой свет... они умирают в тишине. Другие... сжигают своих детей, лишь бы удержать ложное солнце.",
  zh:
    "有些世界失去光明……便在沉默中死去。另一些……焚烧自己的子民，只为维系虚假的太阳。",
  ja:
    "ある世界が光を失えば……静寂の中で死ぬ。別の世界は……偽りの太陽を生かすために、自らの子らを焼く。",
  ko:
    "어떤 세계는 빛을 잃으면... 침묵 속에 죽는다. 다른 세계는... 거짓 태양을 살리려 자신의 아이들을 태운다.",
  es:
    "Cuando algunos mundos pierden su luz... mueren en silencio. Otros... queman a sus propios hijos para mantener vivo un sol falso.",
  de:
    "Wenn Welten ihr Licht verlieren... sterben sie in Stille. Andere... verbrennen ihre eigenen Kinder, um eine falsche Sonne am Leben zu erhalten.",
  hi:
    "जब कुछ दुनियाएँ अपना प्रकाश खोती हैं... वे चुप्पी में मर जाती हैं। कुछ... झूठे सूरज को ज़िंदा रखने के लिए अपने ही बच्चों को जलाती हैं।",
  ar:
    "حين تفقد بعض العوالم نورها... تموت في صمت. وأخرى... تحرق أطفالها لإبقاء شمس زائفة حيّة.",
};

/** vo_2 — page2 */
const VO2: Record<Locale, string> = {
  en:
    "This is the Dominion. A kingdom built upon the corpses of gods... terrified of the dark.",
  tr:
    "Burası Dominion. Tanrıların cesetleri üzerine kurulmuş bir krallık... karanlıktan ölesiye korkan.",
  ru:
    "Это Доминион. Королевство, воздвигнутое на трупах богов... поверженное в ужас перед тьмой.",
  zh:
    "这就是多米尼恩。建立在诸神尸骸之上的王国……对黑暗充满恐惧。",
  ja:
    "ここがドミニオン。神々の亡骸の上に築かれた王国……闇を恐れおののく。",
  ko:
    "이곳이 도미니온이다. 신들의 시체 위에 세워진 왕국... 어둠을 두려워한다.",
  es:
    "Esta es la Dominión. Un reino erguido sobre los cadáveres de los dioses... aterrorizado por la oscuridad.",
  de:
    "Dies ist das Dominion. Ein Königreich, erbaut auf den Leichen der Götter... von der Dunkelheit in Angst erfüllt.",
  hi:
    "यह है डोमिनियन। देवताओं की लाशों पर खड़ा एक राज्य... जो अंधकार से भयभीत है।",
  ar:
    "هذا هو الدومينيون. مملكة بُنيت على جثث الآلهة... مرعوبة من الظلام.",
};

/** vo_3 — page3 */
const VO3: Record<Locale, string> = {
  en:
    "They say to me: tyrant. They say to me: sinner. Do they not see? If I do not sit upon this throne... if I do not stain these hands with blood... the night will swallow us all!",
  tr:
    "Bana zalim diyorlar. Bana günahkar diyorlar. Görmüyorlar mı? Bu tahta oturmazsam... bu elleri kanla lekelemezsem... gece hepimizi yutacak!",
  ru:
    "Мне говорят — тиран. Мне говорят — грешник. Разве они не видят? Если я не сяду на этот трон... если я не запятнаю эти руки кровью... ночь поглотит нас всех!",
  zh:
    "他们对我说我是暴君。他们对我说我是罪人。他们难道看不见吗？若我不坐上这王座……若不让这双手染血……黑夜将吞噬我们所有人！",
  ja:
    "彼らは私に暴君と言う。彼らは私に罪人と言う。彼らには見えないのか？この玉座に座らなければ……この手を血で染めなければ……夜が私たちすべてを飲み込む！",
  ko:
    "그들은 나에게 폭군이라 한다. 그들은 나에게 죄인이라 한다. 그들은 보지 못하는가? 내가 이 왕좌에 앉지 않으면... 이 손에 피를 묻히지 않으면... 밤이 우리 모두를 삼켜 버릴 것이다!",
  es:
    "Me dicen tirano. Me dicen pecador. ¿Acaso no ven? Si no me siento en este trono... si no mancho estas manos con sangre... ¡la noche nos tragará a todos!",
  de:
    "Sie sagen mir: Tyrann. Sie sagen mir: Sünder. Sehen sie es denn nicht? Wenn ich nicht auf diesem Thron sitze... wenn ich diese Hände nicht mit Blut beflecke... wird die Nacht uns alle verschlingen!",
  hi:
    "वे मुझे अत्याचारी कहते हैं। वे मुझे पापी कहते हैं। क्या उन्हें दिखाई नहीं देता? यदि मैं इस सिंहासन पर न बैठूँ... यदि मैं इन हाथों को खून से न रंगूँ... तो रात हम सबको निगल जाएगी!",
  ar:
    "يقولون لي: طاغية. يقولون لي: آثم. ألا يرون؟ إن لم أجلس على هذا العرش... إن لم ألطّخ هذه الأيدي بالدم... فسيحتضننا الليل جميعًا!",
};

/** vo_4 — page4 */
const VO4: Record<Locale, string> = {
  en:
    "Lord... forgive me. Not for the hell I have created... but for the light, I was forced to bring.",
  tr:
    "Rabbim... bana bağışla. Yarattığım cehennem için değil... getirmeye mecbur kılındığım o ışık için.",
  ru:
    "Господи... прости меня. Не за ад, что я создал... а за свет, который я был вынужден принести.",
  zh:
    "主啊……请宽恕我。不是为了我创造的地狱……而是为了我被迫带来的那道光。",
  ja:
    "主よ……お許しください。私が創り出した地獄のためではなく……運ばざるを得なかった光のために。",
  ko:
    "주님... 저를 용서하소서. 내가 만든 지옥이 아니라... 내가 어쩔 수 없이 가져온 그 빛을 위해.",
  es:
    "Señor... perdóname. No por el infierno que he creado... sino por la luz que me vi obligado a traer.",
  de:
    "Herr... vergib mir. Nicht für die Hölle, die ich erschaffen habe... sondern für das Licht, das ich bringen musste.",
  hi:
    "हे प्रभु... मुझे क्षमा करो। उस नरक के लिए नहीं जो मैंने रचा... बल्कि उस प्रकाश के लिए जिसे लाने के लिए मुझे मजबूर किया गया।",
  ar:
    "يا رب... اغفر لي. ليس من أجل الجحيم الذي خلقته... بل من أجل النور الذي أُجبرتُ على إحضاره.",
};

/** vo_5 — page5 (two timed cues: 0s + 10s) */
const VO5_A: Record<Locale, string> = {
  en:
    "You thought I died the day you buried me in that dungeon, Isolde. You were wrong. I did not drown in the dark...",
  tr:
    "Beni o zindana gömdüğün gün öldüğümü sandın, Isolde. Yanılıyordun. Karanlıkta boğulmadım...",
  ru:
    "Ты думала, я умер в тот день, когда ты похоронила меня в той темнице, Изольда. Ты ошибалась. Я не утонул во тьме...",
  zh:
    "你以为在你把我埋进那座地牢的那天我就死了，伊索尔德。你错了。我没有在黑暗中沉溺……",
  ja:
    "お前は俺をあの地下牢に埋めた日に死んだと思ったな、イゾルデ。間違いだ。闇の中で溺れなどしなかった……",
  ko:
    "넌 나를 그 지하 감옥에 묻은 날 내가 죽었다고 생각했지, 이졸데. 틀렸어. 나는 어둠 속에서 빠져 죽지 않았다...",
  es:
    "Creíste que morí el día que me enterraste en esa mazmorra, Isolde. Te equivocabas. No me ahogué en la oscuridad...",
  de:
    "Du dachtest, ich starb an dem Tag, als du mich in diesem Kerker begrubst, Isolde. Du hast dich geirrt. Ich ertrank nicht in der Dunkelheit...",
  hi:
    "तुमने सोचा कि जिस दिन तुमने मुझे उस कालकोठरी में दबाया, मैं मर गया, इसोल्डे। तुम गलत थीं। मैं अंधकार में डूबा नहीं...",
  ar:
    "ظننتِ أنني متُّ في اليوم الذي دفنتِني في ذلك السجن، إيزولده. كنتِ مخطئة. لم أغرق في الظلام...",
};

const VO5_B: Record<Locale, string> = {
  en:
    "...I became the darkness itself! Every scar on my flesh is a vow to you! I will burn your throne, shatter your crown... and grant none of you peace. Not even in death!",
  tr:
    "...Karanlığın kendisi oldum! Etimdeki her yara sana bir yemin! Tahtını yakacağım, tacını paramparça edeceğim... ve hiçbirinize huzur vermeyeceğim. Ölümde bile!",
  ru:
    "...Я сам стал тьмой! Каждый шрам на моей плоти — клятва тебе! Я сожгу твой трон, разобью твою корону... и не дарую покоя никому из вас. Даже в смерти!",
  zh:
    "……我成为了黑暗本身！我血肉上的每一道伤疤都是对你的誓言！我会焚毁你的王座，粉碎你的皇冠……让你们任何人不得安宁。即便在死亡中！",
  ja:
    "……俺は闇そのものとなった！肉体の傷一つ一つがお前への誓いだ！お前の玉座を焼き、冠を砕き……誰一人として安らぎなど与えぬ。死においてさえ！",
  ko:
    "...나는 어둠 그 자체가 되었다! 내 살결의 흉터 하나하나가 너에게 맹세다! 네 왕좌를 불태우고, 왕관을 산산이 부수겠다... 그리고 너희 누구에게도 평화를 주지 않겠다. 죽음에서조차!",
  es:
    "...¡Me convertí en la oscuridad misma! ¡Cada cicatriz en mi carne es un voto hacia ti! Quemaré tu trono, haré añicos tu corona... y no concederé paz a ninguno de vosotros. ¡Ni siquiera en la muerte!",
  de:
    "...Ich wurde die Dunkelheit selbst! Jede Narbe auf meinem Fleisch ist ein Schwur an dich! Ich werde deinen Thron verbrennen, deine Krone zerschmettern... und keinem von euch Frieden gewähren. Selbst nicht im Tod!",
  hi:
    "...मैं स्वयं अंधकार बन गया! मेरे शरीर की हर निशान तुम्हें दी गई प्रतिज्ञा है! मैं तुम्हारा सिंहासन जलाऊँगा, तुम्हारा मुकुट चूर करूँगा... और तुममें से किसी को भी शांति नहीं दूँगा। मृत्यु में भी नहीं!",
  ar:
    "...صِرتُ الظلام ذاته! كل ندبة على لحمي نذرٌ لكِ! سأحرق عرشك، وأحطم تاجك... ولن أمنح أياً منكم سلامًا. حتى في الموت!",
};

/** vo_6 — page6 */
const VO6: Record<Locale, string> = {
  en:
    "Do not weep, fragile mortals... shed no more blood. The sky never forgets. For a hundred years, I have watched your struggles from this silver cage.",
  tr:
    "Ağlamayın, kırılgan faniler... bir damla daha kan dökmeyin. Gökyüzü asla unutmaz. Yüz yıldır bu gümüş kafesten mücadelelerinizi izliyorum.",
  ru:
    "Не плачьте, хрупкие смертные... не проливайте больше крови. Небо никогда не забывает. Сто лет я наблюдаю за вашими битвами из этой серебряной клетки.",
  zh:
    "不要哭泣，脆弱的人们……不要再流血了。天空从不遗忘。百年来，我在这座银笼中注视着你们的挣扎。",
  ja:
    "泣くな、脆き凡人どもよ……これ以上血を流すな。空は決して忘れない。百年、この銀の檻からお前たちの苦闘を見てきた。",
  ko:
    "울지 마라, 연약한 필멸자들이여... 더 이상 피를 흘리지 마라. 하늘은 결코 잊지 않는다. 백 년 동안 이 은빛 우리에서 너희의 싸움을 지켜보아 왔다.",
  es:
    "No lloréis, frágiles mortales... no derraméis más sangre. El cielo nunca olvida. Durante cien años, he observado vuestras luchas desde esta jaula de plata.",
  de:
    "Weint nicht, zerbrechliche Sterbliche... vergosset kein Blut mehr. Der Himmel vergisst nie. Hundert Jahre lang beobachte ich eure Kämpfe aus diesem silbernen Käfig.",
  hi:
    "रोओ मत, नाज़ुक मनुष्यों... और खून मत बहाओ। आकाश कभी नहीं भूलता। सौ वर्षों से इस चाँदी के पिंजरे से मैं तुम्हारे संघर्ष देख रही हूँ।",
  ar:
    "لا تبكوا أيها الفانون الهش... ولا تسفكوا المزيد من الدماء. السماء لا تنسى أبدًا. منذ مئة عام، أراقب صراعاتكم من هذا القفص الفضي.",
};

/** vo_7 — page7 */
const VO7: Record<Locale, string> = {
  en:
    "The hour has come. The moment the crimson blade touches that throne... I shall release my final breath. And the eternal equinox I bring... will lay you all into an endless sleep.",
  tr:
    "Saat geldi. Kızıl kılıç o tahtına değdiği an... son nefesimi bırakacağım. Ve getireceğim o sonsuz ekinoks... hepinizi sonsuz bir uykuya yatıracak.",
  ru:
    "Час настал. В тот миг, когда багряный клинок коснётся того трона... я испущу свой последний вздох. И вечное равноденствие, что я принесу... уложит вас всех в бесконечный сон.",
  zh:
    "时辰已到。当猩红之刃触及那张王座的一刻……我将呼出最后一口气。而我带来的永恒春分……将使你们所有人陷入无尽的沉睡。",
  ja:
    "時は来た。その玉座に紅の刃が触れた瞬間……私は最後の息を吐くだろう。そして私がもたらす永遠の秋分……お前たちすべてを終わりなき眠りに落とす。",
  ko:
    "때가 왔다. 핏빛 칼날이 그 왕좌에 닿는 순간... 나는 마지막 숨을 내뱉을 것이다. 그리고 내가 가져올 영원한 춘분... 너희 모두를 끝없는 잠에 빠뜨릴 것이다.",
  es:
    "Ha llegado la hora. En el instante en que la hoja carmesí toque ese trono... exhalaré mi último aliento. Y el equinoccio eterno que traigo... os sumirá a todos en un sueño sin fin.",
  de:
    "Die Stunde ist gekommen. In dem Moment, da die purpurne Klinge jenen Thron berührt... werde ich meinen letzten Atemzug entlassen. Und das ewige Äquinoktium, das ich bringe... wird euch alle in einen endlosen Schlaf legen.",
  hi:
    "घड़ी आ गई है। जिस क्षण लाल तलवार उस सिंहासन को छुएगी... मैं अपनी अंतिम साँस छोड़ूँगी। और मैं जो शाश्वत विषुव लाऊँगी... तुम सबको अनंत नींद में सुला देगी।",
  ar:
    "لقد حان الموعد. في اللحظة التي يلمس فيها النصل القرمزي ذلك العرش... سأطلق أنفاسي الأخيرة. والاعتدال الأبدي الذي أحضره... سيجعلكم جميعًا في نوم لا نهاية له.",
};

/** vo_8 — page8 */
const VO8: Record<Locale, string> = {
  en:
    "(Soft chuckle) Ah... what a magnificent tragedy, isn't it? One believes she saves the world... the other seeks her vengeance... while the little goddess in the sky just waits for them all to die.",
  tr:
    "(Hafif bir kıkırdama) Ah... ne muhteşem bir trajedi, değil mi? Biri dünyayı kurtardığına inanıyor... diğeri intikamını arıyor... gökyüzündeki küçük tanrıça ise hepsinin ölmesini bekliyor.",
  ru:
    "(Тихий смешок) Ах... какая великолепная трагедия, не правда ли? Одна верит, что спасает мир... другая ищет свою месть... а маленькая богиня в небе просто ждёт, когда они все умрут.",
  zh:
    "（轻笑）啊……多么壮丽的悲剧，不是吗？一个以为自己拯救了世界……另一个追寻她的复仇……而天上的小女神，只是等着他们全部死去。",
  ja:
    "（くすくす笑い）ああ……なんと壮麗な悲劇だろう？一人は世界を救ったと信じ、もう一人は復讐を求め……空の小さな女神は、皆が死ぬのをただ待っている。",
  ko:
    "(낮은 웃음) 아... 정말 장엄한 비극이지 않은가? 하나는 자신이 세계를 구한다 믿고... 다른 하나는 복수를 추구하며... 하늘의 작은 여신은 그저 모두가 죽기를 기다릴 뿐이다.",
  es:
    "(Risa suave) Ah... qué magnífica tragedia, ¿no? Una cree que salva al mundo... la otra busca su venganza... mientras la pequeña diosa en el cielo solo espera a que todos mueran.",
  de:
    "(Leises Kichern) Ah... was für eine großartige Tragödie, nicht wahr? Die eine glaubt, sie rette die Welt... die andere sucht ihre Rache... während die kleine Göttin am Himmel nur darauf wartet, dass sie alle sterben.",
  hi:
    "(धीरी हँसी) आह... क्या शानदार त्रासदी है, है न? एक को लगता है वह संसार बचा रही है... दूसरी अपना बदला चाहती है... और आकाश की छोटी देवी बस उन सबके मरने का इंतज़ार कर रही है।",
  ar:
    "(ضحكة خفيفة) آه... يا لها من مأساة رائعة، أليس كذلك؟ إحداهما تظن أنها تنقذ العالم... والأخرى تطلب انتقامها... بينما الإلهة الصغيرة في السماء تنتظر فقط موتهم جميعًا.",
};

/** vo_9 — page9 */
const VO9: Record<Locale, string> = {
  en:
    "They swing the blades, darling... but I hold the strings. Let the show begin!",
  tr:
    "Kılıçlarını sallıyorlar, canım... ama ipleri ben tutuyorum. Gösteri başlasın!",
  ru:
    "Они размахивают клинками, дорогая... но нити держу я. Пусть начнётся представление!",
  zh:
    "他们在挥舞刀刃，亲爱的……但牵线的人是我。让演出开始吧！",
  ja:
    "奴らは刃を振るう、ダーリン……だが糸を握るのは私よ。ショーの始まりだ！",
  ko:
    "그들은 칼날을 휘두르지, 자기야... 하지만 실을 쥔 건 나야. 쇼를 시작하자!",
  es:
    "Ellos blanden las espadas, cariño... pero yo sostengo los hilos. ¡Que comience el espectáculo!",
  de:
    "Sie schwingen die Klingen, Liebling... aber ich halte die Fäden. Lasst die Show beginnen!",
  hi:
    "वे तलवारें चलाते हैं, प्रिये... पर धागे मेरे हाथ में हैं। तमाशा शुरू हो!",
  ar:
    "إنهم يُلوّحون بالسيوف، عزيزتي... لكن الخيوط بيدي. فلتبدأ العروض!",
};

function vo5Cues(locale: Locale): StorySubtitleCue[] {
  return [
    { atMs: 0, text: VO5_A[locale] },
    { atMs: VO5_PART2_AT_MS, text: VO5_B[locale] },
  ];
}

function buildScenes(locale: Locale): Messages["story"]["scenes"] {
  return [
    VO1[locale],
    VO2[locale],
    VO3[locale],
    VO4[locale],
    vo5Cues(locale),
    VO6[locale],
    VO7[locale],
    VO8[locale],
    VO9[locale],
  ];
}

export const STORY_SCENE_SUBTITLES: Record<Locale, Messages["story"]["scenes"]> = {
  tr: buildScenes("tr"),
  en: buildScenes("en"),
  ru: buildScenes("ru"),
  zh: buildScenes("zh"),
  ja: buildScenes("ja"),
  ko: buildScenes("ko"),
  es: buildScenes("es"),
  de: buildScenes("de"),
  hi: buildScenes("hi"),
  ar: buildScenes("ar"),
};
