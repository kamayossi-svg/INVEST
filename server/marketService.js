import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Alpaca from '@alpacahq/alpaca-trade-api';

// Load .env from the server directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// =====================
// ALPACA CLIENT SETUP (S&P 500 stocks)
// =====================

const alpaca = new Alpaca({
  keyId: process.env.APCA_API_KEY_ID,
  secretKey: process.env.APCA_API_SECRET_KEY,
  paper: true,
  feed: 'iex' // Use IEX feed (free tier)
});

console.log('🦙 Alpaca client initialized (S&P 500 - 512 stocks)');

// =====================
// FINNHUB SETUP (Analyst Ratings)
// =====================

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

console.log('📊 Finnhub API configured for analyst ratings');

// S&P 500 Complete Stock List (503 stocks as of 2024)
export const DEFAULT_STOCKS = [
  // Information Technology (77 stocks)
  'AAPL', 'MSFT', 'NVDA', 'AVGO', 'ORCL', 'CRM', 'CSCO', 'ACN', 'ADBE', 'IBM',
  'INTC', 'AMD', 'QCOM', 'TXN', 'NOW', 'INTU', 'AMAT', 'ADI', 'LRCX', 'MU',
  'KLAC', 'SNPS', 'CDNS', 'MCHP', 'FTNT', 'MSI', 'ANSS', 'NXPI', 'APH', 'KEYS',
  'HPQ', 'HPE', 'CTSH', 'GLW', 'IT', 'ZBRA', 'CDW', 'TYL', 'ON', 'FSLR',
  'SWKS', 'NTAP', 'JNPR', 'PTC', 'AKAM', 'VRSN', 'FFIV', 'TER', 'TRMB', 'WDC',
  'STX', 'ENPH', 'EPAM', 'GEN', 'QRVO', 'PAYC', 'MPWR', 'DELL', 'PANW', 'CRWD',
  'GDDY', 'FICO', 'ANET', 'ROP', 'ADSK', 'WDAY', 'SPLK', 'VEEV', 'DOCU', 'ZM',
  'CTXS', 'XLNX', 'MRVL', 'NXST', 'JKHY', 'LDOS', 'SSNC',

  // Healthcare (64 stocks)
  'UNH', 'JNJ', 'LLY', 'MRK', 'ABBV', 'TMO', 'ABT', 'DHR', 'PFE', 'BMY',
  'AMGN', 'GILD', 'MDT', 'SYK', 'ISRG', 'VRTX', 'REGN', 'ZTS', 'ELV', 'CI',
  'CVS', 'MCK', 'HUM', 'CNC', 'BSX', 'BDX', 'EW', 'IDXX', 'IQV', 'DXCM',
  'A', 'MTD', 'RMD', 'ALGN', 'HOLX', 'ILMN', 'WAT', 'WST', 'COO', 'TFX',
  'BAX', 'BIIB', 'MRNA', 'TECH', 'MOH', 'CRL', 'DGX', 'LH', 'CAH', 'VTRS',
  'HSIC', 'XRAY', 'OGN', 'DVA', 'CTLT', 'INCY', 'PODD', 'RVTY', 'STE', 'HCA',
  'UHS', 'GEHC', 'SOLV', 'BIO',

  // Financials (69 stocks)
  'BRK.B', 'JPM', 'V', 'MA', 'BAC', 'WFC', 'GS', 'MS', 'BLK', 'SCHW',
  'AXP', 'C', 'USB', 'PNC', 'TFC', 'BK', 'COF', 'ICE', 'CME', 'CB',
  'AON', 'MMC', 'PGR', 'AIG', 'MET', 'PRU', 'AFL', 'TRV', 'ALL', 'AJG',
  'SPGI', 'MCO', 'MSCI', 'NDAQ', 'FIS', 'FITB', 'STT', 'MTB', 'HBAN', 'RF',
  'CFG', 'KEY', 'NTRS', 'DFS', 'SYF', 'RJF', 'CINF', 'WRB', 'L', 'RE',
  'GL', 'AIZ', 'BRO', 'EG', 'ACGL', 'FDS', 'MKTX', 'CBOE', 'TROW', 'IVZ',
  'BEN', 'AMP', 'LNC', 'ZION', 'CMA', 'PYPL', 'FI', 'GPN', 'VRSN',

  // Consumer Discretionary (58 stocks)
  'AMZN', 'TSLA', 'HD', 'MCD', 'NKE', 'LOW', 'SBUX', 'TGT', 'TJX', 'ROST',
  'BKNG', 'CMG', 'ORLY', 'AZO', 'MAR', 'HLT', 'YUM', 'DG', 'DLTR', 'EBAY',
  'DHI', 'LEN', 'PHM', 'NVR', 'GPC', 'BBY', 'ULTA', 'POOL', 'GRMN', 'TSCO',
  'DRI', 'WYNN', 'LVS', 'MGM', 'CZR', 'RCL', 'CCL', 'NCLH', 'EXPE', 'HAS',
  'F', 'GM', 'APTV', 'BWA', 'LEA', 'KMX', 'LULU', 'NWL', 'VFC', 'PVH',
  'TPR', 'RL', 'ETSY', 'DECK', 'DPZ', 'PENN', 'WYNN', 'LKQ',

  // Communication Services (26 stocks)
  'GOOGL', 'GOOG', 'META', 'NFLX', 'DIS', 'CMCSA', 'VZ', 'T', 'TMUS', 'CHTR',
  'EA', 'TTWO', 'WBD', 'PARA', 'FOX', 'FOXA', 'NWSA', 'NWS', 'OMC', 'IPG',
  'LYV', 'MTCH', 'ATVI', 'DISH', 'LUMN', 'VIA',

  // Industrials (77 stocks)
  'CAT', 'DE', 'BA', 'GE', 'HON', 'UNP', 'RTX', 'LMT', 'UPS', 'FDX',
  'EMR', 'ETN', 'ITW', 'PH', 'WM', 'RSG', 'CTAS', 'NSC', 'CSX', 'GD',
  'NOC', 'TT', 'MMM', 'JCI', 'CMI', 'AME', 'CARR', 'OTIS', 'ROK', 'PCAR',
  'FAST', 'PWR', 'PAYX', 'VRSK', 'DOV', 'CPRT', 'ODFL', 'JBHT', 'XYL', 'WAB',
  'GWW', 'SWK', 'IEX', 'HWM', 'TDG', 'RHI', 'EXPD', 'CHRW', 'DAL', 'UAL',
  'LUV', 'AAL', 'ALK', 'J', 'BAH', 'AXON', 'BLDR', 'TXT', 'HII', 'LHX',
  'URI', 'WSO', 'AOS', 'FTV', 'EME', 'GNRC', 'IR', 'HUBB', 'MAS', 'SNA',
  'PNR', 'ALLE', 'NDSN', 'RRX', 'EFX', 'BR', 'PAYC',

  // Consumer Staples (38 stocks)
  'PG', 'KO', 'PEP', 'COST', 'WMT', 'PM', 'MO', 'MDLZ', 'CL', 'KMB',
  'GIS', 'KHC', 'HSY', 'K', 'SJM', 'CPB', 'CAG', 'HRL', 'MKC', 'CLX',
  'CHD', 'EL', 'KR', 'SYY', 'ADM', 'BG', 'WBA', 'STZ', 'TAP', 'MNST',
  'KDP', 'TSN', 'LW', 'KVUE', 'COR', 'CASY', 'JJSF', 'LANC',

  // Energy (23 stocks)
  'XOM', 'CVX', 'COP', 'EOG', 'SLB', 'MPC', 'PSX', 'VLO', 'OXY', 'WMB',
  'KMI', 'HAL', 'DVN', 'HES', 'FANG', 'BKR', 'TRGP', 'OKE', 'CTRA', 'APA',
  'EQT', 'MRO', 'PR',

  // Utilities (31 stocks)
  'NEE', 'DUK', 'SO', 'D', 'AEP', 'SRE', 'EXC', 'XEL', 'ED', 'PEG',
  'WEC', 'ES', 'AWK', 'DTE', 'EIX', 'ETR', 'AEE', 'FE', 'PPL', 'CMS',
  'CNP', 'EVRG', 'ATO', 'NI', 'LNT', 'NRG', 'AES', 'PNW', 'CEG', 'VST',
  'PCG',

  // Real Estate (31 stocks)
  'AMT', 'PLD', 'CCI', 'EQIX', 'PSA', 'SPG', 'O', 'WELL', 'DLR', 'AVB',
  'EQR', 'VTR', 'ARE', 'MAA', 'UDR', 'ESS', 'INVH', 'SUI', 'REG', 'KIM',
  'HST', 'CPT', 'PEAK', 'IRM', 'SBAC', 'WY', 'BXP', 'CBRE', 'CSGP', 'FRT',
  'DOC',

  // Materials (29 stocks)
  'LIN', 'APD', 'SHW', 'ECL', 'FCX', 'NEM', 'NUE', 'DOW', 'DD', 'PPG',
  'VMC', 'MLM', 'ALB', 'CTVA', 'CE', 'EMN', 'IFF', 'IP', 'PKG', 'WRK',
  'AVY', 'SEE', 'BALL', 'AMCR', 'CF', 'MOS', 'FMC', 'RPM', 'SMG'
];

