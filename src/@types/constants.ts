import { CannonFamily, CannonType } from "./cannons.js"
import { Nation } from "./nations.js"

// Cannons
export const cannonType = ["medium", "long", "carronade"]!
export const cannonFamilyList: Record<CannonType, CannonFamily[]> = {
    medium: ["regular", "congreve", "defense", "edinorog"],
    long: ["regular", "navy", "blomefield"],
    carronade: ["regular", "obusiers"],
}
export const cannonEntityType = ["name", "family", "damage", "generic", "penetration"]!
export const peneDistance = [50, 100, 200, 300, 400, 500, 750, 1000, 1250, 1500]

// Loot
export const lootType = ["item", "loot", "chest", "fish"]!

// Nations
export const nationShortName = ["CN", "DE", "DK", "ES", "FR", "FT", "GB", "NT", "PL", "PR", "RU", "SE", "US", "VP"]!
export const portBattleNationShortName = [...nationShortName, ""]
export const attackerNationShortName = [...portBattleNationShortName, "n/a"]
export const nationShortNameAlternative = [
    "CNa",
    "DEa",
    "DKa",
    "ESa",
    "FRa",
    "FTa",
    "GBa",
    "NTa",
    "PLa",
    "PRa",
    "RUa",
    "SEa",
    "USa",
    "VPa",
]!
export const nationFullName = [
    "China",
    "Commonwealth of Poland",
    "Danmark-Norge",
    "España",
    "France",
    "Free Town",
    "Great Britain",
    "Kingdom of Prussia",
    "Neutral",
    "Pirates",
    "Russian Empire",
    "Sverige",
    "United States",
    "Verenigde Provinciën",
]!
export const nations: Nation[] = [
    { id: 0, short: "NT", name: "Neutral", sortName: "Neutral", colours: ["#cec1c1"] },
    { id: 1, short: "PR", name: "Pirates", sortName: "Pirates", colours: ["#352828", "#cec1c1"] },
    { id: 2, short: "ES", name: "España", sortName: "España", colours: ["#9b3438", "#c5a528"] },
    { id: 3, short: "FR", name: "France", sortName: "France", colours: ["#284e98", "#b5423a", "#cec1c1"] },
    {
        id: 4,
        short: "GB",
        name: "Great Britain",
        sortName: "Great Britain",
        colours: ["#284180", "#cec1c1", "#b13443"],
    },
    {
        id: 5,
        short: "VP",
        name: "Verenigde Provinciën",
        sortName: "Verenigde Provinciën",
        colours: ["#9d3841", "#3b5688", "#cec1c1"],
    },
    { id: 6, short: "DK", name: "Danmark-Norge", sortName: "Danmark-Norge", colours: ["#9c294b", "#cec1c1"] },
    { id: 7, short: "SE", name: "Sverige", sortName: "Sverige", colours: ["#287099", "#cdad28"] },
    {
        id: 8,
        short: "US",
        name: "United States",
        sortName: "United States",
        colours: ["#282873", "#cec1c1", "#a72e47"],
    },
    { id: 9, short: "FT", name: "Free Town", sortName: "Free Town", colours: ["#cec1c1"] },
    { id: 10, short: "RU", name: "Russian Empire", sortName: "Russian Empire", colours: ["#284e98", "#cec1c1"] },
    { id: 11, short: "DE", name: "Kingdom of Prussia", sortName: "Prussia", colours: ["#352828", "#cec1c1"] },
    { id: 12, short: "PL", name: "Commonwealth of Poland", sortName: "Poland", colours: ["#c22839", "#cec1c1"] },
    { id: 13, short: "CN", name: "China", sortName: "China", colours: ["#cdad3b", "#ce2828"] },
]
export const nationMap = new Map<number, Nation>(nations.map((nation) => [nation.id, nation]))

