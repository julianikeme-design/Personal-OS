/**
 * Sample menus for demos and testing.
 *
 * These restaurants are FICTIONAL. Names, dishes and prices are invented for
 * demonstration and are always labelled as such in the UI. They are stored as
 * raw menu text and run through the same parser a pasted menu uses.
 */
export interface SampleMenu {
  id: string;
  restaurantName: string;
  cuisine: string;
  blurb: string;
  text: string;
}

export const SAMPLE_MENUS: SampleMenu[] = [
  {
    id: "lantern-house",
    restaurantName: "Lantern House",
    cuisine: "Modern Cantonese",
    blurb: "Dim sum, wok dishes and a few Sichuan curveballs.",
    text: `DIM SUM & STARTERS
Har gow — steamed prawn dumplings, 4 pieces £7.50
Xiao long bao — pork soup dumplings, ginger vinegar £9
Char siu bao — steamed buns, honey-roast pork £8.50
Salt & pepper tofu (V) — chilli, garlic, spring onion £8
Crispy duck salad — pomelo, pine nuts, shallot, hoisin dressing £12

MAINS
Black pepper beef — wok-fried rib-eye, onion, peppers £24
Sweet & sour chicken — pineapple, peppers, rice vinegar £18
Mapo tofu — silken tofu, minced beef, Sichuan pepper, chilli bean sauce 🌶🌶 £16
Steamed sea bass — ginger, spring onion, superior soy £28
Kung pao prawns — peanuts, dried chilli, spring onion 🌶 £22
Claypot aubergine (VG) — garlic, chilli, black vinegar £15

RICE & NOODLES
Egg fried rice (V) £5
Singapore vermicelli — prawn, char siu, curry spice £14
Beef ho fun — flat rice noodles, beansprouts, soy £15

DESSERTS
Mango pudding £7`,
  },
  {
    id: "ember-ash",
    restaurantName: "Ember & Ash",
    cuisine: "West African grill",
    blurb: "Live-fire grilling, jollof and big flavours.",
    text: `SMALL PLATES
Suya skewers — beef, yaji spice, red onion 🌶 £9
Puff puff (V) — fried dough, sugar dust £6
Kelewele (VG) — ginger-spiced fried plantain £6
Moi moi (V) — steamed bean pudding, boiled egg £7
Goat pepper soup — uda, scent leaf 🌶🌶🌶 £10

MAINS
Jollof rice & chicken — smoky party jollof, grilled chicken thigh, dodo £17
Egusi & pounded yam — melon seed stew, spinach, beef, stockfish £19
Grilled tilapia — whole fish, pepper sauce, yam chips 🌶🌶 £22
Scotch bonnet lamb chops — charred, herb marinade 🌶🌶 £24
Red red (VG) — black-eyed bean stew, palm oil, plantain £14
Asun — smoked goat, hot pepper sauce 🌶🌶🌶 £16

SIDES
Dodo (VG) £4.50
Fried yam £4.50

DESSERTS
Chin chin ice cream £6.50`,
  },
  {
    id: "kumo-izakaya",
    restaurantName: "Kumo Izakaya",
    cuisine: "Japanese izakaya",
    blurb: "Small plates, skewers and ramen.",
    text: `SMALL PLATES
Edamame (VG) — sea salt £5
Agedashi tofu (V) — fried tofu in dashi broth, spring onion £7
Chicken karaage — Japanese fried chicken, yuzu mayo £9
Tsukune — chicken meatball skewers, tare glaze £8
Takoyaki — octopus balls, okonomi sauce, bonito £8
Yasai tempura (V) — seasonal vegetables, tentsuyu £10

MAINS
Okonomiyaki — savoury cabbage pancake, pork belly, kewpie £14
Tonkotsu ramen — pork bone broth, chashu, ajitama, nori £16
Chicken katsu curry — panko chicken, Japanese curry, rice £15
Salmon chirashi — sushi rice, salmon sashimi, ikura £19
Black cod miso — sweet miso glaze, pickled ginger £29

DESSERTS
Matcha cheesecake £7`,
  },
];

export const getSample = (id: string) => SAMPLE_MENUS.find((m) => m.id === id);