// Sector mapping for display (S&P 500 complete)
const SECTOR_MAP = {
  // Information Technology
  'AAPL': 'Technology', 'MSFT': 'Technology', 'NVDA': 'Technology', 'AVGO': 'Technology',
  'ORCL': 'Technology', 'CRM': 'Technology', 'CSCO': 'Technology', 'ACN': 'Technology',
  'ADBE': 'Technology', 'IBM': 'Technology', 'INTC': 'Technology', 'AMD': 'Technology',
  'QCOM': 'Technology', 'TXN': 'Technology', 'NOW': 'Technology', 'INTU': 'Technology',
  'AMAT': 'Technology', 'ADI': 'Technology', 'LRCX': 'Technology', 'MU': 'Technology',
  'KLAC': 'Technology', 'SNPS': 'Technology', 'CDNS': 'Technology', 'MCHP': 'Technology',
  'FTNT': 'Technology', 'MSI': 'Technology', 'ANSS': 'Technology', 'NXPI': 'Technology',
  'APH': 'Technology', 'KEYS': 'Technology', 'HPQ': 'Technology', 'HPE': 'Technology',
  'CTSH': 'Technology', 'GLW': 'Technology', 'IT': 'Technology', 'ZBRA': 'Technology',
  'CDW': 'Technology', 'TYL': 'Technology', 'ON': 'Technology', 'FSLR': 'Technology',
  'SWKS': 'Technology', 'NTAP': 'Technology', 'JNPR': 'Technology', 'PTC': 'Technology',
  'AKAM': 'Technology', 'VRSN': 'Technology', 'FFIV': 'Technology', 'TER': 'Technology',
  'TRMB': 'Technology', 'WDC': 'Technology', 'STX': 'Technology', 'ENPH': 'Technology',
  'EPAM': 'Technology', 'GEN': 'Technology', 'QRVO': 'Technology', 'SEDG': 'Technology',
  'PAYC': 'Technology', 'MPWR': 'Technology', 'SMCI': 'Technology', 'DELL': 'Technology',
  'PANW': 'Technology', 'CRWD': 'Technology', 'ZS': 'Technology', 'DDOG': 'Technology',
  'PLTR': 'Technology', 'NET': 'Technology', 'SNOW': 'Technology', 'MDB': 'Technology',
  'OKTA': 'Technology', 'HUBS': 'Technology', 'TEAM': 'Technology',

  // Healthcare
  'UNH': 'Healthcare', 'JNJ': 'Healthcare', 'LLY': 'Healthcare', 'MRK': 'Healthcare',
  'ABBV': 'Healthcare', 'TMO': 'Healthcare', 'ABT': 'Healthcare', 'DHR': 'Healthcare',
  'PFE': 'Healthcare', 'BMY': 'Healthcare', 'AMGN': 'Healthcare', 'GILD': 'Healthcare',
  'MDT': 'Healthcare', 'SYK': 'Healthcare', 'ISRG': 'Healthcare', 'VRTX': 'Healthcare',
  'REGN': 'Healthcare', 'ZTS': 'Healthcare', 'ELV': 'Healthcare', 'CI': 'Healthcare',
  'CVS': 'Healthcare', 'MCK': 'Healthcare', 'HUM': 'Healthcare', 'CNC': 'Healthcare',
  'BSX': 'Healthcare', 'BDX': 'Healthcare', 'EW': 'Healthcare', 'IDXX': 'Healthcare',
  'IQV': 'Healthcare', 'DXCM': 'Healthcare', 'A': 'Healthcare', 'MTD': 'Healthcare',
  'RMD': 'Healthcare', 'ALGN': 'Healthcare', 'HOLX': 'Healthcare', 'ILMN': 'Healthcare',
  'WAT': 'Healthcare', 'WST': 'Healthcare', 'COO': 'Healthcare', 'TFX': 'Healthcare',
  'BAX': 'Healthcare', 'BIIB': 'Healthcare', 'MRNA': 'Healthcare', 'TECH': 'Healthcare',
  'MOH': 'Healthcare', 'CRL': 'Healthcare', 'DGX': 'Healthcare', 'LH': 'Healthcare',
  'CAH': 'Healthcare', 'VTRS': 'Healthcare', 'HSIC': 'Healthcare', 'XRAY': 'Healthcare',
  'OGN': 'Healthcare', 'DVA': 'Healthcare', 'CTLT': 'Healthcare', 'INCY': 'Healthcare',
  'PODD': 'Healthcare', 'RVTY': 'Healthcare', 'STE': 'Healthcare', 'HCA': 'Healthcare',
  'UHS': 'Healthcare', 'GEHC': 'Healthcare', 'SOLV': 'Healthcare', 'JAZZ': 'Healthcare',

  // Financials
  'JPM': 'Financial', 'V': 'Financial', 'MA': 'Financial', 'BAC': 'Financial',
  'WFC': 'Financial', 'GS': 'Financial', 'MS': 'Financial', 'BLK': 'Financial',
  'SCHW': 'Financial', 'AXP': 'Financial', 'C': 'Financial', 'USB': 'Financial',
  'PNC': 'Financial', 'TFC': 'Financial', 'BK': 'Financial', 'COF': 'Financial',
  'ICE': 'Financial', 'CME': 'Financial', 'CB': 'Financial', 'AON': 'Financial',
  'MMC': 'Financial', 'PGR': 'Financial', 'AIG': 'Financial', 'MET': 'Financial',
  'PRU': 'Financial', 'AFL': 'Financial', 'TRV': 'Financial', 'ALL': 'Financial',
  'AJG': 'Financial', 'SPGI': 'Financial', 'MCO': 'Financial', 'MSCI': 'Financial',
  'NDAQ': 'Financial', 'FIS': 'Financial', 'FITB': 'Financial', 'STT': 'Financial',
  'MTB': 'Financial', 'HBAN': 'Financial', 'RF': 'Financial', 'CFG': 'Financial',
  'KEY': 'Financial', 'NTRS': 'Financial', 'DFS': 'Financial', 'SYF': 'Financial',
  'RJF': 'Financial', 'CINF': 'Financial', 'WRB': 'Financial', 'L': 'Financial',
  'RE': 'Financial', 'GL': 'Financial', 'AIZ': 'Financial', 'BRO': 'Financial',
  'EG': 'Financial', 'ACGL': 'Financial', 'FDS': 'Financial', 'MKTX': 'Financial',
  'CBOE': 'Financial', 'TROW': 'Financial', 'IVZ': 'Financial', 'BEN': 'Financial',
  'AMP': 'Financial', 'LNC': 'Financial', 'JKHY': 'Financial', 'ZION': 'Financial',
  'CMA': 'Financial', 'WBS': 'Financial', 'FHN': 'Financial', 'PYPL': 'Financial',
  'SQ': 'Financial', 'COIN': 'Financial', 'HOOD': 'Financial', 'ALLY': 'Financial',
  'EWBC': 'Financial',

  // Consumer Discretionary
  'AMZN': 'Consumer', 'TSLA': 'Consumer', 'HD': 'Consumer', 'MCD': 'Consumer',
  'NKE': 'Consumer', 'LOW': 'Consumer', 'SBUX': 'Consumer', 'TGT': 'Consumer',
  'TJX': 'Consumer', 'ROST': 'Consumer', 'BKNG': 'Consumer', 'CMG': 'Consumer',
  'ORLY': 'Consumer', 'AZO': 'Consumer', 'MAR': 'Consumer', 'HLT': 'Consumer',
  'YUM': 'Consumer', 'DG': 'Consumer', 'DLTR': 'Consumer', 'EBAY': 'Consumer',
  'DHI': 'Consumer', 'LEN': 'Consumer', 'PHM': 'Consumer', 'NVR': 'Consumer',
  'GPC': 'Consumer', 'BBY': 'Consumer', 'ULTA': 'Consumer', 'POOL': 'Consumer',
  'GRMN': 'Consumer', 'TSCO': 'Consumer', 'DRI': 'Consumer', 'WYNN': 'Consumer',
  'LVS': 'Consumer', 'MGM': 'Consumer', 'CZR': 'Consumer', 'RCL': 'Consumer',
  'CCL': 'Consumer', 'NCLH': 'Consumer', 'EXPE': 'Consumer', 'HAS': 'Consumer',
  'F': 'Consumer', 'GM': 'Consumer', 'APTV': 'Consumer', 'BWA': 'Consumer',
  'LEA': 'Consumer', 'AAP': 'Consumer', 'KMX': 'Consumer', 'LULU': 'Consumer',
  'NWL': 'Consumer', 'VFC': 'Consumer', 'PVH': 'Consumer', 'TPR': 'Consumer',
  'RL': 'Consumer', 'ETSY': 'Consumer',

  // Communication Services
  'GOOGL': 'Communication', 'GOOG': 'Communication', 'META': 'Communication',
  'NFLX': 'Entertainment', 'DIS': 'Entertainment', 'CMCSA': 'Communication',
  'VZ': 'Communication', 'T': 'Communication', 'TMUS': 'Communication',
  'CHTR': 'Communication', 'EA': 'Entertainment', 'TTWO': 'Entertainment',
  'WBD': 'Entertainment', 'PARA': 'Entertainment', 'FOX': 'Communication',
  'FOXA': 'Communication', 'NWSA': 'Communication', 'NWS': 'Communication',
  'OMC': 'Communication', 'IPG': 'Communication', 'LYV': 'Entertainment',
  'MTCH': 'Communication', 'PINS': 'Communication',

  // Industrials
  'CAT': 'Industrial', 'DE': 'Industrial', 'BA': 'Industrial', 'GE': 'Industrial',
  'HON': 'Industrial', 'UNP': 'Industrial', 'RTX': 'Industrial', 'LMT': 'Industrial',
  'UPS': 'Industrial', 'FDX': 'Industrial', 'EMR': 'Industrial', 'ETN': 'Industrial',
  'ITW': 'Industrial', 'PH': 'Industrial', 'WM': 'Industrial', 'RSG': 'Industrial',
  'CTAS': 'Industrial', 'NSC': 'Industrial', 'CSX': 'Industrial', 'GD': 'Industrial',
  'NOC': 'Industrial', 'TT': 'Industrial', 'MMM': 'Industrial', 'JCI': 'Industrial',
  'CMI': 'Industrial', 'AME': 'Industrial', 'CARR': 'Industrial', 'OTIS': 'Industrial',
  'ROK': 'Industrial', 'PCAR': 'Industrial', 'FAST': 'Industrial', 'PWR': 'Industrial',
  'PAYX': 'Industrial', 'VRSK': 'Industrial', 'DOV': 'Industrial', 'CPRT': 'Industrial',
  'ODFL': 'Industrial', 'JBHT': 'Industrial', 'XYL': 'Industrial', 'WAB': 'Industrial',
  'GWW': 'Industrial', 'SWK': 'Industrial', 'IEX': 'Industrial', 'HWM': 'Industrial',
  'TDG': 'Industrial', 'RHI': 'Industrial', 'EXPD': 'Industrial', 'CHR': 'Industrial',
  'CHRW': 'Industrial', 'DAL': 'Industrial', 'UAL': 'Industrial', 'LUV': 'Industrial',
  'AAL': 'Industrial', 'ALK': 'Industrial', 'J': 'Industrial', 'LDOS': 'Industrial',
  'BAH': 'Industrial', 'AXON': 'Industrial', 'BLDR': 'Industrial', 'TXT': 'Industrial',
  'HII': 'Industrial', 'LHX': 'Industrial', 'URI': 'Industrial', 'WSO': 'Industrial',
  'AOS': 'Industrial', 'FTV': 'Industrial', 'EME': 'Industrial', 'GNRC': 'Industrial',
  'IR': 'Industrial', 'HUBB': 'Industrial', 'MAS': 'Industrial', 'SNA': 'Industrial',
  'PNR': 'Industrial', 'ALLE': 'Industrial', 'NDSN': 'Industrial', 'RRX': 'Industrial',
  'EFX': 'Industrial', 'BR': 'Industrial',

  // Consumer Staples
  'PG': 'Consumer Staples', 'KO': 'Consumer Staples', 'PEP': 'Consumer Staples',
  'COST': 'Consumer Staples', 'WMT': 'Consumer Staples', 'PM': 'Consumer Staples',
  'MO': 'Consumer Staples', 'MDLZ': 'Consumer Staples', 'CL': 'Consumer Staples',
  'KMB': 'Consumer Staples', 'GIS': 'Consumer Staples', 'KHC': 'Consumer Staples',
  'HSY': 'Consumer Staples', 'K': 'Consumer Staples', 'SJM': 'Consumer Staples',
  'CPB': 'Consumer Staples', 'CAG': 'Consumer Staples', 'HRL': 'Consumer Staples',
  'MKC': 'Consumer Staples', 'CLX': 'Consumer Staples', 'CHD': 'Consumer Staples',
  'EL': 'Consumer Staples', 'KR': 'Consumer Staples', 'SYY': 'Consumer Staples',
  'ADM': 'Consumer Staples', 'BG': 'Consumer Staples', 'WBA': 'Consumer Staples',
  'STZ': 'Consumer Staples', 'TAP': 'Consumer Staples', 'BF.B': 'Consumer Staples',
  'MNST': 'Consumer Staples', 'KDP': 'Consumer Staples', 'TSN': 'Consumer Staples',
  'LW': 'Consumer Staples', 'KVUE': 'Consumer Staples', 'USFD': 'Consumer Staples',
  'LAMB': 'Consumer Staples', 'POST': 'Consumer Staples',

  // Energy
  'XOM': 'Energy', 'CVX': 'Energy', 'COP': 'Energy', 'EOG': 'Energy',
  'SLB': 'Energy', 'MPC': 'Energy', 'PSX': 'Energy', 'VLO': 'Energy',
  'PXD': 'Energy', 'OXY': 'Energy', 'WMB': 'Energy', 'KMI': 'Energy',
  'HAL': 'Energy', 'DVN': 'Energy', 'HES': 'Energy', 'FANG': 'Energy',
  'BKR': 'Energy', 'TRGP': 'Energy', 'OKE': 'Energy', 'CTRA': 'Energy',
  'APA': 'Energy', 'EQT': 'Energy', 'MRO': 'Energy',

  // Utilities
  'NEE': 'Utilities', 'DUK': 'Utilities', 'SO': 'Utilities', 'D': 'Utilities',
  'AEP': 'Utilities', 'SRE': 'Utilities', 'EXC': 'Utilities', 'XEL': 'Utilities',
  'ED': 'Utilities', 'PEG': 'Utilities', 'WEC': 'Utilities', 'ES': 'Utilities',
  'AWK': 'Utilities', 'DTE': 'Utilities', 'EIX': 'Utilities', 'ETR': 'Utilities',
  'AEE': 'Utilities', 'FE': 'Utilities', 'PPL': 'Utilities', 'CMS': 'Utilities',
  'CNP': 'Utilities', 'EVRG': 'Utilities', 'ATO': 'Utilities', 'NI': 'Utilities',
  'LNT': 'Utilities', 'NRG': 'Utilities', 'AES': 'Utilities', 'PNW': 'Utilities',
  'CEG': 'Utilities', 'VST': 'Utilities',

  // Real Estate
  'AMT': 'Real Estate', 'PLD': 'Real Estate', 'CCI': 'Real Estate', 'EQIX': 'Real Estate',
  'PSA': 'Real Estate', 'SPG': 'Real Estate', 'O': 'Real Estate', 'WELL': 'Real Estate',
  'DLR': 'Real Estate', 'AVB': 'Real Estate', 'EQR': 'Real Estate', 'VTR': 'Real Estate',
  'ARE': 'Real Estate', 'MAA': 'Real Estate', 'UDR': 'Real Estate', 'ESS': 'Real Estate',
  'INVH': 'Real Estate', 'SUI': 'Real Estate', 'ELS': 'Real Estate', 'REG': 'Real Estate',
  'KIM': 'Real Estate', 'HST': 'Real Estate', 'CPT': 'Real Estate', 'PEAK': 'Real Estate',
  'IRM': 'Real Estate', 'SBAC': 'Real Estate', 'WY': 'Real Estate', 'BXP': 'Real Estate',
  'CBRE': 'Real Estate', 'CSGP': 'Real Estate', 'FRT': 'Real Estate',

  // Materials
  'LIN': 'Materials', 'APD': 'Materials', 'SHW': 'Materials', 'ECL': 'Materials',
  'FCX': 'Materials', 'NEM': 'Materials', 'NUE': 'Materials', 'DOW': 'Materials',
  'DD': 'Materials', 'PPG': 'Materials', 'VMC': 'Materials', 'MLM': 'Materials',
  'ALB': 'Materials', 'CTVA': 'Materials', 'CE': 'Materials', 'EMN': 'Materials',
  'IFF': 'Materials', 'IP': 'Materials', 'PKG': 'Materials', 'WRK': 'Materials',
  'AVY': 'Materials', 'SEE': 'Materials', 'BALL': 'Materials', 'AMCR': 'Materials',
  'CF': 'Materials', 'MOS': 'Materials', 'FMC': 'Materials'
};

// Cache for quotes and historical data
const quoteCache = new Map();
const historicalCache = new Map();
const analystCache = new Map();
const companyProfileCache = new Map();
const companyNewsCache = new Map();
const earningsCache = new Map();
const QUOTE_CACHE_TTL_MARKET_OPEN = 60000;    // 60 seconds when market is open
const QUOTE_CACHE_TTL_MARKET_CLOSED = Infinity; // Never expire when market is closed
const HISTORICAL_CACHE_TTL_MARKET_OPEN = 300000; // 5 minutes when market is open
const HISTORICAL_CACHE_TTL_MARKET_CLOSED = Infinity; // Never expire when market is closed
const ANALYST_CACHE_TTL = 86400000;   // 24 hours for analyst data (changes infrequently)
const COMPANY_PROFILE_CACHE_TTL = 86400000; // 24 hours for company profile (rarely changes)
const COMPANY_NEWS_CACHE_TTL = 900000; // 15 minutes for news
const EARNINGS_CACHE_TTL = 43200000; // 12 hours for earnings data (dates don't change often)

