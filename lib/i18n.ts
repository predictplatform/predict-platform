export type Lang = 'ar' | 'en';

export const translations = {
  ar: {
    // ── Navbar ──────────────────────────────────────────────────────────
    nav: {
      home:        'الرئيسية',
      matches:     'المباريات',
      standings:   'الترتيب',
      predict:     'توقعاتي',
      leaderboard: 'الليدربورد',
      stats:       'الإحصائيات',
      profile:     'ملفي',
      signIn:      'تسجيل الدخول',
      signUp:      'إنشاء حساب',
    },

    // ── Footer ──────────────────────────────────────────────────────────
    footer: {
      contactUs:       'تواصل معنا',
      contactQuestion: 'عندك اقتراح؟ حصلت خطأ؟ أو ودك تتواصل معنا؟',
      copyright:       '⚽ دوري التوقعات — مجاني بالكامل | لا مراهنات مالية',
      whatsappAlt:     'تابعنا على منصة X',
      twitterAlt:      'تابعنا على منصة X',
      tiktokAlt:       'تابعنا على تيك توك',
    },

    // ── Home page ────────────────────────────────────────────────────────
    home: {
      heroTitle:        '⚽ دوري التوقعات',
      heroSubtitle:     'توقع المباريات .. جمّع نقاط ونافس اخوياك',
      predictNow:       'توقع الآن 🎯',
      leaderboardBtn:   'الليدربورد 🏆',
      pointsSystem:     'نظام النقاط',
      availableLeagues: 'الدوريات المتاحة',
      todayMatches:     'مباريات اليوم',
      viewAll:          'عرض الكل ←',
      noMatchesToday:   'لا توجد مباريات اليوم',
      noMatchesHint:    'تحقق من صفحة المباريات لأيام أخرى',
      pts5Label:  'نتيجة دقيقة 100%',
      pts4Label:  'اتجاه + فارق صح',
      pts3Label:  'اتجاه صحيح فقط',
      pts0Label:  'غلط كلياً',
    },

    // ── Matches page ─────────────────────────────────────────────────────
    matches: {
      title:       'المباريات',
      today:       'اليوم',
      yesterday:   'أمس',
      prevDays:    'الأيام السابقة',
      nextDays:    'الأيام القادمة',
      filterAll:      'الكل',
      filterLive:     '🔴 مباشر',
      filterUpcoming: 'القادمة',
      filterFinished: 'المنتهية',
      noMatches:       'لا توجد مباريات في هذا اليوم',
      noMatchesHint:   'للدوريات المدعومة: روشن، إنجليزي، إسباني، إيطالي، أبطال أوروبا',
    },

    // ── Predict page ──────────────────────────────────────────────────────
    predict: {
      title:           'توقعاتي 🎯',
      matchesOf:       'مباريات',
      welcomeHello:    'مرحباً',
      welcomeMsg:      'توقع نتائج المباريات القادمة',
      backToAll:       '← العودة للكل',
      upcomingBadge:   'المباريات القادمة',
      fullHistory:     'سجل كامل 📋',
      leaderboardNeed: 'وصّل 10 توقعات عشان تدخل الليدربورد! 🎯',
      remaining:       'باقي',
      noUpcoming:      'لا توجد مباريات قادمة للتوقع حالياً',
      notSignedTitle:  'سجل دخولك للتوقع',
      notSignedDesc:   'يجب تسجيل الدخول لتتمكن من حفظ توقعاتك وتجميع النقاط',
      loginBtn:        'تسجيل الدخول / إنشاء حساب',
      toastSuccess:    'تم حفظ توقعك بنجاح ✓',
      toastError:      'حدث خطأ:',
    },

    // ── Leaderboard page ─────────────────────────────────────────────────
    leaderboard: {
      title:       'الليدربورد 🏆',
      yourRank:    'مركزك:',
      allLabel:    'عام',
      qualifying:       'في طور التأهل 🎯',
      qualifyingDesc:   'يحتاج كل مستخدم',
      qualifyingDesc2:  'توقعات على الأقل في هذا التصنيف للدخول في الترتيب الرسمي',
      colUser:     'المستخدم',
      colPreds:    'التوقعات',
      colRemaining:'المتبقي',
      youLabel:    '(أنت)',
      remaining:   'باقي',
      noPlayers:   'لا يوجد لاعبون مؤهلون بعد. وصّل 10 توقعات لتدخل الترتيب! 🏆',
    },

    // ── Leaderboard table ────────────────────────────────────────────────
    leaderboardTable: {
      colHash:     '#',
      colUser:     'المستخدم',
      colAccuracy: 'الدقة',
      colPoints:   'النقاط',
      colAdjusted: 'المعدّلة',
      youLabel:    '(أنت)',
      noPlayers:   'لا يوجد لاعبون مؤهلون بعد. وصّل 10 توقعات لتدخل الترتيب! 🏆',
    },

    // ── Standings page ────────────────────────────────────────────────────
    standings: {
      title:        'جدول الترتيب',
      season:       'موسم 2025/26',
      noData:       'الترتيب غير متاح حالياً',
      colTeam:      'الفريق',
      colPlayed:    'لع',
      colWin:       'ف',
      colDraw:      'ت',
      colLose:      'خ',
      colGoals:     'أه',
      colDiff:      '±',
      colPoints:    'نق',
      legendCL:     'دوري الأبطال',
      legendEL:     'الدوري الأوروبي',
      legendRel:    'هبوط',
    },

    // ── Stats page ────────────────────────────────────────────────────────
    stats: {
      title:       'الإحصائيات 📊',
      season:      'موسم 2025/26',
      topScorers:  'ترتيب الهدافين',
      goals:       'هدف',
      assists:     'تمريرة',
    },

    // ── History page ──────────────────────────────────────────────────────
    history: {
      title:           'سجل توقعاتي 📋',
      subtitle:        'كل توقعاتك السابقة مع النتائج والنقاط',
      backToPredict:   '← التوقعات',
      totalPredictions:'إجمالي التوقعات',
      pointsEarned:    'النقاط المكتسبة',
      accuracy:        'نسبة الدقة',
      yourPred:        'توقعك',
      result:          'النتيجة',
      pending:         'في انتظار نتيجة المباراة ⏳',
      noPreds:         'لم تسجل أي توقعات بعد',
      predictNow:      'توقع الآن',
      notSignedTitle:  'سجل دخولك أولاً',
      notSignedLogin:  'تسجيل الدخول',
    },

    // ── User profile page ─────────────────────────────────────────────────
    profile: {
      notFoundTitle:  'المستخدم غير موجود',
      notFoundDesc:   'لا يوجد مستخدم باسم',
      leaderboardBtn: 'الليدربورد',
      totalPoints:    'نقطة',
      memberSince:    'عضو منذ:',
      editProfile:    'تعديل الملف',
      qualified:      'مؤهل في الليدربورد',
      qualifying:     'في طور التأهل — باقي',
      qualifyingEnd:  'توقعات للدخول للليدربورد',
      statsTitle:     'الإحصائيات',
      totalPreds:     'إجمالي التوقعات',
      accuracyLabel:  'نسبة الدقة',
      correctPreds:   'توقعات صحيحة',
      wrongPreds:     'توقعات خاطئة',
      byLeague:       'حسب الدوري',
      colTotal:       'إجمالي',
      colCorrect:     'صحيح',
      colWrong:       'خطأ',
      noPreds:        'لم تسجل أي توقعات بعد',
      noPredsOther:   'لم يسجل',
      noPredsOtherEnd:'أي توقعات بعد',
      startPredict:   'ابدأ التوقع الآن',
    },

    // ── Setup page ────────────────────────────────────────────────────────
    setup: {
      title:          'أكمل ملفك الشخصي',
      subtitle:       'خطوة واحدة قبل الانضمام للمنافسة',
      usernameLabel:  'اسم المستخدم',
      usernamePlaceholder: 'مثال: AbdullahSA',
      usernameHint:   'يظهر في الليدربورد — 3 إلى 20 حرفاً',
      teamLabel:      'الفريق المفضل',
      teamOptional:   '(اختياري)',
      teamPlaceholder:'— اختر فريقك المفضل —',
      savingBtn:      'جاري الحفظ...',
      saveEditBtn:    'حفظ التعديلات ✓',
      startBtn:       'ابدأ المنافسة 🚀',
    },

    // ── MatchCard ─────────────────────────────────────────────────────────
    matchCard: {
      finished:       'انتهت',
      yourPred:       'توقعك:',
      points:         'نقطة',
      recorded:       'تم تسجيل توقعك ✓',
      predictBtn:     'توقع النتيجة 🎯',
      matchLocked:    'انطلقت المباراة — التوقع مغلق 🔒',
      soonPrefix:     'يفتح التوقع قريباً ⏳ يفتح',
      halfTime:       'ش.أ',
    },

    // ── PredictionCard ────────────────────────────────────────────────────
    predCard: {
      yourPredLabel:   'توقعك',
      resultLabel:     'النتيجة',
      calcPoints:      'جاري حساب النقاط...',
      confirmBtn:      'تأكيد التوقع',
      savingBtn:       'جاري الحفظ...',
      recordedMsg:     'تم تسجيل توقعك ✓ — لا يمكن التعديل بعد الآن',
      shareTwitter:    'شارك',
      shareWhatsapp:   'واتساب',
      matchLocked:     'انطلقت المباراة — التوقع مغلق',
    },

    // ── PredictionStats ───────────────────────────────────────────────────
    predStats: {
      beFirst:   'كن أول من يتوقع هذه المباراة!',
      draw:      'تعادل',
      predCount: 'توقع',
    },

    // ── ProfileSetupBanner ────────────────────────────────────────────────
    banner: {
      incomplete: 'ملفك الشخصي غير مكتمل — أضف اسم مستخدم لتظهر في الليدربورد',
      completeNow:'أكمل الآن',
    },

    // ── Points labels (lib/points.ts) ─────────────────────────────────────
    points: {
      pending:     'في الانتظار',
      exact:       'نتيجة دقيقة ⭐',
      dirAndGap:   'اتجاه + فارق ✅',
      dirOnly:     'اتجاه صحيح 👍',
      wrong:       'غلط كلياً ❌',
    },

    // ── LeagueSelector ────────────────────────────────────────────────────
    leagues: {
      all:        'الكل',
      saudi:      'روشن',
      english:    'إنجليزي',
      spanish:    'إسباني',
      italian:    'إيطالي',
      german:     'ألماني',
    },

    // ── Locale ────────────────────────────────────────────────────────────
    locale: 'ar-SA',
    dir: 'rtl' as 'rtl' | 'ltr',
  },

  en: {
    // ── Navbar ──────────────────────────────────────────────────────────
    nav: {
      home:        'Home',
      matches:     'Matches',
      standings:   'Standings',
      predict:     'My Predictions',
      leaderboard: 'Leaderboard',
      stats:       'Statistics',
      profile:     'My Profile',
      signIn:      'Sign In',
      signUp:      'Sign Up',
    },

    // ── Footer ──────────────────────────────────────────────────────────
    footer: {
      contactUs:       'Contact Us',
      contactQuestion: 'Have feedback, found a bug, or want to contact us?',
      copyright:       '⚽ Dawri Al Tawaquat — Completely free | No real-money betting',
      whatsappAlt:     'Follow us on X',
      twitterAlt:      'Follow us on X',
      tiktokAlt:       'Follow us on TikTok',
    },

    // ── Home page ────────────────────────────────────────────────────────
    home: {
      heroTitle:        '⚽ Dawri Al Tawaquat',
      heroSubtitle:     'Predict match results, earn points, and compete with friends',
      predictNow:       'Make Your Prediction 🎯',
      leaderboardBtn:   'Rankings 🏆',
      pointsSystem:     'Scoring System',
      availableLeagues: 'Available Leagues',
      todayMatches:     "Today's Matches",
      viewAll:          'View All →',
      noMatchesToday:   'No matches today',
      noMatchesHint:    'Check the matches page for other days',
      pts5Label:  'Exact score prediction',
      pts4Label:  'Correct winner & goal difference',
      pts3Label:  'Correct winner only',
      pts0Label:  'Wrong prediction',
    },

    // ── Matches page ─────────────────────────────────────────────────────
    matches: {
      title:       'Matches',
      today:       'Today',
      yesterday:   'Yesterday',
      prevDays:    'Previous days',
      nextDays:    'Next days',
      filterAll:      'All',
      filterLive:     '🔴 Live',
      filterUpcoming: 'Upcoming',
      filterFinished: 'Finished',
      noMatches:       'No matches on this day',
      noMatchesHint:   'Supported leagues: Saudi Pro, EPL, La Liga, Serie A, UCL',
    },

    // ── Predict page ──────────────────────────────────────────────────────
    predict: {
      title:           'My Predictions 🎯',
      matchesOf:       'Matches of',
      welcomeHello:    'Hello',
      welcomeMsg:      'Predict upcoming match results',
      backToAll:       '→ Back to all',
      upcomingBadge:   'Upcoming Matches',
      fullHistory:     'Prediction History 📋',
      leaderboardNeed: 'Make 10 predictions to join the leaderboard! 🎯',
      remaining:       'remaining',
      noUpcoming:      'No upcoming matches to predict right now',
      notSignedTitle:  'Sign in to predict',
      notSignedDesc:   'You need to sign in to save your predictions and earn points',
      loginBtn:        'Sign In / Create Account',
      toastSuccess:    'Prediction saved successfully ✓',
      toastError:      'An error occurred:',
    },

    // ── Leaderboard page ─────────────────────────────────────────────────
    leaderboard: {
      title:       'Leaderboard 🏆',
      yourRank:    'Your rank:',
      allLabel:    'Overall',
      qualifying:       'In Qualifying Stage 🎯',
      qualifyingDesc:   'Each user needs',
      qualifyingDesc2:  'predictions minimum in this category to enter the official standings',
      colUser:     'User',
      colPreds:    'Predictions',
      colRemaining:'Remaining',
      youLabel:    '(You)',
      remaining:   'remaining',
      noPlayers:   'No qualified players yet. Make 10 predictions to join! 🏆',
    },

    // ── Leaderboard table ────────────────────────────────────────────────
    leaderboardTable: {
      colHash:     '#',
      colUser:     'User',
      colAccuracy: 'Accuracy',
      colPoints:   'Points',
      colAdjusted: 'Adjusted',
      youLabel:    '(You)',
      noPlayers:   'No qualified players yet. Make 10 predictions to join! 🏆',
    },

    // ── Standings page ────────────────────────────────────────────────────
    standings: {
      title:        'Standings',
      season:       'Season 2025/26',
      noData:       'Standings not available right now',
      colTeam:      'Team',
      colPlayed:    'P',
      colWin:       'W',
      colDraw:      'D',
      colLose:      'L',
      colGoals:     'GF:GA',
      colDiff:      '±',
      colPoints:    'Pts',
      legendCL:     'Champions League',
      legendEL:     'Europa League',
      legendRel:    'Relegation',
    },

    // ── Stats page ────────────────────────────────────────────────────────
    stats: {
      title:       'Statistics 📊',
      season:      'Season 2025/26',
      topScorers:  'Top Scorers',
      goals:       'goals',
      assists:     'assists',
    },

    // ── History page ──────────────────────────────────────────────────────
    history: {
      title:           'My Prediction History 📋',
      subtitle:        'All your past predictions with results and points',
      backToPredict:   '→ Predictions',
      totalPredictions:'Total Predictions',
      pointsEarned:    'Points Earned',
      accuracy:        'Prediction Accuracy',
      yourPred:        'Your prediction',
      result:          'Result',
      pending:         'Waiting for the match result ⏳',
      noPreds:         'No predictions recorded yet',
      predictNow:      'Predict Now',
      notSignedTitle:  'Sign in first',
      notSignedLogin:  'Sign In',
    },

    // ── User profile page ─────────────────────────────────────────────────
    profile: {
      notFoundTitle:  'User not found',
      notFoundDesc:   'No user with the name',
      leaderboardBtn: 'Leaderboard',
      totalPoints:    'points',
      memberSince:    'Member since:',
      editProfile:    'Edit Profile',
      qualified:      'Qualified for Leaderboard',
      qualifying:     'In qualifying — ',
      qualifyingEnd:  'predictions left to enter the leaderboard',
      statsTitle:     'Statistics',
      totalPreds:     'Total Predictions',
      accuracyLabel:  'Prediction Accuracy',
      correctPreds:   'Correct Predictions',
      wrongPreds:     'Incorrect Predictions',
      byLeague:       'By League',
      colTotal:       'Total',
      colCorrect:     'Correct',
      colWrong:       'Wrong',
      noPreds:        'No predictions recorded yet',
      noPredsOther:   '',
      noPredsOtherEnd: 'has no predictions yet',
      startPredict:   'Start Predicting Now',
    },

    // ── Setup page ────────────────────────────────────────────────────────
    setup: {
      title:          'Complete Your Profile',
      subtitle:       'One step before joining the competition',
      usernameLabel:  'Username',
      usernamePlaceholder: 'e.g. AbdullahSA',
      usernameHint:   'Shown on the leaderboard — 3 to 20 characters',
      teamLabel:      'Favorite Team',
      teamOptional:   '(optional)',
      teamPlaceholder:'— Choose your favorite team —',
      savingBtn:      'Saving...',
      saveEditBtn:    'Save Changes ✓',
      startBtn:       'Start Competing 🚀',
    },

    // ── MatchCard ─────────────────────────────────────────────────────────
    matchCard: {
      finished:       'Finished',
      yourPred:       'Your prediction:',
      points:         'pts',
      recorded:       'Prediction recorded ✓',
      predictBtn:     'Predict Result 🎯',
      matchLocked:    'Match started — predictions closed 🔒',
      soonPrefix:     'Opens soon ⏳ Opens on',
      halfTime:       'HT',
    },

    // ── PredictionCard ────────────────────────────────────────────────────
    predCard: {
      yourPredLabel:   'Your Prediction',
      resultLabel:     'Result',
      calcPoints:      'Calculating points...',
      confirmBtn:      'Confirm Prediction',
      savingBtn:       'Saving...',
      recordedMsg:     'Prediction submitted ✓ — it can no longer be changed',
      shareTwitter:    'Share',
      shareWhatsapp:   'WhatsApp',
      matchLocked:     'Match started — predictions closed',
    },

    // ── PredictionStats ───────────────────────────────────────────────────
    predStats: {
      beFirst:   'Be the first to predict this match!',
      draw:      'Draw',
      predCount: 'predictions',
    },

    // ── ProfileSetupBanner ────────────────────────────────────────────────
    banner: {
      incomplete: 'Your profile is incomplete — add a username to appear on the leaderboard',
      completeNow:'Complete Now',
    },

    // ── Points labels ─────────────────────────────────────────────────────
    points: {
      pending:     'Pending',
      exact:       'Exact score ⭐',
      dirAndGap:   'Correct winner & goal diff ✅',
      dirOnly:     'Correct winner 👍',
      wrong:       'Wrong prediction ❌',
    },

    // ── LeagueSelector ────────────────────────────────────────────────────
    leagues: {
      all:        'All',
      saudi:      'Saudi',
      english:    'EPL',
      spanish:    'La Liga',
      italian:    'Serie A',
      german:     'Bundesliga',
    },

    // ── Locale ────────────────────────────────────────────────────────────
    locale: 'en-US',
    dir: 'ltr' as 'rtl' | 'ltr',
  },
} as const;

export type Translations = typeof translations.ar;

// أسماء الدوريات الكاملة — مفصولة عن as const لأن المفاتيح أرقام
export const LEAGUE_NAMES: Record<Lang, Record<number, string>> = {
  ar: {
    944: 'دوري روشن السعودي',
    8:   'الدوري الإنجليزي الممتاز',
    564: 'الدوري الإسباني',
    384: 'الدوري الإيطالي',
    82:  'الدوري الألماني',
  },
  en: {
    944: 'Saudi Pro League',
    8:   'Premier League',
    564: 'La Liga',
    384: 'Serie A',
    82:  'Bundesliga',
  },
};
