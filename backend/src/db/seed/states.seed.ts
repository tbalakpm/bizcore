import { db, states } from "../../db";

export const seedStates = async () => {
    const existing = await db.select().from(states).limit(1).all();
    if (existing.length > 0) return;

    const initialStates = [
        { stateName: 'Tamil Nadu', stateCode: '33', stateShortCode: 'TN', countryCode: 'IN', isUnionTerritory: false },
        { stateName: 'Karnataka', stateCode: '29', stateShortCode: 'KA', countryCode: 'IN', isUnionTerritory: false },
        { stateName: 'Kerala', stateCode: '32', stateShortCode: 'KL', countryCode: 'IN', isUnionTerritory: false },
        { stateName: 'Andhra Pradesh', stateCode: '37', stateShortCode: 'AP', countryCode: 'IN', isUnionTerritory: false },
        { stateName: 'Telangana', stateCode: '36', stateShortCode: 'TG', countryCode: 'IN', isUnionTerritory: false },
        { stateName: 'Maharashtra', stateCode: '27', stateShortCode: 'MH', countryCode: 'IN', isUnionTerritory: false },
        { stateName: 'Delhi', stateCode: '07', stateShortCode: 'DL', countryCode: 'IN', isUnionTerritory: true },
        { stateName: 'Puducherry', stateCode: '34', stateShortCode: 'PY', countryCode: 'IN', isUnionTerritory: true },
    ];

    for (const state of initialStates) {
        await db.insert(states).values(state).run();
    }
};