// =====================
// FINNHUB RATE LIMITER
// =====================
// Finnhub free tier: 60 calls/minute = 1 call/second
// We make 2 Finnhub calls per stock (analyst + earnings), so limit to 1 call per 1.2 seconds
const FINNHUB_MIN_INTERVAL = 1200; // 1.2 seconds between Finnhub API calls
let lastFinnhubCall = 0;

async function finnhubRateLimitedFetch(url) {
  const now = Date.now();
  const timeSinceLastCall = now - lastFinnhubCall;

  if (timeSinceLastCall < FINNHUB_MIN_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, FINNHUB_MIN_INTERVAL - timeSinceLastCall));
  }

  lastFinnhubCall = Date.now();
  return fetch(url);
}

// =====================
// BROKER FEES & TAX (Israel - IBI Style)
// =====================
const MIN_COMMISSION = 7.5;  // USD per trade (IBI minimum)
const TOTAL_COMMISSION = MIN_COMMISSION * 2;  // Buy + Sell = $15 per round trip
const TAX_RATE = 0.25;  // 25% Israel capital gains tax

// Scan results cache for market-closed consistency
let lastScanResults = null;
let lastScanTimestamp = null;
let lastMarketOpenState = null;

// =====================
// MARKET HOURS DETECTION
// =====================

// US Market holidays for 2024-2026 (market closed)
const MARKET_HOLIDAYS = new Set([
  // 2024
  '2024-01-01', '2024-01-15', '2024-02-19', '2024-03-29', '2024-05-27',
  '2024-06-19', '2024-07-04', '2024-09-02', '2024-11-28', '2024-12-25',
  // 2025
  '2025-01-01', '2025-01-20', '2025-02-17', '2025-04-18', '2025-05-26',
  '2025-06-19', '2025-07-04', '2025-09-01', '2025-11-27', '2025-12-25',
  // 2026
  '2026-01-01', '2026-01-19', '2026-02-16', '2026-04-03', '2026-05-25',
  '2026-06-19', '2026-07-03', '2026-09-07', '2026-11-26', '2026-12-25',
]);

// Early close days (1:00 PM ET instead of 4:00 PM)
const EARLY_CLOSE_DAYS = new Set([
  // 2024
  '2024-07-03', '2024-11-29', '2024-12-24',
  // 2025
  '2025-07-03', '2025-11-28', '2025-12-24',
  // 2026
  '2026-02-13', '2026-07-02', '2026-11-27', '2026-12-24',
]);

/**
 * Get current Eastern Time components
 * @returns {object} - { hours, minutes, dayOfWeek, dateKey }
 */
function getEasternTimeComponents() {
  const now = new Date();
  const etFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false,
  });

  const parts = etFormatter.formatToParts(now);
  const getPart = (type) => parts.find(p => p.type === type)?.value || '';

  const hours = parseInt(getPart('hour'), 10);
  const minutes = parseInt(getPart('minute'), 10);
  const weekday = getPart('weekday');
  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');

  const dayMap = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };

  return {
    hours,
    minutes,
    dayOfWeek: dayMap[weekday] ?? 0,
    dateKey: `${year}-${month}-${day}`,
  };
}

/**
 * Check if US stock market is currently open
 * @returns {object} - { isOpen, isEarlyClose, reason, nextOpenTime }
 */
export function isMarketOpen() {
  const et = getEasternTimeComponents();
  const currentMinutes = et.hours * 60 + et.minutes;

  // Market hours in minutes from midnight (ET)
  const marketOpen = 9 * 60 + 30;  // 9:30 AM ET
  const earlyClose = EARLY_CLOSE_DAYS.has(et.dateKey);
  const marketClose = earlyClose ? 13 * 60 : 16 * 60;  // 1:00 PM or 4:00 PM ET

  // Check weekend
  if (et.dayOfWeek === 0 || et.dayOfWeek === 6) {
    return { isOpen: false, isEarlyClose: false, reason: 'weekend' };
  }

  // Check holiday
  if (MARKET_HOLIDAYS.has(et.dateKey)) {
    return { isOpen: false, isEarlyClose: false, reason: 'holiday' };
  }

  // Check if within market hours
  if (currentMinutes >= marketOpen && currentMinutes < marketClose) {
    return { isOpen: true, isEarlyClose: earlyClose, reason: 'market_hours' };
  }

  // Before market open
  if (currentMinutes < marketOpen) {
    return { isOpen: false, isEarlyClose: earlyClose, reason: 'before_open' };
  }

  // After market close
  return { isOpen: false, isEarlyClose: false, reason: 'after_close' };
}

/**
 * Get quote cache TTL based on market status
 */
function getQuoteCacheTTL() {
  return isMarketOpen().isOpen ? QUOTE_CACHE_TTL_MARKET_OPEN : QUOTE_CACHE_TTL_MARKET_CLOSED;
}

// =====================
// HYSTERESIS SYSTEM (Stabilization #1)
// Requires stocks to appear as BUY_NOW in 2 consecutive scans
// =====================
const verdictHistoryCache = new Map(); // Tracks previous scan verdicts
const VERDICT_HISTORY_TTL = 86400000;  // 24 hours - persists between scans throughout the trading day

/**
 * Check if a stock's BUY_NOW verdict should be confirmed or pending
 * @param {string} symbol - Stock symbol
 * @param {string} currentVerdict - The verdict from current analysis
 * @returns {object} - { finalVerdict, isPendingConfirmation, previousVerdict }
 */
function applyHysteresis(symbol, currentVerdict) {
  const upperSymbol = symbol.toUpperCase();
  const now = Date.now();

  // Get previous verdict history
  const history = verdictHistoryCache.get(upperSymbol);
  const previousVerdict = history && (now - history.timestamp < VERDICT_HISTORY_TTL)
    ? history.verdict
    : null;

  let finalVerdict = currentVerdict;
  let isPendingConfirmation = false;

  // Hysteresis logic: BUY_NOW requires confirmation from previous scan
  // BUT: if previous verdict was already BUY_NOW or WATCH (close to buy), confirm immediately
  if (currentVerdict === 'BUY_NOW') {
    if (previousVerdict === 'BUY_NOW' || previousVerdict === 'WATCH' || previousVerdict === 'WAIT_FOR_DIP') {
      // Confirmed! Stock was already tracked in previous scan
      finalVerdict = 'BUY_NOW';
      console.log(`[${upperSymbol}] ✅ BUY_NOW CONFIRMED (previous: ${previousVerdict})`);
    } else {
      // First time seeing this stock - downgrade to WATCH pending confirmation
      finalVerdict = 'WATCH';
      isPendingConfirmation = true;
      console.log(`[${upperSymbol}] ⏳ BUY_NOW PENDING CONFIRMATION (was: ${previousVerdict || 'new'})`);
    }
  }

  // Update history with current verdict (before hysteresis adjustment)
  verdictHistoryCache.set(upperSymbol, {
    verdict: currentVerdict,  // Store the ORIGINAL verdict, not the adjusted one
    timestamp: now
  });

  return {
    finalVerdict,
    isPendingConfirmation,
    previousVerdict
  };
}

/**
 * Clean up old verdict history entries
 * Only runs when market is OPEN to preserve history during closed periods
 */
function cleanupVerdictHistory() {
  // Don't clean up when market is closed - preserve hysteresis state
  if (!isMarketOpen().isOpen) {
    console.log('📊 Verdict history cleanup skipped (market closed)');
    return;
  }

  const now = Date.now();
  let cleaned = 0;
  for (const [symbol, history] of verdictHistoryCache.entries()) {
    if (now - history.timestamp > VERDICT_HISTORY_TTL) {
      verdictHistoryCache.delete(symbol);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`📊 Cleaned up ${cleaned} old verdict history entries`);
  }
}

// Clean up verdict history periodically (every 5 minutes) - only during market hours
setInterval(cleanupVerdictHistory, 300000);

// =====================
// TECHNICAL INDICATORS
// =====================

/**
 * Calculate Simple Moving Average
 */
export function calculateSMA(prices, period) {
  if (!prices || prices.length < period) return null;
  const slice = prices.slice(-period);
  return slice.reduce((sum, p) => sum + p, 0) / period;
}

/**
 * Calculate Relative Strength Index (RSI)
 * Uses Wilder's smoothing method
 */
function calculateRSI(prices, period = 14) {
  if (!prices || prices.length < period + 1) return null;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change >= 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    const gain = change >= 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  return parseFloat(rsi.toFixed(2));
}

/**
 * Calculate Volume Ratio
 */
function calculateVolumeRatio(currentVolume, avgVolume) {
  if (!avgVolume || avgVolume === 0) return 1;
  return currentVolume / avgVolume;
}

/**
 * Get RSI interpretation
 */
function getRSIInterpretation(rsi) {
  if (rsi === null) return { status: 'Unknown', color: 'gray' };
  if (rsi >= 70) return { status: 'Overbought', color: 'red', description: 'Stock may be too expensive right now' };
  if (rsi >= 50) return { status: 'Bullish', color: 'green', description: 'Stock is rising with room to grow' };
  if (rsi >= 30) return { status: 'Neutral', color: 'yellow', description: 'Stock is in a waiting zone' };
  return { status: 'Oversold', color: 'blue', description: 'Stock might be undervalued (risky)' };
}

/**
 * Detect Death Cross / Golden Cross
 * Death Cross: SMA20 crosses below SMA50 (bearish)
 * Golden Cross: SMA20 crosses above SMA50 (bullish)
 * @param {number} sma20 - 20-day Simple Moving Average
 * @param {number} sma50 - 50-day Simple Moving Average
 * @returns {object} - Cross status and trend strength
 */
function detectCrossover(sma20, sma50) {
  if (sma20 === null || sma50 === null) {
    return { deathCross: false, goldenCross: false, crossStatus: 'unknown', trendStrength: 0 };
  }

  const deathCross = sma20 < sma50;
  const goldenCross = sma20 > sma50;

  // Calculate trend strength as percentage difference
  const trendStrength = ((sma20 - sma50) / sma50) * 100;

  let crossStatus = 'neutral';
  if (goldenCross && trendStrength > 2) crossStatus = 'strong_bullish';
  else if (goldenCross) crossStatus = 'bullish';
  else if (deathCross && trendStrength < -2) crossStatus = 'strong_bearish';
  else if (deathCross) crossStatus = 'bearish';

  return {
    deathCross,
    goldenCross,
    crossStatus,
    trendStrength: parseFloat(trendStrength.toFixed(2))
  };
}

/**
 * Count consecutive down days (falling knife detection)
 * @param {number[]} closes - Array of closing prices
 * @returns {object} - Consecutive down days count and pattern info
 */
function detectFallingKnife(closes) {
  if (!closes || closes.length < 2) {
    return { consecutiveDownDays: 0, isFallingKnife: false, recentTrend: 'unknown' };
  }

  let downDays = 0;
  let upDays = 0;

  // Count consecutive down days from most recent
  for (let i = closes.length - 1; i > 0; i--) {
    if (closes[i] < closes[i - 1]) {
      downDays++;
    } else {
      break;
    }
  }

  // Count consecutive up days from most recent (if not down)
  if (downDays === 0) {
    for (let i = closes.length - 1; i > 0; i--) {
      if (closes[i] > closes[i - 1]) {
        upDays++;
      } else {
        break;
      }
    }
  }

  // Calculate 5-day momentum
  const fiveDayReturn = closes.length >= 5
    ? ((closes[closes.length - 1] - closes[closes.length - 5]) / closes[closes.length - 5]) * 100
    : 0;

  const isFallingKnife = downDays >= 3 || fiveDayReturn < -8;

  let recentTrend = 'neutral';
  if (upDays >= 3) recentTrend = 'strong_up';
  else if (upDays >= 1) recentTrend = 'up';
  else if (downDays >= 3) recentTrend = 'strong_down';
  else if (downDays >= 1) recentTrend = 'down';

  return {
    consecutiveDownDays: downDays,
    consecutiveUpDays: upDays,
    fiveDayReturn: parseFloat(fiveDayReturn.toFixed(2)),
    isFallingKnife,
    recentTrend
  };
}

/**
 * Check for extreme volatility conditions
 * @param {object} atrData - ATR calculation results
 * @param {number} price - Current price
 * @returns {object} - Volatility assessment
 */
function assessVolatility(atrData, price) {
  if (!atrData || !price) {
    return { isHighVolatility: false, volatilityLevel: 'unknown', riskMultiplier: 1 };
  }

  const dailyVolPercent = atrData.avgDailyRangePercent;

  let volatilityLevel = 'normal';
  let riskMultiplier = 1;
  let isHighVolatility = false;

  if (dailyVolPercent > 5) {
    volatilityLevel = 'extreme';
    riskMultiplier = 0.5; // Reduce position size
    isHighVolatility = true;
  } else if (dailyVolPercent > 3) {
    volatilityLevel = 'high';
    riskMultiplier = 0.75;
    isHighVolatility = true;
  } else if (dailyVolPercent > 2) {
    volatilityLevel = 'elevated';
    riskMultiplier = 0.9;
  } else if (dailyVolPercent < 1) {
    volatilityLevel = 'low';
    riskMultiplier = 1.1; // Can take slightly larger position
  }

  return {
    isHighVolatility,
    volatilityLevel,
    dailyVolPercent,
    riskMultiplier
  };
}

// =====================
// FALSE POSITIVE PREVENTION (Item 5)
// =====================

/**
 * Detect Bull Trap - Price crosses above SMA but lacks confirmation
 * Bull traps occur when price breaks above resistance/SMA but fails to sustain
 * @param {number} price - Current price
 * @param {number} sma20 - 20-day SMA
 * @param {number} sma50 - 50-day SMA
 * @param {number} rsi - Current RSI
 * @param {number} volumeRatio - Volume vs average
 * @param {number[]} closes - Array of closing prices
 * @returns {object} - Bull trap detection results
 */
