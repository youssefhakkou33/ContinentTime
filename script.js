// Global array to store trip data
let trips = [];

// DOM elements
const cityInput = document.getElementById('city');
const countryInput = document.getElementById('country');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const continentSelect = document.getElementById('continent');
const addTripBtn = document.getElementById('addTripBtn');
const continentRankingList = document.getElementById('continentRankingList');
const tripsTableBody = document.querySelector('#tripsTable tbody');
const yearFilter = document.getElementById('yearFilter');
const clearDataBtn = document.getElementById('clearDataBtn');

// Custom Modal elements
const customModal = document.getElementById('customModal');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const modalConfirmBtn = document.getElementById('modalConfirmBtn');
const modalCancelBtn = document.getElementById('modalCancelBtn');

// --- Utility Functions ---

/**
 * Displays a custom modal for alerts or confirmations.
 * @param {string} title - The title of the modal.
 * @param {string} message - The message to display.
 * @param {boolean} isConfirm - True if it's a confirmation, false for alert.
 * @returns {Promise<boolean>} Resolves true if confirmed, false if cancelled.
 */
function showCustomModal(title, message, isConfirm = false) {
    return new Promise((resolve) => {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalCancelBtn.style.display = isConfirm ? 'inline-block' : 'none'; // Show cancel only for confirm
        modalConfirmBtn.textContent = isConfirm ? 'Confirm' : 'OK';

        customModal.classList.remove('hidden');

        const confirmHandler = () => {
            customModal.classList.add('hidden');
            modalConfirmBtn.removeEventListener('click', confirmHandler);
            modalCancelBtn.removeEventListener('click', cancelHandler);
            resolve(true);
        };

        const cancelHandler = () => {
            customModal.classList.add('hidden');
            modalConfirmBtn.removeEventListener('click', confirmHandler);
            modalCancelBtn.removeEventListener('click', cancelHandler);
            resolve(false);
        };

        modalConfirmBtn.addEventListener('click', confirmHandler);
        modalCancelBtn.addEventListener('click', cancelHandler);
    });
}


/**
 * Calculates the number of days between two date strings (inclusive).
 * @param {string} start_date_str - Start date in YYYY-MM-DD format.
 * @param {string} end_date_str - End date in YYYY-MM-DD format.
 * @returns {number} The number of days.
 */
function calculateDaysBetween(start_date_str, end_date_str) {
    const startDate = new Date(start_date_str + 'T00:00:00'); // Add T00:00:00 to avoid timezone issues
    const endDate = new Date(end_date_str + 'T00:00:00');
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Inclusive of both start and end date
}

/**
 * Summarizes the total days spent in each continent for a given year.
 * @param {Array<Object>} trips - The array of trip objects.
 * @param {number|null} year - The year to filter by, or null for all time.
 * @returns {Object} An object mapping continent names to total days.
 */
function summarizeContinentDays(trips, year = null) {
    const continentSummary = {};

    trips.forEach(trip => {
        const tripStart = new Date(trip.start_date + 'T00:00:00');
        const tripEnd = new Date(trip.end_date + 'T00:00:00');
        const continent = trip.continent;

        let effectiveStart = tripStart;
        let effectiveEnd = tripEnd;

        if (year !== null) {
            const yearStart = new Date(year, 0, 1, 0, 0, 0); // January 1st of the year
            const yearEnd = new Date(year, 11, 31, 23, 59, 59); // December 31st of the year

            // If trip is entirely outside the target year, skip
            if (tripStart > yearEnd || tripEnd < yearStart) {
                return;
            }

            // Adjust trip dates to be within the specified year
            effectiveStart = new Date(Math.max(tripStart.getTime(), yearStart.getTime()));
            effectiveEnd = new Date(Math.min(tripEnd.getTime(), yearEnd.getTime()));
        }

        const daysInPeriod = Math.ceil(Math.abs(effectiveEnd - effectiveStart) / (1000 * 60 * 60 * 24)) + 1;

        continentSummary[continent] = (continentSummary[continent] || 0) + daysInPeriod;
    });
    return continentSummary;
}

// --- Data Persistence ---

/**
 * Loads trip data from localStorage.
 */
function loadTrips() {
    const storedTrips = localStorage.getItem('continentTrackerTrips');
    if (storedTrips) {
        try {
            trips = JSON.parse(storedTrips);
            // Ensure 'id' exists for older entries
            trips.forEach(trip => {
                if (!trip.id) {
                    trip.id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
                }
            });
        } catch (e) {
            console.error("Error parsing stored trips:", e);
            trips = []; // Reset if data is corrupted
            showCustomModal("Data Error", "Could not load trip data. Local storage might be corrupted.", false);
        }
    } else {
        trips = [];
    }
}

/**
 * Saves current trip data to localStorage.
 */
function saveTrips() {
    try {
        localStorage.setItem('continentTrackerTrips', JSON.stringify(trips));
    } catch (e) {
        console.error("Error saving trips to local storage:", e);
        showCustomModal("Save Error", "Could not save trip data to local storage.", false);
    }
}

// --- UI Update Functions ---

/**
 * Populates the year filter dropdown with relevant years.
 */
function populateYearFilter() {
    const currentYear = new Date().getFullYear();
    let years = ["All Time"];
    // Add years from 10 years ago to 5 years in the future
    for (let y = currentYear - 10; y <= currentYear + 5; y++) {
        years.push(y.toString());
    }

    yearFilter.innerHTML = ''; // Clear existing options
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });
    yearFilter.value = currentYear.toString(); // Set current year as default
}

