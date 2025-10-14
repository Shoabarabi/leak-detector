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

// Capture URL parameters
const urlParams = new URLSearchParams(window.location.search);
const userData = {
  name: urlParams.get('name') || '',
  company: urlParams.get('company') || '',
  industry: urlParams.get('industry') || '',
  revenue: (parseFloat(urlParams.get('revenue')) || 0) * 1000000, // Convert from millions
  email: urlParams.get('email') || ''
};

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
  console.log('Business Profit Leak Diagnostic initialized');
  generateSessionId();
  
  if (userData.industry && userData.revenue > 0) {
    selectedIndustry = userData.industry;
    selectedRevenue = userData.revenue;
    hideAllScreens();
    await loadQuestions();
    startAssessmentDirectly();
  } else {
    loadIndustries();
    loadQuestions();
  }
});

// Generate unique session ID
function generateSessionId() {
  sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  console.log('Generated session ID:', sessionId);
}

// Load and display industries
function loadIndustries() {
  const industries = [
    'Beauty & Skincare', 'Supplements & Nutraceuticals', 'Fashion & Apparel', 'Home & Garden', 'Pet Products', 'Food & Beverage', 'Electronics & Tech Accessories', 'Fitness & Wellness', 'Baby & Kids', 'Jewelry & Accessories', 'Outdoor & Sports', 'Automotive Accessories', 'Arts & Crafts', 'Personal Care (Salons/Spas)', 'Subscription Boxes', 'Consulting', 'Tech Services', 'Real Estate', 'Business Services', 'Education', 'Marketing Services', 'Recruiting', 'Nonprofit', 'Retail Consulting', 'Health Tech', 'Publishing', 'Electronics & Tech (SaaS)', 'Ecommerce Services', 'Tech Consulting', 'Personal Care (Dental)', 'Business Advocacy', 'Retail', 'Default (Other SMBs)'
  ];
  const grid = document.getElementById('industry-grid');
  if (!grid) return;
  grid.innerHTML = '';
  industries.forEach(industry => {
    const button = document.createElement('button');
    button.className = 'industry-btn';
    button.textContent = industry;
    button.onclick = () => selectIndustry(industry, button);
    grid.appendChild(button);
  });
}

// Industry selection
function selectIndustry(industry, button) {
  selectedIndustry = industry;
  document.querySelectorAll('.industry-btn').forEach(btn => btn.classList.remove('selected'));
  button.classList.add('selected');
  document.getElementById('continue-to-revenue').classList.remove('hidden');
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
  document.querySelectorAll('.revenue-btn').forEach(btn => btn.classList.remove('selected'));
  event.target.classList.add('selected');
  document.getElementById('custom-revenue').value = '';
  document.getElementById('start-assessment').classList.remove('hidden');
}

function useCustomRevenue() {
  const customValue = document.getElementById('custom-revenue').value;
  if (!customValue || customValue <= 0) {
    alert('Please enter a valid revenue amount');
    return;
  }
  selectedRevenue = parseFloat(customValue);
  document.querySelectorAll('.revenue-btn').forEach(btn => btn.classList.remove('selected'));
  document.getElementById('start-assessment').classList.remove('hidden');
}

// Load quiz questions from API
function loadQuestions() {
  return fetch(`${API_URL}?action=getQuizQuestions`)
    .then(response => response.json())
    .then(data => {
      questions = data;
      console.log('Loaded', questions.length, 'questions');
    })
    .catch(handleError);
}

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
  currentQuestionIndex = 0;
  responses = [];
  hideAllScreens();
  document.getElementById('quiz-screen').classList.add('active');
  updateProgress(25);
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
  document.getElementById('question-counter').textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
  document.getElementById('question-text').textContent = question.text;
  const optionsContainer = document.getElementById('options-container');
  optionsContainer.innerHTML = '';
  question.options.forEach(option => {
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option';
    optionDiv.onclick = () => selectOption(option, optionDiv);
    optionDiv.innerHTML = `<span>${option.text}</span>`;
    optionsContainer.appendChild(optionDiv);
  });
  document.getElementById('prev-question').disabled = currentQuestionIndex === 0;
  document.getElementById('next-question').disabled = !responses.find(r => r.questionId === question.id);
  document.getElementById('next-question').textContent = (currentQuestionIndex === questions.length - 1) ? 'See Results' : 'Next';
  updateProgress(25 + (currentQuestionIndex / questions.length * 65));
}

