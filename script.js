// Global variables
let selectedIndustry = '';
let selectedRevenue = 0;
let sessionId = '';
let currentQuestionIndex = 0;
let questions = [];
let responses = [];
let currentResults = null; // Store results globally for reuse

// API Configuration
const API_URL = 'https://leakdetector.mainnov.tech/proxy.php';

// NEW: Capture URL parameters immediately
const urlParams = new URLSearchParams(window.location.search);
const nameFromURL = urlParams.get('name') || '';
const companyFromURL = urlParams.get('company') || '';
const industryFromURL = urlParams.get('industry') || '';
const revenueFromURL = parseFloat(urlParams.get('revenue')) || 0;
const emailFromURL = urlParams.get('email') || '';

// Store these in a global object for easy access
const userData = {
  name: nameFromURL,
  company: companyFromURL,
  industry: industryFromURL,
  revenue: revenueFromURL * 1000000, // Convert from millions to actual amount
  email: emailFromURL
};

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
  console.log('Business Profit Leak Diagnostic initialized');
  console.log('User data from URL:', userData);
  
  generateSessionId();
  
  // Check if we have the required data from URL
  if (userData.industry && userData.revenue > 0) {
    // Skip directly to quiz
    selectedIndustry = userData.industry;
    selectedRevenue = userData.revenue;
    
    // Hide industry and revenue screens
    hideAllScreens();
    
    // Wait for questions to load BEFORE starting assessment
    await loadQuestions();
    console.log('Questions loaded, now starting assessment');
    
    // Start assessment directly (no timeout needed now)
    startAssessmentDirectly();
  } else {
    // Normal flow if no URL parameters
    loadIndustries();
    loadQuestions();
  }
});




// Generate unique session ID
function generateSessionId() {
  sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  console.log('Generated session ID:', sessionId);
}

// Load industries for selection
function loadIndustries() {
  console.log('Loading industries directly...');
  
  const industries = [
    'Beauty & Skincare',
    'Supplements & Nutraceuticals',
    'Fashion & Apparel',
    'Home & Garden',
    'Pet Products',
    'Food & Beverage',
    'Electronics & Tech Accessories',
    'Fitness & Wellness',
    'Baby & Kids',
    'Jewelry & Accessories',
    'Outdoor & Sports',
    'Automotive Accessories',
    'Arts & Crafts',
    'Personal Care (Salons/Spas)',
    'Subscription Boxes',
    'Consulting',
    'Tech Services',
    'Real Estate',
    'Business Services',
    'Education',
    'Marketing Services',
    'Recruiting',
    'Nonprofit',
    'Retail Consulting',
    'Health Tech',
    'Publishing',
    'Electronics & Tech (SaaS)',
    'Ecommerce Services',
    'Tech Consulting',
    'Personal Care (Dental)',
    'Business Advocacy',
    'Retail',
    'Default (Other SMBs)'
  ];
  
  console.log('About to display', industries.length, 'industries');
  displayIndustries(industries);
}

function displayIndustries(industries) {
  const grid = document.getElementById('industry-grid');
  if (!grid) {
    console.error('industry-grid element not found!');
    return;
  }
  
  grid.innerHTML = '';
  
  industries.forEach(industry => {
    const button = document.createElement('button');
    button.className = 'industry-btn';
    button.textContent = industry;
    button.onclick = () => selectIndustry(industry, button);
    grid.appendChild(button);
  });
  
  console.log('Industries displayed:', industries.length);
}

// Industry selection
function selectIndustry(industry, button) {
  selectedIndustry = industry;
  
  document.querySelectorAll('.industry-btn').forEach(btn => {
    btn.classList.remove('selected');
  });
  
  button.classList.add('selected');
  document.getElementById('continue-to-revenue').classList.remove('hidden');
  
  console.log('Selected industry:', industry);
}

// Show revenue input screen
function showRevenueScreen() {
  if (!selectedIndustry) {
    alert('Please select an industry first.');
    return;
  }
  
  hideAllScreens();
  document.getElementById('revenue-input').classList.add('active');
  updateProgress(20);
}

// Revenue selection
function selectRevenue(amount) {
  selectedRevenue = amount;
  
  document.querySelectorAll('.revenue-btn').forEach(btn => {
    btn.classList.remove('selected');
  });
  
  event.target.classList.add('selected');
  document.getElementById('custom-revenue').value = '';
  document.getElementById('start-assessment').classList.remove('hidden');
  
  console.log('Selected revenue:', amount);
}

function useCustomRevenue() {
  const customValue = document.getElementById('custom-revenue').value;
  if (!customValue || customValue <= 0) {
    alert('Please enter a valid revenue amount');
    return;
  }
  
  selectedRevenue = parseFloat(customValue);
  
  document.querySelectorAll('.revenue-btn').forEach(btn => {
    btn.classList.remove('selected');
  });
  
  document.getElementById('start-assessment').classList.remove('hidden');
  
  console.log('Custom revenue:', selectedRevenue);
}

function loadQuestions() {
    // Check sessionStorage first
    const cachedQuestions = sessionStorage.getItem('quizQuestions');
    if (cachedQuestions) {
        questions = JSON.parse(cachedQuestions);
        console.log('Loaded', questions.length, 'questions from cache');
        return Promise.resolve(questions);
    }
    
    // Fall back to API if no cache
    return fetch(`${API_URL}?action=getQuizQuestions`)
        .then(response => response.json())
        .then(data => {
            questions = data;
            console.log('Loaded', questions.length, 'questions from API');
            return data;
        })
        .catch(error => {
            console.error('Error loading questions:', error);
            handleError(error);
        });
}


// Load quiz questions

/*
function loadQuestions() {
  return fetch(`${API_URL}?action=getQuizQuestions`)
    .then(response => response.json())
    .then(data => {
      questions = data;
      console.log('Loaded', questions.length, 'questions');
      return data; // Add this line
    })
    .catch(error => {
      console.error('Error loading questions:', error);
      handleError(error);
    });
}*/


// Start the assessment
function startAssessment() {
  if (!selectedIndustry || !selectedRevenue) {
    alert('Please select both industry and revenue first.');
    return;
  }
  
  currentQuestionIndex = 0;
  responses = [];
  
  hideAllScreens();
  document.getElementById('quiz-screen').classList.add('active');
  updateProgress(25);
  displayQuestion();
}

function startAssessmentDirectly() {
  console.log('Starting assessment with:', selectedIndustry, selectedRevenue);
  
  currentQuestionIndex = 0;
  responses = [];
  
  hideAllScreens();
  document.getElementById('quiz-screen').classList.add('active');
  updateProgress(25);
  
  // Update header to show personalized greeting
  const header = document.querySelector('.header h1');
  if (header && userData.name) {
    header.textContent = `${userData.name}'s Revenue Leak Analysis`;
  }
  
  displayQuestion();
}



// Display current question
function displayQuestion() {
  if (currentQuestionIndex >= questions.length) {
    calculateResults();
    return;
  }
  
  const question = questions[currentQuestionIndex];
  
  document.getElementById('section-title').textContent = question.section;
  document.getElementById('question-counter').textContent = 
    `Question ${currentQuestionIndex + 1} of ${questions.length}`;
  
  document.getElementById('question-text').textContent = question.text;
  
  const optionsContainer = document.getElementById('options-container');
  optionsContainer.innerHTML = '';
  
  question.options.forEach((option, index) => {
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option';
    optionDiv.onclick = () => selectOption(option, optionDiv);
    
    const optionText = document.createElement('span');
    optionText.textContent = option.text;
    
    optionDiv.appendChild(optionText);
    optionsContainer.appendChild(optionDiv);
  });
  
  const existingResponse = responses.find(r => r.questionId === question.id);
  if (existingResponse) {
    const options = optionsContainer.querySelectorAll('.option');
    question.options.forEach((opt, idx) => {
      if (opt.value === existingResponse.value) {
        options[idx].classList.add('selected');
      }
    });
    document.getElementById('next-question').disabled = false;
  } else {
    document.getElementById('next-question').disabled = true;
  }
  
  document.getElementById('prev-question').disabled = currentQuestionIndex === 0;
  
  if (currentQuestionIndex === questions.length - 1) {
    document.getElementById('next-question').textContent = 'See Results';
  } else {
    document.getElementById('next-question').textContent = 'Next';
  }
  
  const progress = 25 + (currentQuestionIndex / questions.length * 65);
  updateProgress(progress);
}

// Handle option selection
function selectOption(option, optionDiv) {
  document.querySelectorAll('.option').forEach(opt => {
    opt.classList.remove('selected');
  });
  
  optionDiv.classList.add('selected');
  
  const question = questions[currentQuestionIndex];
  const existingIndex = responses.findIndex(r => r.questionId === question.id);
  
  const response = {
    questionId: question.id,
    question: question.text,
    category: question.category,
    answer: option.text,
    value: option.value
  };
  
  if (existingIndex >= 0) {
    responses[existingIndex] = response;
  } else {
    responses.push(response);
  }
  
  document.getElementById('next-question').disabled = false;
}

// Navigate to next question
function nextQuestion() {
  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex++;
    displayQuestion();
  } else {
    calculateResults();
  }
}

// Navigate to previous question
function previousQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    displayQuestion();
  }
}

// Calculate and display results
function calculateResults() {
  if (responses.length < questions.length) {
    alert('Please answer all questions before seeing results.');
    return;
  }

  // ADD THIS DEBUG LINE
  console.log('Sending to backend:', {
    name: userData.name,
    company: userData.company,
    email: userData.email
  });
  
  showLoading('Analyzing your profit leaks...');
  
  const params = new URLSearchParams({
    action: 'calculateLeakage',
    industry: selectedIndustry,
    revenue: selectedRevenue,
    sessionId: sessionId,
    responses: JSON.stringify(responses),
    name: userData.name,
    company: userData.company,
    email: userData.email
  });
  
  fetch(API_URL + '?' + params.toString())
    .then(response => response.json())
    .then(result => {
      currentResults = result; // Store results globally
      displayResults(result);
    })
    .catch(error => {
      console.error('Error calculating results:', error);
      hideLoading();
      alert('Error calculating results. Please try again.');
    });
}

