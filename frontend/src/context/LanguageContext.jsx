import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const translations = {
  en: {
    // General
    admin: 'Admin',
    adminDashboard: 'Admin Dashboard',
    adminSubtitle: 'Manage government projects on-chain via Solana',
    connected: 'Connected',
    walletNotConnected: 'Wallet not connected',
    connectWallet: 'Connect Wallet',
    adminBadge: 'ADMIN',
    submit: 'Submit On-Chain',
    submitting: 'Sending to Solana...',
    cancel: 'Cancel',
    confirm: 'Confirm',
    success: 'Success',
    error: 'Error',
    loading: 'Loading...',
    language: 'Language',

    // Access
    accessRequired: 'Admin Access Required',
    accessDesc: 'Connect your admin wallet (Phantom) to manage government projects on the Solana blockchain.',
    unauthorizedTitle: 'Unauthorized Wallet',
    unauthorizedDesc: 'This wallet is not authorized. Admin actions require the designated admin wallet.',
    connectedWallet: 'Connected wallet',

    // Tabs
    tabCreate: '📋 Create Project',
    tabAllocate: '💵 Allocate Budget',
    tabRelease: '📤 Release Funds',
    tabMilestone: '🎯 Milestones',
    tabDocument: '📄 Documents',
    tabClose: '🔒 Close Project',

    // Create Project
    createTitle: 'Create New Project (On-Chain)',
    projectId: 'Project ID',
    projectIdPlaceholder: 'e.g. kathmandu-bridge-007',
    projectName: 'Project Name',
    projectNamePlaceholder: 'Enter project name',
    province: 'Province',
    selectProvince: 'Select Province',
    district: 'District',
    selectDistrict: 'Select District',
    sector: 'Sector',
    selectSector: 'Select Sector',
    contractor: 'Contractor',
    contractorPlaceholder: 'Contractor name',
    totalBudget: 'Total Budget (NPR)',
    totalBudgetPlaceholder: 'Enter total budget',
    milestoneCount: 'Milestones',
    estimatedCompletion: 'Estimated Completion',
    description: 'Description (off-chain)',
    descriptionPlaceholder: 'Project description stored in MongoDB',
    budgetNote: 'Budget, name, and milestones stored on Solana. Province/district/description cached in MongoDB.',

    // Budget Summary
    budgetSummary: 'Budget Summary',
    allocatedBudget: 'Allocated Budget',
    releasedAmount: 'Released Amount',
    milestonesCompleted: 'Milestones Completed',
    utilizationRate: 'Utilization Rate',

    // Allocate
    allocateTitle: 'Allocate Budget (On-Chain)',
    selectProject: 'Select Project',
    amount: 'Amount (NPR)',
    amountPlaceholder: 'Enter amount',
    noteOffchain: 'Description (off-chain note)',

    // Release
    releaseTitle: 'Release Funds (On-Chain)',

    // Milestone
    milestoneTitle: 'Update Milestone (On-Chain)',
    milestoneIndex: 'Milestone Index (0-based)',
    milestoneDesc: 'Description',
    milestoneDescPlaceholder: 'Milestone description',
    milestoneStatus: 'Status',
    pending: 'Pending',
    inProgress: 'In Progress',
    completed: 'Completed',
    delayed: 'Delayed',

    // Document
    documentTitle: 'Record Document (On-Chain)',
    ipfsHash: 'IPFS Hash',
    ipfsHashPlaceholder: 'e.g. QmXo...',
    documentName: 'Document Name',
    documentNamePlaceholder: 'Enter document name',

    // Close
    closeTitle: 'Close Project (On-Chain)',
    closeWarning: '⚠️ Warning: Closing a project is permanent and recorded on-chain. No further mutations allowed.',
    selectActiveProject: 'Select Active Project',

    // Messages
    programNotLoaded: 'Program not loaded. Connect wallet first.',
    connectFirst: 'Connect wallet first.',
    projectCreated: 'Project created on-chain!',
    budgetAllocated: 'Budget allocated on-chain!',
    fundsReleased: 'Funds released on-chain!',
    milestoneUpdated: 'Milestone updated on-chain!',
    documentRecorded: 'Document recorded on-chain!',
    projectClosed: 'Project closed on-chain!',
    txLabel: 'TX',
    fillAllFields: 'Please fill all required fields.',
    invalidProgramId: 'Invalid Program ID. Check your .env configuration.',

    // Navbar
    home: 'Home',
    dashboard: 'Dashboard',
    projects: 'Projects',
  },

  ne: {
    // General
    admin: 'प्रशासक',
    adminDashboard: 'प्रशासक ड्यासबोर्ड',
    adminSubtitle: 'सोलाना ब्लकचेनमा सरकारी परियोजनाहरू व्यवस्थापन गर्नुहोस्',
    connected: 'जडित',
    walletNotConnected: 'वालेट जडित छैन',
    connectWallet: 'वालेट जडान गर्नुहोस्',
    adminBadge: 'प्रशासक',
    submit: 'अन-चेनमा पेश गर्नुहोस्',
    submitting: 'सोलानामा पठाउँदै...',
    cancel: 'रद्द गर्नुहोस्',
    confirm: 'पुष्टि गर्नुहोस्',
    success: 'सफल',
    error: 'त्रुटि',
    loading: 'लोड हुँदैछ...',
    language: 'भाषा',

    // Access
    accessRequired: 'प्रशासक पहुँच आवश्यक',
    accessDesc: 'सोलाना ब्लकचेनमा सरकारी परियोजनाहरू व्यवस्थापन गर्न आफ्नो प्रशासक वालेट (Phantom) जडान गर्नुहोस्।',
    unauthorizedTitle: 'अनधिकृत वालेट',
    unauthorizedDesc: 'यो वालेट अधिकृत छैन। प्रशासक कार्यहरूका लागि निर्दिष्ट प्रशासक वालेट आवश्यक छ।',
    connectedWallet: 'जडित वालेट',

    // Tabs
    tabCreate: '📋 परियोजना सिर्जना',
    tabAllocate: '💵 बजेट विनियोजन',
    tabRelease: '📤 कोष विमोचन',
    tabMilestone: '🎯 माइलस्टोन',
    tabDocument: '📄 कागजात',
    tabClose: '🔒 परियोजना बन्द',

    // Create Project
    createTitle: 'नयाँ परियोजना सिर्जना (अन-चेन)',
    projectId: 'परियोजना आईडी',
    projectIdPlaceholder: 'जस्तै kathmandu-bridge-007',
    projectName: 'परियोजना नाम',
    projectNamePlaceholder: 'परियोजना नाम प्रविष्ट गर्नुहोस्',
    province: 'प्रदेश',
    selectProvince: 'प्रदेश छान्नुहोस्',
    district: 'जिल्ला',
    selectDistrict: 'जिल्ला छान्नुहोस्',
    sector: 'क्षेत्र',
    selectSector: 'क्षेत्र छान्नुहोस्',
    contractor: 'ठेकेदार',
    contractorPlaceholder: 'ठेकेदार नाम',
    totalBudget: 'कुल बजेट (रु.)',
    totalBudgetPlaceholder: 'कुल बजेट प्रविष्ट गर्नुहोस्',
    milestoneCount: 'माइलस्टोनहरू',
    estimatedCompletion: 'अनुमानित समापन',
    description: 'विवरण (अफ-चेन)',
    descriptionPlaceholder: 'MongoDB मा भण्डारण हुने विवरण',
    budgetNote: 'बजेट, नाम, र माइलस्टोनहरू सोलानामा भण्डारण हुन्छ। प्रदेश/जिल्ला/विवरण MongoDB मा क्यास हुन्छ।',

    // Budget Summary
    budgetSummary: 'बजेट सारांश',
    allocatedBudget: 'विनियोजित बजेट',
    releasedAmount: 'विमोचित रकम',
    milestonesCompleted: 'माइलस्टोन पूरा',
    utilizationRate: 'उपयोग दर',

    // Allocate
    allocateTitle: 'बजेट विनियोजन (अन-चेन)',
    selectProject: 'परियोजना छान्नुहोस्',
    amount: 'रकम (रु.)',
    amountPlaceholder: 'रकम प्रविष्ट गर्नुहोस्',
    noteOffchain: 'विवरण (अफ-चेन नोट)',

    // Release
    releaseTitle: 'कोष विमोचन (अन-चेन)',

    // Milestone
    milestoneTitle: 'माइलस्टोन अपडेट (अन-चेन)',
    milestoneIndex: 'माइलस्टोन सूचकांक (०-आधारित)',
    milestoneDesc: 'विवरण',
    milestoneDescPlaceholder: 'माइलस्टोन विवरण',
    milestoneStatus: 'स्थिति',
    pending: 'पेन्डिङ',
    inProgress: 'प्रगतिमा',
    completed: 'सम्पन्न',
    delayed: 'ढिला',

    // Document
    documentTitle: 'कागजात रेकर्ड (अन-चेन)',
    ipfsHash: 'IPFS ह्यास',
    ipfsHashPlaceholder: 'जस्तै QmXo...',
    documentName: 'कागजात नाम',
    documentNamePlaceholder: 'कागजात नाम प्रविष्ट गर्नुहोस्',

    // Close
    closeTitle: 'परियोजना बन्द (अन-चेन)',
    closeWarning: '⚠️ चेतावनी: परियोजना बन्द गर्नु स्थायी हो र अन-चेनमा रेकर्ड हुन्छ। त्यसपछि कुनै परिवर्तन हुन सक्दैन।',
    selectActiveProject: 'सक्रिय परियोजना छान्नुहोस्',

    // Messages
    programNotLoaded: 'प्रोग्राम लोड भएन। पहिले वालेट जडान गर्नुहोस्।',
    connectFirst: 'पहिले वालेट जडान गर्नुहोस्।',
    projectCreated: 'परियोजना अन-चेनमा सिर्जना भयो!',
    budgetAllocated: 'बजेट अन-चेनमा विनियोजित भयो!',
    fundsReleased: 'कोष अन-चेनमा विमोचित भयो!',
    milestoneUpdated: 'माइलस्टोन अन-चेनमा अपडेट भयो!',
    documentRecorded: 'कागजात अन-चेनमा रेकर्ड भयो!',
    projectClosed: 'परियोजना अन-चेनमा बन्द भयो!',
    txLabel: 'TX',
    fillAllFields: 'कृपया सबै आवश्यक फिल्डहरू भर्नुहोस्।',
    invalidProgramId: 'अमान्य Program ID। कृपया .env कन्फिगरेसन जाँच गर्नुहोस्।',

    // Navbar
    home: 'गृहपृष्ठ',
    dashboard: 'ड्यासबोर्ड',
    projects: 'परियोजनाहरू',
  },
};

const LanguageContext = createContext({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export default function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem('govfund-lang') || 'en';
    } catch {
      return 'en';
    }
  });

  const setLang = useCallback((newLang) => {
    setLangState(newLang);
    try {
      localStorage.setItem('govfund-lang', newLang);
    } catch {}
  }, []);

  const t = useCallback(
    (key) => {
      return translations[lang]?.[key] || translations.en?.[key] || key;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}