// Handle option selection
function selectOption(option, optionDiv) {
  document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
  optionDiv.classList.add('selected');
  const question = questions[currentQuestionIndex];
  const response = {
    questionId: question.id,
    question: question.text,
    category: question.category,
    answer: option.text,
    value: option.value
  };
  const existingIndex = responses.findIndex(r => r.questionId === question.id);
  if (existingIndex >= 0) {
    responses[existingIndex] = response;
  } else {
    responses.push(response);
  }
  document.getElementById('next-question').disabled = false;
}

function nextQuestion() {
  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex++;
    displayQuestion();
  } else {
    calculateResults();
  }
}

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
      if (result.error) {
          throw new Error(result.error);
      }
      currentResults = result; // Store results globally
      displaySummaryScreen(result);
    })
    .catch(error => {
      hideLoading();
      alert('Error calculating results: ' + error.message);
    });
}

// Display summary screen before email
function displaySummaryScreen(result) {
  hideLoading();
  hideAllScreens();
  document.getElementById('result-summary-screen').classList.add('active');

  // Hide progress bar and adjust header styles
  document.querySelector('.progress-container').style.display = 'none';
  document.querySelector('.header').style.paddingBottom = '10px';
  document.querySelector('.experience').style.marginBottom = '5px';
  document.querySelector('.subtitle').style.display = 'none';
  
  if (userData.name && userData.company) {
    const headline = document.querySelector('#result-summary-screen .results-header h2');
    if (headline) {
      headline.textContent = `${userData.name}, Your ${userData.company} Profit Leak Analysis`;
    }
  }

  // Pre-fill email if available
  if (userData.email) {
    document.getElementById('inline-report-email').value = userData.email;
  }
  updateProgress(100);
  
  // Populate summary data
  document.getElementById('summary-industry').textContent = result.industry;
  document.getElementById('summary-leak-dollars').textContent = formatCurrency(result.totalLeakageDollars);
  document.getElementById('summary-leak-percentage-text').textContent = result.totalLeakagePercent.toFixed(1) + '%';
  
  if (result.topThreeLeaks && result.topThreeLeaks[0]) {
    document.getElementById('biggest-leak-category').textContent = result.topThreeLeaks[0].category;
    document.getElementById('biggest-leak-dollar').textContent = formatCurrency(result.topThreeLeaks[0].leakageDollars);
  }
  
  drawPieChart(result.totalLeakagePercent);
  
  // Add inline email handler
  document.getElementById('inline-send-report-btn').addEventListener('click', () => handleInlineEmailSubmit(result));
}

// Generate HTML for the PDF report
function generateHTMLReportTemplate(result) {
    // This extensive function remains unchanged.
    // It correctly maps data and builds the HTML string for the PDF.
    // (Content of the function from your original file is assumed here)
  const leakagePercent = result.totalLeakagePercent || 0;
  const totalLoss = result.totalLeakageDollars || 0;
  const weeklyLoss = Math.round(totalLoss / 52);
  const contactName = userData.name || result.userName || 'Valued Client';
  const clientName = userData.company || result.companyName || 'Your Company';

  return `<!doctype html>
    <html>
    <head><title>Report for ${clientName}</title></head>
    <body>
      <h1>Revenue Leak Executive Briefing for ${clientName}</h1>
      <p>Prepared for: ${contactName}</p>
      <h2>Total Annual Leakage: <span style="color:red;">${formatCurrency(totalLoss)} (${leakagePercent.toFixed(1)}%)</span></h2>
      <p>That's <strong>${formatCurrency(weeklyLoss)}</strong> every single week.</p>
      <h3>Top 3 Leaks:</h3>
      <ul>
        ${result.topThreeLeaks.map(leak => `<li><strong>${leak.category}:</strong> ${formatCurrency(leak.leakageDollars)}</li>`).join('')}
      </ul>
      </body>
    </html>
  `;
}

