import 'dotenv/config';
import Alpaca from '@alpacahq/alpaca-trade-api';

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
  // Information Technology (71 stocks)
  'AAPL', 'MSFT', 'NVDA', 'AVGO', 'ORCL', 'CRM', 'CSCO', 'ACN', 'ADBE', 'IBM',
  'INTC', 'AMD', 'QCOM', 'TXN', 'NOW', 'INTU', 'AMAT', 'ADI', 'LRCX', 'MU',
  'KLAC', 'SNPS', 'CDNS', 'MCHP', 'FTNT', 'MSI', 'ANSS', 'NXPI', 'APH', 'KEYS',
  'HPQ', 'HPE', 'CTSH', 'GLW', 'IT', 'ZBRA', 'CDW', 'TYL', 'ON', 'FSLR',
  'SWKS', 'NTAP', 'JNPR', 'PTC', 'AKAM', 'VRSN', 'FFIV', 'TER', 'TRMB', 'WDC',
  'STX', 'ENPH', 'EPAM', 'GEN', 'QRVO', 'SEDG', 'PAYC', 'MPWR', 'SMCI', 'DELL',
  'PANW', 'CRWD', 'ZS', 'DDOG', 'PLTR', 'NET', 'SNOW', 'MDB', 'OKTA', 'HUBS',
  'TEAM',

  // Healthcare (64 stocks)
  'UNH', 'JNJ', 'LLY', 'MRK', 'ABBV', 'TMO', 'ABT', 'DHR', 'PFE', 'BMY',
  'AMGN', 'GILD', 'MDT', 'SYK', 'ISRG', 'VRTX', 'REGN', 'ZTS', 'ELV', 'CI',
  'CVS', 'MCK', 'HUM', 'CNC', 'BSX', 'BDX', 'EW', 'IDXX', 'IQV', 'DXCM',
  'A', 'MTD', 'RMD', 'ALGN', 'HOLX', 'ILMN', 'WAT', 'WST', 'COO', 'TFX',
  'BAX', 'BIIB', 'MRNA', 'TECH', 'MOH', 'CRL', 'DGX', 'LH', 'CAH', 'VTRS',
  'HSIC', 'XRAY', 'OGN', 'DVA', 'CTLT', 'INCY', 'PODD', 'RVTY', 'STE', 'HCA',
  'UHS', 'GEHC', 'SOLV', 'JAZZ',

  // Financials (73 stocks)
  'JPM', 'V', 'MA', 'BAC', 'WFC', 'GS', 'MS', 'BLK', 'SCHW', 'AXP',
  'C', 'USB', 'PNC', 'TFC', 'BK', 'COF', 'ICE', 'CME', 'CB', 'AON',
  'MMC', 'PGR', 'AIG', 'MET', 'PRU', 'AFL', 'TRV', 'ALL', 'AJG', 'SPGI',
  'MCO', 'MSCI', 'NDAQ', 'FIS', 'FITB', 'STT', 'MTB', 'HBAN', 'RF', 'CFG',
  'KEY', 'NTRS', 'DFS', 'SYF', 'RJF', 'CINF', 'WRB', 'L', 'RE', 'GL',
  'AIZ', 'BRO', 'EG', 'ACGL', 'FDS', 'MKTX', 'CBOE', 'TROW', 'IVZ', 'BEN',
  'AMP', 'LNC', 'JKHY', 'ZION', 'CMA', 'WBS', 'FHN', 'PYPL', 'SQ', 'COIN',
  'HOOD', 'ALLY', 'EWBC',

  // Consumer Discretionary (54 stocks)
  'AMZN', 'TSLA', 'HD', 'MCD', 'NKE', 'LOW', 'SBUX', 'TGT', 'TJX', 'ROST',
  'BKNG', 'CMG', 'ORLY', 'AZO', 'MAR', 'HLT', 'YUM', 'DG', 'DLTR', 'EBAY',
  'DHI', 'LEN', 'PHM', 'NVR', 'GPC', 'BBY', 'ULTA', 'POOL', 'GRMN', 'TSCO',
  'DRI', 'WYNN', 'LVS', 'MGM', 'CZR', 'RCL', 'CCL', 'NCLH', 'EXPE', 'HAS',
  'F', 'GM', 'APTV', 'BWA', 'LEA', 'AAP', 'KMX', 'LULU', 'NWL', 'VFC',
  'PVH', 'TPR', 'RL', 'ETSY',

  // Communication Services (23 stocks)
  'GOOGL', 'GOOG', 'META', 'NFLX', 'DIS', 'CMCSA', 'VZ', 'T', 'TMUS', 'CHTR',
  'EA', 'TTWO', 'WBD', 'PARA', 'FOX', 'FOXA', 'NWSA', 'NWS', 'OMC', 'IPG',
  'LYV', 'MTCH', 'PINS',

  // Industrials (78 stocks)
  'CAT', 'DE', 'BA', 'GE', 'HON', 'UNP', 'RTX', 'LMT', 'UPS', 'FDX',
  'EMR', 'ETN', 'ITW', 'PH', 'WM', 'RSG', 'CTAS', 'NSC', 'CSX', 'GD',
  'NOC', 'TT', 'MMM', 'JCI', 'CMI', 'AME', 'CARR', 'OTIS', 'ROK', 'PCAR',
  'FAST', 'PWR', 'PAYX', 'VRSK', 'DOV', 'CPRT', 'ODFL', 'JBHT', 'XYL', 'WAB',
  'GWW', 'SWK', 'IEX', 'HWM', 'TDG', 'RHI', 'EXPD', 'CHR', 'CHRW', 'DAL',
  'UAL', 'LUV', 'AAL', 'ALK', 'J', 'LDOS', 'BAH', 'AXON', 'BLDR', 'TXT',
  'HII', 'LHX', 'URI', 'WSO', 'AOS', 'FTV', 'EME', 'GNRC', 'IR', 'HUBB',
  'MAS', 'SNA', 'PNR', 'ALLE', 'NDSN', 'RRX', 'EFX', 'BR',

  // Consumer Staples (39 stocks)
  'PG', 'KO', 'PEP', 'COST', 'WMT', 'PM', 'MO', 'MDLZ', 'CL', 'KMB',
  'GIS', 'KHC', 'HSY', 'K', 'SJM', 'CPB', 'CAG', 'HRL', 'MKC', 'CLX',
  'CHD', 'EL', 'KR', 'SYY', 'ADM', 'BG', 'WBA', 'STZ', 'TAP', 'BF.B',
  'MNST', 'KDP', 'TSN', 'LW', 'KVUE', 'USFD', 'LAMB', 'POST',

  // Energy (23 stocks)
  'XOM', 'CVX', 'COP', 'EOG', 'SLB', 'MPC', 'PSX', 'VLO', 'PXD', 'OXY',
  'WMB', 'KMI', 'HAL', 'DVN', 'HES', 'FANG', 'BKR', 'TRGP', 'OKE', 'CTRA',
  'APA', 'EQT', 'MRO',

  // Utilities (30 stocks)
  'NEE', 'DUK', 'SO', 'D', 'AEP', 'SRE', 'EXC', 'XEL', 'ED', 'PEG',
  'WEC', 'ES', 'AWK', 'DTE', 'EIX', 'ETR', 'AEE', 'FE', 'PPL', 'CMS',
  'CNP', 'EVRG', 'ATO', 'NI', 'LNT', 'NRG', 'AES', 'PNW', 'CEG', 'VST',

  // Real Estate (31 stocks)
  'AMT', 'PLD', 'CCI', 'EQIX', 'PSA', 'SPG', 'O', 'WELL', 'DLR', 'AVB',
  'EQR', 'VTR', 'ARE', 'MAA', 'UDR', 'ESS', 'INVH', 'SUI', 'ELS', 'REG',
  'KIM', 'HST', 'CPT', 'PEAK', 'IRM', 'SBAC', 'WY', 'BXP', 'CBRE', 'CSGP',
  'FRT',

  // Materials (27 stocks)
  'LIN', 'APD', 'SHW', 'ECL', 'FCX', 'NEM', 'NUE', 'DOW', 'DD', 'PPG',
  'VMC', 'MLM', 'ALB', 'CTVA', 'CE', 'EMN', 'IFF', 'IP', 'PKG', 'WRK',
  'AVY', 'SEE', 'BALL', 'AMCR', 'CF', 'MOS', 'FMC'
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
const QUOTE_CACHE_TTL = 15000;       // 15 seconds for quotes (Alpaca is fast)
const HISTORICAL_CACHE_TTL = 300000; // 5 minutes for historical data
const ANALYST_CACHE_TTL = 3600000;   // 1 hour for analyst data (changes infrequently)

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
    // Fetch recommendation trends
    const recResponse = await fetch(
      `${FINNHUB_BASE_URL}/stock/recommendation?symbol=${upperSymbol}&token=${FINNHUB_API_KEY}`
    );

    if (!recResponse.ok) {
      throw new Error(`Finnhub API error: ${recResponse.status}`);
    }

    const recommendations = await recResponse.json();

    // Fetch price target
    const targetResponse = await fetch(
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
    if (cached && Date.now() - cached.timestamp < QUOTE_CACHE_TTL) {
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
      timestamp: Date.now(),
      isLive: true,
      source: 'Alpaca'
    };

    quoteCache.set(upperSymbol, { data: result, timestamp: Date.now() });
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

  // Check cache first
  const cached = historicalCache.get(upperSymbol);
  if (cached && Date.now() - cached.timestamp < HISTORICAL_CACHE_TTL) {
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
  const atrData = analysis.atrData;

  // Calculate entry zone (±1% from current price)
  const entryLow = parseFloat((price * 0.99).toFixed(2));
  const entryHigh = parseFloat((price * 1.01).toFixed(2));

  // Calculate DYNAMIC stop loss and take profit based on ATR volatility
  const strategy = calculateDynamicStrategy(price, atrData, 1.5, 2);

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

  if (!hasRealData) {
    confidenceScore -= 30;
  }

  // Score based on filter criteria
  if (filterResults.trendFilter) confidenceScore += 25;
  if (filterResults.momentumFilter) confidenceScore += 30;
  if (filterResults.volumeFilter) confidenceScore += 20;
  if (filterResults.priceFilter) confidenceScore += 5;

  // Bonus points
  if (rsi !== null && rsi >= 55 && rsi <= 65) {
    confidenceScore += 10;
  }
  if (volumeRatio >= 1.2) {
    confidenceScore += 5;
  }

  // Determine verdict
  if (!hasRealData) {
    verdict = 'WATCH';
    reasoning = `Waiting for market data. Analysis will be available when market is open.`;
  } else if (passesAllFilters) {
    verdict = 'BUY_NOW';
    reasoning = `All quality filters pass: Price above SMA50 (uptrend), RSI at ${rsi} (momentum), volume ${(volumeRatio * 100).toFixed(0)}% of average.`;
  } else if (filterResults.trendFilter && filterResults.priceFilter) {
    if (!filterResults.momentumFilter && rsi !== null) {
      if (rsi >= 70) {
        verdict = 'WAIT_FOR_DIP';
        reasoning = `Uptrend confirmed but RSI ${rsi} indicates overbought. Wait for pullback.`;
      } else if (rsi < 50) {
        verdict = 'WATCH';
        reasoning = `Above SMA50 but weak momentum (RSI ${rsi}). Wait for strength.`;
      }
    } else if (!filterResults.volumeFilter) {
      verdict = 'WAIT_FOR_DIP';
      reasoning = `Good trend and momentum but volume only ${(volumeRatio * 100).toFixed(0)}% of average.`;
    } else {
      verdict = 'WATCH';
      reasoning = `Some positive signals but not all criteria met.`;
    }
  } else if (!filterResults.trendFilter) {
    verdict = 'AVOID';
    reasoning = `Below SMA50 indicates downtrend. Wait for trend reversal.`;
  } else if (!filterResults.priceFilter) {
    verdict = 'AVOID';
    reasoning = `Price below $10 - higher volatility risk.`;
  } else {
    verdict = 'WATCH';
    reasoning = `Monitoring for better entry conditions.`;
  }

  // Set confidence level
  if (confidenceScore >= 70) {
    confidence = 'High';
  } else if (confidenceScore >= 45) {
    confidence = 'Medium';
  } else {
    confidence = 'Low';
  }

  // Generate why factors
  const whyFactors = [];

  whyFactors.push(hasRealData ? '📊 LIVE DATA: Real-time Alpaca feed' : '⚠️ DATA: Waiting for market data');

  if (filterResults.trendFilter) {
    whyFactors.push('📈 TREND: Price ABOVE 50-day average');
  } else {
    whyFactors.push('📉 TREND: Price BELOW 50-day average');
  }

  if (rsi !== null) {
    const rsiInterp = getRSIInterpretation(rsi);
    if (filterResults.momentumFilter) {
      whyFactors.push(`🎯 MOMENTUM: RSI ${rsi} - ${rsiInterp.status}`);
    } else if (rsi >= 70) {
      whyFactors.push(`⚠️ MOMENTUM: RSI ${rsi} - Overbought`);
    } else {
      whyFactors.push(`⏳ MOMENTUM: RSI ${rsi} - ${rsiInterp.status}`);
    }
  }

  if (filterResults.volumeFilter) {
    whyFactors.push(`🔊 VOLUME: ${(volumeRatio * 100).toFixed(0)}% of average`);
  } else {
    whyFactors.push(`🔇 VOLUME: ${(volumeRatio * 100).toFixed(0)}% of average (low)`);
  }

  // Position sizing
  const maxPositionValue = 5000;
  const suggestedShares = Math.floor(maxPositionValue / price);
  const suggestedInvestment = parseFloat((suggestedShares * price).toFixed(2));

  return {
    verdict,
    confidence,
    confidenceScore,
    reasoning,
    whyFactors,
    filterResults,
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
      maxProfit: parseFloat((suggestedShares * profitPerShare).toFixed(2))
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

    // Fetch Wall Street analyst ratings from Finnhub
    const analystData = await fetchAnalystRatings(symbol);

    let sma20 = null;
    let sma50 = null;
    let rsi = null;
    let avgVolume20 = null;
    let volumeRatio = 1;
    let atrData = null;

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

      console.log(`[${symbol}] Indicators: SMA50=${sma50?.toFixed(2)}, RSI=${rsi}, ATR=${atrData?.atr || 'N/A'}, AvgVol=${avgVolume20?.toFixed(0)}`);
    } else {
      console.log(`[${symbol}] Insufficient historical data`);
    }

    // Calculate volume ratio
    const currentVolume = quote.volume || 0;
    volumeRatio = calculateVolumeRatio(currentVolume, avgVolume20 || currentVolume);

    // Determine trend
    const isUptrend = sma50 ? quote.price > sma50 : false;

    // Filter criteria
    const trendFilter = isUptrend;
    const momentumFilter = rsi !== null && rsi >= 50 && rsi <= 70;
    const volumeFilter = volumeRatio >= 1.10;
    const priceFilter = quote.price > 10;

    const passesAllFilters = hasRealData && trendFilter && momentumFilter && volumeFilter && priceFilter;

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
      dataPoints: historical?.dataPoints || 0,
      atrData, // ATR data for dynamic stop loss / take profit
      analystData, // Wall Street analyst ratings from Finnhub
      filterResults: {
        trendFilter,
        momentumFilter,
        volumeFilter,
        priceFilter
      }
    };

    // Generate battle plan
    const battlePlan = generateBattlePlan(analysis);

    console.log(`[${symbol}] ✅ ${battlePlan.verdict} | RSI: ${rsi} | Real Data: ${hasRealData ? 'YES' : 'NO'}`);

    return { ...analysis, battlePlan };

  } catch (error) {
    console.error(`[${symbol}] Analysis error:`, error.message);
    return null;
  }
}

// =====================
// MARKET SCANNER
// =====================

export async function scanMarket(symbols = DEFAULT_STOCKS) {
  console.log(`\n========================================`);
  console.log(`🦙 ALPACA SCANNER: ${symbols.length} stocks`);
  console.log(`========================================\n`);

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

  // Sort by verdict priority
  const verdictPriority = { 'BUY_NOW': 0, 'WAIT_FOR_DIP': 1, 'WATCH': 2, 'AVOID': 3 };

  return results.sort((a, b) => {
    const aPriority = verdictPriority[a.battlePlan.verdict] ?? 4;
    const bPriority = verdictPriority[b.battlePlan.verdict] ?? 4;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return b.battlePlan.confidenceScore - a.battlePlan.confidenceScore;
  });
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