// Display results - NOW SHOWS SUMMARY FIRST
function displayResults(result) {
  hideLoading();
  
  if (result.error) {
    alert('Error calculating results: ' + result.error);
    return;
  }

  // Personalize the headline if we have user data
  if (userData.name && userData.company) {
    const headline = document.querySelector('.results-header h2');
    if (headline) {
      headline.textContent = `${userData.name}, Your ${userData.company} Profit Leak Analysis`;
    }
  }
  
  // Store results globally
  currentResults = result;
  
  // Show SUMMARY screen first (not full results)
  hideAllScreens();
  document.getElementById('result-summary-screen').classList.add('active');

  // Hide progress bar on results screen - ADD THIS
  const progressContainer = document.querySelector('.progress-container');
  if (progressContainer) {
    progressContainer.style.display = 'none';
  }

  // Reduce header box height on results screen only - ADD THIS
  const headerElement = document.querySelector('.header');
  if (headerElement) {
    headerElement.style.paddingBottom = '10px';
  }

  const experienceText = document.querySelector('.experience');
  if (experienceText) {
    experienceText.style.marginBottom = '5px';
  }
  
  // Hide subtitle text on results page to save vertical space
  const headerSubtitle = document.querySelector('.subtitle');
  if (headerSubtitle) {
    headerSubtitle.style.display = 'none';
  }
  // Pre-fill email if we have it from URL
  if (userData.email) {
    const emailInput = document.getElementById('inline-report-email');
    if (emailInput) {
      emailInput.value = userData.email;
    }
  }
  updateProgress(100);
  
  // Populate summary data
  document.getElementById('summary-industry').textContent = result.industry;
  // Don't show percentage separately since it's in the pie chart
  //document.getElementById('summary-leak-percentage').textContent = 
  //  result.totalLeakagePercent.toFixed(1) + '%';
  document.getElementById('summary-leak-dollars').textContent = 
    formatCurrency(result.totalLeakageDollars);
  document.getElementById('summary-leak-percentage-text').textContent = 
  result.totalLeakagePercent.toFixed(1) + '%';
  
  // Show biggest opportunity only
  if (result.topThreeLeaks && result.topThreeLeaks[0]) {
    document.getElementById('biggest-leak-category').textContent = result.topThreeLeaks[0].category;
    document.getElementById('biggest-leak-dollar').textContent = 
      formatCurrency(result.topThreeLeaks[0].leakageDollars);
  }
  
  // Draw pie chart
  drawPieChart(result.totalLeakagePercent);
  
  // Add inline email handler
  document.getElementById('inline-send-report-btn').addEventListener('click', function() {
    handleInlineEmailSubmit(result);
  });
  
  // Don't show modal anymore - email is inline
  // No setTimeout for modal
}


  

function formatCurrency(amount) {
  if (amount >= 1000000) {
    return '$' + (amount / 1000000).toFixed(1) + 'M';
  } else if (amount >= 1000) {
    return '$' + Math.round(amount / 1000) + 'K';
  } else {
    return '$' + Math.round(amount);
  }
}

// ========== COMPLETE PDF TEMPLATE FUNCTION ==========
// ADD THIS ENTIRE FUNCTION AFTER formatCurrency() IN script.js

