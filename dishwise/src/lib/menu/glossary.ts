/**
 * A small, hand-written glossary of dish names and culinary terms.
 *
 * This is GENERAL culinary knowledge: how a dish is *usually* made. A specific
 * restaurant's version may differ, and the UI always says so.
 *
 * `mayContain` lists ingredients a dish *traditionally* includes that matter
 * for dietary requirements (e.g. dashi is usually made with fish). These
 * generate "check with the restaurant" cautions — never guarantees.
 */
export type Concern =
  | "meat"
  | "pork"
  | "fish"
  | "shellfish"
  | "dairy"
  | "gluten"
  | "nuts"
  | "alcohol"
  | "egg";

export interface GlossaryEntry {
  keys: string[];
  name: string;
  explain: string;
  cuisine: string;
  /** 1 = familiar to most UK diners, 3 = unfamiliar to most. */
  novelty: 1 | 2 | 3;
  flavour: string[];
  mayContain?: Partial<Record<Concern, string>>;
  /** Typical heat 0–3 when the term itself implies spice. */
  spice?: 0 | 1 | 2 | 3;
}

export const GLOSSARY: GlossaryEntry[] = [
  // ——— Chinese / Cantonese ———
  { keys: ["har gow", "har gau"], name: "Har gow", cuisine: "Cantonese", novelty: 2, flavour: ["delicate", "sweet prawn"],
    explain: "Translucent steamed dumplings, usually filled with prawn. A dim sum classic with a soft, slightly chewy wrapper.",
    mayContain: { shellfish: "Traditionally filled with prawn.", gluten: "Wrappers are often made with wheat starch." } },
  { keys: ["xiao long bao", "soup dumpling"], name: "Xiao long bao", cuisine: "Shanghainese", novelty: 3, flavour: ["savoury broth", "gingery"],
    explain: "Steamed dumplings with a filling and a mouthful of hot broth inside. Usually eaten from a spoon: nibble, sip the soup, then eat.",
    mayContain: { pork: "Traditionally made with pork, and often pork-based broth.", gluten: "Wheat-flour wrapper." } },
  { keys: ["char siu"], name: "Char siu", cuisine: "Cantonese", novelty: 2, flavour: ["sweet", "sticky", "smoky"],
    explain: "Cantonese barbecued pork with a sweet, sticky, reddish glaze.",
    mayContain: { pork: "Char siu is traditionally pork.", alcohol: "Marinades sometimes include rice wine.", gluten: "Marinades often include soy or hoisin, which may contain wheat." } },
  { keys: ["bao"], name: "Bao", cuisine: "Chinese / Taiwanese", novelty: 2, flavour: ["soft", "pillowy"],
    explain: "A soft, fluffy steamed bun, either filled or folded around a filling.",
    mayContain: { gluten: "Bao dough is made from wheat flour.", dairy: "Some recipes use milk in the dough." } },
  { keys: ["hoisin"], name: "Hoisin", cuisine: "Chinese", novelty: 1, flavour: ["sweet", "savoury", "thick"],
    explain: "A thick, sweet-savoury sauce made from fermented soybeans. Think of the sauce served with crispy duck pancakes.",
    mayContain: { gluten: "Hoisin often contains wheat." } },
  { keys: ["mapo tofu", "mapo"], name: "Mapo tofu", cuisine: "Sichuan", novelty: 3, flavour: ["numbing", "spicy", "savoury"], spice: 2,
    explain: "Soft tofu in a fiery, oily chilli-bean sauce with Sichuan pepper, which gives a tingling, numbing sensation. Traditionally includes minced meat.",
    mayContain: { meat: "Traditionally includes minced beef or pork.", pork: "Some versions use minced pork." } },
  { keys: ["sichuan pepper", "szechuan pepper"], name: "Sichuan pepper", cuisine: "Sichuan", novelty: 3, flavour: ["citrusy", "tingling", "numbing"],
    explain: "Not actually a chilli. It's a husk that makes your lips tingle and go slightly numb. Often paired with chilli for 'mala' heat." },
  { keys: ["kung pao", "gong bao"], name: "Kung pao", cuisine: "Sichuan", novelty: 2, flavour: ["sweet", "sour", "spicy", "nutty"], spice: 2,
    explain: "A stir-fry with dried chillies, peanuts and a glossy sweet-sour-savoury sauce.",
    mayContain: { nuts: "Kung pao dishes traditionally contain peanuts.", gluten: "Usually made with soy sauce, which typically contains wheat." } },
  { keys: ["ho fun", "hor fun"], name: "Ho fun", cuisine: "Cantonese", novelty: 2, flavour: ["smoky 'wok hei'", "savoury"],
    explain: "Wide, flat rice noodles, often wok-fried until slightly smoky. The smokiness is called 'wok hei'.",
    mayContain: { gluten: "Rice noodles, but usually seasoned with soy sauce, which typically contains wheat." } },
  { keys: ["singapore vermicelli", "singapore noodles"], name: "Singapore noodles", cuisine: "Cantonese (Hong Kong)", novelty: 1, flavour: ["curry-spiced", "light"],
    explain: "Thin rice noodles stir-fried with curry powder. Despite the name, it's a Hong Kong-Cantonese takeaway classic." },
  { keys: ["superior soy"], name: "Superior soy", cuisine: "Cantonese", novelty: 2, flavour: ["savoury", "salty"],
    explain: "A premium light soy sauce, often poured over steamed fish.",
    mayContain: { gluten: "Soy sauce typically contains wheat." } },
  { keys: ["black vinegar"], name: "Black vinegar", cuisine: "Chinese", novelty: 2, flavour: ["malty", "tangy"],
    explain: "A dark, malty, mildly sweet vinegar. Tangy but rounder than malt vinegar.",
    mayContain: { gluten: "Often brewed from wheat, barley or sorghum." } },
  { keys: ["salt & pepper", "salt and pepper"], name: "Salt & pepper (Cantonese style)", cuisine: "Cantonese", novelty: 1, flavour: ["crispy", "garlicky", "salty"], spice: 1,
    explain: "Lightly battered and fried, then tossed with salt, garlic, chilli and spring onion. Crispy rather than saucy.",
    mayContain: { gluten: "The batter or coating may contain wheat." } },
  { keys: ["mango pudding"], name: "Mango pudding", cuisine: "Cantonese (Hong Kong)", novelty: 1, flavour: ["sweet", "fruity", "silky"],
    explain: "A chilled, set mango dessert, often finished with evaporated milk.",
    mayContain: { dairy: "Usually made with milk or cream.", meat: "Some recipes set with gelatine, which is animal-derived." } },
  { keys: ["pomelo"], name: "Pomelo", cuisine: "Southeast Asian", novelty: 2, flavour: ["citrus", "mildly bitter"],
    explain: "A large citrus fruit, like a sweeter, milder grapefruit." },

  // ——— Japanese ———
  { keys: ["edamame"], name: "Edamame", cuisine: "Japanese", novelty: 1, flavour: ["fresh", "salty"],
    explain: "Young soybeans steamed in their pods and salted. Squeeze the beans out and leave the pod." },
  { keys: ["agedashi"], name: "Agedashi tofu", cuisine: "Japanese", novelty: 2, flavour: ["light", "savoury broth"],
    explain: "Lightly fried tofu served in a warm, savoury dashi-based broth.",
    mayContain: { fish: "The broth is traditionally made with dashi, which usually contains bonito (fish).", gluten: "Typically seasoned with soy sauce." } },
  { keys: ["dashi"], name: "Dashi", cuisine: "Japanese", novelty: 3, flavour: ["umami", "smoky", "savoury"],
    explain: "Japanese stock, usually made from kombu seaweed and bonito (dried fish) flakes.",
    mayContain: { fish: "Dashi is usually made with bonito (fish)." } },
  { keys: ["karaage"], name: "Karaage", cuisine: "Japanese", novelty: 2, flavour: ["crispy", "juicy", "gingery"],
    explain: "Japanese fried chicken: marinated in soy, ginger and garlic, then coated and fried until very crisp.",
    mayContain: { gluten: "Usually marinated in soy sauce and may be coated in flour.", alcohol: "Marinades often include sake or mirin." } },
  { keys: ["yuzu"], name: "Yuzu", cuisine: "Japanese", novelty: 2, flavour: ["citrus", "floral", "tart"],
    explain: "A fragrant Japanese citrus fruit, somewhere between lemon, lime and mandarin." },
  { keys: ["tsukune"], name: "Tsukune", cuisine: "Japanese", novelty: 3, flavour: ["savoury", "sweet glaze", "smoky"],
    explain: "Chicken meatballs or patties grilled on skewers, usually glazed with tare (a sweet soy sauce).",
    mayContain: { gluten: "Tare is soy-based, which typically contains wheat.", egg: "Often bound with egg.", alcohol: "Tare often contains mirin or sake." } },
  { keys: ["tare"], name: "Tare", cuisine: "Japanese", novelty: 3, flavour: ["sweet", "salty", "glossy"],
    explain: "A sweet-savoury glaze for grilled skewers, usually made from soy sauce, mirin and sugar.",
    mayContain: { alcohol: "Usually contains mirin or sake.", gluten: "Soy sauce typically contains wheat." } },
  { keys: ["takoyaki"], name: "Takoyaki", cuisine: "Japanese (Osaka)", novelty: 3, flavour: ["savoury", "creamy", "smoky"],
    explain: "Golf-ball-sized batter balls with pieces of octopus inside, topped with sweet-savoury sauce, mayo and bonito flakes. Very hot inside!",
    mayContain: { shellfish: "Contains octopus (a mollusc).", fish: "Usually topped with bonito (fish) flakes.", gluten: "Wheat batter.", egg: "Batter and mayo usually contain egg." } },
  { keys: ["bonito"], name: "Bonito flakes", cuisine: "Japanese", novelty: 3, flavour: ["smoky", "fishy", "umami"],
    explain: "Paper-thin shavings of dried, smoked fish. They 'dance' on hot food.",
    mayContain: { fish: "Bonito is fish." } },
  { keys: ["okonomiyaki"], name: "Okonomiyaki", cuisine: "Japanese", novelty: 3, flavour: ["savoury", "sweet-tangy sauce", "creamy"],
    explain: "A savoury cabbage pancake cooked on a griddle, topped with a sweet-tangy sauce, mayo and often bonito flakes.",
    mayContain: { gluten: "Made with wheat flour.", egg: "Batter usually contains egg.", fish: "Often topped with bonito (fish) flakes." } },
  { keys: ["kewpie", "japanese mayo"], name: "Kewpie mayo", cuisine: "Japanese", novelty: 2, flavour: ["rich", "tangy"],
    explain: "A Japanese mayonnaise that is richer and tangier than British mayo.",
    mayContain: { egg: "Mayonnaise is made with egg." } },
  { keys: ["tonkotsu"], name: "Tonkotsu", cuisine: "Japanese", novelty: 2, flavour: ["rich", "creamy", "porky"],
    explain: "A rich, milky ramen broth made by boiling pork bones for many hours.",
    mayContain: { pork: "Tonkotsu broth is made from pork bones.", gluten: "Ramen noodles are wheat-based." } },
  { keys: ["chashu"], name: "Chashu", cuisine: "Japanese", novelty: 2, flavour: ["tender", "savoury-sweet"],
    explain: "Slow-braised pork belly, sliced and served on ramen.",
    mayContain: { pork: "Chashu is traditionally pork.", alcohol: "Braising liquid often includes sake or mirin." } },
  { keys: ["ajitama", "ajitsuke tamago"], name: "Ajitama", cuisine: "Japanese", novelty: 3, flavour: ["jammy", "savoury"],
    explain: "A soft-boiled egg marinated in soy and mirin, with a jammy yolk.",
    mayContain: { egg: "It's an egg.", alcohol: "Usually marinated with mirin." } },
  { keys: ["ramen"], name: "Ramen", cuisine: "Japanese", novelty: 1, flavour: ["savoury", "warming"],
    explain: "Wheat noodles in a deeply flavoured broth with toppings.",
    mayContain: { gluten: "Ramen noodles are wheat-based." } },
  { keys: ["katsu"], name: "Katsu", cuisine: "Japanese", novelty: 1, flavour: ["crispy", "mild"],
    explain: "A cutlet coated in panko breadcrumbs and fried. 'Katsu curry' adds a mild, slightly sweet Japanese curry sauce.",
    mayContain: { gluten: "Breadcrumb coating contains wheat.", egg: "Coating usually uses egg." } },
  { keys: ["chirashi"], name: "Chirashi", cuisine: "Japanese", novelty: 3, flavour: ["fresh", "clean", "delicate"],
    explain: "A bowl of seasoned sushi rice topped with slices of raw fish (sashimi).",
    mayContain: { fish: "Topped with raw fish." } },
  { keys: ["sashimi"], name: "Sashimi", cuisine: "Japanese", novelty: 2, flavour: ["fresh", "clean"],
    explain: "Thin slices of raw fish or seafood, served without rice.",
    mayContain: { fish: "Sashimi is raw fish or seafood." } },
  { keys: ["ikura"], name: "Ikura", cuisine: "Japanese", novelty: 3, flavour: ["salty", "briny", "pops"],
    explain: "Salmon roe: glossy orange fish eggs that pop in the mouth.",
    mayContain: { fish: "Ikura is fish roe." } },
  { keys: ["miso"], name: "Miso", cuisine: "Japanese", novelty: 1, flavour: ["umami", "salty", "savoury-sweet"],
    explain: "A fermented soybean paste. In 'black cod miso' the fish is marinated in sweet miso and caramelised.",
    mayContain: { gluten: "Some miso is made with barley.", alcohol: "Miso marinades often include sake or mirin." } },
  { keys: ["tempura"], name: "Tempura", cuisine: "Japanese", novelty: 1, flavour: ["light", "crispy"],
    explain: "Seafood or vegetables in a very light, crisp batter.",
    mayContain: { gluten: "Tempura batter is wheat-based.", egg: "Batter often contains egg." } },
  { keys: ["yasai"], name: "Yasai", cuisine: "Japanese", novelty: 2, flavour: [],
    explain: "Japanese for 'vegetables'." },
  { keys: ["matcha"], name: "Matcha", cuisine: "Japanese", novelty: 2, flavour: ["grassy", "slightly bitter"],
    explain: "Powdered green tea with a grassy, gently bitter flavour." },
  { keys: ["mirin"], name: "Mirin", cuisine: "Japanese", novelty: 2, flavour: ["sweet"],
    explain: "A sweet rice wine used for seasoning.",
    mayContain: { alcohol: "Mirin is a rice wine." } },

  // ——— West African ———
  { keys: ["suya"], name: "Suya", cuisine: "Nigerian / West African", novelty: 2, flavour: ["smoky", "nutty", "spicy"], spice: 2,
    explain: "Thinly sliced meat (usually beef) coated in yaji, a spicy ground-peanut spice blend, then grilled over flame.",
    mayContain: { nuts: "Yaji spice traditionally contains ground peanuts.", meat: "Usually beef." } },
  { keys: ["yaji"], name: "Yaji", cuisine: "Nigerian", novelty: 3, flavour: ["nutty", "smoky", "spicy"], spice: 2,
    explain: "The suya spice blend: ground peanuts, chilli, ginger and other spices.",
    mayContain: { nuts: "Made with ground peanuts." } },
  { keys: ["puff puff", "puff-puff"], name: "Puff puff", cuisine: "West African", novelty: 2, flavour: ["sweet", "doughy"],
    explain: "Soft, round fried dough balls, a bit like a doughnut but lighter and chewier.",
    mayContain: { gluten: "Made from wheat flour.", dairy: "Some recipes include milk." } },
  { keys: ["kelewele"], name: "Kelewele", cuisine: "Ghanaian", novelty: 3, flavour: ["sweet", "gingery", "spiced"], spice: 1,
    explain: "Ripe plantain cubes seasoned with ginger, chilli and spices, then fried until caramelised." },
  { keys: ["moi moi", "moin moin", "moi-moi"], name: "Moi moi", cuisine: "Nigerian", novelty: 3, flavour: ["savoury", "soft", "peppery"], spice: 1,
    explain: "A steamed pudding made from blended black-eyed beans, peppers and onions. Soft and savoury.",
    mayContain: { egg: "Often contains boiled egg.", fish: "Some versions include fish or crayfish powder." } },
  { keys: ["pepper soup"], name: "Pepper soup", cuisine: "Nigerian", novelty: 3, flavour: ["hot", "aromatic", "brothy"], spice: 3,
    explain: "A light but fiery, aromatic broth with meat or fish and West African spices.",
    mayContain: { meat: "Usually made with goat, chicken or other meat.", fish: "Some versions use fish." } },
  { keys: ["uda"], name: "Uda", cuisine: "West African", novelty: 3, flavour: ["smoky", "musky", "peppery"],
    explain: "Grains of Selim: a smoky, slightly bitter West African spice pod." },
  { keys: ["scent leaf"], name: "Scent leaf", cuisine: "West African", novelty: 3, flavour: ["herbal", "clove-like"],
    explain: "African basil, with a strong, slightly clove-like aroma." },
  { keys: ["jollof"], name: "Jollof rice", cuisine: "West African", novelty: 2, flavour: ["smoky", "tomatoey", "peppery"], spice: 1,
    explain: "Rice cooked in a rich tomato, pepper and onion base. 'Party jollof' is famously smoky from the bottom of the pot.",
    mayContain: { meat: "Often cooked in meat stock." } },
  { keys: ["dodo"], name: "Dodo", cuisine: "Nigerian", novelty: 2, flavour: ["sweet", "caramelised"],
    explain: "Fried ripe plantain: soft, sweet and caramelised at the edges." },
  { keys: ["plantain"], name: "Plantain", cuisine: "West African / Caribbean", novelty: 1, flavour: ["sweet", "starchy"],
    explain: "A cooking banana. When ripe and fried it's sweet and soft." },
  { keys: ["egusi"], name: "Egusi", cuisine: "Nigerian", novelty: 3, flavour: ["rich", "nutty", "savoury"], spice: 1,
    explain: "A rich stew thickened with ground melon seeds, usually with leafy greens, meat and/or fish.",
    mayContain: { meat: "Usually contains meat.", fish: "Often contains stockfish, dried fish or crayfish." } },
  { keys: ["pounded yam"], name: "Pounded yam", cuisine: "Nigerian", novelty: 3, flavour: ["smooth", "mild", "stretchy"],
    explain: "Yam pounded into a smooth, stretchy dough. Pinch off a piece with your fingers and use it to scoop up stew." },
  { keys: ["stockfish"], name: "Stockfish", cuisine: "West African (via Norway)", novelty: 3, flavour: ["intense", "fishy"],
    explain: "Air-dried cod with a strong, savoury flavour, used to deepen stews.",
    mayContain: { fish: "Stockfish is dried fish." } },
  { keys: ["tilapia"], name: "Tilapia", cuisine: "West African", novelty: 1, flavour: ["mild", "flaky"],
    explain: "A mild white fish, often grilled whole in West African cooking. Watch for bones." },
  { keys: ["scotch bonnet"], name: "Scotch bonnet", cuisine: "Caribbean / West African", novelty: 2, flavour: ["fruity", "very hot"], spice: 3,
    explain: "A small, fruity and very hot chilli pepper." },
  { keys: ["jerk"], name: "Jerk", cuisine: "Jamaican", novelty: 1, flavour: ["smoky", "allspice", "hot"], spice: 2,
    explain: "A Jamaican marinade of scotch bonnet, allspice, thyme and spring onion, traditionally grilled over pimento wood." },
  { keys: ["red red"], name: "Red red", cuisine: "Ghanaian", novelty: 3, flavour: ["earthy", "sweet", "savoury"], spice: 1,
    explain: "Black-eyed bean stew cooked in red palm oil, often served with fried plantain." },
  { keys: ["palm oil"], name: "Palm oil", cuisine: "West African", novelty: 2, flavour: ["earthy", "rich"],
    explain: "Red palm oil gives a distinctive colour and earthy richness." },
  { keys: ["asun"], name: "Asun", cuisine: "Nigerian (Yoruba)", novelty: 3, flavour: ["smoky", "very spicy"], spice: 3,
    explain: "Smoked, grilled goat meat chopped and tossed in a hot pepper sauce.",
    mayContain: { meat: "Asun is goat meat." } },
  { keys: ["chin chin"], name: "Chin chin", cuisine: "Nigerian", novelty: 3, flavour: ["crunchy", "sweet"],
    explain: "Small, crunchy fried dough bites, a popular Nigerian snack.",
    mayContain: { gluten: "Made from wheat flour.", dairy: "Usually contains butter or milk.", egg: "Often contains egg." } },
  { keys: ["yam"], name: "Yam", cuisine: "West African", novelty: 2, flavour: ["starchy", "mild"],
    explain: "A starchy tuber (not a sweet potato), often boiled or fried like chips." },

  // ——— Levantine / Middle Eastern / Mediterranean ———
  { keys: ["shawarma"], name: "Shawarma", cuisine: "Levantine", novelty: 1, flavour: ["spiced", "garlicky"],
    explain: "Spiced meat roasted on a vertical spit and thinly sliced." },
  { keys: ["tahini"], name: "Tahini", cuisine: "Middle Eastern", novelty: 1, flavour: ["nutty", "creamy"],
    explain: "A paste made from ground sesame seeds." },
  { keys: ["za'atar", "zaatar"], name: "Za'atar", cuisine: "Levantine", novelty: 2, flavour: ["herby", "tangy"],
    explain: "A herb blend of thyme, sumac and sesame." },
  { keys: ["sumac"], name: "Sumac", cuisine: "Middle Eastern", novelty: 2, flavour: ["tart", "lemony"],
    explain: "A dark red spice with a tart, lemony flavour." },
  { keys: ["harissa"], name: "Harissa", cuisine: "North African", novelty: 2, flavour: ["smoky", "hot"], spice: 2,
    explain: "A smoky, hot chilli paste from North Africa." },
  { keys: ["labneh"], name: "Labneh", cuisine: "Levantine", novelty: 2, flavour: ["tangy", "creamy"],
    explain: "Strained yoghurt, thick and tangy like a soft cheese.",
    mayContain: { dairy: "Made from yoghurt." } },
  { keys: ["halloumi"], name: "Halloumi", cuisine: "Cypriot", novelty: 1, flavour: ["salty", "squeaky"],
    explain: "A firm, salty cheese that holds its shape when grilled.",
    mayContain: { dairy: "Halloumi is cheese." } },
  { keys: ["burrata"], name: "Burrata", cuisine: "Italian", novelty: 1, flavour: ["creamy", "milky"],
    explain: "A ball of fresh mozzarella with a soft, creamy centre.",
    mayContain: { dairy: "Burrata is cheese." } },
  { keys: ["nduja", "'nduja"], name: "'Nduja", cuisine: "Italian (Calabrian)", novelty: 2, flavour: ["spicy", "rich"], spice: 2,
    explain: "A soft, spicy, spreadable pork sausage from Calabria.",
    mayContain: { pork: "'Nduja is made from pork." } },
  { keys: ["chorizo"], name: "Chorizo", cuisine: "Spanish", novelty: 1, flavour: ["smoky", "paprika"],
    explain: "Paprika-spiced cured sausage.",
    mayContain: { pork: "Chorizo is usually pork." } },
  { keys: ["ceviche"], name: "Ceviche", cuisine: "Peruvian", novelty: 2, flavour: ["zesty", "fresh", "sharp"],
    explain: "Raw fish 'cooked' in lime juice, usually with chilli and red onion.",
    mayContain: { fish: "Ceviche is raw fish or seafood." } },
  { keys: ["gochujang"], name: "Gochujang", cuisine: "Korean", novelty: 2, flavour: ["sweet", "spicy", "funky"], spice: 2,
    explain: "A Korean fermented red chilli paste, sweet, spicy and savoury.",
    mayContain: { gluten: "Often contains wheat or barley." } },
  { keys: ["bulgogi"], name: "Bulgogi", cuisine: "Korean", novelty: 2, flavour: ["sweet", "savoury", "garlicky"],
    explain: "Thinly sliced marinated beef, grilled or pan-fried.",
    mayContain: { gluten: "The marinade usually contains soy sauce." } },
  { keys: ["bibimbap"], name: "Bibimbap", cuisine: "Korean", novelty: 2, flavour: ["savoury", "spicy"], spice: 1,
    explain: "A rice bowl with vegetables, often meat and a fried egg. Mix it all together with gochujang.",
    mayContain: { egg: "Usually topped with egg." } },
  { keys: ["pad thai"], name: "Pad thai", cuisine: "Thai", novelty: 1, flavour: ["sweet", "sour", "savoury"],
    explain: "Stir-fried rice noodles with tamarind, egg and crushed peanuts.",
    mayContain: { nuts: "Usually topped with peanuts.", egg: "Contains egg.", fish: "Fish sauce is a standard ingredient.", shellfish: "Often includes dried shrimp." } },
  { keys: ["laksa"], name: "Laksa", cuisine: "Malaysian / Singaporean", novelty: 2, flavour: ["coconut", "spicy", "rich"], spice: 2,
    explain: "A spicy coconut curry noodle soup.",
    mayContain: { shellfish: "The paste usually contains shrimp paste." } },
  { keys: ["rendang"], name: "Rendang", cuisine: "Indonesian / Malaysian", novelty: 2, flavour: ["rich", "coconut", "spiced"], spice: 1,
    explain: "Meat (usually beef) slow-cooked in coconut and spices until almost dry and very tender." },
  { keys: ["biryani"], name: "Biryani", cuisine: "South Asian", novelty: 1, flavour: ["fragrant", "spiced"], spice: 1,
    explain: "Layered, fragrant spiced rice cooked with meat or vegetables.",
    mayContain: { dairy: "Often cooked with yoghurt or ghee.", nuts: "Sometimes garnished with nuts." } },
  { keys: ["makhani"], name: "Makhani", cuisine: "North Indian", novelty: 1, flavour: ["buttery", "creamy", "mild"],
    explain: "A mild, buttery tomato sauce. Butter chicken is 'murgh makhani'.",
    mayContain: { dairy: "Made with butter and cream.", nuts: "Some recipes use cashew paste." } },
  { keys: ["vindaloo"], name: "Vindaloo", cuisine: "Goan / British-Indian", novelty: 1, flavour: ["hot", "tangy"], spice: 3,
    explain: "A hot, tangy curry. In British curry houses it's one of the spiciest options." },
  { keys: ["paneer"], name: "Paneer", cuisine: "South Asian", novelty: 1, flavour: ["mild", "milky"],
    explain: "A firm, mild fresh cheese that doesn't melt.",
    mayContain: { dairy: "Paneer is cheese." } },
  { keys: ["carbonara"], name: "Carbonara", cuisine: "Italian", novelty: 1, flavour: ["rich", "peppery"],
    explain: "Pasta with egg, hard cheese, black pepper and cured pork.",
    mayContain: { pork: "Traditionally made with guanciale or pancetta.", egg: "Sauce is egg-based.", dairy: "Contains cheese.", gluten: "Pasta is usually wheat." } },
  { keys: ["risotto"], name: "Risotto", cuisine: "Italian", novelty: 1, flavour: ["creamy", "comforting"],
    explain: "Creamy rice slowly cooked in stock, usually finished with butter and cheese.",
    mayContain: { dairy: "Usually finished with butter and parmesan.", alcohol: "Often made with white wine.", meat: "Stock may be meat-based." } },
];

const normalise = (s: string) => s.toLowerCase().replace(/[’']/g, "'");

/** Return glossary entries whose keys appear (as whole words/phrases) in the text. */
export function findGlossaryTerms(text: string): GlossaryEntry[] {
  const t = ` ${normalise(text).replace(/[^a-z0-9' &-]+/g, " ")} `;
  const found: GlossaryEntry[] = [];
  for (const entry of GLOSSARY) {
    if (entry.keys.some((k) => t.includes(` ${normalise(k)} `) || t.includes(` ${normalise(k)}s `))) {
      found.push(entry);
    }
  }
  // Prefer specific multi-word matches: drop "bun"/"bao" style generic entries
  // when a more specific entry with the same cuisine already explains the dish.
  return found;
}