function detectBullTrap(price, sma20, sma50, rsi, volumeRatio, closes) {
  if (!price || !sma50 || !closes || closes.length < 5) {
    return { isBullTrap: false, trapType: 'none', riskLevel: 'low' };
  }

  const warnings = [];
  let trapScore = 0;

  // Check 1: Price just barely above SMA50 (weak breakout)
  const distanceAboveSMA50 = ((price - sma50) / sma50) * 100;
  const justAboveSMA50 = distanceAboveSMA50 > 0 && distanceAboveSMA50 < 1;
  if (justAboveSMA50) {
    trapScore += 20;
    warnings.push('Price barely above SMA50');
  }

  // Check 2: Price crossed above SMA50 recently but RSI is weak
  const wasBelow5DaysAgo = closes.length >= 5 && closes[closes.length - 5] < sma50;
  const crossedRecently = wasBelow5DaysAgo && price > sma50;
  if (crossedRecently && rsi !== null && rsi < 55) {
    trapScore += 30;
    warnings.push('Recent SMA50 cross with weak RSI');
  }

  // Check 3: Low volume on breakout (no conviction)
  if (price > sma50 && volumeRatio < 0.9) {
    trapScore += 25;
    warnings.push('Breakout on below-average volume');
  }

  // Check 4: SMA20 still below SMA50 (weak underlying trend)
  if (sma20 !== null && sma20 < sma50 && price > sma50) {
    trapScore += 20;
    warnings.push('SMA20 still below SMA50');
  }

  // Check 5: Price touched SMA50 from above and bounced weakly
  const recentLow = Math.min(...closes.slice(-3));
  const touchedSMA50 = Math.abs(recentLow - sma50) / sma50 < 0.01; // Within 1% of SMA50
  if (touchedSMA50 && distanceAboveSMA50 < 2) {
    trapScore += 15;
    warnings.push('Weak bounce off SMA50');
  }

  const isBullTrap = trapScore >= 40;
  let trapType = 'none';
  let riskLevel = 'low';

  if (trapScore >= 60) {
    trapType = 'high_risk_trap';
    riskLevel = 'high';
  } else if (trapScore >= 40) {
    trapType = 'potential_trap';
    riskLevel = 'medium';
  } else if (trapScore >= 20) {
    trapType = 'weak_signal';
    riskLevel = 'low';
  }

  return {
    isBullTrap,
    trapScore,
    trapType,
    riskLevel,
    warnings,
    distanceAboveSMA50: parseFloat(distanceAboveSMA50.toFixed(2))
  };
}

/**
 * Detect Bearish RSI Divergence
 * Bearish divergence: Price making higher highs while RSI making lower highs
 * This often precedes price reversals
 * @param {number[]} closes - Array of closing prices
 * @param {number[]} highs - Array of high prices
 * @param {number} period - Lookback period (default 14)
 * @returns {object} - Divergence detection results
 */
function detectRSIDivergence(closes, highs, period = 14) {
  if (!closes || !highs || closes.length < period + 10) {
    return { hasBearishDivergence: false, divergenceStrength: 0, description: 'Insufficient data' };
  }

  // Calculate RSI values at different points
  const calculateRSIAtPoint = (priceArray, endIndex, rsiPeriod) => {
    if (endIndex < rsiPeriod + 1) return null;
    const slice = priceArray.slice(0, endIndex + 1);
    return calculateRSI(slice, rsiPeriod);
  };

  // Get RSI values at recent peak points
  const recentRSI = calculateRSI(closes, period);
  const midpointRSI = calculateRSIAtPoint(closes, closes.length - 5, period);
  const earlierRSI = calculateRSIAtPoint(closes, closes.length - 10, period);

  // Get price high points
  const recentHigh = Math.max(...highs.slice(-5));
  const earlierHigh = Math.max(...highs.slice(-15, -5));

  if (recentRSI === null || earlierRSI === null) {
    return { hasBearishDivergence: false, divergenceStrength: 0, description: 'Cannot calculate RSI' };
  }

  // Check for bearish divergence: Price higher high, RSI lower high
  const priceHigherHigh = recentHigh > earlierHigh;
  const rsiLowerHigh = recentRSI < earlierRSI;

  const hasBearishDivergence = priceHigherHigh && rsiLowerHigh && recentRSI > 50;

  // Calculate divergence strength
  let divergenceStrength = 0;
  if (hasBearishDivergence) {
    const priceDiff = ((recentHigh - earlierHigh) / earlierHigh) * 100;
    const rsiDiff = earlierRSI - recentRSI;
    divergenceStrength = Math.min(100, (priceDiff + rsiDiff) * 5);
  }

  let description = 'No divergence detected';
  if (hasBearishDivergence) {
    if (divergenceStrength > 50) {
      description = 'Strong bearish divergence - price up, RSI down';
    } else {
      description = 'Mild bearish divergence detected';
    }
  }

  return {
    hasBearishDivergence,
    divergenceStrength: parseFloat(divergenceStrength.toFixed(0)),
    recentRSI,
    earlierRSI,
    priceHigherHigh,
    rsiLowerHigh,
    description
  };
}

/**
 * Detect Price Extension - Stock has rallied too much too fast
 * Extended stocks are prone to pullbacks
 * @param {number} price - Current price
 * @param {number} sma50 - 50-day SMA
 * @param {number[]} closes - Array of closing prices
 * @returns {object} - Extension detection results
 */
function detectPriceExtension(price, sma50, closes) {
  if (!price || !sma50 || !closes || closes.length < 10) {
    return { isExtended: false, extensionType: 'normal', extensionPercent: 0 };
  }

  const warnings = [];

  // Check 1: Distance from SMA50
  const distanceFromSMA50 = ((price - sma50) / sma50) * 100;
  const farAboveSMA50 = distanceFromSMA50 > 8; // More than 8% above SMA50
  const veryFarAboveSMA50 = distanceFromSMA50 > 15; // More than 15% above SMA50

  // Check 2: 5-day rally
  const fiveDayReturn = closes.length >= 5
    ? ((price - closes[closes.length - 5]) / closes[closes.length - 5]) * 100
    : 0;
  const rapidRally = fiveDayReturn > 10; // More than 10% in 5 days

  // Check 3: 10-day rally
  const tenDayReturn = closes.length >= 10
    ? ((price - closes[closes.length - 10]) / closes[closes.length - 10]) * 100
    : 0;
  const extendedRally = tenDayReturn > 15; // More than 15% in 10 days

  if (veryFarAboveSMA50) {
    warnings.push(`${distanceFromSMA50.toFixed(1)}% above SMA50 - very extended`);
  } else if (farAboveSMA50) {
    warnings.push(`${distanceFromSMA50.toFixed(1)}% above SMA50 - extended`);
  }

  if (rapidRally) {
    warnings.push(`${fiveDayReturn.toFixed(1)}% rally in 5 days`);
  }

  if (extendedRally) {
    warnings.push(`${tenDayReturn.toFixed(1)}% rally in 10 days`);
  }

  const isExtended = veryFarAboveSMA50 || (farAboveSMA50 && rapidRally) || extendedRally;

  let extensionType = 'normal';
  if (veryFarAboveSMA50 && rapidRally) {
    extensionType = 'extreme_extension';
  } else if (veryFarAboveSMA50 || (farAboveSMA50 && rapidRally)) {
    extensionType = 'significant_extension';
  } else if (farAboveSMA50 || rapidRally) {
    extensionType = 'mild_extension';
  }

  return {
    isExtended,
    extensionType,
    extensionPercent: parseFloat(distanceFromSMA50.toFixed(2)),
    fiveDayReturn: parseFloat(fiveDayReturn.toFixed(2)),
    tenDayReturn: parseFloat(tenDayReturn.toFixed(2)),
    warnings
  };
}

/**
 * Detect Overbought Extremes
 * RSI > 75 is extremely overbought and likely to pull back
 * @param {number} rsi - Current RSI value
 * @returns {object} - Overbought detection results
 */
function detectOverboughtExtreme(rsi) {
  if (rsi === null) {
    return { isOverboughtExtreme: false, severity: 'none', pullbackRisk: 'unknown' };
  }

  let severity = 'none';
  let pullbackRisk = 'low';
  let isOverboughtExtreme = false;

  if (rsi >= 85) {
    severity = 'extreme';
    pullbackRisk = 'very_high';
    isOverboughtExtreme = true;
  } else if (rsi >= 80) {
    severity = 'severe';
    pullbackRisk = 'high';
    isOverboughtExtreme = true;
  } else if (rsi >= 75) {
    severity = 'elevated';
    pullbackRisk = 'moderate';
    isOverboughtExtreme = true;
  } else if (rsi >= 70) {
    severity = 'mild';
    pullbackRisk = 'low';
  }

  return {
    isOverboughtExtreme,
    severity,
    pullbackRisk,
    rsi,
    description: isOverboughtExtreme
      ? `RSI ${rsi} - ${severity} overbought, ${pullbackRisk} pullback risk`
      : rsi >= 70 ? `RSI ${rsi} - approaching overbought` : 'Normal RSI levels'
  };
}

/**
 * Detect Weak Breakout - Breakout on low volume often fails
 * @param {number} price - Current price
 * @param {number} sma50 - 50-day SMA
 * @param {number} volumeRatio - Current volume vs average
 * @param {number[]} closes - Array of closing prices
 * @returns {object} - Weak breakout detection results
 */
function detectWeakBreakout(price, sma50, volumeRatio, closes) {
  if (!price || !sma50 || !closes || closes.length < 5) {
    return { isWeakBreakout: false, breakoutQuality: 'unknown' };
  }

  // Check if this is a breakout (price recently crossed above SMA50)
  const wasBelow = closes.slice(-5, -1).some(c => c < sma50);
  const isAboveNow = price > sma50;
  const isBreakout = wasBelow && isAboveNow;

  if (!isBreakout) {
    return { isWeakBreakout: false, breakoutQuality: 'no_breakout' };
  }

  // Assess breakout quality
  const distanceAboveSMA50 = ((price - sma50) / sma50) * 100;

  let breakoutQuality = 'strong';
  let isWeakBreakout = false;
  const warnings = [];

  // Low volume breakout
  if (volumeRatio < 0.8) {
    breakoutQuality = 'very_weak';
    isWeakBreakout = true;
    warnings.push('Very low volume on breakout');
  } else if (volumeRatio < 1.0) {
    breakoutQuality = 'weak';
    isWeakBreakout = true;
    warnings.push('Below-average volume on breakout');
  } else if (volumeRatio < 1.2) {
    breakoutQuality = 'moderate';
    warnings.push('Average volume - ideally want 1.2x+ for strong breakout');
  }

  // Barely clearing resistance
  if (distanceAboveSMA50 < 1) {
    if (breakoutQuality !== 'very_weak') {
      breakoutQuality = isWeakBreakout ? breakoutQuality : 'questionable';
    }
    isWeakBreakout = true;
    warnings.push('Price barely above SMA50');
  }

  return {
    isWeakBreakout,
    breakoutQuality,
    volumeRatio,
    distanceAboveSMA50: parseFloat(distanceAboveSMA50.toFixed(2)),
    warnings
  };
}

/**
 * Check for System vs Analyst Divergence
 * Warn when our technical signals diverge from analyst consensus
 * @param {string} verdict - Our system's verdict (BUY_NOW, WATCH, etc.)
 * @param {object} analystData - Analyst ratings from Finnhub
 * @returns {object} - Divergence check results
 */
function checkAnalystDivergence(verdict, analystData) {
  if (!analystData || !analystData.consensus) {
    return { hasDivergence: false, divergenceType: 'no_data', warning: null };
  }

  const systemBullish = verdict === 'BUY_NOW';
  const systemBearish = verdict === 'AVOID';

  const analystBullish = ['Strong Buy', 'Buy'].includes(analystData.consensus);
  const analystBearish = ['Strong Sell', 'Sell'].includes(analystData.consensus);
  const analystNeutral = analystData.consensus === 'Hold';

  let hasDivergence = false;
  let divergenceType = 'aligned';
  let warning = null;

  // System says buy but analysts say sell
  if (systemBullish && analystBearish) {
    hasDivergence = true;
    divergenceType = 'system_bullish_analysts_bearish';
    warning = `Technical signals bullish but ${analystData.total} analysts rate ${analystData.consensus}`;
  }
  // System says buy but analysts are neutral/cautious
  else if (systemBullish && analystNeutral) {
    divergenceType = 'system_bullish_analysts_neutral';
    warning = `Technical bullish but analysts are neutral (${analystData.total} analysts)`;
  }
  // System says avoid but analysts say buy (we're being more cautious - this is OK)
  else if (systemBearish && analystBullish) {
    divergenceType = 'system_cautious';
    // No warning needed - we're being prudent
  }

  return {
    hasDivergence,
    divergenceType,
    warning,
    systemVerdict: verdict,
    analystConsensus: analystData.consensus,
    analystScore: analystData.consensusScore
  };
}

/**
 * Calculate Average True Range (ATR) approximation
 * Uses average daily range as percentage over the specified period
 * @param {number[]} highs - Array of high prices
 * @param {number[]} lows - Array of low prices
 * @param {number[]} closes - Array of closing prices
 * @param {number} period - Number of periods (default 14)
 * @returns {object} - ATR data including volatility factor
 */
