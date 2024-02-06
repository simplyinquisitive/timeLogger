let timerInterval = null;
let time = 0; // Time in seconds
let running = false;
let sessionActive = false; // Added to track if a session is active or not
let startTime, endTime;

const display = document.getElementById('display');
const startStopButton = document.getElementById('startStop');
const resetButton = document.getElementById('reset');
const endSessionButton = document.getElementById('endSession'); // For ending the session explicitly
const statisticsList = document.getElementById('statisticsList');
const timerLabelInput = document.getElementById('timerLabel'); // Input for setting a label for the timer
const timerHeading = document.getElementById('timerHeading'); // Heading to display the timer label

function updateDisplay() {
    const hours = Math.floor(time / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((time % 3600) / 60).toString().padStart(2, '0');
    const seconds = (time % 60).toString().padStart(2, '0');
    display.textContent = `${hours}:${minutes}:${seconds}`;
}

function toggleTimer() {
    const timerLabel = timerLabelInput.value.trim();
    if (running) {
        clearInterval(timerInterval);
        startStopButton.textContent = 'Start';
        running = false;
        endTime = new Date(); // Capture potential end time
    } else {
        if (!sessionActive) { // Only capture start time if it's a new session
            startTime = new Date(); // Log the start time of the session
            sessionActive = true;
            if (timerLabel) {
                timerHeading.textContent = timerLabel; // Update heading with the timer label
            }
            endSessionButton.style.display = 'inline-block'; // Make sure the end session button is visible
        }
        timerInterval = setInterval(() => {
            time++;
            updateDisplay();
        }, 1000);
        startStopButton.textContent = 'Stop';
        running = true;
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    time = 0;
    running = false;
    sessionActive = false; // Reset the session active status
    startStopButton.textContent = 'Start';
    timerHeading.textContent = 'Timer'; // Reset heading to default
    endSessionButton.style.display = 'none'; // Hide the end session button as session is not active
    updateDisplay();
}

function saveStatistic(timeElapsed) {
    const label = timerLabelInput.value.trim();
    fetch('/api/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ time: timeElapsed, start: startTime.toISOString(), end: endTime.toISOString(), label: label }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        fetchStatistic(); // Fetch updated statistics after saving
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
    // Clear current statistics list/table
    statisticsList.innerHTML = '';

    // Create a table and append headings
    const table = document.createElement('table');
    table.className = 'table table-striped'; // Bootstrap classes for styling
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');
    table.appendChild(thead);
    table.appendChild(tbody);

    // Define table headings
    const headings = ['No.', 'Label Name', 'Duration', 'Start Date', 'End Date', 'Start Time', 'End Time'];
    const trHead = document.createElement('tr');
    headings.forEach(heading => {
        const th = document.createElement('th');
        th.textContent = heading;
        trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    // Populate the table with statistics data
    data.forEach((stat, index) => {
        const tr = document.createElement('tr');
        const dateOptions = { year: '2-digit', month: '2-digit', day: '2-digit' };
        const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' };

        // Calculating duration
        const durationSeconds = stat.time;
        const duration = new Date(durationSeconds * 1000).toISOString().substr(11, 8);

        // Formatting dates and times
        const startDate = new Date(stat.start).toLocaleDateString('en-IN', dateOptions);
        const endDate = new Date(stat.end).toLocaleDateString('en-IN', dateOptions);
        const startTime = new Date(stat.start).toLocaleTimeString('en-IN', timeOptions);
        const endTime = new Date(stat.end).toLocaleTimeString('en-IN', timeOptions);

        // Adding cells to the row
        const columns = [
            index + 1, // No.
            stat.label, // Label Name
            duration, // Duration
            startDate, // Start Date
            endDate, // End Date
            startTime, // Start Time
            endTime, // End Time
        ];

        columns.forEach(col => {
            const td = document.createElement('td');
            td.textContent = col;
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });

    // Append the table to the statisticsList container
    statisticsList.appendChild(table);
}




startStopButton.addEventListener('click', toggleTimer);
resetButton.addEventListener('click', resetTimer);

// Explicitly handle ending the session
endSessionButton.addEventListener('click', function() {
    if (running) {
        toggleTimer(); // Stop the timer if it's running
    }
    saveStatistic(time); // Save the session with the current time and label
    resetTimer(); // Reset the timer after the session has ended
});

// Initial fetch of statistics to populate the list on page load
fetchStatistic();
