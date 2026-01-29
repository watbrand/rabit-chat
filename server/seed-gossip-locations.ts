import { db } from "./db";
import { gossipLocations } from "@shared/schema";
import { eq } from "drizzle-orm";

interface LocationData {
  name: string;
  slug: string;
  emoji?: string;
  cities?: {
    name: string;
    slug: string;
    hoods: string[];
  }[];
}

const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .trim();
};

const SOUTH_AFRICA_DATA: LocationData[] = [
  {
    name: "Gauteng",
    slug: "gauteng",
    emoji: "🏙️",
    cities: [
      {
        name: "Johannesburg",
        slug: "johannesburg",
        hoods: [
          "Soweto", "Orlando East", "Orlando West", "Diepkloof", "Meadowlands",
          "Pimville", "Naledi", "Jabulani", "Alexandra", "Diepsloot",
          "Orange Farm", "Cosmo City", "Ivory Park", "Hillbrow", "Yeoville",
          "Berea", "Newtown", "Sandton", "Rosebank", "Braamfontein"
        ],
      },
      {
        name: "Pretoria",
        slug: "pretoria",
        hoods: [
          "Mamelodi East", "Mamelodi West", "Soshanguve Block A", "Soshanguve Block B",
          "Soshanguve Block C", "Soshanguve Block D", "Soshanguve Block E",
          "Soshanguve Block F", "Soshanguve Block G", "Soshanguve Block H",
          "Soshanguve Block L", "Soshanguve Block M", "Atteridgeville",
          "Ga-Rankuwa", "Hammanskraal", "Lotus Gardens", "Saulsville", "Hatfield", "Arcadia"
        ],
      },
      {
        name: "Ekurhuleni",
        slug: "ekurhuleni",
        hoods: [
          "Tembisa", "Phomolong", "Igqagqa", "Ethafeni", "Katlehong",
          "Thokoza", "Palm Ridge", "Vosloorus", "Vosloorus Ext", "Daveyton",
          "Etwatwa", "Kwa-Thema", "Kwa-Thema Ext", "Benoni", "Boksburg", "Springs"
        ],
      },
      {
        name: "Vaal",
        slug: "vaal",
        hoods: [
          "Sebokeng", "Sharpeville", "Boipatong", "Evaton", "Bophelong",
          "Vanderbijlpark", "Vereeniging"
        ],
      },
    ],
  },
  {
    name: "Western Cape",
    slug: "western-cape",
    emoji: "🌊",
    cities: [
      {
        name: "Cape Town",
        slug: "cape-town",
        hoods: [
          "Khayelitsha", "Site B", "Site C", "Makhaza", "Gugulethu",
          "Nyanga", "Langa", "Philippi", "Delft", "Mitchells Plain",
          "Bonteheuwel", "Bishop Lavis", "Manenberg", "Athlone", "Woodstock",
          "Observatory", "Sea Point", "Green Point", "Table View", "Bellville"
        ],
      },
      {
        name: "Paarl",
        slug: "paarl",
        hoods: ["Mbekweni", "Paarl Central", "Dal Josafat"],
      },
      {
        name: "Stellenbosch",
        slug: "stellenbosch",
        hoods: ["Kayamandi", "Idas Valley", "Cloetesville"],
      },
      {
        name: "George",
        slug: "george",
        hoods: ["Thembalethu", "Pacaltsdorp", "Blanco"],
      },
      {
        name: "Mossel Bay",
        slug: "mossel-bay",
        hoods: ["KwaNonqaba", "D'Almeida"],
      },
    ],
  },
  {
    name: "KwaZulu-Natal",
    slug: "kwazulu-natal",
    emoji: "🏖️",
    cities: [
      {
        name: "Durban",
        slug: "durban",
        hoods: [
          "Umlazi", "KwaMashu", "Inanda", "Ntuzuma", "Clermont",
          "Chatsworth", "Lamontville", "Newlands East", "Phoenix",
          "Pinetown", "Umhlanga", "Berea", "Morningside", "Westville"
        ],
      },
      {
        name: "Pietermaritzburg",
        slug: "pietermaritzburg",
        hoods: ["Edendale", "Imbali", "Sobantu", "Willowfontein"],
      },
      {
        name: "Richards Bay",
        slug: "richards-bay",
        hoods: ["Esikhaleni", "Empangeni", "Nseleni"],
      },
      {
        name: "Newcastle",
        slug: "newcastle",
        hoods: ["Madadeni", "Osizweni", "Amajuba"],
      },
    ],
  },
  {
    name: "Eastern Cape",
    slug: "eastern-cape",
    emoji: "🌿",
    cities: [
      {
        name: "Gqeberha",
        slug: "gqeberha",
        hoods: [
          "New Brighton", "KwaZakhele", "Zwide", "Motherwell",
          "Wells Estate", "Summerstrand", "Newton Park", "Central"
        ],
      },
      {
        name: "East London",
        slug: "east-london",
        hoods: ["Mdantsane", "Duncan Village", "Gonubie", "Beacon Bay"],
      },
      {
        name: "Mthatha",
        slug: "mthatha",
        hoods: ["Mandela Park", "Ikwezi", "Fort Gale", "Ngangelizwe"],
      },
      {
        name: "Queenstown",
        slug: "queenstown",
        hoods: ["Ezibeleni", "Mlungisi", "Sada"],
      },
      {
        name: "Makhanda",
        slug: "makhanda",
        hoods: ["Joza", "Fingo Village", "Tantyi"],
      },
    ],
  },
  {
    name: "Free State",
    slug: "free-state",
    emoji: "🌻",
    cities: [
      {
        name: "Bloemfontein",
        slug: "bloemfontein",
        hoods: [
          "Mangaung", "Batho", "Rocklands", "Phahameng",
          "Heidedal", "Universitas", "Westdene"
        ],
      },
      {
        name: "Welkom",
        slug: "welkom",
        hoods: ["Thabong", "Bronville", "Odendaalsrus"],
      },
      {
        name: "Sasolburg",
        slug: "sasolburg",
        hoods: ["Zamdela", "Vaalpark"],
      },
      {
        name: "Bethlehem",
        slug: "bethlehem",
        hoods: ["Bohlokong", "Phomolong"],
      },
      {
        name: "Kroonstad",
        slug: "kroonstad",
        hoods: ["Maokeng", "Seeisoville"],
      },
    ],
  },
  {
    name: "Limpopo",
    slug: "limpopo",
    emoji: "🌳",
    cities: [
      {
        name: "Polokwane",
        slug: "polokwane",
        hoods: ["Seshego", "Mankweng", "Ga-Chuene", "Flora Park", "Bendor"],
      },
      {
        name: "Tzaneen",
        slug: "tzaneen",
        hoods: ["Nkowankowa", "Lenyenye", "Burgersdorp"],
      },
      {
        name: "Thohoyandou",
        slug: "thohoyandou",
        hoods: ["Shayandima", "Makwarela", "Sibasa"],
      },
      {
        name: "Mokopane",
        slug: "mokopane",
        hoods: ["Mahwelereng", "Masodi"],
      },
      {
        name: "Musina",
        slug: "musina",
        hoods: ["Nancefield", "Harper"],
      },
    ],
  },
  {
    name: "Mpumalanga",
    slug: "mpumalanga",
    emoji: "⛰️",
    cities: [
      {
        name: "Mbombela",
        slug: "mbombela",
        hoods: ["Kanyamazane", "Matsulu", "Kabokweni", "Riverside", "White River"],
      },
      {
        name: "eMalahleni",
        slug: "emalahleni",
        hoods: ["Kwa-Guqa", "Vosman", "Hlalanikahle", "Klarinet"],
      },
      {
        name: "Middelburg",
        slug: "middelburg",
        hoods: ["Mhluzi", "Nasaret", "Rockdale"],
      },
      {
        name: "Secunda",
        slug: "secunda",
        hoods: ["Embalenhle", "Lebohang"],
      },
      {
        name: "Ermelo",
        slug: "ermelo",
        hoods: ["Wesselton", "Cassim Park"],
      },
    ],
  },
  {
    name: "North West",
    slug: "north-west",
    emoji: "🏜️",
    cities: [
      {
        name: "Rustenburg",
        slug: "rustenburg",
        hoods: ["Boitekong", "Phokeng", "Luka", "Tlhabane", "Geelhoutpark"],
      },
      {
        name: "Mahikeng",
        slug: "mahikeng",
        hoods: ["Montshiwa", "Unit 14", "Unit 9", "Riviera Park"],
      },
      {
        name: "Brits",
        slug: "brits",
        hoods: ["Oukasie", "Letlhabile", "Mothotlung"],
      },
      {
        name: "Klerksdorp",
        slug: "klerksdorp",
        hoods: ["Jouberton", "Alabama", "Kanana"],
      },
      {
        name: "Vryburg",
        slug: "vryburg",
        hoods: ["Huhudi", "Stella"],
      },
    ],
  },
  {
    name: "Northern Cape",
    slug: "northern-cape",
    emoji: "🌵",
    cities: [
      {
        name: "Kimberley",
        slug: "kimberley",
        hoods: ["Galeshewe", "Roodepan", "Beaconsfield", "Diamond Fields"],
      },
      {
        name: "Upington",
        slug: "upington",
        hoods: ["Paballelo", "Progress", "Louisvaleweg"],
      },
      {
        name: "Kuruman",
        slug: "kuruman",
        hoods: ["Seoding", "Bankhara-Bodulong"],
      },
      {
        name: "Springbok",
        slug: "springbok",
        hoods: ["Concordia", "Bergsig"],
      },
      {
        name: "De Aar",
        slug: "de-aar",
        hoods: ["Nonzwakazi", "Leeukloof"],
      },
    ],
  },
];

