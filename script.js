$('.print-button').click(function() {
    window.print()
});
const stackedCanvas = document.getElementById('stacked');
stackedCanvas.height = 400;
stackedCanvas.width = 600;
const baseData = [50, 20, 30];
Chart.register(ChartDataLabels);
var stackedChart = new Chart(stackedCanvas, {
    type: 'bar',
    data: {
        labels: [''], // You can add more labels if needed
        datasets: [
            {
                label: 'Home Owner',
                data: [baseData[0]],
                backgroundColor: '#f6e7ce'
            },
            {
                label: 'Homium',
                data: [baseData[1]],
                backgroundColor: '#e9c892'
            },
            {
                label: 'First Mortgage',
                data: [baseData[2]],
                backgroundColor: '#DCAA57'
            }
        ]
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                display: false // Adjusted for Chart.js v3 to hide the legend
            },
            tooltip: {
                enabled: false // Assuming you don't want tooltips either
            },
            datalabels: {
                color: '#00334A',
                font: {
                    size: 24, // Choose the font size,
                    weight: 'bold',
                    family: 'Ubuntu'
                },
                padding: 10,
                formatter: function(value, context) {
                    // Get the dataset label and value
                    const label = context.dataset.label;
                    const dataValue = context.dataset.data[context.dataIndex];

                    // Return the label along with percentage
                    return `${dataValue}% ${label} `;
                },
                anchor: 'end',
                align: 'start', // Align text to the start
                display: 'auto' // 'auto' or true depending on your preference
            }
        },
        scales: {
            x: { // Updated for Chart.js v3
                stacked: true,
                display: false
            },
            y: { // Updated for Chart.js v3
                stacked: true,
                display: false,
                grid: {
                    display: false
                },
                ticks: {
                    display: false
                }
            }
        },
        maintainAspectRatio: false
    }
});
const estimatedHomeValueData = {
  labels: [
      '2024', '2025'
  ],
  datasets: [ {
      label: 'HOMIUM',
      data: [400000, 420000], // Complete the array with your data points
      backgroundColor: '#DCAA57', // Adjust this color to match the image
      fill: 'origin', // To fill the area under the line
      tension: 0.4
  },
  {
  label: 'HOMEOWNER PLUS FIRST MORTGAGE',
  data: [300000, 310000], // Complete the array with your data points
  backgroundColor: '#557386', // Adjust this color to match the image
  fill: 'origin', // To fill the area under the line
  tension: 0.4
  }]
};

const config = {
  type: 'line',
  data: estimatedHomeValueData,
  options: {
      layout: {
          padding: {
              top: 20, // Padding at the top of the chart
              right: 50, // Padding on the right side of the chart
              bottom: 50, // Padding at the bottom of the chart (increased value for more space)
              left: 25 // Padding on the left side of the chart
          }
      },
      scales: {
          y: {
              stacked: true,
              beginAtZero: true,
              ticks: {
                  callback: function(value) {
                      return '$' + value.toLocaleString();
                  },
                  min: 0,
                  max: 3000000,
                  stepSize: 500000
              }
          },
          x: {
              grid: {
                  display: false // This will hide the vertical grid lines
              }
          }
      },
      plugins: {
          legend: {
              display: true,
              position: 'bottom',
              labels: {
                  padding: 20 // Adds space below the legend
              }
          },
          title: {
              display: true,
              text: 'Estimated Future Home Value',
              font: {
                  size: 24 // Increase the title font size
              },
              padding: {
                  top: 25,
                  bottom: 40 // Adjust the bottom padding to increase space below the title
              }
          },
          datalabels: {
              display: false
          }
      },
      responsive: true,
      maintainAspectRatio: false
  },
  plugins: [{
      beforeDraw: function(chart) {
          chart.canvas.parentNode.style.backgroundColor = 'white'; // Set white background color
      }
  }]
};

const estimatedHomeValueCanvas = document.getElementById('estimatedHomeValue').getContext('2d');
estimatedHomeValueCanvas.height = 600;
estimatedHomeValueCanvas.width = 600; 
const estimatedHomeValueChart = new Chart(estimatedHomeValueCanvas, config);

function calculateBaseData() {
  return [50, 20, 30];
}