// Generate PDF from HTML using jspdf and html2canvas
async function generatePDFFromHTML(result) {
  try {
    showLoading('Generating your PDF report...');
    const htmlContent = generateHTMLReportTemplate(result);
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '210mm'; // A4 width
    document.body.appendChild(container);
    
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for render
    
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pages = container.querySelectorAll('.page'); // Assuming your template has .page elements
    
    const reportPages  = Array.from(container.querySelectorAll('.page'));
    //const pages = container.querySelectorAll('.page');
    
    for (let i = 0; i < reportPages.length; i++) {
      if (i > 0) {
        pdf.addPage();
      }
      
      const canvas = await html2canvas(reportPages[i], {
        scale: 1, // ← CHANGE: was 2, now 1
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.8);  // ← CHANGE: was 'image/png', now 'image/jpeg', 0.8
      //const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
    }
    
    for (let i = 0; i < pages.length; i++) {
      if (i > 0) pdf.addPage();
      const canvas = await html2canvas(pages[i], { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    }
    
    const pdfBase64 = pdf.output('datauristring').split(',')[1];
    document.body.removeChild(container);
    hideLoading();
    return pdfBase64;
  } catch (error) {
    hideLoading();
    console.error('PDF generation error:', error);
    throw error;
  }
}

// Handle inline email submission
async function handleInlineEmailSubmit(result) {
  let email = document.getElementById('inline-report-email').value;
  if (!email || !email.includes('@')) {
    alert('Please enter a valid email address');
    return;
  }

  try {
    const pdfBase64 = await generatePDFFromHTML(result);
    showLoading('Sending your report...');
    
    const response = await fetch(API_URL, {
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
      hideAllScreens();
      document.getElementById('results-screen').classList.add('active');
      displayFullResults(currentResults);
    } else {
      throw new Error(data.error || 'Failed to send report from server.');
    }
  } catch (error) {
    hideLoading();
    alert('Error sending report: ' + error.message);
  }
}

// Display full results after email
function displayFullResults(result) {
  document.getElementById('result-industry').textContent = result.industry;
  document.getElementById('leak-percentage').textContent = result.totalLeakagePercent.toFixed(1) + '%';
  document.getElementById('leak-dollars').textContent = formatCurrency(result.totalLeakageDollars);
  const topLeaksContainer = document.getElementById('top-leaks-container');
  topLeaksContainer.innerHTML = '';
  result.topThreeLeaks.forEach((leak, index) => {
    topLeaksContainer.innerHTML += `
      <div class="leak-item top-leak">
        <div class="leak-rank">#${index + 1}</div>
        <div class="leak-info">
          <div class="leak-category">${leak.category}</div>
          <div class="leak-metrics">
            <span class="leak-percent">${leak.leakagePercent.toFixed(1)}% of revenue</span>
            <span class="leak-dollar">${formatCurrency(leak.leakageDollars)}</span>
          </div>
        </div>
      </div>`;
  });
  document.getElementById('recovery-dollars').textContent = formatCurrency(result.potentialRecovery);
  const breakdownContainer = document.getElementById('breakdown-container');
  breakdownContainer.innerHTML = '';
  result.leaks.forEach(leak => {
    breakdownContainer.innerHTML += `
      <div class="leak-item">
        <div class="leak-category">${leak.category}</div>
        <div class="leak-bar-container">
          <div class="leak-bar" style="width: ${Math.min(leak.leakagePercent * 3, 100)}%"></div>
        </div>
        <div class="leak-metrics">
          <span class="leak-percent">${leak.leakagePercent.toFixed(1)}%</span>
          <span class="leak-dollar">${formatCurrency(leak.leakageDollars)}</span>
        </div>
      </div>`;
  });
}

// Utility functions (unchanged)
function formatCurrency(amount) {
  if (amount >= 1000000) return '$' + (amount / 1000000).toFixed(1) + 'M';
  if (amount >= 1000) return '$' + Math.round(amount / 1000) + 'K';
  return '$' + Math.round(amount);
}

function drawPieChart(leakPercentage) {
    const canvas = document.getElementById('leak-pie-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.8;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Background circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fill();
    // Foreground arc
    const endAngle = (leakPercentage / 100) * 2 * Math.PI - (0.5 * Math.PI);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -0.5 * Math.PI, endAngle);
    ctx.lineWidth = 15;
    ctx.strokeStyle = '#e74c3c';
    ctx.stroke();
    // Text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${leakPercentage.toFixed(1)}%`, centerX, centerY);
}

function updateProgress(percentage) {
  document.getElementById('progress-fill').style.width = percentage + '%';
  let progressText = 'Get Started';
  if (percentage >= 20 && percentage < 25) progressText = 'Revenue Input';
  else if (percentage >= 25 && percentage < 90) progressText = 'Assessment in Progress';
  else if (percentage >= 90 && percentage < 100) progressText = 'Calculating Results...';
  else if (percentage >= 100) progressText = 'Complete!';
  document.getElementById('progress-text').textContent = progressText;
}

function hideAllScreens() {
  document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
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
  alert('An error occurred: ' + error.message);
}

function startOver() {
    window.location.href = window.location.pathname; // Easiest way to reset state
}

function requestAudit() {
  window.open('https://calendly.com/ds-shoab/30min', '_blank');
}