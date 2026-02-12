export type Language = 'en' | 'he';

export const translations = {
  en: {
    // App Header
    appTitle: 'Strategic Investment Agent',
    appSubtitle: 'Paper Trading Simulator',

    // Navigation
    navScanner: 'Find Opportunities',
    navPortfolio: 'My Portfolio',
    navHistory: 'Trade History',

    // Language
    language: 'Language',
    english: 'English',
    hebrew: 'עברית',

    // Scanner Page
    scannerTitle: 'Investment Plans',
    scannerSubtitle: 'Smart trade cards with risk/reward analysis',
    cashLabel: 'Cash',
    refreshBtn: 'Refresh',
    scanning: 'Scanning...',

    // Filter Tabs
    filterAll: 'All Stocks',
    filterBuyNow: 'Buy Now',
    filterWatch: 'Watch',
    filterAvoid: 'Avoid',

    // Verdicts
    verdictBuyNow: 'BUY NOW',
    verdictWatch: 'WATCH',
    verdictAvoid: 'AVOID',

    // Trade Card
    verifyOnTradingView: 'Verify on TradingView',
    confidenceScore: 'Confidence',
    inPortfolio: 'In Portfolio',

    // Wall Street Analysts
    wallStreetAnalysts: 'Wall Street Analysts',
    analysts: 'analysts',
    consensusScore: 'Score',
    strongBuy: 'Strong Buy',
    buy: 'Buy',
    hold: 'Hold',
    sell: 'Sell',
    strongSell: 'Strong Sell',
    avgPriceTarget: 'Avg Price Target',

    // Risk/Reward Section
    riskRewardPlan: 'Risk / Reward Plan',
    stopLoss: 'Stop Loss',
    entryPrice: 'Entry Price',
    target: 'Target',
    risk: 'Risk',
    reward: 'Reward',
    currentMarketPrice: 'Current Market Price',
    riskRewardRatio: 'Risk/Reward Ratio',
    good: 'Good',
    strategyBasis: 'Strategy Basis',
    atrBased: 'ATR-Based',
    fixedPercent: 'Fixed %',
    volatility: 'Vol',
    atrExplanation: 'Stop/Target calculated from 14-day ATR',
    riskMultiplier: 'risk multiplier',

    // Analysis Section
    analysis: 'Analysis',

    // Technical Terms with Explanations
    trendDirection: 'Trend Direction',
    trendUp: 'Up (Above SMA50)',
    trendDown: 'Down (Below SMA50)',
    trendUpExplanation: 'Price is trading above the 50-day moving average, indicating bullish momentum. Stocks in uptrends tend to continue rising.',
    trendDownExplanation: 'Price is below the 50-day moving average, suggesting bearish pressure. Consider waiting for trend reversal before buying.',

    momentumRSI: 'Momentum (RSI)',
    momentumHigh: 'High',
    momentumStrong: 'Strong',
    momentumWeak: 'Weak',
    momentumUnknown: 'Unknown',
    momentumOverboughtExplanation: 'indicates overbought conditions. The stock may be due for a pullback. Consider waiting for a dip before entering.',
    momentumBullishExplanation: 'shows healthy bullish momentum. The stock has buying pressure without being overextended.',
    momentumWeakExplanation: 'indicates weak momentum. Buyers aren\'t in control yet. Wait for RSI to climb above 50.',
    momentumUnknownExplanation: 'RSI data unavailable. Unable to assess momentum strength at this time.',

    volumeActivity: 'Volume Activity',
    volumeStrong: 'Strong Interest',
    volumeLow: 'Low Interest',
    volumeStrongExplanation: 'of the 20-day average. Higher volume confirms institutional interest and validates price movements.',
    volumeLowExplanation: 'of average. Low volume moves are less reliable and may reverse quickly.',

    volatilityATR: 'Volatility (ATR)',
    dailyRange: 'daily range',
    volatilityExplanation: 'This stock moves an average of',
    volatilityExplanation2: 'per day. Stop loss and target prices are calculated using the 14-day ATR',
    volatilityExplanation3: 'to account for normal price swings.',
    volatilityNA: 'Volatility data unavailable. Using default 4% stop loss and 8% target.',

    dataQuality: 'Data Quality',
    realMarketData: 'Real Market Data',
    limitedData: 'Limited Data',
    dataQualityGoodExplanation: 'days of real market data from Alpaca. Indicators are calculated from actual price history.',
    dataQualityBadExplanation: 'Limited historical data available. Analysis may be less reliable. Wait for more data before making decisions.',

    // AI Analysis
    aiAnalysisSummary: 'AI Analysis Summary',
    decisionFactors: 'Decision Factors',
    confidenceHigh: 'High confidence: Multiple indicators align positively. This setup has strong technical backing.',
    confidenceMedium: 'Medium confidence: Some positive signals, but not all criteria met. Proceed with caution.',
    confidenceLow: 'Low confidence: Weak or conflicting signals. Consider waiting for better conditions.',

    // Action Buttons
    tradeThisPlan: 'Trade This Plan',
    notRecommended: 'Not Recommended',
    reviewAnyway: 'Review Anyway',

    // Loading States
    analyzingMarket: 'Analyzing Market...',
    pacingRequests: 'Pacing requests to avoid rate limits',
    fetchingRealTime: 'Fetching real-time data',
    stillScanning: 'Still scanning...',
    stocksAnalyzed: 'stocks analyzed so far',

    // Empty States
    noStocksInCategory: 'No stocks in this category',
    tryDifferentFilter: 'Try a different filter',
    noMarketData: 'No market data available',
    clickRefreshToScan: 'Click Refresh to scan the market',

    // Portfolio Page
    portfolioTitle: 'Your Practice Portfolio',
    portfolioSubtitle: 'Track your virtual investments here. Remember, this is practice money - learn from your wins AND losses without any real risk!',
    totalPortfolioValue: 'Total Portfolio Value',
    startedWith: 'Started with $100,000 virtual cash',
    portfolioBreakdown: 'Portfolio Breakdown',
    cashAvailable: 'Cash Available',
    investedInStocks: 'Invested in Stocks',
    unrealizedPL: 'Unrealized P&L',
    yourHoldings: 'Your Holdings',
    updatePrices: 'Update Prices',
    startOver: 'Start Over',

    // Holding Card
    currentValue: 'Current value',
    makingMoney: "You're making money!",
    currentlyDown: "Currently down, but don't panic",
    sharesOwned: 'Shares owned',
    youPaid: 'You paid',
    nowWorth: 'Now worth',
    perShare: '/share',
    today: 'Today',
    sellShares: 'Sell Shares',

    // Empty Portfolio
    noInvestmentsYet: 'No investments yet',
    noInvestmentsDesc: "You haven't bought any stocks yet. Head to the \"Find Opportunities\" tab to discover stocks and make your first practice trade!",
    waitingToBeInvested: 'is waiting to be invested',

    // Learning Section
    understandingPL: 'Understanding Your P&L',
    unrealizedPLExplanation: "This is your profit or loss \"on paper\" - it's what you would make if you sold right now. It changes as stock prices move.",
    realizedPLExplanation: 'This is locked in when you actually sell. Once you sell, your profit or loss becomes real (well, real virtual money in this case!).',

    // Reset Modal
    startOverQuestion: 'Start Over?',
    resetDescription: 'This will reset your portfolio back to $100,000 and clear all your trades. It\'s like a fresh start!',
    keepTrading: 'Keep Trading',
    startFresh: 'Start Fresh',

    // Trade Success
    tradeSubmitted: 'Trade Submitted!',
    orderSubmittedFor: 'Order submitted for',

    // Errors
    somethingWentWrong: 'Something went wrong',
    loadingPortfolio: 'Loading your portfolio...',

    // Order Editor
    reviewTradePlan: 'Review Trade Plan',
    customizeOrder: 'Customize your order before execution',
    currentPrice: 'Current Price',
    quantityShares: 'Quantity (Shares)',
    shares: 'shares',
    totalInvestment: 'Total Investment',
    exceedsCash: 'Exceeds available cash',
    marketPriceLive: 'Market Price (Live)',
    takeProfitTarget: 'Take Profit Target',
    sellWhenReaches: 'Sell when price reaches',
    stopLossProtection: 'Stop Loss Protection',
    exitIfDrops: 'Exit if price drops to',
    orderSummary: 'Order Summary',
    ifStopLossHit: 'If Stop Loss hit:',
    ifTakeProfitHit: 'If Take Profit hit:',
    great: 'Great',
    okay: 'Okay',
    risky: 'Risky',
    proTip: 'Pro tip:',
    proTipText: 'A ratio of 1:2 or higher means your potential reward is at least double your risk - that\'s a smart trade setup!',
    cancel: 'Cancel',
    processing: 'Processing...',
    submitOrder: 'SUBMIT ORDER',
    insufficientFunds: 'Insufficient funds for this order',
    orderFailed: 'Order failed. Please try again.',
    connectionError: 'Failed to submit order. Please check your connection.',

    // Sell Modal
    sellSymbol: 'Sell',
    avgCost: 'Avg Cost',
    liveMarketPrice: 'Live Market Price',
    priceRefreshNote: 'Price refreshes every 5 seconds. Execution uses fresh price.',
    sharesToSell: 'Shares to Sell',
    available: 'Available:',
    totalProceeds: 'Total Proceeds',
    costBasis: 'Cost Basis',
    realizedPL: 'Realized P&L',
    executingOrder: 'Executing Order...',
    sellNow: 'Sell Now',
    unableToFetchPrice: 'Unable to fetch live price',

    // Trade History
    tradeHistory: 'Trade History',
    recentPracticeTrades: 'Your recent practice trades',
    bought: 'Bought',
    sold: 'Sold',
    price: 'Price',
    total: 'Total',
    planTakeProfitAt: 'Plan: Take profit at',
    stopLossAt: '· Stop loss at',
    noTradesYet: 'No trades yet',
    tradesWillAppear: 'When you buy or sell stocks, they\'ll appear here',
    showingRecentTrades: 'Showing 10 most recent trades of',
    totalTrades: 'total',

    // Alerts
    alerts: 'Alerts',
    noNewAlerts: 'No new alerts',
    takeProfitExecuted: 'Take Profit Executed',
    stopLossExecuted: 'Stop Loss Executed',
    profit: 'Profit',
    loss: 'Loss',
    markAllRead: 'Mark all read',
    autoExitAlerts: 'Auto-Exit Alerts',
    targetTP: 'Target (TP)',
    targetSL: 'Target (SL)',
    pendingOrders: 'Pending Orders',
    autoMonitored: 'Auto-monitored',
  },

  he: {
    // App Header
    appTitle: 'סוכן השקעות אסטרטגי',
    appSubtitle: 'סימולטור מסחר וירטואלי',

    // Navigation
    navScanner: 'מצא הזדמנויות',
    navPortfolio: 'התיק שלי',
    navHistory: 'היסטוריית עסקאות',

    // Language
    language: 'שפה',
    english: 'English',
    hebrew: 'עברית',

    // Scanner Page
    scannerTitle: 'תוכניות השקעה',
    scannerSubtitle: 'כרטיסי מסחר חכמים עם ניתוח סיכון/תשואה',
    cashLabel: 'מזומן',
    refreshBtn: 'רענן',
    scanning: 'סורק...',

    // Filter Tabs
    filterAll: 'כל המניות',
    filterBuyNow: 'קנה עכשיו',
    filterWatch: 'עקוב',
    filterAvoid: 'הימנע',

    // Verdicts
    verdictBuyNow: 'קנה עכשיו',
    verdictWatch: 'עקוב',
    verdictAvoid: 'הימנע',

    // Trade Card
    verifyOnTradingView: 'אמת ב-TradingView',
    confidenceScore: 'רמת ביטחון',
    inPortfolio: 'בתיק שלי',

    // Wall Street Analysts
    wallStreetAnalysts: 'אנליסטים של וול סטריט',
    analysts: 'אנליסטים',
    consensusScore: 'ציון',
    strongBuy: 'קנייה חזקה',
    buy: 'קנייה',
    hold: 'החזק',
    sell: 'מכירה',
    strongSell: 'מכירה חזקה',
    avgPriceTarget: 'מחיר יעד ממוצע',

    // Risk/Reward Section
    riskRewardPlan: 'תוכנית סיכון / תשואה',
    stopLoss: 'סטופ לוס (הפסד מקסימלי)',
    entryPrice: 'מחיר כניסה',
    target: 'יעד רווח',
    risk: 'סיכון',
    reward: 'תשואה',
    currentMarketPrice: 'מחיר שוק נוכחי',
    riskRewardRatio: 'יחס סיכון/תשואה',
    good: 'טוב',
    strategyBasis: 'בסיס האסטרטגיה',
    atrBased: 'מבוסס ATR (טווח תנודתיות)',
    fixedPercent: 'אחוז קבוע',
    volatility: 'תנודתיות',
    atrExplanation: 'סטופ/יעד מחושב מ-ATR של 14 יום',
    riskMultiplier: 'מכפיל סיכון',

    // Analysis Section
    analysis: 'ניתוח טכני',

    // Technical Terms with Explanations
    trendDirection: 'כיוון המגמה',
    trendUp: 'עולה (מעל ממוצע 50 יום)',
    trendDown: 'יורד (מתחת לממוצע 50 יום)',
    trendUpExplanation: 'המחיר נסחר מעל הממוצע הנע של 50 יום, מה שמצביע על מומנטום חיובי. מניות במגמת עלייה נוטות להמשיך לעלות.',
    trendDownExplanation: 'המחיר מתחת לממוצע הנע של 50 יום, מה שמרמז על לחץ שלילי. שקול להמתין להיפוך מגמה לפני קנייה.',

    momentumRSI: 'מומנטום (מדד RSI)',
    momentumHigh: 'גבוה',
    momentumStrong: 'חזק',
    momentumWeak: 'חלש',
    momentumUnknown: 'לא ידוע',
    momentumOverboughtExplanation: 'מצביע על מצב קניית יתר. המניה עשויה להיות צפויה לירידה. שקול להמתין לירידה לפני כניסה.',
    momentumBullishExplanation: 'מראה מומנטום חיובי בריא. למניה יש לחץ קנייה בלי להיות מתוחה יתר על המידה.',
    momentumWeakExplanation: 'מצביע על מומנטום חלש. הקונים עדיין לא בשליטה. המתן ש-RSI יעלה מעל 50.',
    momentumUnknownExplanation: 'נתוני RSI לא זמינים. לא ניתן להעריך את עוצמת המומנטום כרגע.',

    volumeActivity: 'פעילות מחזור מסחר',
    volumeStrong: 'עניין חזק',
    volumeLow: 'עניין נמוך',
    volumeStrongExplanation: 'מהממוצע של 20 יום. מחזור גבוה מאשר עניין מוסדי ומאמת תנועות מחיר.',
    volumeLowExplanation: 'מהממוצע. תנועות במחזור נמוך פחות אמינות ועלולות להתהפך במהירות.',

    volatilityATR: 'תנודתיות (ATR - טווח תנודה ממוצע)',
    dailyRange: 'טווח יומי',
    volatilityExplanation: 'המניה זזה בממוצע',
    volatilityExplanation2: 'ביום. מחירי סטופ ויעד מחושבים באמצעות ATR של 14 יום',
    volatilityExplanation3: 'כדי להתחשב בתנודות מחיר רגילות.',
    volatilityNA: 'נתוני תנודתיות לא זמינים. משתמש בברירת מחדל של 4% סטופ ו-8% יעד.',

    dataQuality: 'איכות הנתונים',
    realMarketData: 'נתוני שוק אמיתיים',
    limitedData: 'נתונים מוגבלים',
    dataQualityGoodExplanation: 'ימים של נתוני שוק אמיתיים מ-Alpaca. האינדיקטורים מחושבים מהיסטוריית מחירים אמיתית.',
    dataQualityBadExplanation: 'נתונים היסטוריים מוגבלים זמינים. הניתוח עשוי להיות פחות אמין. המתן לעוד נתונים לפני קבלת החלטות.',

    // AI Analysis
    aiAnalysisSummary: 'סיכום ניתוח AI',
    decisionFactors: 'גורמי החלטה',
    confidenceHigh: 'ביטחון גבוה: מספר אינדיקטורים מיושרים חיובית. לתצורה זו יש גיבוי טכני חזק.',
    confidenceMedium: 'ביטחון בינוני: כמה אותות חיוביים, אבל לא כל הקריטריונים מתקיימים. התקדם בזהירות.',
    confidenceLow: 'ביטחון נמוך: אותות חלשים או סותרים. שקול להמתין לתנאים טובים יותר.',

    // Action Buttons
    tradeThisPlan: 'בצע עסקה',
    notRecommended: 'לא מומלץ',
    reviewAnyway: 'צפה בכל זאת',

    // Loading States
    analyzingMarket: 'מנתח את השוק...',
    pacingRequests: 'מווסת בקשות למניעת הגבלת קצב',
    fetchingRealTime: 'מושך נתונים בזמן אמת',
    stillScanning: 'עדיין סורק...',
    stocksAnalyzed: 'מניות נותחו עד כה',

    // Empty States
    noStocksInCategory: 'אין מניות בקטגוריה זו',
    tryDifferentFilter: 'נסה פילטר אחר',
    noMarketData: 'אין נתוני שוק זמינים',
    clickRefreshToScan: 'לחץ על רענן כדי לסרוק את השוק',

    // Portfolio Page
    portfolioTitle: 'תיק ההשקעות שלך לתרגול',
    portfolioSubtitle: 'עקוב אחר ההשקעות הווירטואליות שלך כאן. זכור, זה כסף לתרגול - למד מהרווחים וגם מההפסדים בלי סיכון אמיתי!',
    totalPortfolioValue: 'שווי תיק כולל',
    startedWith: 'התחלת עם $100,000 וירטואלי',
    portfolioBreakdown: 'פירוט התיק',
    cashAvailable: 'מזומן זמין',
    investedInStocks: 'מושקע במניות',
    unrealizedPL: 'רווח/הפסד לא ממומש',
    yourHoldings: 'ההחזקות שלך',
    updatePrices: 'עדכן מחירים',
    startOver: 'התחל מחדש',

    // Holding Card
    currentValue: 'שווי נוכחי',
    makingMoney: 'אתה מרוויח כסף!',
    currentlyDown: 'כרגע בירידה, אבל אל תיבהל',
    sharesOwned: 'מניות בבעלותך',
    youPaid: 'שילמת',
    nowWorth: 'שווה עכשיו',
    perShare: '/מניה',
    today: 'היום',
    sellShares: 'מכור מניות',

    // Empty Portfolio
    noInvestmentsYet: 'אין השקעות עדיין',
    noInvestmentsDesc: 'עדיין לא קנית מניות. עבור ללשונית "מצא הזדמנויות" כדי לגלות מניות ולבצע את העסקה הראשונה שלך!',
    waitingToBeInvested: 'מחכה להשקעה',

    // Learning Section
    understandingPL: 'הבנת הרווח וההפסד שלך',
    unrealizedPLExplanation: 'זהו הרווח או ההפסד "על הנייר" - זה מה שהיית מרוויח אם היית מוכר עכשיו. זה משתנה כאשר מחירי המניות זזים.',
    realizedPLExplanation: 'זה ננעל כאשר אתה באמת מוכר. ברגע שאתה מוכר, הרווח או ההפסד שלך הופך לאמיתי (ובכן, כסף וירטואלי אמיתי במקרה הזה!).',

    // Reset Modal
    startOverQuestion: 'להתחיל מחדש?',
    resetDescription: 'זה יאפס את התיק שלך ל-$100,000 וימחק את כל העסקאות שלך. זה כמו התחלה חדשה!',
    keepTrading: 'המשך לסחור',
    startFresh: 'התחל חדש',

    // Trade Success
    tradeSubmitted: 'העסקה נשלחה!',
    orderSubmittedFor: 'הוזמנה פקודה עבור',

    // Errors
    somethingWentWrong: 'משהו השתבש',
    loadingPortfolio: 'טוען את התיק שלך...',

    // Order Editor
    reviewTradePlan: 'סקירת תוכנית מסחר',
    customizeOrder: 'התאם את ההזמנה לפני ביצוע',
    currentPrice: 'מחיר נוכחי',
    quantityShares: 'כמות (מניות)',
    shares: 'מניות',
    totalInvestment: 'סה"כ השקעה',
    exceedsCash: 'חורג מהמזומן הזמין',
    marketPriceLive: 'מחיר שוק (חי)',
    takeProfitTarget: 'יעד לקיחת רווח',
    sellWhenReaches: 'מכור כאשר המחיר מגיע ל',
    stopLossProtection: 'הגנת סטופ לוס',
    exitIfDrops: 'צא אם המחיר יורד ל',
    orderSummary: 'סיכום הזמנה',
    ifStopLossHit: 'אם סטופ לוס יופעל:',
    ifTakeProfitHit: 'אם יעד הרווח יושג:',
    great: 'מעולה',
    okay: 'בסדר',
    risky: 'מסוכן',
    proTip: 'טיפ מקצועי:',
    proTipText: 'יחס של 1:2 או יותר אומר שהרווח הפוטנציאלי שלך לפחות כפול מהסיכון - זו הגדרת מסחר חכמה!',
    cancel: 'ביטול',
    processing: 'מעבד...',
    submitOrder: 'שלח הזמנה',
    insufficientFunds: 'אין מספיק כסף להזמנה זו',
    orderFailed: 'ההזמנה נכשלה. נסה שוב.',
    connectionError: 'נכשל בשליחת ההזמנה. בדוק את החיבור.',

    // Sell Modal
    sellSymbol: 'מכור',
    avgCost: 'עלות ממוצעת',
    liveMarketPrice: 'מחיר שוק חי',
    priceRefreshNote: 'המחיר מתרענן כל 5 שניות. הביצוע משתמש במחיר עדכני.',
    sharesToSell: 'מניות למכירה',
    available: 'זמין:',
    totalProceeds: 'סה"כ תמורה',
    costBasis: 'בסיס עלות',
    realizedPL: 'רווח/הפסד ממומש',
    executingOrder: 'מבצע הזמנה...',
    sellNow: 'מכור עכשיו',
    unableToFetchPrice: 'לא ניתן לקבל מחיר חי',

    // Trade History
    tradeHistory: 'היסטוריית עסקאות',
    recentPracticeTrades: 'העסקאות האחרונות שלך לתרגול',
    bought: 'נקנה',
    sold: 'נמכר',
    price: 'מחיר',
    total: 'סה"כ',
    planTakeProfitAt: 'תוכנית: רווח ב-',
    stopLossAt: '· סטופ ב-',
    noTradesYet: 'אין עסקאות עדיין',
    tradesWillAppear: 'כאשר תקנה או תמכור מניות, הן יופיעו כאן',
    showingRecentTrades: 'מציג 10 עסקאות אחרונות מתוך',
    totalTrades: 'סה"כ',

    // Alerts
    alerts: 'התראות',
    noNewAlerts: 'אין התראות חדשות',
    takeProfitExecuted: 'יעד רווח בוצע',
    stopLossExecuted: 'סטופ לוס בוצע',
    profit: 'רווח',
    loss: 'הפסד',
    markAllRead: 'סמן הכל כנקרא',
    autoExitAlerts: 'התראות יציאה אוטומטית',
    targetTP: 'יעד (TP)',
    targetSL: 'יעד (SL)',
    pendingOrders: 'פקודות ממתינות',
    autoMonitored: 'ניטור אוטומטי',
  }
} as const;

export type TranslationKey = keyof typeof translations.en;