// noinspection SpellCheckingInspection
export const capitalToCounty = new Map([
    ["Arenas", "Cayos del Golfo"],
    ["Ays", "Costa del Fuego"],
    ["Baracoa", "Baracoa"],
    ["Basse-Terre", "Basse-Terre"],
    ["Belize", "Belize"],
    ["Black River", "North Mosquito"],
    ["Bluefields", "South Mosquito"],
    ["Brangman’s Bluff", "Royal Mosquito"],
    ["Bridgetown", "Windward Isles"],
    ["Calobelo", "Portobelo"],
    ["Campeche", "Campeche"],
    ["Cap-Français", "Cap-Français"],
    ["Caracas", "Caracas"],
    ["Cartagena de Indias", "Cartagena"],
    ["Castries", "Sainte-Lucie"],
    ["Caymans", "George Town"],
    ["Charleston", "South Carolina"],
    ["Christiansted", "Vestindiske Øer"],
    ["Cumaná", "Cumaná"],
    ["Fort-Royal", "Martinique"],
    ["Gasparilla", "Costa de los Calos"],
    ["George Town", "Caymans"],
    ["George’s Town", "Exuma"],
    ["Gibraltar", "Lago de Maracaibo"],
    ["Grand Turk", "Turks and Caicos"],
    ["Gustavia", "Gustavia"],
    ["Islamorada", "Los Martires"],
    ["Kidd’s Harbour", "Kidd’s Island"],
    ["Kingston / Port Royal", "Surrey"],
    ["La Bahía", "Texas"],
    ["La Habana", "La Habana"],
    ["Les Cayes", "Les Cayes"],
    ["Maracaibo", "Golfo de Maracaibo"],
    ["Marsh Harbour", "Abaco"],
    ["Matina", "Costa Rica"],
    ["Morgan’s Bluff", "Andros"],
    ["Mortimer Town", "Inagua"],
    ["Nassau", "New Providence"],
    ["Nouvelle-Orléans", "Louisiane"],
    ["Nuevitas", "Nuevitas del Principe"],
    ["Old Providence", "Providencia"],
    ["Omoa", "Comayaqua"],
    ["Oranjestad", "Bovenwinds"],
    ["Pampatar", "Margarita"],
    ["Pedro Cay", "South Cays"],
    ["Penzacola", "Florida Occidental"],
    ["Pinar del Río", "Filipina"],
    ["Pitt’s Town", "Crooked"],
    ["Pointe-à-Pitre", "Grande-Terre"],
    ["Ponce", "Ponce"],
    ["Port-au-Prince", "Port-au-Prince"],
    ["Portobelo", "Portobelo"],
    ["Puerto de España", "Trinidad"],
    ["Puerto Plata", "La Vega"],
    ["Remedios", "Los Llanos"],
    ["Roseau", "Dominica"],
    ["Saint George’s Town", "Bermuda"],
    ["Saint John’s", "Leeward Islands"],
    ["Salamanca", "Bacalar"],
    ["San Agustín", "Timucua"],
    ["San Juan", "San Juan"],
    ["San Marcos", "Apalache"],
    ["Santa Fe", "Isla de Pinos"],
    ["Santa Marta", "Santa Marta"],
    ["Santiago de Cuba", "Ciudad de Cuba"],
    ["Santo Domingo", "Santo Domingo"],
    ["Santo Tomé de Guayana", "Orinoco"],
    ["Savanna la Mar", "Cornwall"],
    ["Savannah", "Georgia"],
    ["Sisal", "Mérida"],
    ["Soto La Marina", "Nuevo Santander"],
    ["Spanish Town", "Virgin Islands"],
    ["Trinidad", "Quatro Villas"],
    ["Vera Cruz", "Vera Cruz"],
    ["West End", "Grand Bahama"],
    ["Willemstad", "Benedenwinds"],
    ["Wilmington", "North Carolina"],
])

// Woods
export const woodFamily = ["regular", "seasoned", "rare"]
export const woodType = ["frame", "trim"]