function generateHTMLReportTemplate(result) {
  
  // ========== DATA MAPPING ==========
  const leakagePercent = result.totalLeakagePercent || 17.1;
  const totalLoss = result.totalLeakageDollars || 1103000;
  const revenue = result.revenue || 6450000;
  const dailyLoss = Math.round(totalLoss / 365);
  const weeklyLoss = Math.round(totalLoss / 52);
  const monthlyLoss = Math.round(weeklyLoss * 4);
  
  const contactName = userData.name || result.userName || 'Client';
  const clientName = userData.company || result.companyName || 'Your Company';
  
  const today = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const clientDate = months[today.getMonth()] + ' ' + today.getDate() + ', ' + today.getFullYear();
  
  const sortedLeaks = [...result.leaks].sort((a, b) => b.leakageDollars - a.leakageDollars);
  const top3Leaks = sortedLeaks.slice(0, 3);
  const top8Leaks = sortedLeaks.slice(0, 8);
  const otherLeaks = sortedLeaks.slice(3);
  
  const top3Total = top3Leaks.reduce((sum, leak) => sum + leak.leakageDollars, 0);
  const top3Percent = ((top3Total / totalLoss) * 100).toFixed(0);
  const other9Total = otherLeaks.reduce((sum, leak) => sum + leak.leakageDollars, 0);
  
  const roiInvestment = 25000;
  const week1Payment = 5000;
  const consultantCost = 150000;
  const consultantCostMax = 200000;
  const internalHoursCost = 120000;
  const implementationCount = 50;
  
  const conservRecov = Math.round(totalLoss * 0.50);
  const probRecov = Math.round(totalLoss * 0.65);
  
  // LEAK DESCRIPTIONS DATABASE
  const leakDescriptions = {
    'Missed Sales Opportunities': {
      problemFeeling: 'Deals stall quietly. Reps promise follow-ups that never happen. By the time you realize it, the prospect\'s gone cold or bought elsewhere.',
      whatsCantSee: 'Most SMBs lose 40–60% of deals to "no decision" — HBR research shows delay and weak follow-up are top reasons leads go cold.',
      cantSeeBullets: ['Which deals have gone cold and when', 'Which high-value opportunities are at risk this week', 'Whether your reps are actually following up'],
      tracking: 'Real-time pipeline monitoring that flags silent deals before they\'re lost. You\'ll know which accounts need a nudge today.',
      mainCause: 'Delayed or missed follow-ups kill warm deals.'
    },
    'Operational Inefficiency': {
      problemFeeling: 'Everyone\'s busy, yet progress crawls. Work gets stuck in handoffs between teams, but nobody can see where the bottleneck is.',
      whatsCantSee: 'McKinsey finds knowledge workers lose roughly 20–25% of productive time to coordination friction and poor process visibility — that\'s nearly a day a week.',
      cantSeeBullets: ['Which processes waste the most hours', 'Where work stalls between departments', 'Whether your fixes actually improved flow'],
      tracking: 'Time-drag heatmaps revealing your top process bottlenecks. Prioritize fixes based on where hours are truly burned.',
      mainCause: 'Time lost to unclear handoffs and manual processes.'
    },
    'Customer Churn': {
      problemFeeling: 'You only notice unhappy customers after they\'re gone. There\'s no early signal before they cancel or fail to renew.',
      whatsCantSee: 'SMBs lose 12–20% of customers yearly on average — and SaaS benchmarks show 30–50% of churn could be prevented with earlier detection.',
      cantSeeBullets: ['Which customers are at risk before they tell you', 'What\'s driving dissatisfaction', 'Whether your \'save\' actions work'],
      tracking: 'Customer health scoring that flags at-risk accounts 45–60 days before churn. Save revenue before it walks away.',
      mainCause: 'Late detection of unhappy or silent customers.'
    },
    'Accounts Receivable': {
      problemFeeling: 'Invoices sit unpaid for weeks. Cash flow suffers, and you don\'t know which customers are chronic late payers until it\'s bad.',
      whatsCantSee: 'The average SMB waits 30–60 days to get paid, and over a third of invoices go past due — QuickBooks and Atradius data confirm late payments are a major cash-flow drag.',
      cantSeeBullets: ['Which customers always pay late', 'How much cash is trapped in A/R', 'Which clients are credit risks'],
      tracking: 'Automated A/R tracking that alerts you at day 30 — not day 60. Recover cash faster with prioritized follow-up lists.',
      mainCause: 'Late payments and poor invoice follow-up.'
    },
    'Marketing Spend': {
      problemFeeling: 'You spend heavily on ads, events, and content — but can\'t prove what\'s working. Leads look random and ROI feels invisible.',
      whatsCantSee: '40–60% of SMB marketing budgets can\'t be tied directly to revenue — Nielsen and WordStream show most teams can\'t see which channels actually work.',
      cantSeeBullets: ['Which channels truly drive sales', 'Actual CAC by channel', 'Which campaigns deserve to stop or scale'],
      tracking: 'Channel-level ROI dashboards linking every dollar to pipeline results. Cut waste, double down on winners.',
      mainCause: 'Spending without clear ROI tracking.'
    },
    'Employee Turnover': {
      problemFeeling: 'Great employees leave without warning. You discover problems only in exit interviews.',
      whatsCantSee: 'SMB turnover runs 15–25% a year, and replacing each lost employee costs roughly 6–9 months of salary — SHRM and Workable data highlight how fast that adds up.',
      cantSeeBullets: ['Which employees are flight risks', 'Real causes of disengagement', 'Whether retention programs are working'],
      tracking: 'Sentiment analytics that detect disengagement early — before resignations happen.',
      mainCause: 'Poor engagement visibility and reactive retention.'
    },
    'Pricing Errors & Discounts': {
      problemFeeling: 'Reps discount too deeply "just to close," eroding margin. No one knows what discount levels are truly needed to win.',
      whatsCantSee: 'Many reps over-discount by 15–30%, quietly eroding 3–7% of annual margin — Bain and HubSpot note most firms lack visibility into discounting behavior.',
      cantSeeBullets: ['Who\'s over-discounting', 'How much margin is lost', 'What discount level closes most deals'],
      tracking: 'Smart discount guardrails showing "deals like this close at 12% off." Protect margin without slowing sales.',
      mainCause: 'Over-discounting due to lack of deal insights.'
    },
    'Marketing Inefficiency': {
      problemFeeling: 'You spend heavily on ads, events, and content — but can\'t prove what\'s working. Leads look random and ROI feels invisible.',
      whatsCantSee: '40–60% of SMB marketing budgets can\'t be tied directly to revenue — Nielsen and WordStream show most teams can\'t see which channels actually work.',
      cantSeeBullets: ['Which channels truly drive sales', 'Actual CAC by channel', 'Which campaigns deserve to stop or scale'],
      tracking: 'Channel-level ROI dashboards linking every dollar to pipeline results. Cut waste, double down on winners.',
      mainCause: 'Spending without clear ROI tracking.'
    },
    'Supplier Inefficiencies': {
      problemFeeling: 'Supplier prices creep up over time. You suspect overpayment but lack data to negotiate.',
      whatsCantSee: 'Companies that skip annual supplier benchmarking overpay 8–15% — Deloitte and CIPS research confirm consistent savings when rates are reviewed regularly.',
      cantSeeBullets: ['Which suppliers charge above market', 'Where renegotiation yields biggest savings', 'Whether volume justifies better terms'],
      tracking: 'Supplier cost benchmarking dashboards with market-rate comparisons. Negotiate from data, not guesswork.',
      mainCause: 'Outdated contracts and unbenchmarked supplier pricing.'
    },
    'Compliance & Regulatory': {
      problemFeeling: 'Filing deadlines sneak up. Late fees and penalties eat cash. Manual tracking creates constant "fire drills."',
      whatsCantSee: 'Missed filings and late reports can cost SMBs $10K–$30K a year — PwC and ADP studies show most penalties stem from preventable oversights.',
      cantSeeBullets: ['Upcoming compliance deadlines', 'Exposure to potential fines', 'Effectiveness of your current process'],
      tracking: 'Automated compliance calendars with proactive alerts 60, 30, and 7 days out. Stay compliant without chaos.',
      mainCause: 'Missed deadlines and manual tracking errors.'
    },
    'Customer Support': {
      problemFeeling: 'Tickets pile up and VIP clients wait too long. You can\'t see which issues are driving churn or repeat complaints.',
      whatsCantSee: 'Average first-response times hover around 12–24 hours — Zendesk and HubSpot data show delays like these drive churn among high-value clients.',
      cantSeeBullets: ['Which support issues cause churn', 'How quickly VIPs are helped', 'Root causes of repeat issues'],
      tracking: 'Smart ticket routing that auto-prioritizes high-value customers. Track resolution time vs. retention impact.',
      mainCause: 'Slow response times for key clients.'
    },
    'Tech Downtime': {
      problemFeeling: 'Systems fail — and you only find out from customers. Each outage costs time, money, and reputation.',
      whatsCantSee: 'A single SMB outage costs $5K–$15K in lost productivity and recovery — Datto and Infrascale confirm downtime hits hardest when monitoring is reactive.',
      cantSeeBullets: ['Downtime cost per system', 'Which apps are most critical', 'Whether redundancy works'],
      tracking: 'Uptime and revenue-impact dashboards that alert your team instantly when systems fail.',
      mainCause: 'Reactive system monitoring and weak redundancy.'
    },
    'Inventory Mismanagement': {
      problemFeeling: 'Fast sellers stock out. Slow stock piles up. You\'re guessing at reorder points and tying up cash in the wrong places.',
      whatsCantSee: 'Poor inventory control costs 5–12% of annual revenue — Gartner and Forrester benchmarks show overstock and stockouts silently drain SMB profits.',
      cantSeeBullets: ['Over/understock SKUs', 'Optimal reorder points', 'Cash trapped in dead inventory'],
      tracking: 'Demand forecasting that predicts what to order, when, and what to clear. Stop guessing, start optimizing.',
      mainCause: 'Poor forecasting and no real-time stock visibility.'
    },
    'Procurement Overspend': {
      problemFeeling: 'You suspect you\'re overpaying vendors but lack data to negotiate better rates.',
      whatsCantSee: 'Companies that skip annual supplier benchmarking overpay 5–10%.',
      cantSeeBullets: ['Which vendors charge above market', 'Where renegotiation yields savings', 'Whether volume justifies better terms'],
      tracking: 'Vendor cost benchmarking dashboards.',
      mainCause: 'No systematic vendor rate comparison.'
    },
    'Project Overruns': {
      problemFeeling: 'Projects consistently run over budget with no early warning.',
      whatsCantSee: 'Early detection could prevent 40-60% of budget bleed.',
      cantSeeBullets: ['Which projects are trending over', 'Where scope creep is happening', 'Whether estimates are accurate'],
      tracking: 'Real-time project budget burn dashboards.',
      mainCause: 'Poor project tracking and no burn rate visibility.'
    },
    'Supplier/Contract Leakage': {
      problemFeeling: 'Auto-renewed contracts and forgotten subscriptions drain cash.',
      whatsCantSee: 'Average company has 5-10% of spend on unused subscriptions.',
      cantSeeBullets: ['Which contracts auto-renewed', 'What services aren\'t being used', 'Where duplicate spending exists'],
      tracking: 'Contract management dashboard with renewal alerts.',
      mainCause: 'No centralized contract tracking.'
    }
  };
  
  function getLeakDescription(leakName) {
    return leakDescriptions[leakName] || leakDescriptions['Operational Inefficiency'];
  }
  
  // ========== HTML TEMPLATE ==========
  return `
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Revenue Leak Executive Briefing</title>

<style>
  :root{
    --bg:#f6f7f9;
    --card:#ffffff;
    --text:#111827;
    --muted:#6b7280;
    --accent:#00b7b7;
    --danger:#c53030;
    --radius:10px;
    --page-width:210mm;
    --page-height:297mm;
  }

  html,body{height:100%; margin:0; font-family:Inter,system-ui,-apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; background:var(--bg); color:var(--text); -webkit-font-smoothing:antialiased;}
  .page{
    width:var(--page-width);
    height:var(--page-height);
    box-sizing:border-box;
    margin:20px auto;
    padding:36px 46px;
    background:var(--card);
    border:1px solid #e8e8ea;
    border-radius:8px;
    box-shadow:0 10px 30px rgba(16,24,40,0.06);
    position:relative;
    page-break-after:always;
  }
  header{display:flex; justify-content:space-between; align-items:center; gap:18px; margin-bottom:18px;}
  h1{font-size:20px; margin:0; font-weight:700;}
  .muted{color:var(--muted); font-size:13px;}
  .headline{font-size:36px; font-weight:800; color:var(--text); letter-spacing:-0.5px; margin:2px 0 6px 0;}
  
  .leak-card{border:1px solid #e5e7eb; border-radius:8px; padding:16px; margin-bottom:14px; background:#fff;}
  .leak-item {padding: 20px; background: white; border-radius: 8px; border: 1px solid #e5e7eb; min-height: 140px;}
  .leak-item-header {display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;}
  .leak-item-name {font-size: 14px; font-weight: 700; color: var(--text);}
  .leak-item-amount {font-size: 16px; font-weight: 800; color: var(--danger);}
  .leak-item-reason {font-size: 13px; line-height: 1.6; color: var(--muted); font-style: italic; margin-top: 8px;}
  
  table{width:100%; border-collapse:collapse; margin-top:10px; font-size:13px;}
  thead th{ text-align:left; padding:10px; border-bottom:2px solid #eef0f2; color:var(--muted); font-weight:700;}
  tbody td{padding:10px; border-bottom:1px solid #f3f4f6;}
  
  .roi-table{width:100%; border-collapse:collapse; margin-top:12px;}
  .roi-table th, .roi-table td{padding:12px; border:1px solid #eef0f2; text-align:left; font-size:13px;}
  .roi-table th{background:#fbfdfe; color:var(--muted); font-weight:700;}
  .highlight{font-weight:800; color:var(--accent);}
  
  .cta{margin-top:16px; display:inline-block; padding:12px 20px; background:var(--accent); color:#001; border-radius:8px; font-weight:800; text-decoration:none;}
  footer{position:absolute; bottom:24px; left:46px; right:46px; text-align:center; color:var(--muted); font-size:12px;}
  
  .systems-grid {display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 12px auto; max-width: 480px;}
  .system-box {display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px 6px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; text-align: center;}
  .system-icon {width: 24px; height: 24px; margin-bottom: 4px; color: var(--accent);}
  .system-name {font-size: 10px; color: var(--muted); line-height: 1.2;}
  
  .obstacles-container {display: flex; flex-direction: column; gap: 11px; margin-top: 15px;}
  .obstacle-box {display: flex; gap: 14px; padding: 15px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; position: relative;}
  .obstacle-box::before {content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; border-radius: 8px 0 0 8px;}
  .obstacle-box.obstacle-1::before { background: #0066FF; }
  .obstacle-box.obstacle-2::before { background: #FF8C42; }
  .obstacle-box.obstacle-3::before { background: #22C55E; }
  .obstacle-box.obstacle-1 { background: rgba(0, 102, 255, 0.04); }
  .obstacle-box.obstacle-2 { background: rgba(255, 140, 66, 0.04); }
  .obstacle-box.obstacle-3 { background: rgba(34, 197, 94, 0.04); }
  
  .obstacle-icon {flex-shrink: 0; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; background: #f9fafb; border-radius: 8px;}
  .obstacle-icon svg {width: 24px; height: 24px;}
  .obstacle-content {flex: 1;}
  .obstacle-title {font-size: 14px; font-weight: 700; color: var(--text); margin: 0 0 7px 0;}
  .obstacle-description {font-size: 12px; color: var(--text); line-height: 1.45; margin: 0 0 9px 0;}
  .obstacle-stat {background: #f9fafb; padding: 9px 11px; border-radius: 6px; border-left: 3px solid var(--accent);}
  .stat-number {font-size: 18px; font-weight: 800; color: var(--danger); display: block; margin-bottom: 4px;}
  .stat-text {font-size: 11px; color: var(--muted); line-height: 1.35;}
  .stat-source {font-size: 10px; color: #9ca3af; font-style: italic; margin-top: 4px;}
  
  .section-title{font-size:15px; font-weight:700; color:var(--text); margin:20px 0 10px 0;}
  .industry-list{display:flex; flex-direction:column; gap:6px; margin-bottom:12px;}
  .industry-item{display:flex; gap:10px; align-items:flex-start; padding:7px 10px; background:#f9fafb; border-radius:6px; border-left:3px solid var(--accent);}
  .industry-item .checkmark{color:var(--accent); font-size:13px; font-weight:700; flex-shrink:0;}
  .industry-item .content{flex:1;}
  .industry-name{font-size:12px; font-weight:700; color:var(--text); margin:0 0 2px 0;}
  .industry-desc{font-size:11px; color:var(--muted); margin:0; line-height:1.3;}
  
  .testimonial-grid{display:grid; grid-template-columns:repeat(2, 1fr); gap:8px; margin-bottom:14px;}
  .testimonial-box{padding:10px 12px; background:#fff; border:1px solid #e5e7eb; border-radius:8px; border-left:4px solid var(--accent); box-shadow:0 2px 6px rgba(0,183,183,0.06);}
  .testimonial-quote{font-size:12px; color:var(--text); line-height:1.45; margin:0 0 6px 0; font-style:italic; font-weight:500;}
  .testimonial-author{font-size:11px; color:var(--muted); margin:0; font-weight:600;}
  .star-rating{display:flex; gap:2px; margin-top:5px; align-items:center;}
  .rating-text{font-size:10px; color:#92400e; font-weight:700; margin-left:3px;}
  
  .patterns-container{display:flex; flex-direction:column; gap:8px; margin-bottom:14px;}
  .pattern-category{padding:10px 12px; background:#fff; border:1px solid #e5e7eb; border-radius:8px; border-left:3px solid var(--accent);}
  .pattern-header{display:flex; justify-content:space-between; align-items:baseline; margin-bottom:5px;}
  .pattern-title{font-size:13px; font-weight:700; color:var(--text); margin:0;}
  .pattern-benchmark{font-size:11px; color:var(--accent); font-weight:600;}
  .pattern-list{margin:0; padding-left:18px;}
  .pattern-list li{font-size:11px; color:var(--muted); line-height:1.35; margin:2px 0;}
  
  .why-choose-box{padding:10px 12px; background:linear-gradient(135deg, #f0fdfa 0%, #e6fffa 100%); border-radius:8px; border:2px solid var(--accent); margin-bottom:12px;}
  .why-choose-title{font-size:13px; font-weight:700; color:var(--text); margin:0 0 6px 0;}
  .why-list{display:flex; flex-direction:column; gap:5px;}
  .why-item{display:flex; gap:8px; align-items:flex-start;}
  .why-item .check{color:var(--accent); font-weight:700; flex-shrink:0; font-size:13px;}
  .why-item .text{font-size:11px; color:var(--text); line-height:1.35;}
  
  .bridge-box{padding:12px 16px; background:linear-gradient(135deg, #00b7b7 0%, #009999 100%); border-radius:10px; text-align:center; box-shadow:0 3px 15px rgba(0,183,183,0.2);}
  .bridge-text{margin:0; font-size:12px; font-weight:600; color:#fff; line-height:1.45;}
  .bridge-text strong{display:block; margin-top:8px; font-size:13px; font-weight:700;}
  .bridge-highlight{
    color:#fef3c7; 
    background: rgba(254, 243, 199, 0.25); 
    padding: 2px 6px; 
    border-radius: 4px;
    font-weight:800; 
    font-size:14px; 
    text-shadow:0 2px 4px rgba(0,0,0,0.2);
  }
</style>
</head>
<body>

<!-- ========== PAGE 1 ========== -->
<div class="page">
  <header>
    <div>
      <h1>Revenue Leak — Executive Brief</h1>
      <div class="muted">${contactName} at ${clientName} • ${clientDate}</div>
    </div>
  </header>

  <section>
    <div style="text-align:center; margin:80px auto 50px auto; position:relative; width:480px;">
      <svg width="480" height="480" viewBox="0 0 480 480">
        <circle cx="240" cy="240" r="120" fill="none" stroke="#e5e7eb" stroke-width="24"/>
        <circle cx="240" cy="240" r="120" fill="none" stroke="#c53030" stroke-width="24"
                stroke-dasharray="${(leakagePercent / 100 * 754).toFixed(1)} 754" 
                stroke-dashoffset="0"
                transform="rotate(-90 240 240)"
                style="filter: drop-shadow(0 0 8px rgba(231, 76, 60, 0.3));"/>
      </svg>
      <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); text-align:center;">
        <div style="font-size:56px; font-weight:800; color:var(--danger); line-height:1;">${leakagePercent.toFixed(1)}%</div>
        <div style="font-size:14px; color:var(--muted); margin-top:8px;">Revenue Leakage</div>
      </div>
    </div>

    <div class="headline" style="text-align:center; margin-top:30px;">
      $${totalLoss.toLocaleString()}
    </div>
    
    <div style="font-size:28px; font-weight:700; color:var(--danger); margin:10px 0 20px 0; line-height:1.2; text-align:center;">
      That's $${weeklyLoss.toLocaleString()} every week
    </div>

    <div style="margin-top:24px; max-width:700px; margin-left:auto; margin-right:auto;">
      <p style="margin:0 0 8px 0; font-size:16px; color:var(--text); font-weight:600; line-height:1.4; text-align:center;">
        Every week you operate without fixing this costs $${weeklyLoss.toLocaleString()}.
      </p>
      <p style="margin:0; font-size:16px; color:var(--text); font-weight:600; line-height:1.4; text-align:center;">
        That's $${monthlyLoss.toLocaleString()} this month while you're "thinking about it."
      </p>
    </div>

    <div style="margin-top:28px; padding:16px; background:#fef2f2; border-radius:8px; border-left:4px solid var(--danger); max-width:700px; margin-left:auto; margin-right:auto;">
      <div style="font-weight:700; font-size:14px; color:var(--danger); margin-bottom:10px;">The Cost of Delay:</div>
      <div style="display:flex; flex-direction:column; gap:6px; font-size:13px; color:var(--text);">
        <div style="display:flex; justify-content:space-between;">
          <span>• Act today: </span>
          <strong>$0 lost </strong>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span>• Wait 1 week:</span>
          <strong style="color:var(--danger);">$${weeklyLoss.toLocaleString()} more gone</strong>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span>• Wait 1 month:</span>
          <strong style="color:var(--danger);">$${monthlyLoss.toLocaleString()} vanished</strong>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span>• Wait 90 days:</span>
          <strong style="color:var(--danger);">$${Math.round(weeklyLoss * 12).toLocaleString()} you'll never recover</strong>
        </div>
      </div>
      <div style="margin-top:12px; padding-top:12px; border-top:1px solid #fecaca; font-size:14px; font-weight:700; color:var(--text);">
        Every day you delay costs $${dailyLoss.toLocaleString()}.
      </div>
    </div>
  </section>

  <footer>Page 1</footer>
</div>

<!-- ========== PAGE 2 ========== -->
<div class="page" style="padding:32px 46px 50px 46px;">
  <header style="margin-bottom:14px;">
    <h1 style="font-size:26px; margin:0; line-height:1.2;"><span style="color:var(--danger);">$${(totalLoss / 1000000).toFixed(1)}M</span> Is Leaking. Your Data Knows Where.<br><span style="color:var(--danger);">You Don't.</span></h1>
  </header>

  <div style="margin-top: 22px;">
    <p style="margin:0 0 10px 0; font-size:13px; line-height:1.5; color:var(--text);">
      Your answer? It lives in 8 different systems.
    </p>
    
    <div class="systems-grid">
      <div class="system-box">
        <svg class="system-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
        </svg>
        <div class="system-name">CRM</div>
      </div>
      <div class="system-box">
        <svg class="system-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <div class="system-name">ERP</div>
      </div>
      <div class="system-box">
        <svg class="system-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
        <div class="system-name">Ad Campaigns</div>
      </div>
      <div class="system-box">
        <svg class="system-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
        </svg>
        <div class="system-name">E-commerce</div>
      </div>
      <div class="system-box">
        <svg class="system-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
        <div class="system-name">Analytics</div>
      </div>
      <div class="system-box">
        <svg class="system-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
        </svg>
        <div class="system-name">Inventory</div>
      </div>
      <div class="system-box">
        <svg class="system-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/>
        </svg>
        <div class="system-name">Support</div>
      </div>
      <div class="system-box">
        <svg class="system-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <div class="system-name">Billing</div>
      </div>
    </div>

    <p style="margin:10px 0 0 0; font-size:13px; line-height:1.5; color:var(--text);">
      No human can see across all of them at once. So the leaks hide in the gaps.
    </p>
  </div>

  <div class="obstacles-container">
    <div class="obstacle-box obstacle-1">
      <div class="obstacle-icon">
        <svg fill="none" stroke="#0066FF" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"/>
        </svg>
      </div>
      <div class="obstacle-content">
        <h3 class="obstacle-title">Scattered Data = Invisible Problems</h3>
        <p class="obstacle-description">Your revenue intelligence is trapped in silos. No single person can see the full picture—so deals stall, unbilled hours pile up, and customer issues escalate before anyone sees the pattern.</p>
        <div class="obstacle-stat">
          <div style="display:flex; gap:16px; margin-bottom:8px;">
            <div style="flex:1;">
              <span class="stat-number">53%</span>
              <div class="stat-text">Don't understand what insights their data could provide</div>
            </div>
            <div style="flex:1;">
              <span class="stat-number">41%</span>
              <div class="stat-text">Don't even trust their own data</div>
            </div>
          </div>
          <div class="stat-source">AWS SMB Global Trends Survey, 2022</div>
        </div>
      </div>
    </div>

    <div class="obstacle-box obstacle-2">
      <div class="obstacle-icon">
        <svg fill="none" stroke="#FF8C42" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <div class="obstacle-content">
        <h3 class="obstacle-title">No Early Warning System</h3>
        <p class="obstacle-description">By the time you see the problem, the money's already gone. You only spot leaks when they hit your P&L—weeks after they started bleeding.</p>
        <div class="obstacle-stat">
          <div style="display:flex; gap:16px; margin-bottom:8px;">
            <div style="flex:1;">
              <span class="stat-number">69%</span>
              <div class="stat-text">Say manual expense and invoice solutions are "inefficient and laborious"</div>
            </div>
            <div style="flex:1;">
              <span class="stat-number">60%</span>
              <div class="stat-text">Report difficulty tracking spending trends and behaviors</div>
            </div>
          </div>
          <div class="stat-source">SAP Concur / AMI Survey</div>
        </div>
      </div>
    </div>

    <div class="obstacle-box obstacle-3">
      <div class="obstacle-icon">
        <svg fill="none" stroke="#22C55E" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
        </svg>
      </div>
      <div class="obstacle-content">
        <h3 class="obstacle-title">Insight Without Action = Zero ROI</h3>
        <p class="obstacle-description">Even when you spot a leak, you can't track if your fix worked. Without metrics showing if changes stick, the same problems persist quarter after quarter.</p>
        <div class="obstacle-stat">
          <div style="display:flex; gap:16px; margin-bottom:8px;">
            <div style="flex:1;">
              <span class="stat-number">45%</span>
              <div class="stat-text">Do not measure ROI of their digital marketing efforts</div>
            </div>
            <div style="flex:1;">
              <span class="stat-number">58%</span>
              <div class="stat-text">Say they're not investing in data to drive growth</div>
            </div>
          </div>
          <div class="stat-source">AWS SMB Global Trends Survey, 2022</div>
        </div>
      </div>
    </div>
  </div>

  <div style="margin-top: 18px; padding: 11px 15px; background: linear-gradient(135deg, #f0fdfa 0%, #e0f2f1 100%); border-radius: 8px; border-left: 4px solid var(--accent);">
    <p style="margin:0; font-size:13px; font-weight:600; color:var(--text); line-height:1.45;">
      The next 5 pages show you exactly which gaps are costing you $${(totalLoss / 1000000).toFixed(1)}M—and how to close them in 90 days.
    </p>
  </div>

  <footer>Page 2</footer>
</div>

<!-- ========== PAGE 3 ========== -->
<div class="page">
  <header>
    <h1 style="font-size:20px; margin:0;">Your Diagnostic Found 12 Profit Leaks Totaling $${(totalLoss / 1000000).toFixed(1)}M</h1>
    <div class="muted">Below are the top 3 bleeding fastest (${top3Percent}% of your total loss)</div>
  </header>

  <div style="margin: 30px 0;">
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 12px;">
      ${top8Leaks.slice(0, 4).map((leak, idx) => {
        const colors = [
          { bg: 'rgba(255,0,0,0.18)', border: '#c53030', text: '#991b1b' },
          { bg: 'rgba(255,77,0,0.18)', border: '#dc2626', text: '#991b1b' },
          { bg: 'rgba(255,140,66,0.18)', border: '#ea580c', text: '#9a3412' },
          { bg: 'rgba(251,191,36,0.18)', border: '#f59e0b', text: '#92400e' }
        ];
        const style = colors[idx];
        return `
          <div style="text-align: center; padding: 18px 12px; background: ${style.bg}; border: 2px solid ${style.border}; border-radius: 8px;">
            <div style="font-size: 10px; font-weight: 700; color: ${style.text}; margin-bottom: 6px; text-transform: uppercase;">Priority #${idx + 1}</div>
            <div style="font-size: 22px; font-weight: 800; color: ${style.border};">$${Math.round(leak.leakageDollars / 1000)}K</div>
            <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">${leak.category.split(' ')[0]}</div>
          </div>
        `;
      }).join('')}
    </div>
    
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
      ${top8Leaks.slice(4, 8).map((leak, idx) => {
        const colors = [
          { bg: 'rgba(253,224,71,0.18)', border: '#eab308', text: '#854d0e' },
          { bg: 'rgba(190,242,100,0.18)', border: '#84cc16', text: '#3f6212' },
          { bg: 'rgba(134,239,172,0.18)', border: '#22c55e', text: '#166534' },
          { bg: 'rgba(110,231,183,0.18)', border: '#10b981', text: '#065f46' }
        ];
        const style = colors[idx];
        return `
          <div style="text-align: center; padding: 18px 12px; background: ${style.bg}; border: 2px solid ${style.border}; border-radius: 8px;">
            <div style="font-size: 10px; font-weight: 700; color: ${style.text}; margin-bottom: 6px; text-transform: uppercase;">Priority #${idx + 5}</div>
            <div style="font-size: 22px; font-weight: 800; color: ${style.border};">$${Math.round(leak.leakageDollars / 1000)}K</div>
            <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">${leak.category.split(' ')[0]}</div>
          </div>
        `;
      }).join('')}
    </div>
    
    <div style="text-align: center; padding: 16px; background: #fef2f2; border-radius: 6px; margin-top: 20px; border-left: 4px solid #c53030;">
      <strong style="color: #c53030; font-size: 15px;">Top 3 leaks = $${Math.round(top3Total / 1000)}K/year (${top3Percent}% of your total loss) • Fix these first for maximum recovery</strong>
    </div>
  </div>

  ${(() => {
    const leak = top3Leaks[0];
    const desc = getLeakDescription(leak.category);
    return `
    <div class="leak-card" style="border-left: 4px solid #0066FF;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px;">
        <h3 style="font-size: 17px; font-weight: 700; margin: 0; color: var(--text);">#1: ${leak.category}</h3>
        <div>
          <div style="font-size: 18px; font-weight: 800; color: var(--danger); text-align: right;">${Math.round(leak.leakageDollars / 1000)}K</div>
          <div style="font-size: 12px; color: var(--muted); margin-top: 2px;">${((leak.leakageDollars / totalLoss) * 100).toFixed(1)}% of total</div>
        </div>
      </div>

      <div style="margin: 16px 0; padding: 14px; border-radius: 6px; background: #fef2f2; border-left: 3px solid var(--danger);">
        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0; color: var(--danger);">The Problem You're Feeling</div>
        <p style="font-size: 13px; line-height: 1.6; margin: 0; color: var(--text);">${desc.problemFeeling}</p>
      </div>

      <div style="margin: 16px 0; padding: 14px; border-radius: 6px; background: #fff7ed; border-left: 3px solid #FF8C42;">
        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0; color: #FF8C42;">What You Can't See Right Now</div>
        <p style="font-size: 13px; line-height: 1.6; margin: 0; color: var(--text);">${desc.whatsCantSee}</p>
        <div style="margin-top:12px;">
          <strong style="font-size:12px; color:#FF8C42;">What You Can't See Right Now:</strong>
          <ul style="margin: 8px 0 0 0; padding-left: 20px;">
            ${desc.cantSeeBullets.map(bullet => `<li style="font-size: 13px; line-height: 1.6; margin: 4px 0; color: var(--text);">${bullet}</li>`).join('')}
          </ul>
        </div>
      </div>

      <div style="margin: 16px 0; padding: 14px; border-radius: 6px; background: #f0fdfa; border-left: 3px solid var(--accent);">
        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0; color: var(--accent);">What We'll Track For You</div>
        <p style="font-size: 13px; line-height: 1.6; margin: 0; color: var(--text);">${desc.tracking}</p>
      </div>
    </div>
    `;
  })()}

  <footer>Page 3</footer>
</div>

<!-- ========== PAGE 4 ========== -->
<div class="page">
  ${top3Leaks.slice(1, 3).map((leak, idx) => {
    const desc = getLeakDescription(leak.category);
    const colors = ['#FF8C42', '#22C55E'];
    return `
    <div class="leak-card" style="border-left: 4px solid ${colors[idx]}; ${idx > 0 ? 'margin-top:18px;' : ''}">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px;">
        <h3 style="font-size: 17px; font-weight: 700; margin: 0; color: var(--text);">#${idx + 2}: ${leak.category}</h3>
        <div>
          <div style="font-size: 18px; font-weight: 800; color: var(--danger); text-align: right;">${Math.round(leak.leakageDollars / 1000)}K</div>
          <div style="font-size: 12px; color: var(--muted); margin-top: 2px;">${((leak.leakageDollars / totalLoss) * 100).toFixed(1)}% of total</div>
        </div>
      </div>

      <div style="margin: 16px 0; padding: 14px; border-radius: 6px; background: #fef2f2; border-left: 3px solid var(--danger);">
        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0; color: var(--danger);">The Problem You're Feeling</div>
        <p style="font-size: 13px; line-height: 1.6; margin: 0; color: var(--text);">${desc.problemFeeling}</p>
      </div>

      <div style="margin: 16px 0; padding: 14px; border-radius: 6px; background: #fff7ed; border-left: 3px solid #FF8C42;">
        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0; color: #FF8C42;">What You Can't See Right Now</div>
        <p style="font-size: 13px; line-height: 1.6; margin: 0; color: var(--text);">${desc.whatsCantSee}</p>
        <div style="margin-top:12px;">
          <strong style="font-size:12px; color:#FF8C42;">What You Can't See Right Now:</strong>
          <ul style="margin: 8px 0 0 0; padding-left: 20px;">
            ${desc.cantSeeBullets.map(bullet => `<li style="font-size: 13px; line-height: 1.6; margin: 4px 0; color: var(--text);">${bullet}</li>`).join('')}
          </ul>
        </div>
      </div>

      <div style="margin: 16px 0; padding: 14px; border-radius: 6px; background: #f0fdfa; border-left: 3px solid var(--accent);">
        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0; color: var(--accent);">What We'll Track For You</div>
        <p style="font-size: 13px; line-height: 1.6; margin: 0; color: var(--text);">${desc.tracking}</p>
      </div>
    </div>
    `;
  }).join('')}

  <footer>Page 4</footer>
</div>

<!-- ========== PAGE 5 ========== -->
<div class="page">
  <header>
    <h1 style="font-size:20px; margin:0;">The Other 9 Leaks We Found</h1>
    <div class="muted">Lower priority but still worth tracking</div>
  </header>

  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin: 30px 0;">
    ${otherLeaks.map((leak, idx) => {
      const desc = getLeakDescription(leak.category);
      return `
      <div class="leak-item">
        <div class="leak-item-header">
          <span class="leak-item-name">${idx + 4}. ${leak.category}</span>
          <span class="leak-item-amount">${Math.round(leak.leakageDollars / 1000)}K</span>
        </div>
        <p class="leak-item-reason">${desc.mainCause}</p>
      </div>
      `;
    }).join('')}
  </div>

  <div style="margin-top: 32px; padding: 20px; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 8px; border-left: 4px solid var(--danger);">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div style="flex: 1;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: var(--danger);">Why These 9 Matter More Than You Think</h3>
        <p style="margin: 0; font-size: 13px; line-height: 1.6; color: var(--text);">
          At <strong>$${Math.round(other9Total / 1000)}K/year</strong>, these may seem secondary—but here's the catch: <strong>many of these leaks feed the top 3</strong>. Poor inventory management causes missed sales. Employee turnover kills operational efficiency. Tech downtime erodes customer trust. <strong>Without plugging these, your top 3 fixes won't stick.</strong> They're not just leaks—they're the hidden bottlenecks preventing full recovery.
        </p>
      </div>
      <div style="text-align: center; padding: 0 20px; border-left: 2px solid #fecaca;">
        <div style="font-size: 32px; font-weight: 800; color: var(--danger);">$${Math.round(other9Total / 1000)}K</div>
        <div style="font-size: 12px; color: var(--muted); margin-top: 4px;">Annual Loss</div>
      </div>
    </div>
  </div>

  <div style="margin-top: 28px; padding: 16px; background: #f0fdfa; border-radius: 8px; border-left: 4px solid var(--accent); text-align: center;">
    <p style="margin: 0; font-size: 14px; font-weight: 600; color: var(--text);">
      Next, let's look at how other companies have recovered from similar leaks...
    </p>
  </div>

  <footer>Page 5</footer>
</div>

<!-- ========== PAGE 6 ========== -->
<div class="page">
  <header>
    <h1 style="font-size:20px; margin:0;">Our Track Record: ${implementationCount}+ Dashboard Implementations</h1>
    <p style="font-size:13px; color:var(--muted); margin:6px 0 0 0;">Real results from companies who needed visibility into their revenue operations</p>
  </header>

  <h2 class="section-title">Our Experience Across Business Models</h2>
  <p style="font-size:11px; color:var(--muted); margin:0 0 8px 0;">Over the past 3 years, we've built revenue intelligence dashboards for ${implementationCount}+ companies across three core models:</p>
  
  <div style="margin-bottom:8px;">
    <h3 style="font-size:12px; font-weight:700; color:var(--accent); margin:8px 0 6px 0;">High-Transaction Businesses</h3>
    <div class="industry-list" style="gap:5px; margin-bottom:8px;">
      <div class="industry-item">
        <div class="checkmark">✓</div>
        <div class="content">
          <p class="industry-name">Quick-Service Restaurant Franchises (McDonald's franchise owners)</p>
          <p class="industry-desc">Multi-location revenue tracking and upsell performance</p>
        </div>
      </div>
      <div class="industry-item">
        <div class="checkmark">✓</div>
        <div class="content">
          <p class="industry-name">Amazon FBA Businesses</p>
          <p class="industry-desc">Inventory velocity and profitability by SKU</p>
        </div>
      </div>
    </div>
    
    <h3 style="font-size:12px; font-weight:700; color:var(--accent); margin:8px 0 6px 0;">Service-Based Operations</h3>
    <div class="industry-list" style="gap:5px; margin-bottom:8px;">
      <div class="industry-item">
        <div class="checkmark">✓</div>
        <div class="content">
          <p class="industry-name">Marketing Agencies</p>
          <p class="industry-desc">Client profitability and resource utilization</p>
        </div>
      </div>
      <div class="industry-item">
        <div class="checkmark">✓</div>
        <div class="content">
          <p class="industry-name">Professional Services</p>
          <p class="industry-desc">Unbilled time tracking and project margin analysis</p>
        </div>
      </div>
    </div>
    
    <h3 style="font-size:12px; font-weight:700; color:var(--accent); margin:8px 0 6px 0;">Complex Supply Chains</h3>
    <div class="industry-list" style="gap:5px; margin-bottom:8px;">
      <div class="industry-item">
        <div class="checkmark">✓</div>
        <div class="content">
          <p class="industry-name">Manufacturing</p>
          <p class="industry-desc">Production efficiency and material waste tracking</p>
        </div>
      </div>
      <div class="industry-item">
        <div class="checkmark">✓</div>
        <div class="content">
          <p class="industry-name">Consumer Packaged Goods Distributors</p>
          <p class="industry-desc">Distribution and inventory optimization</p>
        </div>
      </div>
      <div class="industry-item">
        <div class="checkmark">✓</div>
        <div class="content">
          <p class="industry-name">Tourism & Hospitality</p>
          <p class="industry-desc">Customer acquisition costs and lifetime value</p>
        </div>
      </div>
    </div>
  </div>

  <h2 class="section-title" style="font-size:14px; font-weight:700;">What Our Dashboard Clients Say</h2>
  
  <div class="testimonial-grid">
    <div class="testimonial-box">
      <p class="testimonial-quote">"Shoab and his team helped us streamline our marketing, finance, and sales data with powerful dashboards. We now have clear visibility into performance and can make faster, smarter decisions. Highly recommend their work."</p>
      <p class="testimonial-author">— Carl Solomon, The Solomon Law Group, LLC</p>
      <div style="display:flex; gap:8px; margin-top:6px; margin-bottom:6px;">
        <span style="background:#99f6e4; padding:2px 6px; border-radius:4px; font-size:10px; color:var(--accent); font-weight:600;">Legal Dashboard</span>
        <span style="background:#99f6e4; padding:2px 6px; border-radius:4px; font-size:10px; color:#065f46; font-weight:600;">Multi-Department</span>
      </div>
      <div class="star-rating">
        <span style="color:#FFD700;">★★★★★</span>
        <span class="rating-text">5.0/5</span>
      </div>
    </div>
    
    <div class="testimonial-box">
      <p class="testimonial-quote">"Muhammad was patient and always willing to make any adjustments until I was satisfied with the outcome. I enjoyed working with him."</p>
      <p class="testimonial-author">— Mareile Paley, Life in Movement</p>
      <div style="display:flex; gap:8px; margin-top:6px; margin-bottom:6px;">
        <span style="background:#99f6e4; padding:2px 6px; border-radius:4px; font-size:10px; color:var(--accent); font-weight:600;">Data Visualization</span>
        <span style="background:#99f6e4; padding:2px 6px; border-radius:4px; font-size:10px; color:#065f46; font-weight:600;">4 weeks delivery</span>
      </div>
      <div class="star-rating">
        <span style="color:#FFD700;">★★★★</span><span style="color:#e5e7eb;">★</span>
        <span class="rating-text">4.8/5</span>
      </div>
    </div>
    
    <div class="testimonial-box">
      <p class="testimonial-quote">"Thanks again repeat client, glad I found Muhammad!"</p>
      <p class="testimonial-author">— Stephen Burkhalter, Solcertain LLC</p>
      <div style="display:flex; gap:8px; margin-top:6px; margin-bottom:6px;">
        <span style="background:#99f6e4; padding:2px 6px; border-radius:4px; font-size:10px; color:var(--accent); font-weight:600;">Stripe + QuickBooks</span>
        <span style="background:#fde68a; padding:2px 6px; border-radius:4px; font-size:10px; color:#92400e; font-weight:600;">Ongoing Partnership</span>
      </div>
      <div class="star-rating">
        <span style="color:#FFD700;">★★★★★</span>
        <span class="rating-text">5.0/5</span>
      </div>
    </div>
    
    <div class="testimonial-box">
      <p class="testimonial-quote">"I recently had the pleasure of working with Shoab and his incredible team on a KPI tracker using Google Looker, and I am beyond impressed..."</p>
      <p class="testimonial-author">— Jonah Nimmer, Amazon Growth Lab</p>
      <div style="display:flex; gap:8px; margin-top:6px; margin-bottom:6px;">
        <span style="background:#99f6e4; padding:2px 6px; border-radius:4px; font-size:10px; color:var(--accent); font-weight:600;">Google Looker</span>
        <span style="background:#fde68a; padding:2px 6px; border-radius:4px; font-size:10px; color:#92400e; font-weight:600;">KPI Tracking</span>
      </div>
      <div class="star-rating">
        <span style="color:#FFD700;">★★★★★</span>
        <span class="rating-text">5.0/5</span>
      </div>
    </div>
  </div>

  <footer>Page 6</footer>
</div>

<!-- ========== PAGE 7 ========== -->
<div class="page">
  <h2 class="section-title" style="font-size:15px; font-weight:700; margin:0 0 10px 0;">Where You Stand vs. Your Competition</h2>
  
  <div style="display:flex; gap:10px; margin-bottom:14px;">
    <div style="flex:1; padding:10px; background:#fef2f2; border-radius:6px; border-left:4px solid var(--danger);">
      <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
        <span style="font-size:20px;">🔴</span>
        <span style="font-size:12px; font-weight:700; color:var(--danger);">DANGER ZONE (15%+)</span>
      </div>
      <div style="font-size:14px; font-weight:800; color:var(--danger);">You're here at ${leakagePercent.toFixed(1)}%</div>
      <div style="font-size:10px; color:var(--muted); margin-top:2px;">Bleeding cash, can't invest in growth</div>
    </div>
    
    <div style="flex:1; padding:10px; background:#f0fdfa; border-radius:6px; border-left:4px solid var(--accent);">
      <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
        <span style="font-size:20px;">✅</span>
        <span style="font-size:12px; font-weight:700; color:var(--accent);">BEST-IN-CLASS (<10%)</span>
      </div>
      <div style="font-size:14px; font-weight:800; color:var(--accent);">Top performers achieved this</div>
      <div style="font-size:10px; color:var(--muted); margin-top:2px;">7% more to reinvest, hit growth targets</div>
    </div>
  </div>
  
  <div style="padding:8px 12px; background:#f9fafb; border-radius:6px; margin-bottom:14px;">
    <p style="margin:0; font-size:11px; color:var(--text); font-style:italic; text-align:center;">
      <strong>"The specific leaks vary by industry, but the total damage is universal."</strong>
    </p>
  </div>

  <h2 class="section-title" style="font-size:15px; font-weight:800; color:#00b7b7; margin:0 0 5px 0; padding:5px 0; border-top:2px solid #f0fdfa;">Common Revenue Leak Patterns We've Uncovered</h2>
  <p style="font-size:11px; color:var(--text); font-weight:500; margin:0 0 10px 0;">Based on our implementations across industries, here are the most frequent blind spots we help companies see:</p>
  
  <div class="patterns-container">
    <div class="pattern-category">
      <div class="pattern-header">
        <h3 class="pattern-title">Sales & Revenue Leaks</h3>
        <span class="pattern-benchmark">Industry benchmark: 15-25% of pipeline value</span>
      </div>
      <ul class="pattern-list">
        <li>Stalled deals with no follow-up cadence</li>
        <li>Proposal-to-close gaps that aren't tracked</li>
        <li>Lost opportunities due to slow response times</li>
      </ul>
    </div>
    
    <div class="pattern-category">
      <div class="pattern-header">
        <h3 class="pattern-title">Financial Leaks</h3>
        <span class="pattern-benchmark">Industry benchmark: 5-15% of receivables</span>
      </div>
      <ul class="pattern-list">
        <li>Overdue invoices with no systematic follow-up</li>
        <li>Pricing inconsistencies across customers</li>
        <li>Unbilled services or forgotten scope changes</li>
      </ul>
    </div>

    <div class="pattern-category">
      <div class="pattern-header">
        <h3 class="pattern-title">Operational Inefficiency</h3>
        <span class="pattern-benchmark">Industry benchmark: 12-20% of operating costs</span>
      </div>
      <ul class="pattern-list">
        <li>Manual handoffs eating high-cost labor hours</li>
        <li>No visibility into actual time spent vs. billed</li>
        <li>Process bottlenecks that aren't measured</li>
      </ul>
    </div>
    
    <div class="pattern-category">
      <div class="pattern-header">
        <h3 class="pattern-title">Customer Retention</h3>
        <span class="pattern-benchmark">Industry benchmark: 15-30% annual churn</span>
      </div>
      <ul class="pattern-list">
        <li>No early warning system for at-risk accounts</li>
        <li>Reactive rather than proactive retention efforts</li>
        <li>Missing renewal signals until it's too late</li>
      </ul>
    </div>
  </div>

  <div class="why-choose-box">
    <h3 class="why-choose-title">Why Companies Choose Us:</h3>
    <div class="why-list">
      <div class="why-item">
        <span class="check">✓</span>
        <span class="text"><strong>Cross-industry experience</strong> - We've seen patterns across ${implementationCount}+ implementations</span>
      </div>
      <div class="why-item">
        <span class="check">✓</span>
        <span class="text"><strong>You own the system</strong> - No ongoing dependency, full team training included</span>
      </div>
      <div class="why-item">
        <span class="check">✓</span>
        <span class="text"><strong>Proven track record</strong> - 5.0 average rating across platforms</span>
      </div>
    </div>
  </div>

  <div class="bridge-box">
    <p class="bridge-text">
      <span style="font-size:18px;">→</span><br>
      You've seen <span class="bridge-highlight">$${(totalLoss / 1000000).toFixed(1)}M in hidden leaks</span> and <span class="bridge-highlight">${implementationCount}+ successful implementations</span><br><br>
      <strong>Your choice: Continue losing ~$${Math.round(monthlyLoss / 1000)}K/month, or fix it in 90 days.</strong><br>
      <span style="font-size:11px; margin-top:6px; display:block;">Next: See exactly what this costs vs. alternatives →</span>
    </p>
  </div>

  <footer>Page 7</footer>
</div>

<!-- ========== PAGE 8 ========== -->
<div class="page">
  <header>
    <h1 style="font-size:20px; margin:0;">Your 12-Month ROI Comparison</h1>
    <div class="muted">What you gain (or lose) based on your choice</div>
  </header>

  <table class="roi-table" style="margin-top:16px;">
    <thead>
      <tr>
        <th style="width:120px;">Option</th>
        <th style="width:150px;">Investment / Cost (1-Year Impact)</th>
        <th style="width:60px;">Timeline</th>
        <th>Outcome / Result</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:18px;">❌</span>
            <strong>Do Nothing</strong>
          </div>
        </td>
        <td style="color:var(--danger); font-weight:700;">– $${totalLoss.toLocaleString()} Lost</td>
        <td>&infin;</td>
        <td>Continue losing revenue month after month</td>
      </tr>
      
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:18px;">🧾</span>
            <strong>Hire Consultant</strong>
          </div>
        </td>
        <td>$${consultantCost.toLocaleString()} – $${consultantCostMax.toLocaleString()} Spend</td>
        <td>9 – 14 months</td>
        <td>
          Strategy deck + partial implementation <span style="font-style:italic;">(no performance tie-in)</span><br>
          <span class="muted">25 – 40% recovery · High cost, uncertain</span>
        </td>
      </tr>
      
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:18px;">🛠</span>
            <strong>Internal Fix</strong>
          </div>
        </td>
        <td>$${internalHoursCost.toLocaleString()} Real Cost (800+ hrs)</td>
        <td>12 – 18 months</td>
        <td>
          DIY implementation · 28% success rate <span style="font-style:italic;">(most stall)</span> · Slow, uncertain progress
        </td>
      </tr>
      
      <tr style="background:#f0fdfa;">
        <td>
          <div style="display:flex; align-items:flex-start; gap:8px;">
            <span style="font-size:18px;">💡</span>
            <div>
              <strong style="color:var(--accent);">Mainnov Revenue Leak Detector</strong><br>
              <span style="font-size:11px;">🏆 Fastest ROI & Lowest Risk</span>
            </div>
          </div>
        </td>
        <td>
          <div style="display:flex; align-items:flex-start; gap:6px;">
            <span style="font-size:16px;">💼</span>
            <div>
              <strong>Typical Investment:</strong><br>
              $${week1Payment.toLocaleString()} – $${roiInvestment.toLocaleString()}<br>
              <span class="muted" style="font-size:11px;">(based on data scope)</span>
            </div>
          </div>
        </td>
        <td><strong style="color:var(--accent);">90 days</strong></td>
        <td>
          <strong>Pinpoint up to 8 revenue leaks</strong> — with a clear path to recovery<br><br>
          <div style="display:flex; align-items:flex-start; gap:6px; margin-top:8px;">
            <span style="font-size:16px;">💰</span>
            <div>
              <strong style="color:var(--accent);">Guaranteed to uncover at least 5× your investment in hidden revenue leaks — or it's on us.</strong>
            </div>
          </div>
          <div style="margin-top:10px; padding:10px; background:#e6fffa; border-radius:6px; border-left:3px solid var(--accent);">
            <strong style="color:var(--accent);">Projected ROI:</strong> +$${Math.round(conservRecov / 1000)}K – $${Math.round(probRecov / 1000)}K<br> (${Math.round(conservRecov / roiInvestment)}-${Math.round(probRecov / roiInvestment)}× return)
          </div>
        </td>
      </tr>
    </tbody>
  </table>

  <div style="margin-top:20px; padding:14px; background:#fef2f2; border-left:4px solid var(--danger); border-radius:6px;">
    <strong style="font-size:15px;">The Cost of Waiting:</strong>
    <ul style="margin:8px 0 0 0; padding-left:20px; font-size:13px;">
      <li>Today: $${(totalLoss / 1000000).toFixed(1)}M annual leak</li>
      <li>Wait 1 month: $${Math.round(monthlyLoss / 1000)}K more lost</li>
      <li>Wait 1 quarter: $${Math.round(monthlyLoss * 3 / 1000)}K more lost</li>
    </ul>
    <p style="margin:8px 0 0 0; font-size:14px; font-weight:600;">Every day you delay is $${dailyLoss.toLocaleString()} in leakage.</p>
  </div>

  <div style="margin-top:20px; text-align:center;">
    <p style="font-size:16px; font-weight:600; color:var(--text); margin:0 0 16px 0; line-height:1.4;">
      Let's identify where your profit is leaking — before your next quarter closes.
    </p>
    <a class="cta" href="https://calendly.com/ds-shoab/30min" target="_blank" style="font-size:16px; padding:14px 28px;">
      Book Your Free Diagnostic Call
    </a>
    <p class="muted" style="margin-top:10px; font-size:13px;">
      Zero obligation. If we can't show you a clear 10x ROI path in 30 minutes,<br>we'll point you to someone who can.
    </p>
  </div>

  <footer>Page 8</footer>
</div>

</body>
</html>
  `;
}

