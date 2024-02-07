let timerInterval = null;
let time = 0; // Time in seconds
let running = false;
let sessionActive = false; // To track if a session is active
let startTime, endTime;
let usedLabels = []; // Store used labels for suggestions

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
        const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' };

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
    $('#endSessionModal').modal('show'); // Use jQuery to show the modal
});
// Actual end session action
document.getElementById('confirmEndSession').addEventListener('click', function() {
    if (running) {
        toggleTimer(); // Stop the timer
    }
    endTime = new Date(); // Set end time
    saveStatistic(time);
    resetTimer();
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