function calculateATR(highs, lows, closes, period = 14) {
  if (!highs || !lows || !closes || highs.length < period + 1) {
    return null;
  }

  // Calculate True Range for each day
  const trueRanges = [];
  for (let i = 1; i < highs.length; i++) {
    const high = highs[i];
    const low = lows[i];
    const prevClose = closes[i - 1];

    // True Range = max(high - low, |high - prevClose|, |low - prevClose|)
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }

  // Calculate ATR (simple moving average of True Range)
  const recentTRs = trueRanges.slice(-period);
  const atr = recentTRs.reduce((sum, tr) => sum + tr, 0) / recentTRs.length;

  // Current price (latest close)
  const currentPrice = closes[closes.length - 1];

  // Volatility factor as percentage of price
  const volatilityPercent = (atr / currentPrice) * 100;

  // Average daily range percentage (alternative calculation)
  const dailyRanges = [];
  for (let i = highs.length - period; i < highs.length; i++) {
    const range = ((highs[i] - lows[i]) / closes[i]) * 100;
    dailyRanges.push(range);
  }
  const avgDailyRangePercent = dailyRanges.reduce((sum, r) => sum + r, 0) / dailyRanges.length;

  return {
    atr: parseFloat(atr.toFixed(2)),
    volatilityPercent: parseFloat(volatilityPercent.toFixed(2)),
    avgDailyRangePercent: parseFloat(avgDailyRangePercent.toFixed(2)),
    period
  };
}

/**
 * Calculate dynamic stop loss and take profit based on ATR
 * @param {number} entryPrice - Current/entry price
 * @param {object} atrData - ATR calculation results
 * @param {number} riskMultiplier - Multiplier for ATR to set stop loss (default 1.5)
 * @param {number} rewardRatio - Risk:Reward ratio (default 2 for 1:2)
 * @returns {object} - Strategy with stop loss, target, and ratios
 */
function calculateDynamicStrategy(entryPrice, atrData, riskMultiplier = 1.5, rewardRatio = 2) {
  if (!atrData || !entryPrice) {
    // Fallback to fixed percentages if no ATR data
    const stopLoss = entryPrice * 0.96; // -4%
    const target = entryPrice * 1.08;   // +8%
    return {
      stopLoss: parseFloat(stopLoss.toFixed(2)),
      target: parseFloat(target.toFixed(2)),
      stopLossPercent: -4,
      targetPercent: 8,
      riskRatio: '1:2.0',
      volatilityBased: false,
      volatilityPercent: null
    };
  }

  // Calculate stop loss based on ATR
  // Stop Loss = Entry - (ATR * riskMultiplier)
  const stopLossDistance = atrData.atr * riskMultiplier;
  const stopLoss = entryPrice - stopLossDistance;
  const stopLossPercent = ((stopLoss - entryPrice) / entryPrice) * 100;

  // Calculate take profit for desired risk:reward ratio
  // Target = Entry + (StopLossDistance * rewardRatio)
  const targetDistance = stopLossDistance * rewardRatio;
  const target = entryPrice + targetDistance;
  const targetPercent = ((target - entryPrice) / entryPrice) * 100;

  return {
    stopLoss: parseFloat(stopLoss.toFixed(2)),
    target: parseFloat(target.toFixed(2)),
    stopLossPercent: parseFloat(stopLossPercent.toFixed(2)),
    targetPercent: parseFloat(targetPercent.toFixed(2)),
    riskRatio: `1:${rewardRatio.toFixed(1)}`,
    volatilityBased: true,
    volatilityPercent: atrData.avgDailyRangePercent,
    atr: atrData.atr
  };
}

// =====================
// FINNHUB ANALYST DATA
// =====================

/**
 * Fetch analyst recommendations from Finnhub
 * Returns: strongBuy, buy, hold, sell, strongSell counts and consensus
 */
async function fetchAnalystRatings(symbol) {
  const upperSymbol = symbol.toUpperCase();

  // Check cache first
  const cached = analystCache.get(upperSymbol);
  if (cached && Date.now() - cached.timestamp < ANALYST_CACHE_TTL) {
    return cached.data;
  }

  try {
    // Fetch recommendation trends (rate limited)
    const recResponse = await finnhubRateLimitedFetch(
      `${FINNHUB_BASE_URL}/stock/recommendation?symbol=${upperSymbol}&token=${FINNHUB_API_KEY}`
    );

    if (!recResponse.ok) {
      throw new Error(`Finnhub API error: ${recResponse.status}`);
    }

    const recommendations = await recResponse.json();

    // Fetch price target (rate limited)
    const targetResponse = await finnhubRateLimitedFetch(
      `${FINNHUB_BASE_URL}/stock/price-target?symbol=${upperSymbol}&token=${FINNHUB_API_KEY}`
    );

    let priceTarget = null;
    if (targetResponse.ok) {
      priceTarget = await targetResponse.json();
    }

    // Get most recent recommendation (first in array)
    const latestRec = recommendations && recommendations.length > 0 ? recommendations[0] : null;

    if (!latestRec) {
      console.log(`[${upperSymbol}] No analyst data available`);
      return null;
    }

    // Calculate consensus rating
    const total = latestRec.strongBuy + latestRec.buy + latestRec.hold + latestRec.sell + latestRec.strongSell;
    let consensus = 'Hold';
    let consensusScore = 0;

    if (total > 0) {
      // Weighted score: Strong Buy=5, Buy=4, Hold=3, Sell=2, Strong Sell=1
      consensusScore = (
        (latestRec.strongBuy * 5) +
        (latestRec.buy * 4) +
        (latestRec.hold * 3) +
        (latestRec.sell * 2) +
        (latestRec.strongSell * 1)
      ) / total;

      if (consensusScore >= 4.5) consensus = 'Strong Buy';
      else if (consensusScore >= 3.5) consensus = 'Buy';
      else if (consensusScore >= 2.5) consensus = 'Hold';
      else if (consensusScore >= 1.5) consensus = 'Sell';
      else consensus = 'Strong Sell';
    }

    const result = {
      strongBuy: latestRec.strongBuy || 0,
      buy: latestRec.buy || 0,
      hold: latestRec.hold || 0,
      sell: latestRec.sell || 0,
      strongSell: latestRec.strongSell || 0,
      total,
      consensus,
      consensusScore: parseFloat(consensusScore.toFixed(2)),
      period: latestRec.period,
      targetHigh: priceTarget?.targetHigh || null,
      targetLow: priceTarget?.targetLow || null,
      targetMean: priceTarget?.targetMean || null,
      targetMedian: priceTarget?.targetMedian || null,
      lastUpdated: priceTarget?.lastUpdated || latestRec.period
    };

    console.log(`[${upperSymbol}] 📊 Analyst: ${consensus} (${total} analysts), Target: $${result.targetMean?.toFixed(2) || 'N/A'}`);

    // Cache the result
    analystCache.set(upperSymbol, { data: result, timestamp: Date.now() });
    return result;

  } catch (error) {
    console.error(`[${upperSymbol}] Finnhub error:`, error.message);
    return null;
  }
}

/**
 * Fetch company profile from Finnhub
 * Returns: name, description, sector, industry, market cap, etc.
 */
