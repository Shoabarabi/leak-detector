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

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  console.log('Business Profit Leak Diagnostic initialized');
  generateSessionId();
  loadIndustries();
  loadQuestions();
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

// Load quiz questions
function loadQuestions() {
  fetch(`${API_URL}?action=getQuizQuestions`)
    .then(response => response.json())
    .then(data => {
      questions = data;
      console.log('Loaded', questions.length, 'questions');
    })
    .catch(error => {
      console.error('Error loading questions:', error);
      handleError(error);
    });
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
  
  showLoading('Analyzing your profit leaks...');
  
  const params = new URLSearchParams({
    action: 'calculateLeakage',
    industry: selectedIndustry,
    revenue: selectedRevenue,
    sessionId: sessionId,
    responses: JSON.stringify(responses)
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
  
  // Store results globally
  currentResults = result;
  
  // Show SUMMARY screen first (not full results)
  hideAllScreens();
  document.getElementById('result-summary-screen').classList.add('active');
  updateProgress(100);
  
  // Populate summary data
  document.getElementById('summary-industry').textContent = result.industry;
  document.getElementById('summary-leak-percentage').textContent = 
    result.totalLeakagePercent.toFixed(1) + '%';
  document.getElementById('summary-leak-dollars').textContent = 
    formatCurrency(result.totalLeakageDollars);
  
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


// Draw pie chart for summary
function drawPieChart(leakPercentage) {
  const canvas = document.getElementById('leak-pie-chart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 80;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Convert percentage to radians
  const leakAngle = (leakPercentage / 100) * 2 * Math.PI;
  
  // Draw leak portion (red)
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.arc(centerX, centerY, radius, -Math.PI/2, -Math.PI/2 + leakAngle);
  ctx.closePath();
  ctx.fillStyle = '#e74c3c';
  ctx.fill();
  
  // Draw healthy portion (green)
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.arc(centerX, centerY, radius, -Math.PI/2 + leakAngle, Math.PI * 1.5);
  ctx.closePath();
  ctx.fillStyle = '#27ae60';
  ctx.fill();
  
  // Draw border
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // Draw percentage text in center
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(leakPercentage.toFixed(1) + '%', centerX, centerY);
}

// Handle inline email submission
function handleInlineEmailSubmit(result) {
  const email = document.getElementById('inline-report-email').value;
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
  .then(response => response.text())
  .then(text => {
    const data = JSON.parse(text);
    hideLoading();
    
    if (data.success) {
      // Now show the FULL results
      hideAllScreens();
      document.getElementById('results-screen').classList.add('active');
      displayFullResults(currentResults);
    }
  })
  .catch(error => {
    hideLoading();
    alert('Error sending report: ' + error.message);
  });
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
  window.open('https://calendly.com/mainnov/recovery', '_blank');
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