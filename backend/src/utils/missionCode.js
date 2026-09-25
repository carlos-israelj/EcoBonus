/**
 * Generate mission code in format: LM-ZONA-NNNN
 * Examples:
 *   - LM-RIM-0001 (Lima - Rimac)
 *   - LM-MFLOR-0024 (Lima - Miraflores)
 *   - LM-SUR-0412 (Lima - Surco)
 *   - CDMX-COY-0003 (Ciudad de México - Coyoacán)
 */

const DISTRICT_CODES = {
  // Lima districts
  'Miraflores': 'MFLOR',
  'San Isidro': 'SIDR',
  'Surco': 'SUR',
  'Barranco': 'BAR',
  'La Molina': 'MOLINA',
  'Rimac': 'RIM',
  'Cercado de Lima': 'CERCADO',
  'San Borja': 'SBORJA',
  'Magdalena': 'MAG',
  'Lince': 'LIN',
  'Pueblo Libre': 'PLIB',
  'Jesús María': 'JM',
  'Breña': 'BRENA',
  'San Miguel': 'SMIG',
  'Callao': 'CALL',

  // Ciudad de México
  'Coyoacán': 'COY',
  'Condesa': 'COND',
  'Roma': 'ROMA',
  'Polanco': 'POL',
  'Centro': 'CENTRO',

  // Bogotá
  'Chapinero': 'CHA',
  'Usaquén': 'USA',
  'Suba': 'SUBA',
};

const CITY_CODES = {
  'Lima': 'LM',
  'Ciudad de México': 'CDMX',
  'Bogotá': 'BOG',
  'Santiago': 'SCL',
  'Buenos Aires': 'BA',
};

/**
 * Generate mission code
 * @param {string} city - City name (e.g., "Lima")
 * @param {string} district - District name (e.g., "Miraflores")
 * @param {number} sequence - Sequence number (e.g., 412)
 * @returns {string} Mission code (e.g., "LM-MFLOR-0412")
 */
export function generateMissionCode(city, district, sequence) {
  const cityCode = CITY_CODES[city] || 'XX';
  const districtCode = DISTRICT_CODES[district] || district.substring(0, 4).toUpperCase();
  const sequenceStr = String(sequence).padStart(4, '0');

  return `${cityCode}-${districtCode}-${sequenceStr}`;
}

/**
 * Parse mission code into components
 * @param {string} code - Mission code (e.g., "LM-MFLOR-0412")
 * @returns {object} Parsed components: { city, district, sequence }
 */
export function parseMissionCode(code) {
  const parts = code.split('-');

  if (parts.length !== 3) {
    throw new Error('Invalid mission code format. Expected: CITY-DISTRICT-NNNN');
  }

  const [cityCode, districtCode, sequenceStr] = parts;

  // Reverse lookup
  const city = Object.keys(CITY_CODES).find(k => CITY_CODES[k] === cityCode) || 'Unknown';
  const district = Object.keys(DISTRICT_CODES).find(k => DISTRICT_CODES[k] === districtCode) || districtCode;
  const sequence = parseInt(sequenceStr, 10);

  return { city, district, sequence };
}

/**
 * Get next sequence number for a district
 * @param {object} supabase - Supabase client
 * @param {string} city - City name
 * @param {string} district - District name
 * @returns {Promise<number>} Next sequence number
 */
export async function getNextSequence(supabase, city, district) {
  const { data, error } = await supabase
    .from('missions')
    .select('code')
    .eq('city', city)
    .eq('district', district)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error getting last mission code:', error);
    return 1;
  }

  if (!data || data.length === 0) {
    return 1; // First mission in this district
  }

  try {
    const lastCode = data[0].code;
    const parsed = parseMissionCode(lastCode);
    return parsed.sequence + 1;
  } catch (err) {
    console.error('Error parsing last mission code:', err);
    return 1;
  }
}

export default {
  generateMissionCode,
  parseMissionCode,
  getNextSequence,
};
