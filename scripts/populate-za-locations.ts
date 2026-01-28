import { db } from "../server/db";
import { zaLocations } from "../shared/schema";

const SA_LOCATIONS = {
  "Gauteng": {
    cities: {
      "Johannesburg": ["Soweto", "Alexandra", "Sandton", "Randburg", "Roodepoort", "Midrand", "Lenasia", "Diepsloot", "Orange Farm", "Eldorado Park", "Ennerdale", "Dobsonville", "Meadowlands", "Orlando", "Kliptown", "Zola", "Zondi", "Tembisa"],
      "Pretoria": ["Mamelodi", "Atteridgeville", "Soshanguve", "Ga-Rankuwa", "Mabopane", "Winterveldt", "Hammanskraal", "Centurion", "Eersterust", "Laudium"],
      "Ekurhuleni": ["Benoni", "Boksburg", "Germiston", "Kempton Park", "Springs", "Alberton", "Edenvale", "Tsakane", "Katlehong", "Thokoza", "Vosloorus", "Daveyton", "Duduza", "Kwathema", "Tembisa"]
    }
  },
  "Western Cape": {
    cities: {
      "Cape Town": ["Khayelitsha", "Gugulethu", "Langa", "Nyanga", "Mitchells Plain", "Philippi", "Delft", "Mfuleni", "Blue Downs", "Atlantis", "Kraaifontein", "Bellville", "Durbanville", "Goodwood", "Parow", "Athlone", "Manenberg", "Bonteheuwel", "Hanover Park", "Lavender Hill"],
      "Stellenbosch": ["Kayamandi", "Cloetesville", "Idas Valley"],
      "Paarl": ["Mbekweni", "Wellington", "Drakenstein"],
      "George": ["Thembalethu", "Pacaltsdorp", "Wilderness"],
      "Worcester": ["Zweletemba", "Riverview"]
    }
  },
  "KwaZulu-Natal": {
    cities: {
      "Durban": ["Umlazi", "KwaMashu", "Inanda", "Ntuzuma", "Phoenix", "Chatsworth", "Pinetown", "Clermont", "Umbilo", "Lamontville", "Chesterville", "Wentworth", "Tongaat", "Verulam", "Umhlanga"],
      "Pietermaritzburg": ["Edendale", "Imbali", "Sobantu", "Ashdown", "Northdale"],
      "Newcastle": ["Madadeni", "Osizweni"],
      "Richards Bay": ["Esikhawini", "Empangeni"],
      "Ladysmith": ["Ezakheni", "Steadville"]
    }
  },
  "Eastern Cape": {
    cities: {
      "Port Elizabeth": ["KwaZakhele", "New Brighton", "Motherwell", "KwaNobuhle", "Zwide", "Walmer", "Uitenhage", "Despatch", "Colchester"],
      "East London": ["Mdantsane", "Duncan Village", "Beacon Bay", "Gonubie", "Nahoon"],
      "Mthatha": ["Ngangelizwe", "Slovo Park", "Ikwezi"],
      "Queenstown": ["Ezibeleni", "Mlungisi"],
      "Grahamstown": ["Joza", "Fingo Village", "Rhini"]
    }
  },
  "Free State": {
    cities: {
      "Bloemfontein": ["Mangaung", "Botshabelo", "Thaba Nchu", "Heidedal", "Batho"],
      "Welkom": ["Thabong", "Bronville"],
      "Sasolburg": ["Zamdela", "Metsimaholo"],
      "Kroonstad": ["Maokeng", "Seeisoville"],
      "Bethlehem": ["Bohlokong", "Dihlabeng"]
    }
  },
  "Limpopo": {
    cities: {
      "Polokwane": ["Seshego", "Mankweng", "Lebowakgomo", "Westenburg"],
      "Thohoyandou": ["Sibasa", "Makwarela", "Shayandima"],
      "Tzaneen": ["Nkowankowa", "Lenyenye"],
      "Musina": ["Nancefield", "Madimbo"],
      "Mokopane": ["Mahwelereng", "Bakenberg"]
    }
  },
  "Mpumalanga": {
    cities: {
      "Nelspruit": ["Kanyamazane", "Kabokweni", "Hazyview", "White River"],
      "Witbank": ["Emalahleni", "KwaGuqa", "Vosman"],
      "Secunda": ["Embalenhle", "eMbalenhle"],
      "Standerton": ["Sakhile", "Morgenzon"],
      "Middelburg": ["Mhluzi", "Nasaret"]
    }
  },
  "North West": {
    cities: {
      "Rustenburg": ["Phokeng", "Boitekong", "Tlhabane", "Freedom Park"],
      "Mahikeng": ["Mmabatho", "Montshiwa", "Seweding"],
      "Potchefstroom": ["Ikageng", "Promosa"],
      "Klerksdorp": ["Jouberton", "Alabama"],
      "Brits": ["Letlhabile", "Oukasie"]
    }
  },
  "Northern Cape": {
    cities: {
      "Kimberley": ["Galeshewe", "Roodepan", "Homevale"],
      "Upington": ["Paballelo", "Progress"],
      "Springbok": ["Bergsig", "Nababeep"],
      "De Aar": ["Nonzwakazi", "Bongani"],
      "Kuruman": ["Wrenchville", "Mothibistad"]
    }
  }
};

async function populateZaLocations() {
  console.log("Starting SA locations population...");
  
  const locations: Array<{
    province: string;
    city: string | null;
    kasi: string | null;
    fullPath: string;
    level: number;
    parentId: string | null;
  }> = [];

  for (const [province, data] of Object.entries(SA_LOCATIONS)) {
    const provinceId = `prov_${province.toLowerCase().replace(/[\s-]+/g, '_')}`;
    
    locations.push({
      province,
      city: null,
      kasi: null,
      fullPath: province,
      level: 1,
      parentId: null
    });

    for (const [city, kasis] of Object.entries(data.cities)) {
      const cityId = `city_${province.toLowerCase().replace(/[\s-]+/g, '_')}_${city.toLowerCase().replace(/[\s-]+/g, '_')}`;
      
      locations.push({
        province,
        city,
        kasi: null,
        fullPath: `${province} > ${city}`,
        level: 2,
        parentId: provinceId
      });

      for (const kasi of kasis) {
        locations.push({
          province,
          city,
          kasi,
          fullPath: `${province} > ${city} > ${kasi}`,
          level: 3,
          parentId: cityId
        });
      }
    }
  }

  console.log(`Inserting ${locations.length} locations...`);

  for (const loc of locations) {
    try {
      await db.insert(zaLocations).values(loc).onConflictDoNothing();
    } catch (error) {
      console.error(`Failed to insert ${loc.fullPath}:`, error);
    }
  }

  console.log("SA locations population complete!");
  console.log(`Total locations inserted: ${locations.length}`);
  
  const provinceCount = locations.filter(l => l.level === 1).length;
  const cityCount = locations.filter(l => l.level === 2).length;
  const kasiCount = locations.filter(l => l.level === 3).length;
  
  console.log(`  - Provinces: ${provinceCount}`);
  console.log(`  - Cities: ${cityCount}`);
  console.log(`  - Kasis/Townships: ${kasiCount}`);
}

populateZaLocations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Population failed:", err);
    process.exit(1);
  });
