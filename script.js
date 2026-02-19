// Timer Functionality
let timerInterval;
let timerRunning = false;
let timerSeconds = 0;

function toggleTimer() {
    if (!timerRunning) {
        timerRunning = true;
        timerInterval = setInterval(() => {
            timerSeconds++;
            updateTimerDisplay();
        }, 1000);
        // Visual feedback - Start timer
    } else {
        clearInterval(timerInterval);
        timerRunning = false;
        // Visual feedback - Pause timer
    }
}

function updateTimerDisplay() {
    const display = document.getElementById('timerDisplay');
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    display.innerText = `\${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// Finish Workout Functionality
let completedExercises = [];

function finishWorkout(exercise) {
    completedExercises.push(exercise);
    showFinishModal();
}

function showFinishModal() {
    const modal = document.getElementById('finishModal');
    modal.style.display = 'block';
    // Display completed exercises
}

// Social Features
function generateInviteLink(groupId) {
    return `https://yourapp.com/join/${groupId}`;
}

function sendWorkoutToUser(userId, workoutId) {
    // Logic to send the workout to another user
}

function joinGroupViaLink(link) {
    // Logic to accept an invitation
}

function renderSharedWorkoutsList(workouts) {
    const workoutsList = document.getElementById('sharedWorkouts');
    workouts.forEach(workout => {
        const listItem = document.createElement('li');
        listItem.innerText = workout.name;
        workoutsList.appendChild(listItem);
    });
}

function renderConnectedUsers(users) {
    const usersList = document.getElementById('connectedUsers');
    users.forEach(user => {
        const listItem = document.createElement('li');
        listItem.innerText = user.name;
        usersList.appendChild(listItem);
    });
}