function calculateEstimatedHomeValueData() {
  return {
      homeownerPlusFirstMortgage: [300000, 310000], // Mocked data
      homium: [400000, 420000] // Mocked data
  };
}

function formatNumber(numberToFormat) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numberToFormat);
}

function getElementByClassName(className) {
  return document.getElementsByClassName(className)[0];
}

function getStateConstants(state) {
  const states = {
    "COLORADO": {
    homium_lender_rate: 0.03,
    homium_originator_rate: 0.01,
    homium_fixed_fees: 2398.0
    },
  };

  return states[state];
}

function computePMT(rate, nper, pv) {
  rate = parseFloat(rate);
  nper = parseInt(nper, 10);
  pv = parseFloat(pv);

  if (rate === 0) return -pv / nper;

  const pvif = Math.pow(1 + rate, nper);
  return (-pv * rate * pvif) / (pvif - 1);
}

function computeMonthlyAmortizationSeries(loanAmount, monthlyRate, months) {
  let monthlyPmt = computePMT(monthlyRate, months, loanAmount) * -1;
  let sInt = [];
  let sPmt = [];
  let sBegBal = [loanAmount];
  let balance = loanAmount;

  for (let i = 0; i < months; i++) {
    let interest = balance * monthlyRate;
    sInt.push(interest);

    let principalPaid = monthlyPmt - interest;
    balance -= principalPaid;

    sPmt.push(monthlyPmt);
    sBegBal.push(balance);
  }

  return { sInt, sPmt, sBegBal };
}

function computeComparisonGmHeloc(loanAmount, interestRate, closingFees) {
  loanAmount = parseFloat(loanAmount);
  closingFees = parseFloat(closingFees);

  let monthlyRate = interestRate / 12;
  let drawMonthlyPmt = loanAmount * monthlyRate; // Interest-only payment during draw period
  let sDrawInt = new Array(120).fill(drawMonthlyPmt); // 10 years of draw period interest payments

  // For the repayment phase, calculate as a fully amortizing loan over the remaining term
  let { sInt: sRepayInt, sPmt: sRepayPmt } = computeMonthlyAmortizationSeries(loanAmount, monthlyRate, 240);

  // Combine draw period and repayment period interest payments
  let sHelocInt = sDrawInt.concat(sRepayInt);
  // Payments during draw period are interest-only, followed by amortized payments
  let sHelocPmt = new Array(120).fill(drawMonthlyPmt).concat(sRepayPmt);

  // Sum of the first 5 years of interest and payments
  let interest_5y = sHelocInt.slice(0, 60).reduce((acc, int) => acc + int, 0);
  let payments_5y = sHelocPmt.slice(0, 60).reduce((acc, pmt) => acc + pmt, 0) + closingFees;

  // Total interest and payments over the full term
  let interest_full_term = sHelocInt.reduce((acc, int) => acc + int, 0);
  let payments_full_term = sHelocPmt.reduce((acc, pmt) => acc + pmt, 0) + closingFees;

  return {
      loan_program: '30 Year HELOC',
      loan_term_years: 30,
      loan_amount: loanAmount,
      interest_rate: interestRate,
      est_monthly_payment: Math.round(drawMonthlyPmt), // Initial draw period monthly payment
      fees_origination: 0,
      fees_lender: 0,
      fees_closing: Math.round(closingFees),
      interest_5y: Math.round(interest_5y),
      payments_5y: Math.round(payments_5y),
      interest_full_term: Math.round(interest_full_term),
      payments_full_term: Math.round(payments_full_term)
  };
}

function computeComparisonGmHeloan(loanAmount, interestRate, closingFees) {
  // Ensure inputs are numbers
  loanAmount = parseFloat(loanAmount, 10);
  closingFees = parseFloat(closingFees, 10);

  let monthlyRate = +interestRate / 12;
  let { sInt, sPmt } = computeMonthlyAmortizationSeries(loanAmount, monthlyRate, 360);

  // Sum of the first 5 years of interest and total interest
  let interest_5y = sInt.slice(0, 60).reduce((acc, int) => acc + int, 0);
  let interest_full_term = sInt.reduce((acc, int) => acc + int, 0);

  // Payments calculations including closing fees
  let payments_5y = sPmt.slice(0, 60).reduce((acc, pmt) => acc + Math.abs(pmt), 0) + closingFees;
  let payments_full_term = sPmt.reduce((acc, pmt) => acc + Math.abs(pmt), 0) + closingFees;

  return {
      loan_program: '30 Year HELOAN',
      loan_term_years: 30,
      loan_amount: loanAmount,
      interest_rate: +interestRate,
      est_monthly_payment: Math.abs(Math.round(sPmt[0])),
      fees_origination: 0,
      fees_lender: 0,
      fees_closing: Math.round(closingFees),
      interest_5y: Math.round(interest_5y),
      payments_5y: Math.round(payments_5y),
      interest_full_term: Math.round(interest_full_term),
      payments_full_term: Math.round(payments_full_term)
  };
}

