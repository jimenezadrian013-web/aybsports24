// ========== TIMER SYSTEM ==========
let timerSeconds = 90, timerMax = 90, timerInterval = null, timerRunning = false;
const circumference = 2 * Math.PI * 105;

function openTimer() {
  document.getElementById('timerModal').classList.add('active');
  resetTimerDisplay();
}

function closeTimer() {
  document.getElementById('timerModal').classList.remove('active');
  clearInterval(timerInterval);
  timerRunning = false;
  document.getElementById('timerPlayBtn').innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
}

function resetTimerDisplay() {
  timerSeconds = timerMax;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const m = Math.floor(timerSeconds / 60);
  const s = timerSeconds % 60;
  document.getElementById('timerTime').textContent = `${m}:${s.toString().padStart(2, '0')}";
  
  const progressCircle = document.getElementById('timerProgress');
  if (progressCircle) {
    const offset = circumference - (timerSeconds / timerMax) * circumference;
    progressCircle.style.strokeDashoffset = offset;
  }
}

function toggleTimer() {
  if (timerRunning) {
    clearInterval(timerInterval);
    timerRunning = false;
    document.getElementById('timerPlayBtn').innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
  } else {
    timerRunning = true;
    document.getElementById('timerPlayBtn').innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
    
    timerInterval = setInterval(() => {
      if (timerSeconds > 0) {
        timerSeconds--;
        updateTimerDisplay();
      } else {
        clearInterval(timerInterval);
        timerRunning = false;
        document.getElementById('timerPlayBtn').innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
        showToast('¡Tiempo de descanso completado!');
        playTimerSound();
      }
    }, 1000);
  }
}

function adjustTimer(amount) {
  timerMax = Math.max(15, timerMax + amount);
  timerSeconds = Math.max(0, timerSeconds + amount);
  updateTimerDisplay();
}

function playTimerSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.warn('Audio no disponible');
  }
}

// ========== FINISH WORKOUT SYSTEM ==========
function finishWorkout() {
  const btn = document.getElementById('finishBtn');
  if (!btn || !currentExercises || !currentExercises.length) {
    showToast('No hay entreno activo');
    return;
  }

  const completedExercises = currentExercises.filter(e => e.completed);
  const totalWeight = currentExercises.reduce((sum, e) => sum + (e.completed ? (parseInt(e.weight) || 0) : 0), 0);
  
  const logEntry = {
    date: new Date().toISOString(),
    name: document.getElementById('wkName')?.textContent || 'Entreno',
    duration: parseInt(document.getElementById('elapsedTime')?.textContent || '0') || 0,
    exercises: currentExercises.length,
    completed: completedExercises.length,
    totalVolume: totalWeight,
    details: JSON.parse(JSON.stringify(currentExercises))
  };

  if (!workoutLog) workoutLog = [];
  workoutLog.unshift(logEntry);
  
  if (user) {
    user.totalWorkouts = (user.totalWorkouts || 0) + 1;
    user.totalVolume = (user.totalVolume || 0) + totalWeight;
    user.totalMinutes = (user.totalMinutes || 0) + (parseInt(document.getElementById('elapsedTime')?.textContent || '0') || 0);
    user.lastWorkout = new Date().toISOString();
    
    const lastWorkoutDate = user.lastWorkout ? new Date(user.lastWorkout).toDateString() : null;
    const today = new Date().toDateString();
    if (lastWorkoutDate !== today) {
      user.streak = (user.streak || 0) + 1;
    }
  }

  saveAllData();
  showFinishModal(logEntry, completedExercises.length);
}

function showFinishModal(logEntry, completed) {
  const modal = document.getElementById('finishModal');
  const summary = document.getElementById('finishSummary');
  const stats = document.getElementById('finishStats');
  const overload = document.getElementById('finishOverload');

  if (!modal) return;

  const muscleGroups = currentExercises ? [...new Set(currentExercises.map(e => e.muscle))] : [];
  const totalExercises = currentExercises ? currentExercises.length : 0;
  const totalTime = document.getElementById('elapsedTime')?.textContent || '0 min';
  const totalVol = currentExercises ? currentExercises.reduce((sum, e) => sum + (e.completed ? (parseInt(e.weight) || 0) : 0), 0) : 0;

  summary.innerHTML = `
    <div style="text-align:center;margin-bottom:16px;">
      <div style="font-size:28px;margin-bottom:8px;">${completed}/${totalExercises} ejercicios completados</div>
      <div style="color:var(--text-secondary);font-size:14px;">
        ${muscleGroups.slice(0, 2).join(' + ')}${muscleGroups.length > 2 ? ' +' + (muscleGroups.length - 2) : ''}
      </div>
    </div>
  `;

  stats.innerHTML = `
    <div class="finish-stat">
      <div class="finish-stat-val">${totalTime}</div>
      <div class="finish-stat-lbl">Duración</div>
    </div>
    <div class="finish-stat">
      <div class="finish-stat-val">${completed}</div>
      <div class="finish-stat-lbl">Hechos</div>
    </div>
    <div class="finish-stat">
      <div class="finish-stat-val">${totalVol}kg</div>
      <div class="finish-stat-lbl">Volumen</div>
    </div>
  `;

  if (workoutLog && workoutLog.length > 1) {
    const lastSimilar = workoutLog.slice(1).find(w => w.name === logEntry.name);
    if (lastSimilar && lastSimilar.totalVolume < totalVol) {
      overload.innerHTML = `
        <div style="background:var(--accent-subtle);border:1px solid var(--accent-dim);border-radius:12px;padding:12px;margin-bottom:16px;">
          <div style="color:var(--accent);font-weight:600;font-size:14px;margin-bottom:4px;">📈 Progresión detectada</div>
          <div style="font-size:13px;color:var(--text-secondary);">
            +${totalVol - lastSimilar.totalVolume}kg vs última sesión
          </div>
        </div>
      `;
    }
  }

  modal.classList.add('active');
}

function closeFinishModal() {
  document.getElementById('finishModal').classList.remove('active');
  if (currentExercises) {
    currentExercises.forEach(e => e.completed = false);
    renderExercises();
  }
  switchView('home');
  refreshUI();
}

// ========== SOCIAL SYSTEM - CONNECTION & SHARING ==========
let connectedUsers = [];
let userConnections = {};
let sharedWorkouts = [];

function generateInviteLink(groupId) {
  const code = btoa(`group_${groupId}_${currentSession}`).slice(0, 12).toUpperCase();
  return `${window.location.origin}?invite=${code}&group=${groupId}`;
}

function joinGroupViaLink(groupId, inviterUsername) {
  const group = groups.find(g => g.id == groupId);
  if (!group) {
    showToast('Grupo no encontrado');
    return;
  }

  if (group.members.some(m => m.name === user.name)) {
    showToast('Ya eres miembro de este grupo');
    return;
  }

  group.members.push({
    name: user.name,
    initials: user.initials,
    joinedDate: new Date().toISOString()
  });

  if (!connectedUsers.find(u => u.username === inviterUsername)) {
    connectedUsers.push({
      username: inviterUsername,
      displayName: group.members.find(m => m.name && m.name !== user.name)?.name || inviterUsername,
      connectedDate: new Date().toISOString(),
      status: 'online'
    });
  }

  saveAllData();
  showToast(`¡Te uniste a \