/**
 * Updates the entire UI: continent ranking and trips table.
 */
function updateUI() {
    // Clear existing UI elements
    continentRankingList.innerHTML = '';
    tripsTableBody.innerHTML = '';

    const selectedYearText = yearFilter.value;
    const targetYear = selectedYearText === "All Time" ? null : parseInt(selectedYearText);

    // Filter trips for display based on selected year
    const filteredTrips = targetYear === null
        ? trips
        : trips.filter(trip => {
            const startYear = new Date(trip.start_date).getFullYear();
            const endYear = new Date(trip.end_date).getFullYear();
            return startYear === targetYear || endYear === targetYear;
        });

    // --- Populate Continent Ranking ---
    const continentSummary = summarizeContinentDays(trips, targetYear); // Always use all trips for summary, filtering done inside summarizeContinentDays
    const sortedContinents = Object.entries(continentSummary).sort(([, daysA], [, daysB]) => daysB - daysA);

    if (sortedContinents.length === 0) {
        continentRankingList.innerHTML = '<li class="text-gray-500">No continent data for this period.</li>';
    } else {
        sortedContinents.forEach(([continent, days]) => {
            const listItem = document.createElement('li');
            listItem.className = 'flex justify-between items-center bg-white p-3 rounded-md shadow-sm';
            listItem.innerHTML = `
                <span class="font-medium text-gray-800">${continent}</span>
                <span class="text-blue-600 font-semibold">${days} Days</span>
            `;
            continentRankingList.appendChild(listItem);
        });
    }

    // --- Populate Trips Table ---
    // Sort trips by start date, newest first
    const sortedTripsForDisplay = [...filteredTrips].sort((a, b) => new Date(b.start_date) - new Date(a.start_date));

    if (sortedTripsForDisplay.length === 0) {
        const row = tripsTableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 7; // Span all columns
        cell.className = 'text-center py-4 text-gray-500';
        cell.textContent = 'No trips recorded for this period.';
    } else {
        sortedTripsForDisplay.forEach(trip => {
            const row = tripsTableBody.insertRow();
            row.className = 'hover:bg-gray-50'; // Hover effect for rows

            // Use dataset to store the trip ID on the row for easy deletion
            row.dataset.tripId = trip.id;

            row.innerHTML = `
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 rounded-bl-lg">${trip.city}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">${trip.country}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">${trip.continent}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">${trip.start_date}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">${trip.end_date}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">${trip.days_spent}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm font-medium rounded-br-lg">
                    <button data-id="${trip.id}" class="delete-btn text-red-600 hover:text-red-900 transition duration-150 ease-in-out">Delete</button>
                </td>
            `;
        });
    }
}

// --- Event Handlers ---

/**
 * Handles adding a new trip when the button is clicked.
 */
async function handleAddTrip() {
    const city = cityInput.value.trim();
    const country = countryInput.value.trim();
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    const continent = continentSelect.value;

    if (!city || !country || !startDate || !endDate) {
        await showCustomModal("Input Error", "Please fill in all fields.", false);
        return;
    }

    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);

    if (startDateTime > endDateTime) {
        await showCustomModal("Input Error", "Start Date cannot be after End Date.", false);
        return;
    }

    const daysSpent = calculateDaysBetween(startDate, endDate);
    const tripId = Date.now().toString() + Math.random().toString(36).substring(2, 9); // Simple unique ID

    const newTrip = {
        id: tripId,
        city,
        country,
        start_date: startDate,
        end_date: endDate,
        continent,
        days_spent: daysSpent
    };

    trips.push(newTrip);
    saveTrips();
    updateUI();

    // Clear form fields
    cityInput.value = '';
    countryInput.value = '';
    startDateInput.value = '';
    endDateInput.value = '';
    continentSelect.value = 'Africa'; // Reset to default
    await showCustomModal("Success", "Trip added successfully!", false);
}

/**
 * Handles deleting a trip when a delete button is clicked.
 * Uses event delegation on the table body.
 * @param {Event} event - The click event.
 */
async function handleDeleteTrip(event) {
    if (event.target.classList.contains('delete-btn')) {
        const tripIdToDelete = event.target.dataset.id;
        const confirmed = await showCustomModal("Confirm Deletion", "Are you sure you want to delete this trip?", true);

        if (confirmed) {
            trips = trips.filter(trip => trip.id !== tripIdToDelete);
            saveTrips();
            updateUI();
            await showCustomModal("Deleted", "Trip deleted successfully.", false);
        }
    }
}

/**
 * Handles clearing all local data.
 */
async function handleClearData() {
    const confirmed = await showCustomModal("Clear All Data", "Are you sure you want to delete ALL your trip data? This action cannot be undone.", true);

    if (confirmed) {
        localStorage.removeItem('continentTrackerTrips');
        trips = [];
        updateUI();
        await showCustomModal("Cleared", "All trip data has been cleared.", false);
    }
}

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    // Set default date values to today
    const today = new Date().toISOString().split('T')[0];
    startDateInput.value = today;
    endDateInput.value = today;

    loadTrips();
    populateYearFilter();
    updateUI(); // Initial UI render

    // Attach event listeners
    addTripBtn.addEventListener('click', handleAddTrip);
    tripsTableBody.addEventListener('click', handleDeleteTrip); // Event delegation for delete buttons
    yearFilter.addEventListener('change', updateUI);
    clearDataBtn.addEventListener('click', handleClearData);
});