function computeComparisonHomium(state, loanAmount, currentHomeValue, firstMortgageValue, appreciationRate, appreciationYears) {
  const { homium_lender_rate, homium_originator_rate, homium_fixed_fees } = getStateConstants(state);

  loanAmount = parseFloat(loanAmount);
  currentHomeValue = parseFloat(currentHomeValue);
  firstMortgageValue = parseFloat(firstMortgageValue);
  appreciationRate = parseFloat(appreciationRate);
  appreciationYears = parseInt(appreciationYears, 10);

  let ltvSecond = loanAmount / currentHomeValue;
  let futureHomeValue = currentHomeValue * Math.pow(1 + appreciationRate, appreciationYears);
  let futureSanValue = futureHomeValue * ltvSecond;
  let feesTotal = loanAmount * homium_originator_rate + loanAmount * homium_lender_rate + homium_fixed_fees;

  return {
      loan_program: 'Shared Appreciation',
      loan_term_years: 30,
      loan_amount: loanAmount,
      interest_rate: 0.0, // Interest rate is not applicable for this program
      est_monthly_payment: 0.0, // Monthly payment is not applicable for this program
      fees_origination: Math.round(loanAmount * homium_originator_rate),
      fees_lender: Math.round(loanAmount * homium_lender_rate),
      fees_closing: Math.round(homium_fixed_fees),
      interest_5y: 0.0, // Interest for 5 years is not applicable for this program
      payments_5y: Math.round(feesTotal),
      shared_appreciation_years: appreciationYears,
      shared_appreciation_amount: Math.round(futureSanValue),
      interest_full_term: 0.0, // Interest for full term is not applicable for this program
      payments_full_term: Math.round(futureSanValue + feesTotal)
  };
}