// ADD THIS FUNCTION AFTER generateHTMLReportTemplate()
async function generatePDFFromHTML(result) {
  try {
    showLoading('Generating your PDF report...');
    
    // 1. Get HTML template with data
    const htmlContent = generateHTMLReportTemplate(result);
    
    // 2. Create temporary container
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '210mm'; // A4 width
    document.body.appendChild(container);
    
    // 3. Wait for fonts and images to load
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 4. Convert each page to canvas then to PDF
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const reportPages  = Array.from(container.querySelectorAll('.page'));
    //const pages = container.querySelectorAll('.page');
    
    for (let i = 0; i < reportPages.length; i++) {
      if (i > 0) {
        pdf.addPage();
      }
      
      const canvas = await html2canvas(reportPages[i], {
        scale: 2, // ← CHANGE: was 2, now 1
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      //const imgData = canvas.toDataURL('image/jpeg', 0.8);  // ← CHANGE: was 'image/png', now 'image/jpeg', 0.8
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
    }
    
    // 5. Convert PDF to base64
    const pdfBase64 = pdf.output('dataurlstring').split(',')[1];
    
    // 6. Clean up
    document.body.removeChild(container);
    
    hideLoading();
    return pdfBase64;
    
  } catch (error) {
    hideLoading();
    console.error('PDF generation error:', error);
    throw error;
  }
}

function drawPieChart(leakPercentage) {
  const canvas = document.getElementById('leak-pie-chart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const outerRadius = 70;
  const innerRadius = 58;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Convert percentage to radians
  const leakAngle = (leakPercentage / 100) * 2 * Math.PI;
  
  // Draw background ring (darker gray)
  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
  ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI, true);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fill();
  
  
  // Draw leak ring (red) with glow
  
  ctx.shadowColor = '#e74c3c';
  ctx.shadowBlur = 25;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius, -Math.PI/2, -Math.PI/2 + leakAngle);
  ctx.arc(centerX, centerY, innerRadius, -Math.PI/2 + leakAngle, -Math.PI/2, true);
  ctx.closePath();
  ctx.fillStyle = '#e74c3c';
  ctx.fill();
  ctx.shadowBlur = 0; // Reset shadow for next drawings





  


  
  
  // Draw percentage text in center
  ctx.fillStyle = '#e74c3c';
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(Math.round(leakPercentage) + '%', centerX, centerY);
  
}

// Handle inline email submission
// REPLACE YOUR EXISTING handleInlineEmailSubmit FUNCTION WITH THIS
async function handleInlineEmailSubmit(result) {
  let email = document.getElementById('inline-report-email').value;
  
  if (!email && userData.email) {
    email = userData.email;
    document.getElementById('inline-report-email').value = email;
  }
  
  if (!email || !email.includes('@')) {
    alert('Please enter a valid email address');
    return;
  }

  try {
    showLoading('Generating your personalized report...');

    // 1. Generate PDF in browser
    const pdfBase64 = await generatePDFFromHTML(result);
    
    showLoading('Sending your report...');
    
    // 2. Send PDF to backend for emailing
    const response = await fetch(`${API_URL}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        action: 'emailPDF',
        pdfData: pdfBase64,
        leadEmail: email,
        userName: result.userName || userData.name || 'User',
        companyName: result.companyName || userData.company || 'Company',
        totalLoss: result.totalLeakageDollars,
        leakagePercent: result.totalLeakagePercent,
        industry: result.industry
      })
    });
    
    const data = await response.json();
    hideLoading();
    
    if (data.success) {
      // Show full results
      hideAllScreens();
      document.getElementById('results-screen').classList.add('active');
      displayFullResults(currentResults);
    } else {
      throw new Error(data.error || 'Failed to send report');
    }
    
  } catch (error) {
    hideLoading();
    console.error('Error:', error);
    alert('Error sending report: ' + error.message);
  }
}


// Display full results after email
function displayFullResults(result) {
  // Update headline
  document.getElementById('result-industry').textContent = result.industry;
  document.getElementById('leak-percentage').textContent = 
    result.totalLeakagePercent.toFixed(1) + '%';
  document.getElementById('leak-dollars').textContent = 
    formatCurrency(result.totalLeakageDollars);
  
  // Display top 3 leaks
  const topLeaksContainer = document.getElementById('top-leaks-container');
  topLeaksContainer.innerHTML = '';
  
  result.topThreeLeaks.forEach((leak, index) => {
    const leakDiv = document.createElement('div');
    leakDiv.className = 'leak-item top-leak';
    leakDiv.innerHTML = `
      <div class="leak-rank">#${index + 1}</div>
      <div class="leak-info">
        <div class="leak-category">${leak.category}</div>
        <div class="leak-metrics">
          <span class="leak-percent">${leak.leakagePercent.toFixed(1)}% of revenue</span>
          <span class="leak-dollar">${formatCurrency(leak.leakageDollars)}</span>
        </div>
      </div>
    `;
    topLeaksContainer.appendChild(leakDiv);
  });
  
  // Show recovery potential
  document.getElementById('recovery-dollars').textContent = 
    formatCurrency(result.potentialRecovery);
  
  // Show detailed breakdown
  const breakdownContainer = document.getElementById('breakdown-container');
  breakdownContainer.innerHTML = '';
  
  result.leaks.forEach(leak => {
    const leakDiv = document.createElement('div');
    leakDiv.className = 'leak-item';
    
    leakDiv.innerHTML = `
      <div class="leak-category">${leak.category}</div>
      <div class="leak-bar-container">
        <div class="leak-bar" style="width: ${Math.min(leak.leakagePercent * 3, 100)}%"></div>
      </div>
      <div class="leak-metrics">
        <span class="leak-percent">${leak.leakagePercent.toFixed(1)}%</span>
        <span class="leak-dollar">${formatCurrency(leak.leakageDollars)}</span>
      </div>
    `;
    
    breakdownContainer.appendChild(leakDiv);
  });
  
  // No email modal - user already provided email
}

// Update progress bar
function updateProgress(percentage) {
  document.getElementById('progress-fill').style.width = percentage + '%';
  
  let progressText = 'Get Started';
  if (percentage >= 20 && percentage < 25) {
    progressText = 'Revenue Input';
  } else if (percentage >= 25 && percentage < 90) {
    progressText = 'Assessment in Progress';
  } else if (percentage >= 90 && percentage < 100) {
    progressText = 'Calculating Results...';
  } else if (percentage >= 100) {
    progressText = 'Complete!';
  }
  
  document.getElementById('progress-text').textContent = progressText;
}

// Utility functions
function hideAllScreens() {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
}

function showLoading(message = 'Loading...') {
  document.getElementById('loading-message').textContent = message;
  document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loading-overlay').classList.add('hidden');
}

function handleError(error) {
  hideLoading();
  console.error('Error:', error);
  alert('An error occurred: ' + error.toString());
}

function startOver() {
  selectedIndustry = '';
  selectedRevenue = 0;
  currentQuestionIndex = 0;
  responses = [];
  currentResults = null;
  generateSessionId();

  // Show subtitle again when restarting
  const headerSubtitle = document.querySelector('.subtitle');
  if (headerSubtitle) {
    headerSubtitle.style.display = 'block';
  }

 
  document.querySelectorAll('.industry-btn').forEach(btn => {
    btn.classList.remove('selected');
  });
  document.getElementById('continue-to-revenue').classList.add('hidden');
  document.getElementById('start-assessment').classList.add('hidden');
  
  hideAllScreens();
  document.getElementById('industry-selection').classList.add('active');
  updateProgress(0);
}

function requestAudit() {
  window.open('calendly.com/ds-shoab/30min', '_blank');
}

// Enhanced email capture modal
/*function showEmailCaptureModal(result) {
  const modal = document.createElement('div');
  modal.className = 'email-capture-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h2>Get Your Complete 4-Page Report</h2>
      <p>We'll email you the detailed breakdown with:</p>
      <ul>
        <li>✓ Full leak analysis across all categories</li>
        <li>✓ Industry benchmark comparisons</li>
        <li>✓ ROI calculations & recovery plan</li>
        <li>✓ 90-day action roadmap</li>
      </ul>
      <input type="email" id="report-email" placeholder="Enter your email" value="">
      <button id="send-report-btn">Send My Report</button>
      <p style="font-size: 12px; color: #666; margin-top: 10px;">
        We'll also send you 3 case studies showing how similar businesses recovered their leaks.
      </p>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Add event listener for sending report
  document.getElementById('send-report-btn').addEventListener('click', function() {
    const email = document.getElementById('report-email').value;
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    showLoading('Generating your personalized report...');

    fetch(`${API_URL}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        action: 'sendEmailReport',
        leadEmail: email,
        result: result
      })
    })
    .then(response => {
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      return response.text();
    })
    .then(text => {
      console.log('Raw response:', text);
      try {
        const data = JSON.parse(text);
        hideLoading();
        
        if (data.success) {
          // Show success message briefly
          const modal = document.querySelector('.email-capture-modal');
          if (modal) {
            modal.innerHTML = `
              <div class="modal-content">
                <h2>✓ Report Sent!</h2>
                <p>Check your email for your personalized profit leak report.</p>
                <p style="margin-top: 20px;">Redirecting back to your results...</p>
              </div>
            `;
            
            // Close modal and ensure results are visible
            setTimeout(() => {
              closeEmailModal();
              // Make sure results screen is still active
              hideAllScreens();
              document.getElementById('results-screen').classList.add('active');
              // If results were cleared somehow, re-display them
              if (currentResults) {
                displayResultsWithoutModal(currentResults);
              }
            }, 2000);
          }
        } else {
          throw new Error(data.error || 'Unknown error occurred');
        }
      } catch(parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Raw text was:', text);
        throw new Error('Invalid server response');
      }
    })
    .catch(error => {
      hideLoading();
      console.error('Complete error details:', error);
      alert('Error sending report: ' + error.message + '\nPlease check console for details.');
    });
  });
  
  // Add event listener for skipping email
  /*document.getElementById('skip-email-btn').addEventListener('click', function() {
    closeEmailModal();
    // Ensure results screen remains visible
    hideAllScreens();
    document.getElementById('results-screen').classList.add('active');
  });*/


