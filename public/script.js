let timerInterval = null;
let time = 0; // Time in seconds
let running = false;
let sessionActive = false; // To track if a session is active
let startTime, endTime;
let usedLabels = []; // Store used labels for suggestions
let currentDate = new Date();

const display = document.getElementById('display');
const startStopButton = document.getElementById('startStop');
const resetButton = document.getElementById('reset');
const endSessionButton = document.getElementById('endSession');
const statisticsList = document.getElementById('statisticsList');
const timerLabelInput = document.getElementById('timerLabel');
const timerHeading = document.getElementById('timerHeading');
const labelList = document.getElementById('labelList'); // Datalist for label suggestions

// // Capitalize first letter of each word
function capitalizeFirstLetter(str) {
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

// Updates label suggestions
function updateLabelSuggestions(label) {
    if (!usedLabels.includes(label)) {
        usedLabels.push(label);
        const option = document.createElement('option');
        option.value = label;
        labelList.appendChild(option);
    }
}

function updateDisplay() {
    let hours = Math.floor(time / 3600).toString().padStart(2, '0');
    let minutes = Math.floor((time % 3600) / 60).toString().padStart(2, '0');
    let seconds = (time % 60).toString().padStart(2, '0');
    display.textContent = `${hours}:${minutes}:${seconds}`;
}

function toggleTimer() {
    
    const timerLabel = timerLabelInput.value.trim();
    // Check if the label is empty before starting the timer
    if (!running && !timerLabel) {
        // Alert the user or handle this case as needed
        alert("Please enter a label before starting the timer.");
        return; // Exit the function early
    }
    if (running) {
        clearInterval(timerInterval);
        startStopButton.textContent = 'Start';
        running = false;
    } else {
        if (!sessionActive) {
            startTime = new Date();
            sessionActive = true;
            endSessionButton.style.display = 'inline-block';
        }
        timerInterval = setInterval(() => {
            time++;
            updateDisplay();
        }, 1000);
        startStopButton.textContent = 'Pause';
        running = true;
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    time = 0;
    running = false;
    sessionActive = false;
    startStopButton.textContent = 'Start';
    display.textContent = '00:00:00';
    endSessionButton.style.display = 'none';
}

function saveStatistic(timeElapsed) {
    let label = timerLabelInput.value.trim();
    label = capitalizeFirstLetter(label); // Capitalize first letter of each word
    updateLabelSuggestions(label);

    fetch('/api/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            time: timeElapsed,
            start: startTime.toISOString(),
            end: endTime.toISOString(),
            label: label,
        }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        fetchStatistic(); // Refresh the statistics display
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}


function fetchStatistic() {
    fetch('/api/stats')
    .then(response => response.json())
    .then(data => {
        console.log('Fetched statistics:', data);
        displayStatistics(data);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

function displayStatistics(data) {
    statisticsList.innerHTML = ''; // Clear the existing content

    const table = document.createElement('table');
    table.className = 'table table-striped';
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');
    table.appendChild(thead);
    table.appendChild(tbody);

    const headings = ['No.', 'Label Name', 'Duration', 'Start Date', 'End Date', 'Start Time', 'End Time', 'Delete All'];
    const trHead = document.createElement('tr');
    headings.forEach(heading => {
        const th = document.createElement('th');
        if (heading === 'Delete All') {
            // Make the delete column heading clickable
            const deleteAllSpan = document.createElement('span');
            deleteAllSpan.textContent = heading;
            deleteAllSpan.style.cursor = 'pointer';
            deleteAllSpan.className = 'delete-all-btn';
            deleteAllSpan.addEventListener('click', deleteAllStatistics);
            th.appendChild(deleteAllSpan);
        } else {
            th.textContent = heading;
        }
        trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    data.forEach((stat, index) => {
        const tr = document.createElement('tr');
        const duration = new Date(stat.time * 1000).toISOString().substr(11, 8);

        const dateOptions = { year: '2-digit', month: '2-digit', day: '2-digit', timeZone: 'Asia/Kolkata' };
        const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' };

        const startDate = new Date(stat.start).toLocaleDateString('en-IN', dateOptions);
        const endDate = new Date(stat.end).toLocaleDateString('en-IN', dateOptions);
        const startTime = new Date(stat.start).toLocaleTimeString('en-IN', timeOptions);
        const endTime = new Date(stat.end).toLocaleTimeString('en-IN', timeOptions);
        

        const cells = [index + 1, stat.label, duration, startDate, endDate, startTime, endTime];
        cells.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });

        // Add a cell with a trash icon for the delete action
        const deleteCell = document.createElement('td');
        deleteCell.innerHTML = `<i class="fas fa-trash-alt" style="cursor: pointer;"></i>`;
        deleteCell.firstChild.addEventListener('click', function() {
            const confirmed = confirm("Do you really want to delete this entry?");
            if (confirmed) {
                deleteStatistic(stat._id);
            }
        });
        tr.appendChild(deleteCell);

        
        tbody.appendChild(tr);
    });

    statisticsList.appendChild(table);
}

// Function to fetch and update label suggestions from the database
function fetchLabels() {
    fetch('/api/labels')
    .then(response => response.json())
    .then(labels => {
        labels.forEach(label => {
            if (!usedLabels.includes(label)) {
                updateLabelSuggestions(label);
                usedLabels.push(label); // Update usedLabels to include fetched labels
            }
        });
    })
    .catch(error => console.error('Error fetching labels:', error));
}


startStopButton.addEventListener('click', toggleTimer);
// Show Reset Confirmation Modal
resetButton.addEventListener('click', function() {
    $('#resetModal').modal('show'); // Use jQuery to show the modal
});

// Actual reset action
document.getElementById('confirmReset').addEventListener('click', function() {
    resetTimer();
    $('#resetModal').modal('hide'); // Hide the modal after confirming
});

// Show End Session Confirmation Modal
endSessionButton.addEventListener('click', function() {
    if (running) {
        toggleTimer(); // Pause the timer
    }
    $('#endSessionModal').modal('show'); // Use jQuery to show the modal
});

// Listen for the modal being closed without confirmation (i.e., the user clicked "No" or closed the modal)
$('#endSessionModal').on('hidden.bs.modal', function () {
    if (!running && sessionActive) { // Check if the session was active but not running (paused)
        toggleTimer(); // Resume the timer
    }
});

// Actual end session action
document.getElementById('confirmEndSession').addEventListener('click', function() {
    endTime = new Date(); // Set end time since the user has confirmed to end the session
    saveStatistic(time);
    resetTimer();
    sessionActive = false; // Ensure sessionActive is reset
    $('#endSessionModal').modal('hide'); // Hide the modal after confirming
});


// Call fetchLabels when the page loads
document.addEventListener('DOMContentLoaded', () => {
    fetchLabels();
    fetchStatistic(); // Assuming you want to also fetch statistics on page load
});

function deleteStatistic(id) {
    fetch(`/api/delete/${id}`, {
        method: 'DELETE',
    })
    .then(response => response.json())
    .then(data => {
        console.log(data.message);
        fetchStatistic(); // Refresh the log table after deletion
    })
    .catch(error => console.error('Error:', error));
}

function deleteAllStatistics() {
    const confirmed = confirm("Do you really want to delete all log entries?");
    if (confirmed) {
        // Assuming you have an endpoint '/api/delete-all' for deleting all entries
        fetch('/api/delete-all', {
            method: 'DELETE',
        })
        .then(response => response.json())
        .then(data => {
            console.log('All entries deleted:', data);
            fetchStatistic(); // Refresh the log table to show it's empty
        })
        .catch(error => console.error('Error deleting all statistics:', error));
    }
}

function formatDate(date) {
    return date.toISOString().split('T')[0]; // Returns date in 'YYYY-MM-DD' format
}

function updateDateDisplay() {
    // Format the current date to 'YYYY-MM-DD' and set it as the value of the date picker
    document.getElementById('datePicker').value = formatDate(currentDate);
    fetchAndDisplayInsights();
}

function fetchAndDisplayInsights() {
    fetch('/api/stats')
    .then(response => response.json())
    .then(data => {
        // Filter data by currentDate
        const filteredData = data.filter(stat => formatDate(new Date(stat.start)) === formatDate(currentDate));
        const insights = {}; // Object to hold total duration by label

        filteredData.forEach(stat => {
            if (!insights[stat.label]) {
                insights[stat.label] = 0;
            }
            insights[stat.label] += stat.time;
        });

        displayInsights(insights);
    })
    .catch(error => console.error('Error fetching statistics:', error));
}

function displayInsights(insights) {
    const ctx = document.getElementById('dailyInsightsChart').getContext('2d');
    const labels = Object.keys(insights);
    let dataPoints = Object.values(insights); // Keep data in seconds initially

    // Determine the maximum value to decide the unit
    const maxValue = Math.max(...dataPoints);
    let unit = 'Seconds';
    let conversionFactor = 1; // No conversion needed for seconds

    if (maxValue > 3600) { // More than an hour
        unit = 'Hours';
        conversionFactor = 3600;
    } else if (maxValue > 60) { // More than a minute
        unit = 'Minutes';
        conversionFactor = 60;
    }

    // Convert data points to the decided unit
    dataPoints = dataPoints.map(seconds => (seconds / conversionFactor).toFixed(2));

    // Clear any previous chart instance
    if (window.myBarChart) {
        window.myBarChart.destroy();
    }

    window.myBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '', // No dataset label
                data: dataPoints,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: unit // Dynamic y-axis label based on data magnitude
                    }
                }
            },
            plugins: {
                legend: {
                    display: false // Hide the legend
                }
            }
        }
    });
}
document.getElementById('prevDay').addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() - 1);
    updateDateDisplay(); // This now also updates the date picker
});

document.getElementById('nextDay').addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() + 1);
    updateDateDisplay(); // This now also updates the date picker
});


document.addEventListener('DOMContentLoaded', () => {
    currentDate = new Date(); // Ensures currentDate is today
    updateDateDisplay(); // Sets the date picker value and loads insights
});

document.getElementById('datePicker').addEventListener('change', (e) => {
    currentDate = new Date(e.target.value);
    fetchAndDisplayInsights(); // Fetch and display insights for the newly selected date
});