var Webflow = Webflow || [];
Webflow.push(function() {
  // new form handling
  $('.loan-details-form').submit(function(evt) {
    evt.preventDefault();
    const formData = $(this).serialize();

    // You can also access individual form elements by name
    const loanAmount = $('input[name="loan-amount"]').val();
    const estimatedHomeValue = $('input[name="estimated-home-value"]').val();
    const firstMortgageBalance = $('input[name="first-mortgage-balance"]').val();
    const interestRate = $('input[name="interestRate"]').val();
    const interestRateFinalValue = +interestRate / 100;
    const closingFees = $('input[name="closing-fees"]').val();
    const expectedAppreciation = $('input[name="expected-appreciation"]').val();
    const expectedAppreciationFinalValue = +expectedAppreciation / 100;
    const yearsToProject = $('input[name="years-to-project"]').val();
    const homiumCalculations = computeComparisonHomium('COLORADO', loanAmount, estimatedHomeValue, firstMortgageBalance, expectedAppreciationFinalValue, yearsToProject);
    const helocCalculations = computeComparisonGmHeloc(loanAmount, interestRateFinalValue, closingFees);
    const heloanCalculations = computeComparisonGmHeloan(loanAmount, interestRateFinalValue, closingFees);
    // Loan Amounts
    const loanAmountHomium = getElementByClassName('loan-amount-homium');
    const loanAmountGuildMortgage = getElementByClassName('loan-amount-guild-mortgage');
    const loanAmountGuildMortgage2 = getElementByClassName('loan-amount-guild-mortgage-2');
    loanAmountHomium.textContent = formatNumber(loanAmount);
    loanAmountGuildMortgage.textContent = formatNumber(loanAmount);
    loanAmountGuildMortgage2.textContent = formatNumber(loanAmount);
    // Interest Rate
    const interestRateHomium = getElementByClassName('interest-rate-homium');
    const interestRateGuildMortgage = getElementByClassName('interest-rate-guild-mortgage');
    const interestRateGuildMortgage2 = getElementByClassName('interest-rate-guild-mortgage-2');
    interestRateHomium.textContent = formatNumber(0);
    interestRateGuildMortgage.textContent = `${+interestRate}%`;
    interestRateGuildMortgage2.textContent = `${+interestRate}%`;
    // Estimate Payment
    const estimatePaymentHomium = getElementByClassName('estimate-payment-principal-interest');
    const estimatePaymentGuildMortgage = getElementByClassName('est-payment-interest-only');
    const estimatePaymentGuildMortgage2 = getElementByClassName('estimate-payment-principal-and-interest');
    estimatePaymentHomium.textContent = formatNumber(homiumCalculations?.est_monthly_payment);
    estimatePaymentGuildMortgage.textContent = formatNumber(helocCalculations?.est_monthly_payment);
    estimatePaymentGuildMortgage2.textContent = formatNumber(heloanCalculations?.est_monthly_payment);
    // Fees
    const originationFeesHomium = getElementByClassName('origination-fees-homium');
    const originationFeesGuildMortgage = getElementByClassName('origination-fees-guild-mortgage');
    const originationFeesGuildMortgage2 = getElementByClassName('origination-fees-guild-mortgage-2');
    originationFeesHomium.textContent = formatNumber(homiumCalculations?.fees_origination);
    originationFeesGuildMortgage.textContent = formatNumber(helocCalculations?.fees_origination);
    originationFeesGuildMortgage2.textContent = formatNumber(heloanCalculations?.fees_origination);
    const lenderFeesHomium = getElementByClassName('lender-fees-homium');
    const lenderFeesGuildMortgage = getElementByClassName('lender-fees-guild-mortgage');
    const lenderFeesGuildMortgage2 = getElementByClassName('lender-fees-guild-mortgage-2');
    lenderFeesHomium.textContent = formatNumber(homiumCalculations?.fees_lender);
    lenderFeesGuildMortgage.textContent = formatNumber(helocCalculations?.fees_lender);
    lenderFeesGuildMortgage2.textContent = formatNumber(heloanCalculations?.fees_lender);
    const estFeesClosingHomium = getElementByClassName('estimate-fees-closing-homium');
    const estFeesClosingGuildMortgage = getElementByClassName('estimate-fees-closing-guild-mortgage');
    const estFeesClosingGuildMortgage2 = getElementByClassName('estimate-fees-closing-guild-mortgage-2');
    estFeesClosingHomium.textContent = formatNumber(homiumCalculations?.fees_closing);
    estFeesClosingGuildMortgage.textContent = formatNumber(helocCalculations?.fees_closing);
    estFeesClosingGuildMortgage2.textContent = formatNumber(heloanCalculations?.fees_closing);
    // Estimate Cash You Get
    const estimateCashYouGetHomium = getElementByClassName('estimate-cash-homium');
    const estimateCashYouGetGuildMortgage = getElementByClassName('estimate-cash-guild-mortgage');
    const estimateCashYouGetGuildMortgage2 = getElementByClassName('estimate-cash-guild-mortgage-2');
    estimateCashYouGetHomium.textContent =  formatNumber(+loanAmount - homiumCalculations?.fees_origination - homiumCalculations?.fees_lender - homiumCalculations?.fees_closing);
    estimateCashYouGetGuildMortgage.textContent = formatNumber(+loanAmount - helocCalculations?.fees_origination - helocCalculations?.fees_lender - helocCalculations?.fees_closing);
    estimateCashYouGetGuildMortgage2.textContent = formatNumber(+loanAmount - heloanCalculations?.fees_origination - heloanCalculations?.fees_lender - heloanCalculations?.fees_closing);
    // Total Interest in 5 Years
    const totalInterest5YearsHomium = getElementByClassName('total-interest-homium');
    const totalInterest5YearsGuildMortgage = getElementByClassName('total-interest-guild-mortgage');
    const totalInterest5YearsGuildMortgage2 = getElementByClassName('total-interest-guild-mortgage-2');
    totalInterest5YearsHomium.textContent =  formatNumber(homiumCalculations?.interest_5y);
    totalInterest5YearsGuildMortgage.textContent = formatNumber(helocCalculations?.interest_5y);
    totalInterest5YearsGuildMortgage2.textContent = formatNumber(heloanCalculations?.interest_5y);
    // Total Payments in 5 Years
    const totalPayments5YearsHomium = getElementByClassName('total-payments-homium');
    const totalPayments5YearsGuildMortgage = getElementByClassName('total-payments-guild-mortgage');
    const totalPayments5YearsGuildMortgage2 = getElementByClassName('total-payments-guild-mortgage-2');
    totalPayments5YearsHomium.textContent =  formatNumber(homiumCalculations?.payments_5y);
    totalPayments5YearsGuildMortgage.textContent = formatNumber(helocCalculations?.payments_5y);
    totalPayments5YearsGuildMortgage2.textContent = formatNumber(heloanCalculations?.payments_5y);
    // Estimated Share Appreciation
    const estimatedShareAppreciationHomiumHeader = getElementByClassName('estimate-shared-appreciation-in-dynamic-years');
    const estimatedShareAppreciationHomium = getElementByClassName('estimated-shared-appreciation-homium');
    const estimatedShareAppreciationGuildMortgage = getElementByClassName('estimated-shared-appreciation-guild-mortgage');
    const estimatedShareAppreciationGuildMortgage2 = getElementByClassName('estimated-shared-appreciation-guild-mortgage-2');
    estimatedShareAppreciationHomium.textContent =  formatNumber(homiumCalculations?.shared_appreciation_amount);
    estimatedShareAppreciationGuildMortgage.textContent = formatNumber(0);
    estimatedShareAppreciationGuildMortgage2.textContent = formatNumber(0);
    estimatedShareAppreciationHomiumHeader.textContent = `Estimated Shared Appreciation in ${yearsToProject} Years`;
    // Estimated Interest in 30 Years
    const estimatedInterest30YearsHomium = getElementByClassName('estimated-interest-30-homium');
    const estimatedInterest30YearsGuildMortgage = getElementByClassName('estimated-interest-30-guild-mortgage');
    const estimatedInterest30YearsGuildMortgage2 = getElementByClassName('estimated-interest-30-guild-mortgage-2');
    estimatedInterest30YearsHomium.textContent =  formatNumber(homiumCalculations?.interest_full_term);
    estimatedInterest30YearsGuildMortgage.textContent = formatNumber(helocCalculations?.interest_full_term);
    estimatedInterest30YearsGuildMortgage2.textContent = formatNumber(heloanCalculations?.interest_full_term);
    // Estimated Payments in 30 Years
    const estimatedPayments30YearsHomium = getElementByClassName('estimate-payments-30-homium');
    const estimatedPayments30YearsGuildMortgage = getElementByClassName('estimate-payments-30-guild-mortgage');
    const estimatedPayments30YearsGuildMortgage2 = getElementByClassName('estimate-payments-30-guild-mortgage-2');
    estimatedPayments30YearsHomium.textContent =  formatNumber(homiumCalculations?.payments_full_term);
    estimatedPayments30YearsGuildMortgage.textContent = formatNumber(helocCalculations?.payments_full_term);
    estimatedPayments30YearsGuildMortgage2.textContent = formatNumber(heloanCalculations?.payments_full_term);
    const newBaseData = calculateBaseData();
    const newEstimatedHomeValueData = calculateEstimatedHomeValueData();
    
    // Update base chart data
    stackedChart.data.datasets.forEach((dataset, index) => {
      dataset.data = [newBaseData[index]]; // Assuming your dataset structure matches
    });
    stackedChart.update();

    var currentYear = new Date().getFullYear();
    var numberOfYearsToAdd = +yearsToProject;
    var labels = [];
    for (var i = 0; i <= numberOfYearsToAdd; i++) {
    labels.push(currentYear + i);
    }

    estimatedHomeValueChart.data.labels = labels;
    estimatedHomeValueChart.data.datasets[0].data = newEstimatedHomeValueData.homium;
    estimatedHomeValueChart.data.datasets[1].data = newEstimatedHomeValueData.homeownerPlusFirstMortgage;
    estimatedHomeValueChart.update();

    return false;
  });
});