// New function to display results without triggering modal again
function displayResultsWithoutModal(result) {
  if (result.error) {
    alert('Error calculating results: ' + result.error);
    return;
  }
  
  // Update headline
  document.getElementById('result-industry').textContent = result.industry;
  /*document.getElementById('industry-average').textContent = '25-30%';*/
  document.getElementById('leak-percentage').textContent = 
    result.totalLeakagePercent.toFixed(1) + '%';
  document.getElementById('leak-dollars').textContent = 
    formatCurrency(result.totalLeakageDollars);
  
  // Display top 3 leaks
  const topLeaksContainer = document.getElementById('top-leaks-container');
  topLeaksContainer.innerHTML = '';
  
  result.topThreeLeaks.forEach((leak, index) => {
    const leakDiv = document.createElement('div');
    leakDiv.className = 'leak-item top-leak';
    leakDiv.innerHTML = `
      <div class="leak-rank">#${index + 1}</div>
      <div class="leak-info">
        <div class="leak-category">${leak.category}</div>
        <div class="leak-metrics">
          <span class="leak-percent">${leak.leakagePercent.toFixed(1)}% of revenue</span>
          <span class="leak-dollar">${formatCurrency(leak.leakageDollars)}</span>
        </div>
      </div>
    `;
    topLeaksContainer.appendChild(leakDiv);
  });
  
  // Show recovery potential
  document.getElementById('recovery-dollars').textContent = 
    formatCurrency(result.potentialRecovery);
  
  // Show detailed breakdown
  const breakdownContainer = document.getElementById('breakdown-container');
  breakdownContainer.innerHTML = '';
  
  result.leaks.forEach(leak => {
    const leakDiv = document.createElement('div');
    leakDiv.className = 'leak-item';
    
    let severityClass = 'low';
    if (leak.leakagePercent > 5) severityClass = 'medium';
    if (leak.leakagePercent > 10) severityClass = 'high';
    
    leakDiv.classList.add(severityClass);
    
    leakDiv.innerHTML = `
      <div class="leak-category">${leak.category}</div>
      <div class="leak-bar-container">
        <div class="leak-bar" style="width: ${Math.min(leak.leakagePercent * 3, 100)}%"></div>
      </div>
      <div class="leak-metrics">
        <span class="leak-percent">${leak.leakagePercent.toFixed(1)}%</span>
        <span class="leak-dollar">${formatCurrency(leak.leakageDollars)}</span>
      </div>
    `;
    
    breakdownContainer.appendChild(leakDiv);
  });
}

// Function to close email modal
function closeEmailModal() {
  const modal = document.querySelector('.email-capture-modal');
  if (modal) modal.remove();
}

// Make function globally available for onclick handlers
window.closeEmailModal = closeEmailModal;