export async function seedGossipLocations(): Promise<void> {
  console.log("[Gossip Locations] Starting seed...");
  
  const existingCount = await db.select().from(gossipLocations).limit(1);
  if (existingCount.length > 0) {
    console.log("[Gossip Locations] Already seeded - skipping");
    return;
  }

  const countryId = crypto.randomUUID();
  
  await db.insert(gossipLocations).values({
    id: countryId,
    type: "COUNTRY",
    name: "South Africa",
    slug: "south-africa",
    parentId: null,
    emoji: "🇿🇦",
    sortOrder: 0,
  });
  console.log("[Gossip Locations] Created: South Africa (country)");

  let provinceOrder = 0;
  let totalLocations = 1;

  for (const province of SOUTH_AFRICA_DATA) {
    const provinceId = crypto.randomUUID();
    await db.insert(gossipLocations).values({
      id: provinceId,
      type: "PROVINCE",
      name: province.name,
      slug: province.slug,
      parentId: countryId,
      emoji: province.emoji,
      sortOrder: provinceOrder++,
    });
    totalLocations++;

    if (province.cities) {
      let cityOrder = 0;
      for (const city of province.cities) {
        const cityId = crypto.randomUUID();
        await db.insert(gossipLocations).values({
          id: cityId,
          type: "CITY",
          name: city.name,
          slug: city.slug,
          parentId: provinceId,
          sortOrder: cityOrder++,
        });
        totalLocations++;

        let hoodOrder = 0;
        for (const hoodName of city.hoods) {
          await db.insert(gossipLocations).values({
            type: "HOOD",
            name: hoodName,
            slug: slugify(hoodName),
            parentId: cityId,
            sortOrder: hoodOrder++,
          });
          totalLocations++;
        }
      }
    }
  }

  console.log(`[Gossip Locations] Seeded ${totalLocations} locations`);
  console.log("[Gossip Locations] Seed complete!");
}