async function fetchCompanyProfile(symbol) {
  const upperSymbol = symbol.toUpperCase();

  // Check cache first
  const cached = companyProfileCache.get(upperSymbol);
  if (cached && Date.now() - cached.timestamp < COMPANY_PROFILE_CACHE_TTL) {
    return cached.data;
  }

  try {
    const response = await finnhubRateLimitedFetch(
      `${FINNHUB_BASE_URL}/stock/profile2?symbol=${upperSymbol}&token=${FINNHUB_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    const profile = await response.json();

    if (!profile || !profile.name) {
      console.log(`[${upperSymbol}] No company profile available`);
      return null;
    }

    const result = {
      name: profile.name,
      description: profile.description || null,
      sector: profile.finnhubIndustry || null,
      industry: profile.finnhubIndustry || null,
      marketCap: profile.marketCapitalization || null, // In millions
      country: profile.country || null,
      exchange: profile.exchange || null,
      ipo: profile.ipo || null,
      logo: profile.logo || null,
      weburl: profile.weburl || null,
      ticker: profile.ticker || upperSymbol
    };

    // Cache the result
    companyProfileCache.set(upperSymbol, { data: result, timestamp: Date.now() });
    return result;

  } catch (error) {
    console.error(`[${upperSymbol}] Company profile error:`, error.message);
    return null;
  }
}

/**
 * Fetch company news from Finnhub
 * Returns: array of news items with headline, date, source, url
 */
async function fetchCompanyNews(symbol, limit = 3) {
  const upperSymbol = symbol.toUpperCase();

  // Check cache first
  const cached = companyNewsCache.get(upperSymbol);
  if (cached && Date.now() - cached.timestamp < COMPANY_NEWS_CACHE_TTL) {
    return cached.data;
  }

  try {
    // Get news from the last 7 days
    const toDate = new Date().toISOString().split('T')[0];
    const fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const response = await finnhubRateLimitedFetch(
      `${FINNHUB_BASE_URL}/company-news?symbol=${upperSymbol}&from=${fromDate}&to=${toDate}&token=${FINNHUB_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    const news = await response.json();

    if (!Array.isArray(news) || news.length === 0) {
      console.log(`[${upperSymbol}] No recent news available`);
      return [];
    }

    // Take only the most recent items
    const result = news.slice(0, limit).map(item => ({
      headline: item.headline,
      summary: item.summary || null,
      source: item.source,
      url: item.url,
      datetime: item.datetime, // Unix timestamp
      image: item.image || null
    }));

    // Cache the result
    companyNewsCache.set(upperSymbol, { data: result, timestamp: Date.now() });
    return result;

  } catch (error) {
    console.error(`[${upperSymbol}] Company news error:`, error.message);
    return [];
  }
}

/**
 * Fetch earnings calendar from Finnhub
 * Returns: nextEarningsDate, daysUntilEarnings, earningsRisk
 */
async function fetchEarningsCalendar(symbol) {
  const upperSymbol = symbol.toUpperCase();

  // Check cache first
  const cached = earningsCache.get(upperSymbol);
  if (cached && Date.now() - cached.timestamp < EARNINGS_CACHE_TTL) {
    return cached.data;
  }

  try {
    // Get earnings calendar for the next 60 days
    const fromDate = new Date().toISOString().split('T')[0];
    const toDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const response = await finnhubRateLimitedFetch(
      `${FINNHUB_BASE_URL}/calendar/earnings?symbol=${upperSymbol}&from=${fromDate}&to=${toDate}&token=${FINNHUB_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    const data = await response.json();

    // Find the next earnings date for this symbol
    let nextEarningsDate = null;
    let daysUntilEarnings = null;
    let earningsRisk = 'none'; // none, low, medium, high

    if (data.earningsCalendar && data.earningsCalendar.length > 0) {
      // Sort by date and find the next upcoming earnings
      const upcoming = data.earningsCalendar
        .filter(e => e.symbol === upperSymbol && new Date(e.date) >= new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      if (upcoming.length > 0) {
        nextEarningsDate = upcoming[0].date;
        const earningsDateObj = new Date(nextEarningsDate);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        earningsDateObj.setHours(0, 0, 0, 0);

        daysUntilEarnings = Math.ceil((earningsDateObj - now) / (1000 * 60 * 60 * 24));

        // Determine risk level
        if (daysUntilEarnings <= 2) {
          earningsRisk = 'critical'; // Within 48 hours - hard block
        } else if (daysUntilEarnings <= 7) {
          earningsRisk = 'high'; // Within 7 days - penalty
        } else if (daysUntilEarnings <= 14) {
          earningsRisk = 'medium';
        } else {
          earningsRisk = 'low';
        }
      }
    }

    const result = {
      nextEarningsDate,
      daysUntilEarnings,
      earningsRisk,
      hasUpcomingEarnings: daysUntilEarnings !== null && daysUntilEarnings <= 14
    };

    // Cache the result
    earningsCache.set(upperSymbol, { data: result, timestamp: Date.now() });
    console.log(`[${upperSymbol}] Earnings: ${nextEarningsDate || 'None found'} (${daysUntilEarnings || 'N/A'} days, Risk: ${earningsRisk})`);
    return result;

  } catch (error) {
    console.error(`[${upperSymbol}] Earnings calendar error:`, error.message);
    // Return safe default on error
    return {
      nextEarningsDate: null,
      daysUntilEarnings: null,
      earningsRisk: 'unknown',
      hasUpcomingEarnings: false
    };
  }
}

/**
 * Get combined company info (profile + news)
 * Exported function for API use
 */
export async function getCompanyInfo(symbol) {
  const upperSymbol = symbol.toUpperCase();

  // Fetch profile and news in parallel
  const [profile, news] = await Promise.all([
    fetchCompanyProfile(upperSymbol),
    fetchCompanyNews(upperSymbol, 3)
  ]);

  return {
    symbol: upperSymbol,
    profile,
    news
  };
}

// =====================
// ALPACA DATA FETCHING
// =====================

/**
 * Fetch quote for a symbol using Alpaca historical bars
 * (Free tier doesn't support real-time trades, so we use most recent daily bar)
 */
export async function getQuote(symbol, useCache = true) {
  const upperSymbol = symbol.toUpperCase();

  if (useCache) {
    const cached = quoteCache.get(upperSymbol);
    const cacheTTL = getQuoteCacheTTL();
    // When market is closed, cache never expires (Infinity)
    // When market is open, cache expires after 60 seconds
    if (cached && (cacheTTL === Infinity || Date.now() - cached.timestamp < cacheTTL)) {
      return { ...cached.data, fromCache: true };
    }
  }

  try {
    // Get recent bars to find latest price and previous close
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 1); // Include today
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 5);

    const barsIter = alpaca.getBarsV2(upperSymbol, {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
      timeframe: '1Day',
      feed: 'iex'
      // No limit - get all bars in range
    });

    const bars = [];
    for await (const bar of barsIter) {
      bars.push(bar);
    }

    if (bars.length < 1) {
      throw new Error('No bar data available');
    }

    // Latest bar is the most recent trading day
    const latestBar = bars[bars.length - 1];
    const prevBar = bars.length > 1 ? bars[bars.length - 2] : latestBar;

    const price = latestBar.ClosePrice;
    const prevClose = prevBar.ClosePrice;
    const change = price - prevClose;
    const changePercent = (change / prevClose) * 100;

    // Use fetch time for staleness checks (to track when we last refreshed)
    // Store bar timestamp separately for reference
    const fetchTimestamp = Date.now();
    const barTimestamp = latestBar.Timestamp ? new Date(latestBar.Timestamp).getTime() : fetchTimestamp;

    const result = {
      symbol: upperSymbol,
      price: price,
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume: latestBar.Volume || 0,
      avgVolume: null,
      high: latestBar.HighPrice || price,
      low: latestBar.LowPrice || price,
      open: latestBar.OpenPrice || price,
      previousClose: prevClose,
      vwap: latestBar.VWAP || price,
      name: upperSymbol,
      sector: SECTOR_MAP[upperSymbol] || 'Unknown',
      timestamp: fetchTimestamp,  // Use fetch time for staleness checks
      dataDate: latestBar.Timestamp,  // Store the actual bar date for reference
      barTimestamp: barTimestamp,  // Preserve the actual bar timestamp
      isLive: isMarketOpen().isOpen,  // Only "live" if market is actually open
      source: 'Alpaca'
    };

    // Cache with fetch timestamp for proper staleness tracking
    quoteCache.set(upperSymbol, { data: result, timestamp: fetchTimestamp });
    console.log(`[${upperSymbol}] ✅ $${price.toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`);
    return result;

  } catch (error) {
    console.error(`[${upperSymbol}] Alpaca quote error:`, error.message);

    // Return cached data if available
    const cached = quoteCache.get(upperSymbol);
    if (cached) {
      return { ...cached.data, fromCache: true, stale: true };
    }

    return null;
  }
}

/**
 * Get fresh quote (bypass cache)
 */
export async function getFreshQuote(symbol) {
  return getQuote(symbol, false);
}

/**
 * Get quotes for multiple symbols
 */
export async function getQuotes(symbols) {
  const results = [];

  // Fetch quotes individually (more reliable with IEX feed)
  for (const symbol of symbols) {
    const quote = await getQuote(symbol);
    if (quote) results.push(quote);
  }

  return results;
}

/**
 * Fetch historical bars from Alpaca (6 months of daily data)
 */
async function fetchHistoricalData(symbol) {
  const upperSymbol = symbol.toUpperCase();

  // Check cache first (never expire when market is closed)
  const cached = historicalCache.get(upperSymbol);
  const historicalCacheTTL = isMarketOpen().isOpen ? HISTORICAL_CACHE_TTL_MARKET_OPEN : HISTORICAL_CACHE_TTL_MARKET_CLOSED;
  if (cached && (historicalCacheTTL === Infinity || Date.now() - cached.timestamp < historicalCacheTTL)) {
    console.log(`[${upperSymbol}] Using cached historical data`);
    return cached.data;
  }

  try {
    // Calculate date range: 6 months ago to today
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);

    console.log(`[${upperSymbol}] Fetching Alpaca historical data (6 months daily)...`);

    const bars = alpaca.getBarsV2(
      upperSymbol,
      {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        timeframe: '1Day',
        limit: 200,
        feed: 'iex'
      }
    );

    const barArray = [];
    for await (const bar of bars) {
      barArray.push(bar);
    }

    if (barArray.length < 20) {
      throw new Error(`Insufficient data: only ${barArray.length} bars`);
    }

    const data = {
      closes: barArray.map(b => b.ClosePrice),
      volumes: barArray.map(b => b.Volume),
      highs: barArray.map(b => b.HighPrice),
      lows: barArray.map(b => b.LowPrice),
      dates: barArray.map(b => new Date(b.Timestamp)),
      dataPoints: barArray.length,
      startDate: barArray[0]?.Timestamp,
      endDate: barArray[barArray.length - 1]?.Timestamp,
      isReal: true,
      source: 'Alpaca'
    };

    console.log(`[${upperSymbol}] ✅ Fetched ${data.dataPoints} daily bars from Alpaca`);

    // Cache the result
    historicalCache.set(upperSymbol, { data, timestamp: Date.now() });
    return data;

  } catch (error) {
    console.error(`[${upperSymbol}] Alpaca historical error:`, error.message);

    // Return cached data if available (even if stale)
    if (cached) {
      console.log(`[${upperSymbol}] Using stale cached data`);
      return { ...cached.data, isStale: true };
    }

    return null;
  }
}

// =====================
// BATTLE PLAN GENERATOR
// =====================

function generateBattlePlan(analysis) {
  const price = analysis.price;
  const rsi = analysis.rsi;
  const volumeRatio = analysis.volumeRatio;
  const distanceFrom52WeekHigh = analysis.distanceFrom52WeekHigh;
  const passesAllFilters = analysis.passesAllFilters;
  const filterResults = analysis.filterResults;
  const hasRealData = analysis.hasRealData;
  const isStaleData = analysis.isStaleData;
  const atrData = analysis.atrData;

  // Extract enhanced safety indicators (Item 2)
  const crossoverData = analysis.crossoverData || { deathCross: false, goldenCross: false };
  const fallingKnifeData = analysis.fallingKnifeData || { isFallingKnife: false, consecutiveDownDays: 0 };
  const volatilityData = analysis.volatilityData || { isHighVolatility: false, volatilityLevel: 'normal' };

  // FALSE POSITIVE DETECTION DATA (Item 5)
  const bullTrapData = analysis.bullTrapData || { isBullTrap: false, trapType: 'none' };
  const divergenceData = analysis.divergenceData || { hasBearishDivergence: false };
  const extensionData = analysis.extensionData || { isExtended: false };
  const overboughtData = analysis.overboughtData || { isOverboughtExtreme: false };
  const weakBreakoutData = analysis.weakBreakoutData || { isWeakBreakout: false };
  const analystData = analysis.analystData || null;

  // EARNINGS DATA - Critical for risk management
  const earningsData = analysis.earningsData || {
    nextEarningsDate: null,
    daysUntilEarnings: null,
    earningsRisk: 'unknown',
    hasUpcomingEarnings: false
  };

  // Calculate entry zone (±1% from current price)
  const entryLow = parseFloat((price * 0.99).toFixed(2));
  const entryHigh = parseFloat((price * 1.01).toFixed(2));

  // Calculate DYNAMIC stop loss and take profit based on ATR volatility
  // Widen stops for high volatility stocks
  const riskMultiplier = volatilityData.isHighVolatility ? 2.0 : 1.5;
  const strategy = calculateDynamicStrategy(price, atrData, riskMultiplier, 2);

  // Use dynamic values
  const stopLoss = strategy.stopLoss;
  const profitTarget = strategy.target;

  const profitPerShare = parseFloat((profitTarget - price).toFixed(2));
  const lossPerShare = parseFloat((price - stopLoss).toFixed(2));
  const riskRewardRatio = lossPerShare > 0 ? parseFloat((profitPerShare / lossPerShare).toFixed(1)) : 2;

  let verdict = 'WATCH';
  let confidence = 'Low';
  let confidenceScore = 0;
  let reasoning = '';
  const warnings = [];

  // =====================
  // CONFIDENCE SCORING (Enhanced)
  // =====================

  // Base score from filter criteria
  if (filterResults.trendFilter) confidenceScore += 20;
  if (filterResults.momentumFilter) confidenceScore += 25;
  if (filterResults.volumeFilter) confidenceScore += 15;
  if (filterResults.priceFilter) confidenceScore += 5;
  if (filterResults.safetyFilter) confidenceScore += 15;
  if (filterResults.falsePositiveFilter) confidenceScore += 10; // Bonus for clean signal (Item 5)

  // PENALTIES for risky conditions
  if (!hasRealData) {
    confidenceScore -= 30;
    warnings.push('No real-time data available');
  }
  if (isStaleData) {
    confidenceScore -= 25;
    warnings.push('Data may be stale');
  }
  if (crossoverData.deathCross) {
    confidenceScore -= 40; // Heavy penalty for death cross
    warnings.push('DEATH CROSS: SMA20 below SMA50');
  }
  if (fallingKnifeData.isFallingKnife) {
    confidenceScore -= 35;
    warnings.push(`FALLING KNIFE: ${fallingKnifeData.consecutiveDownDays} consecutive down days`);
  }
  if (fallingKnifeData.consecutiveDownDays >= 2 && fallingKnifeData.consecutiveDownDays < 3) {
    confidenceScore -= 15;
    warnings.push('2 consecutive down days');
  }
  if (volatilityData.isHighVolatility) {
    confidenceScore -= 15;
    warnings.push(`HIGH VOLATILITY: ${volatilityData.volatilityLevel} (${volatilityData.dailyVolPercent?.toFixed(1)}% daily range)`);
  }
  if (rsi !== null && rsi > 65) {
    confidenceScore -= 10; // Approaching overbought
  }
  if (rsi !== null && rsi < 40) {
    confidenceScore -= 10; // Weak momentum
  }

  // =====================
  // FALSE POSITIVE PENALTIES (Item 5)
  // =====================

  // Bull Trap penalty
  if (bullTrapData.isBullTrap) {
    if (bullTrapData.riskLevel === 'high') {
      confidenceScore -= 35;
      warnings.push(`BULL TRAP (HIGH RISK): ${bullTrapData.warnings.join(', ')}`);
    } else {
      confidenceScore -= 25;
      warnings.push(`BULL TRAP: ${bullTrapData.warnings.join(', ')}`);
    }
  }

  // Bearish RSI Divergence penalty
  if (divergenceData.hasBearishDivergence) {
    const penalty = divergenceData.divergenceStrength > 50 ? 30 : 20;
    confidenceScore -= penalty;
    warnings.push(`BEARISH DIVERGENCE: ${divergenceData.description}`);
  }

  // Price Extension penalty
  if (extensionData.isExtended) {
    if (extensionData.extensionType === 'extreme_extension') {
      confidenceScore -= 40;
      warnings.push(`EXTREME EXTENSION: ${extensionData.warnings.join(', ')}`);
    } else if (extensionData.extensionType === 'significant_extension') {
      confidenceScore -= 25;
      warnings.push(`PRICE EXTENDED: ${extensionData.warnings.join(', ')}`);
    } else {
      confidenceScore -= 15;
      warnings.push(`MILDLY EXTENDED: ${extensionData.extensionPercent}% above SMA50`);
    }
  }

  // Overbought Extreme penalty
  if (overboughtData.isOverboughtExtreme) {
    if (overboughtData.severity === 'extreme') {
      confidenceScore -= 35;
      warnings.push(`EXTREME OVERBOUGHT: RSI ${overboughtData.rsi} - very high pullback risk`);
    } else if (overboughtData.severity === 'severe') {
      confidenceScore -= 25;
      warnings.push(`SEVERELY OVERBOUGHT: RSI ${overboughtData.rsi}`);
    } else {
      confidenceScore -= 15;
      warnings.push(`OVERBOUGHT: RSI ${overboughtData.rsi}`);
    }
  }

  // Weak Breakout penalty
  if (weakBreakoutData.isWeakBreakout) {
    if (weakBreakoutData.breakoutQuality === 'very_weak') {
      confidenceScore -= 30;
      warnings.push(`VERY WEAK BREAKOUT: ${weakBreakoutData.warnings.join(', ')}`);
    } else {
      confidenceScore -= 20;
      warnings.push(`WEAK BREAKOUT: ${weakBreakoutData.warnings.join(', ')}`);
    }
  }

  // Check Analyst Divergence (informational, lighter penalty)
  const analystDivergence = checkAnalystDivergence('BUY_NOW', analystData);
  if (analystDivergence.hasDivergence) {
    confidenceScore -= 15;
    warnings.push(analystDivergence.warning);
  }

  // EARNINGS RISK PENALTY
  // Critical: earnings within 48h is a hard block (handled in verdict section)
  // High: earnings within 7 days gets -25 penalty
  if (earningsData.earningsRisk === 'high') {
    confidenceScore -= 25;
    warnings.push(`EARNINGS SOON: ${earningsData.daysUntilEarnings} days until earnings (${earningsData.nextEarningsDate})`);
  } else if (earningsData.earningsRisk === 'medium') {
    confidenceScore -= 10;
    warnings.push(`Earnings in ${earningsData.daysUntilEarnings} days (${earningsData.nextEarningsDate})`);
  }

  // BONUSES for strong conditions
  if (crossoverData.goldenCross && crossoverData.trendStrength > 2) {
    confidenceScore += 15; // Strong golden cross
  }
  if (rsi !== null && rsi >= 55 && rsi <= 65) {
    confidenceScore += 10; // Sweet spot RSI
  }
  if (volumeRatio >= 1.3) {
    confidenceScore += 10; // Strong volume confirmation
  }
  if (fallingKnifeData.consecutiveUpDays >= 2) {
    confidenceScore += 5; // Positive momentum
  }

  // =====================
  // VERDICT DETERMINATION (Enhanced)
  // =====================

  // Priority 1: Data quality issues
  if (!hasRealData || isStaleData) {
    verdict = 'WATCH';
    reasoning = isStaleData
      ? 'Data may be stale. Wait for fresh market data before making decisions.'
      : 'Waiting for market data. Analysis will be available when market is open.';
  }
  // Priority 1.5: EARNINGS HARD BLOCK - within 48 hours
  else if (earningsData.earningsRisk === 'critical') {
    verdict = 'AVOID';
    reasoning = `⚠️ EARNINGS RISK: Earnings report in ${earningsData.daysUntilEarnings} days (${earningsData.nextEarningsDate}). Avoid new positions within 48 hours of earnings due to high volatility risk.`;
    warnings.push(`CRITICAL: Earnings in ${earningsData.daysUntilEarnings <= 1 ? 'less than 24 hours' : earningsData.daysUntilEarnings + ' days'}`);
  }
  // Priority 2: Dangerous patterns (AVOID)
  else if (crossoverData.deathCross) {
    verdict = 'AVOID';
    reasoning = `DEATH CROSS detected: SMA20 ($${analysis.sma20?.toFixed(2)}) is below SMA50 ($${analysis.sma50?.toFixed(2)}). This bearish signal suggests waiting for trend reversal.`;
  }
  else if (fallingKnifeData.isFallingKnife) {
    verdict = 'AVOID';
    reasoning = `FALLING KNIFE: ${fallingKnifeData.consecutiveDownDays} consecutive down days with ${fallingKnifeData.fiveDayReturn?.toFixed(1)}% 5-day return. Do not catch falling knives.`;
  }
  else if (!filterResults.trendFilter) {
    verdict = 'AVOID';
    reasoning = `Below SMA50 indicates downtrend. Wait for price to reclaim the 50-day average.`;
  }
  else if (!filterResults.priceFilter) {
    verdict = 'AVOID';
    reasoning = `Price below $10 - higher volatility and manipulation risk.`;
  }
  // Priority 2.5: FALSE POSITIVE PREVENTION (Item 5)
  else if (overboughtData.isOverboughtExtreme && overboughtData.severity === 'extreme') {
    verdict = 'WAIT_FOR_DIP';
    reasoning = `EXTREME OVERBOUGHT: RSI at ${overboughtData.rsi}. Very high probability of pullback. Wait for RSI to drop below 70.`;
  }
  else if (extensionData.isExtended && extensionData.extensionType === 'extreme_extension') {
    verdict = 'WAIT_FOR_DIP';
    reasoning = `EXTREMELY EXTENDED: ${extensionData.extensionPercent}% above SMA50 with ${extensionData.fiveDayReturn}% 5-day gain. High reversion risk. Wait for consolidation.`;
  }
  else if (bullTrapData.isBullTrap && bullTrapData.riskLevel === 'high') {
    verdict = 'WATCH';
    reasoning = `HIGH-RISK BULL TRAP detected: ${bullTrapData.warnings.join('. ')}. Wait for stronger breakout confirmation.`;
  }
  else if (divergenceData.hasBearishDivergence && divergenceData.divergenceStrength > 50) {
    verdict = 'WATCH';
    reasoning = `STRONG BEARISH DIVERGENCE: Price making higher highs but RSI declining (${divergenceData.earlierRSI} → ${divergenceData.recentRSI}). This often precedes reversals.`;
  }
  // Priority 3: Conditional signals
  else if (passesAllFilters && confidenceScore >= 60) {
    verdict = 'BUY_NOW';
    reasoning = `Strong setup: ${crossoverData.goldenCross ? 'Golden Cross confirmed, ' : ''}Price above SMA50, RSI at ${rsi} (healthy momentum), volume ${(volumeRatio * 100).toFixed(0)}% of average.`;
    if (volatilityData.isHighVolatility) {
      reasoning += ` Note: High volatility - consider smaller position size.`;
    }
  }
  else if (passesAllFilters && confidenceScore >= 50) { // Stabilization #3: Raised from 45 to 50
    verdict = 'BUY_NOW';
    reasoning = `Filters pass with moderate confidence. RSI at ${rsi}, volume ${(volumeRatio * 100).toFixed(0)}% of average.`;
  }
  // Priority 3.5: FALSE POSITIVE WARNINGS (milder cases - Item 5)
  else if (bullTrapData.isBullTrap) {
    verdict = 'WATCH';
    reasoning = `Potential bull trap detected: ${bullTrapData.warnings.join('. ')}. Wait for clearer breakout confirmation.`;
  }
  else if (weakBreakoutData.isWeakBreakout) {
    verdict = 'WATCH';
    reasoning = `Weak breakout quality: ${weakBreakoutData.warnings.join('. ')}. Breakouts on low volume often fail.`;
  }
  else if (overboughtData.isOverboughtExtreme) {
    verdict = 'WAIT_FOR_DIP';
    reasoning = `Overbought (RSI ${overboughtData.rsi}): ${overboughtData.description}. Consider waiting for pullback.`;
  }
  else if (extensionData.isExtended) {
    verdict = 'WAIT_FOR_DIP';
    reasoning = `Price extended: ${extensionData.warnings.join('. ')}. May pull back to SMA50 area.`;
  }
  else if (divergenceData.hasBearishDivergence) {
    verdict = 'WATCH';
    reasoning = `Bearish divergence detected: ${divergenceData.description}. Monitor for trend weakening.`;
  }
  else if (filterResults.trendFilter && filterResults.priceFilter) {
    if (!filterResults.momentumFilter && rsi !== null) {
      if (rsi >= 70) {
        verdict = 'WAIT_FOR_DIP';
        reasoning = `Uptrend confirmed but RSI ${rsi} indicates overbought. Wait for pullback to RSI ~55-60.`;
      } else if (rsi < 50) {
        verdict = 'WATCH';
        reasoning = `Above SMA50 but weak momentum (RSI ${rsi}). Wait for RSI to climb above 50.`;
      } else {
        verdict = 'WATCH';
        reasoning = `Mixed signals. Monitor for clearer entry.`;
      }
    } else if (!filterResults.volumeFilter) {
      verdict = 'WAIT_FOR_DIP';
      reasoning = `Good trend and momentum but volume only ${(volumeRatio * 100).toFixed(0)}% of average. Wait for volume confirmation.`;
    } else if (!filterResults.safetyFilter) {
      verdict = 'WATCH';
      reasoning = `Technical setup is okay but safety concerns present. ${warnings.join('. ')}.`;
    } else if (!filterResults.falsePositiveFilter) {
      verdict = 'WATCH';
      reasoning = `False positive warning flags present. ${warnings.slice(-1)[0] || 'Review signals carefully.'}`;
    } else {
      verdict = 'WATCH';
      reasoning = `Some positive signals but not all criteria met for high-confidence entry.`;
    }
  }
  else {
    verdict = 'WATCH';
    reasoning = `Monitoring for better entry conditions. Current setup lacks sufficient confirmation.`;
  }

  // Set confidence level (adjusted thresholds)
  if (confidenceScore >= 70) {
    confidence = 'High';
  } else if (confidenceScore >= 50) {
    confidence = 'Medium';
  } else {
    confidence = 'Low';
  }

  // =====================
  // GENERATE WHY FACTORS (Enhanced)
  // =====================
  const whyFactors = [];

  // Data quality
  if (isStaleData) {
    whyFactors.push('⚠️ DATA: Potentially stale - verify before trading');
  } else if (hasRealData) {
    whyFactors.push('📊 LIVE DATA: Real-time Alpaca feed');
  } else {
    whyFactors.push('⚠️ DATA: Waiting for market data');
  }

  // Trend & Cross
  if (crossoverData.deathCross) {
    whyFactors.push(`☠️ DEATH CROSS: SMA20 < SMA50 (Bearish)`);
  } else if (crossoverData.goldenCross && crossoverData.trendStrength > 2) {
    whyFactors.push(`✨ GOLDEN CROSS: SMA20 > SMA50 by ${crossoverData.trendStrength}%`);
  } else if (filterResults.trendFilter) {
    whyFactors.push('📈 TREND: Price ABOVE 50-day average');
  } else {
    whyFactors.push('📉 TREND: Price BELOW 50-day average');
  }

  // Momentum
  if (rsi !== null) {
    const rsiInterp = getRSIInterpretation(rsi);
    if (filterResults.momentumFilter) {
      whyFactors.push(`🎯 MOMENTUM: RSI ${rsi} - ${rsiInterp.status}`);
    } else if (rsi >= 70) {
      whyFactors.push(`⚠️ MOMENTUM: RSI ${rsi} - Overbought`);
    } else if (rsi < 30) {
      whyFactors.push(`⚠️ MOMENTUM: RSI ${rsi} - Oversold (risky)`);
    } else {
      whyFactors.push(`⏳ MOMENTUM: RSI ${rsi} - ${rsiInterp.status}`);
    }
  }

  // Falling Knife Warning
  if (fallingKnifeData.isFallingKnife) {
    whyFactors.push(`🔪 FALLING KNIFE: ${fallingKnifeData.consecutiveDownDays} down days, ${fallingKnifeData.fiveDayReturn?.toFixed(1)}% weekly`);
  } else if (fallingKnifeData.consecutiveDownDays >= 2) {
    whyFactors.push(`⚠️ CAUTION: ${fallingKnifeData.consecutiveDownDays} consecutive down days`);
  } else if (fallingKnifeData.consecutiveUpDays >= 3) {
    whyFactors.push(`🚀 MOMENTUM: ${fallingKnifeData.consecutiveUpDays} consecutive up days`);
  }

  // Volatility
  if (volatilityData.isHighVolatility) {
    whyFactors.push(`🌊 VOLATILITY: ${volatilityData.volatilityLevel.toUpperCase()} (${volatilityData.dailyVolPercent?.toFixed(1)}% daily)`);
  }

  // Volume
  if (filterResults.volumeFilter) {
    whyFactors.push(`🔊 VOLUME: ${(volumeRatio * 100).toFixed(0)}% of average`);
  } else {
    whyFactors.push(`🔇 VOLUME: ${(volumeRatio * 100).toFixed(0)}% of average (low)`);
  }

  // FALSE POSITIVE WARNINGS (Item 5)
  if (bullTrapData.isBullTrap) {
    whyFactors.push(`🪤 BULL TRAP: ${bullTrapData.trapType.replace('_', ' ')} - ${bullTrapData.riskLevel} risk`);
  }
  if (divergenceData.hasBearishDivergence) {
    whyFactors.push(`📉 RSI DIVERGENCE: Bearish (strength: ${divergenceData.divergenceStrength}%)`);
  }
  if (extensionData.isExtended) {
    whyFactors.push(`📏 EXTENDED: ${extensionData.extensionPercent}% above SMA50`);
  }
  if (overboughtData.isOverboughtExtreme) {
    whyFactors.push(`🔥 OVERBOUGHT EXTREME: RSI ${overboughtData.rsi} (${overboughtData.severity})`);
  }
  if (weakBreakoutData.isWeakBreakout) {
    whyFactors.push(`⚠️ WEAK BREAKOUT: ${weakBreakoutData.breakoutQuality}`);
  }
  if (analystDivergence.hasDivergence) {
    whyFactors.push(`📊 ANALYST DIVERGENCE: ${analystDivergence.analystConsensus} vs our signal`);
  }

  // Position sizing (adjusted for volatility)
  const basePositionValue = 5000;
  const adjustedPositionValue = basePositionValue * (volatilityData.riskMultiplier || 1);
  const suggestedShares = Math.floor(adjustedPositionValue / price);
  const suggestedInvestment = parseFloat((suggestedShares * price).toFixed(2));

  return {
    verdict,
    confidence,
    confidenceScore,
    reasoning,
    warnings, // NEW: Array of risk warnings
    whyFactors,
    filterResults,
    // Safety data for transparency (Items 2 & 5)
    safetyData: {
      // Item 2: Core safety indicators
      deathCross: crossoverData.deathCross,
      goldenCross: crossoverData.goldenCross,
      crossStatus: crossoverData.crossStatus,
      trendStrength: crossoverData.trendStrength,
      consecutiveDownDays: fallingKnifeData.consecutiveDownDays,
      isFallingKnife: fallingKnifeData.isFallingKnife,
      fiveDayReturn: fallingKnifeData.fiveDayReturn,
      volatilityLevel: volatilityData.volatilityLevel,
      isHighVolatility: volatilityData.isHighVolatility,
      isStaleData,
      // Item 5: False Positive Prevention
      isBullTrap: bullTrapData.isBullTrap,
      bullTrapRiskLevel: bullTrapData.riskLevel,
      hasBearishDivergence: divergenceData.hasBearishDivergence,
      divergenceStrength: divergenceData.divergenceStrength,
      isExtended: extensionData.isExtended,
      extensionType: extensionData.extensionType,
      extensionPercent: extensionData.extensionPercent,
      isOverboughtExtreme: overboughtData.isOverboughtExtreme,
      overboughtSeverity: overboughtData.severity,
      isWeakBreakout: weakBreakoutData.isWeakBreakout,
      breakoutQuality: weakBreakoutData.breakoutQuality,
      analystDivergence: analystDivergence.hasDivergence,
      analystConsensus: analystData?.consensus || null,
      // Earnings Risk Data
      nextEarningsDate: earningsData.nextEarningsDate,
      daysUntilEarnings: earningsData.daysUntilEarnings,
      earningsRisk: earningsData.earningsRisk,
      hasUpcomingEarnings: earningsData.hasUpcomingEarnings
    },
    entryZone: { low: entryLow, high: entryHigh, current: price },
    profitTarget: {
      price: profitTarget,
      percentage: Math.abs(strategy.targetPercent),
      perShare: profitPerShare
    },
    stopLoss: {
      price: stopLoss,
      percentage: Math.abs(strategy.stopLossPercent),
      perShare: lossPerShare
    },
    riskReward: {
      ratio: riskRewardRatio,
      description: `Risk $${lossPerShare.toFixed(2)} to make $${profitPerShare.toFixed(2)}`
    },
    // NEW: Dynamic strategy based on ATR volatility
    strategy: {
      stopLoss: strategy.stopLoss,
      target: strategy.target,
      riskRatio: strategy.riskRatio,
      volatilityBased: strategy.volatilityBased,
      volatilityPercent: strategy.volatilityPercent,
      atr: strategy.atr
    },
    suggestedPosition: {
      shares: suggestedShares,
      investment: suggestedInvestment,
      maxRisk: parseFloat((suggestedShares * lossPerShare).toFixed(2)),
      maxProfit: parseFloat((suggestedShares * profitPerShare).toFixed(2)),
      // Net Profit Calculation (After Fees & Tax)
      grossProfit: parseFloat((suggestedShares * profitPerShare).toFixed(2)),
      totalCommission: TOTAL_COMMISSION,
      profitAfterFees: parseFloat((suggestedShares * profitPerShare - TOTAL_COMMISSION).toFixed(2)),
      taxAmount: parseFloat(
        Math.max(0, (suggestedShares * profitPerShare - TOTAL_COMMISSION) * TAX_RATE).toFixed(2)
      ),
      netProfit: parseFloat(
        Math.max(0, (suggestedShares * profitPerShare - TOTAL_COMMISSION) * (1 - TAX_RATE)).toFixed(2)
      ),
      taxRate: TAX_RATE
    }
  };
}

// =====================
// STOCK ANALYSIS
// =====================

export async function analyzeStock(symbol) {
  try {
    // Fetch current quote from Alpaca
    const quote = await getQuote(symbol);
    if (!quote || !quote.price) {
      console.error(`[${symbol}] No quote available`);
      return null;
    }

    // Fetch historical data from Alpaca
    const historical = await fetchHistoricalData(symbol);
    const hasRealData = historical !== null && historical.isReal === true;

    // Fetch Wall Street analyst ratings and earnings calendar from Finnhub
    const [analystData, earningsData] = await Promise.all([
      fetchAnalystRatings(symbol),
      fetchEarningsCalendar(symbol)
    ]);

    let sma20 = null;
    let sma50 = null;
    let rsi = null;
    let avgVolume20 = null;
    let volumeRatio = 1;
    let atrData = null;
    let crossoverData = { deathCross: false, goldenCross: false, crossStatus: 'unknown', trendStrength: 0 };
    let fallingKnifeData = { consecutiveDownDays: 0, isFallingKnife: false, recentTrend: 'unknown' };
    let volatilityData = { isHighVolatility: false, volatilityLevel: 'unknown', riskMultiplier: 1 };

    // FALSE POSITIVE DETECTION DATA (Item 5)
    let bullTrapData = { isBullTrap: false, trapType: 'none', riskLevel: 'low' };
    let divergenceData = { hasBearishDivergence: false, divergenceStrength: 0 };
    let extensionData = { isExtended: false, extensionType: 'normal' };
    let overboughtData = { isOverboughtExtreme: false, severity: 'none' };
    let weakBreakoutData = { isWeakBreakout: false, breakoutQuality: 'unknown' };

    if (historical && historical.closes && historical.closes.length >= 50) {
      const closes = historical.closes;
      const volumes = historical.volumes;
      const highs = historical.highs;
      const lows = historical.lows;

      sma20 = calculateSMA(closes, 20);
      sma50 = calculateSMA(closes, 50);
      rsi = calculateRSI(closes, 14);
      avgVolume20 = calculateSMA(volumes, 20);

      // Calculate ATR for dynamic stop loss / take profit
      atrData = calculateATR(highs, lows, closes, 14);

      // NEW: Detect Death Cross / Golden Cross
      crossoverData = detectCrossover(sma20, sma50);

      // NEW: Detect falling knife pattern
      fallingKnifeData = detectFallingKnife(closes);

      // NEW: Assess volatility risk
      volatilityData = assessVolatility(atrData, quote.price);

      // Calculate volume ratio for false positive checks
      const currentVolume = quote.volume || 0;
      const tempVolumeRatio = calculateVolumeRatio(currentVolume, avgVolume20 || currentVolume);

      // FALSE POSITIVE DETECTION (Item 5)
      // 1. Bull Trap Detection
      bullTrapData = detectBullTrap(quote.price, sma20, sma50, rsi, tempVolumeRatio, closes);

      // 2. Bearish RSI Divergence Detection
      divergenceData = detectRSIDivergence(closes, highs, 14);

      // 3. Price Extension Detection
      extensionData = detectPriceExtension(quote.price, sma50, closes);

      // 4. Overbought Extreme Detection
      overboughtData = detectOverboughtExtreme(rsi);

      // 5. Weak Breakout Detection
      weakBreakoutData = detectWeakBreakout(quote.price, sma50, tempVolumeRatio, closes);

      console.log(`[${symbol}] Indicators: SMA50=${sma50?.toFixed(2)}, RSI=${rsi}, ATR=${atrData?.atr || 'N/A'}, Cross=${crossoverData.crossStatus}, DownDays=${fallingKnifeData.consecutiveDownDays}`);
      if (bullTrapData.isBullTrap || divergenceData.hasBearishDivergence || extensionData.isExtended || overboughtData.isOverboughtExtreme) {
        console.log(`[${symbol}] ⚠️ FALSE POSITIVE FLAGS: BullTrap=${bullTrapData.isBullTrap}, Divergence=${divergenceData.hasBearishDivergence}, Extended=${extensionData.isExtended}, Overbought=${overboughtData.isOverboughtExtreme}`);
      }
    } else {
      console.log(`[${symbol}] Insufficient historical data`);
    }

    // Calculate volume ratio
    const currentVolume = quote.volume || 0;
    volumeRatio = calculateVolumeRatio(currentVolume, avgVolume20 || currentVolume);

    // Determine trend
    const isUptrend = sma50 ? quote.price > sma50 : false;

    // Check for stale data (quote older than 5 minutes) - only during market hours
    // When market is closed, we expect data to be from the last trading session
    const STALE_THRESHOLD = 300000; // 5 minutes
    const marketCurrentlyOpen = isMarketOpen().isOpen;
    const isStaleData = quote.stale || (marketCurrentlyOpen && (Date.now() - quote.timestamp > STALE_THRESHOLD));

    // ENHANCED Filter criteria with safety checks
    const trendFilter = isUptrend && !crossoverData.deathCross; // Must be uptrend AND not in death cross
    const momentumFilter = rsi !== null && rsi >= 48 && rsi <= 72; // Stabilization #2: Widened from 50-70 to reduce edge-case flipping
    const volumeFilter = volumeRatio >= 1.10;
    const priceFilter = quote.price > 10;
    const safetyFilter = !fallingKnifeData.isFallingKnife && !isStaleData; // No falling knives, no stale data

    // FALSE POSITIVE FILTER (Item 5) - Prevent false buy signals
    const falsePositiveFilter = !bullTrapData.isBullTrap &&
                                 !divergenceData.hasBearishDivergence &&
                                 !extensionData.isExtended &&
                                 !overboughtData.isOverboughtExtreme &&
                                 !weakBreakoutData.isWeakBreakout;

    const passesAllFilters = hasRealData && trendFilter && momentumFilter && volumeFilter && priceFilter && safetyFilter && falsePositiveFilter;

    // Build analysis
    const analysis = {
      ...quote,
      sma20,
      sma50,
      rsi,
      rsiInterpretation: getRSIInterpretation(rsi),
      volumeRatio: parseFloat(volumeRatio.toFixed(2)),
      avgVolume20: avgVolume20 ? Math.round(avgVolume20) : null,
      isUptrend,
      passesAllFilters,
      hasRealData,
      isStaleData,
      dataPoints: historical?.dataPoints || 0,
      atrData, // ATR data for dynamic stop loss / take profit
      crossoverData, // Death Cross / Golden Cross detection
      fallingKnifeData, // Consecutive down days detection
      volatilityData, // Volatility risk assessment
      analystData, // Wall Street analyst ratings from Finnhub
      earningsData, // Earnings calendar data from Finnhub
      // FALSE POSITIVE DETECTION DATA (Item 5)
      bullTrapData, // Bull trap detection
      divergenceData, // RSI divergence detection
      extensionData, // Price extension detection
      overboughtData, // Overbought extreme detection
      weakBreakoutData, // Weak breakout detection
      filterResults: {
        trendFilter,
        momentumFilter,
        volumeFilter,
        priceFilter,
        safetyFilter, // No falling knife, no stale data
        falsePositiveFilter // FALSE POSITIVE FILTER (Item 5)
      }
    };

    // Generate battle plan
    const battlePlan = generateBattlePlan(analysis);

    // Apply hysteresis (Stabilization #1): Require 2 consecutive BUY_NOW scans
    // SKIP hysteresis when market is closed - it's meant for live trading flickering prevention
    const marketStatus = isMarketOpen();
    let finalBattlePlan;

    if (marketStatus.isOpen) {
      // Market is open: apply hysteresis to prevent flickering
      const hysteresisResult = applyHysteresis(symbol, battlePlan.verdict);

      finalBattlePlan = {
        ...battlePlan,
        originalVerdict: battlePlan.verdict,
        verdict: hysteresisResult.finalVerdict,
        isPendingConfirmation: hysteresisResult.isPendingConfirmation,
        previousVerdict: hysteresisResult.previousVerdict
      };

      // Adjust reasoning if pending confirmation
      if (hysteresisResult.isPendingConfirmation) {
        finalBattlePlan.reasoning = `⏳ PENDING CONFIRMATION: ${battlePlan.reasoning} (Requires confirmation in next scan)`;
        finalBattlePlan.warnings = [
          ...(battlePlan.warnings || []),
          `First-time BUY signal - awaiting confirmation in next scan`
        ];
        console.log(`[${symbol}] ⏳ PENDING: Original=${battlePlan.verdict} → Displayed=${hysteresisResult.finalVerdict} | RSI: ${rsi}`);
      }
    } else {
      // Market is closed: skip hysteresis, use verdicts as-is
      // But still record the verdict so it's available when market opens
      verdictHistoryCache.set(symbol.toUpperCase(), {
        verdict: battlePlan.verdict,
        timestamp: Date.now()
      });
      finalBattlePlan = {
        ...battlePlan,
        originalVerdict: battlePlan.verdict,
        isPendingConfirmation: false,
        previousVerdict: null
      };
    }

    // Detailed logging
    if (!marketStatus.isOpen) {
      // Market closed: log without hysteresis info
      console.log(`[${symbol}] ✅ ${finalBattlePlan.verdict} | RSI: ${rsi} | Real Data: ${hasRealData ? 'YES' : 'NO'}`);
    } else if (finalBattlePlan.isPendingConfirmation) {
      // Already logged above in hysteresis block
    } else if (battlePlan.verdict === 'BUY_NOW' && finalBattlePlan.verdict === 'BUY_NOW') {
      console.log(`[${symbol}] ✅✅ CONFIRMED BUY_NOW | RSI: ${rsi} | Real Data: ${hasRealData ? 'YES' : 'NO'}`);
    } else {
      console.log(`[${symbol}] ✅ ${finalBattlePlan.verdict} | RSI: ${rsi} | Real Data: ${hasRealData ? 'YES' : 'NO'}`);
    }

    return { ...analysis, battlePlan: finalBattlePlan };

  } catch (error) {
    console.error(`[${symbol}] Analysis error:`, error.message);
    return null;
  }
}

// =====================
// MARKET SCANNER
// =====================

export async function scanMarket(symbols = DEFAULT_STOCKS) {
  const marketStatus = isMarketOpen();

  console.log(`\n========================================`);
  console.log(`🦙 ALPACA SCANNER: ${symbols.length} stocks`);
  console.log(`📊 Market Status: ${marketStatus.isOpen ? 'OPEN' : 'CLOSED'} (${marketStatus.reason})`);
  console.log(`========================================\n`);

  // When market is closed, return cached results for consistency
  // This prevents different results on each refresh when prices aren't changing
  if (!marketStatus.isOpen && lastScanResults && lastScanResults.length > 0) {
    console.log(`📦 Market closed - returning cached scan results (${lastScanResults.length} stocks)`);
    return lastScanResults;
  }

  // Market is open OR no cached results - perform fresh scan
  const results = [];

  for (const symbol of symbols) {
    try {
      const analysis = await analyzeStock(symbol);
      if (analysis) {
        results.push(analysis);
      }
    } catch (e) {
      console.error(`[${symbol}] Failed:`, e.message);
    }
  }

  console.log(`\n========================================`);
  console.log(`SCAN COMPLETE: ${results.length}/${symbols.length} stocks`);
  const withRealData = results.filter(r => r.hasRealData).length;
  console.log(`With real data: ${withRealData}/${results.length}`);
  console.log(`========================================\n`);

  // Sort by verdict priority, then confidence score, then symbol (for deterministic order)
  const verdictPriority = { 'BUY_NOW': 0, 'WAIT_FOR_DIP': 1, 'WATCH': 2, 'AVOID': 3 };

  const sortedResults = results.sort((a, b) => {
    const aPriority = verdictPriority[a.battlePlan.verdict] ?? 4;
    const bPriority = verdictPriority[b.battlePlan.verdict] ?? 4;
    if (aPriority !== bPriority) return aPriority - bPriority;
    if (b.battlePlan.confidenceScore !== a.battlePlan.confidenceScore) {
      return b.battlePlan.confidenceScore - a.battlePlan.confidenceScore;
    }
    // Final tiebreaker: symbol name (alphabetical) for deterministic order
    return a.symbol.localeCompare(b.symbol);
  });

  // Cache the sorted results for market-closed consistency
  lastScanResults = sortedResults;
  lastScanTimestamp = Date.now();
  lastMarketOpenState = marketStatus.isOpen;

  return sortedResults;
}

// =====================
// STOCK SEARCH
// =====================

export async function searchStocks(query) {
  // Alpaca doesn't have a search API, so filter from our default list
  const upperQuery = query.toUpperCase();
  return DEFAULT_STOCKS
    .filter(symbol => symbol.includes(upperQuery))
    .slice(0, 10)
    .map(symbol => ({
      symbol,
      name: symbol,
      exchange: 'NASDAQ'
    }));
}
