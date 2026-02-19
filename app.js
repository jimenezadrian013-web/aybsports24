let timerSeconds = 90, timerMax = 90, timerInterval = null, timerRunning = false;
const circumference = 2 * Math.PI * 105;
let connectedUsers = [];
let sharedWorkouts = [];
let workoutLog = [];
let groups = [];
let currentExercises = [];
let currentSession = 'user_' + Date.now();
let user = null;

function openTimer() {
    document.getElementById('timerModal').classList.add('active');
    resetTimerDisplay();
}

function closeTimer() {
    document.getElementById('timerModal').classList.remove('active');
    clearInterval(timerInterval);
    timerRunning = false;
    if(document.getElementById('timerPlayBtn')) 
        document.getElementById('timerPlayBtn').innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
}

function resetTimerDisplay() {
    timerSeconds = timerMax;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const m = Math.floor(timerSeconds / 60);
    const s = timerSeconds % 60;
    const timeEl = document.getElementById('timerTime');
    if(timeEl) timeEl.textContent = `${m}:${s.toString().padStart(2, '0')}`;
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
        const btn = document.getElementById('timerPlayBtn');
        if(btn) 
            btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
    } else {
        timerRunning = true;
        const btn = document.getElementById('timerPlayBtn');
        if(btn) 
            btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
        timerInterval = setInterval(() => {
            if (timerSeconds > 0) {
                timerSeconds--;
                updateTimerDisplay();
            } else {
                clearInterval(timerInterval);
                timerRunning = false;
                const b = document.getElementById('timerPlayBtn');
                if(b) 
                    b.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
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
    } catch(e) {
        console.log('Audio no disponible');
    }
}

function finishWorkout() {
    const btn = document.getElementById('finishBtn');
    if (!btn || !currentExercises.length) {
        showToast('No hay entreno activo');
        return;
    }
    const completedExercises = currentExercises.filter(e => e.completed);
    const totalWeight = currentExercises.reduce((sum, e) => sum + (e.completed ? (parseInt(e.weight) || 0) : 0), 0);
    const logEntry = {
        date: new Date().toISOString(),
        name: document.getElementById('wkName')?.textContent || 'Entreno',
        duration: parseInt(document.getElementById('elapsedTime')?.textContent || '0'),
        exercises: currentExercises.length,
        completed: completedExercises.length,
        totalVolume: totalWeight,
        details: currentExercises
    };
    workoutLog.unshift(logEntry);
    if (user) {
        user.totalWorkouts = (user.totalWorkouts || 0) + 1;
        user.totalVolume = (user.totalVolume || 0) + totalWeight;
        user.totalMinutes = (user.totalMinutes || 0) + (parseInt(document.getElementById('elapsedTime')?.textContent || '0'));
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
    if (!modal) return;
    const muscleGroups = [...new Set(currentExercises.map(e => e.muscle))];
    const totalExercises = currentExercises.length;
    const totalTime = document.getElementById('elapsedTime')?.textContent || '0 min';
    const totalVol = currentExercises.reduce((sum, e) => sum + (e.completed ? (parseInt(e.weight) || 0) : 0), 0);
    if(summary) 
        summary.innerHTML = `<div style="text-align:center;margin-bottom:16px;"><div style="font-size:28px;margin-bottom:8px;">${completed}/${totalExercises} ejercicios completados</div><div style="color:var(--text-secondary);font-size:14px;">${muscleGroups.slice(0, 2).join(' + ')}${muscleGroups.length > 2 ? ' +' + (muscleGroups.length - 2) : ''}</div></div>`;
    if(stats) 
        stats.innerHTML = `<div class="finish-stat"><div class="finish-stat-val">${totalTime}</div><div class="finish-stat-lbl">Duración</div></div><div class="finish-stat"><div class="finish-stat-val">${completed}</div><div class="finish-stat-lbl">Hechos</div></div><div class="finish-stat"><div class="finish-stat-val">${totalVol}kg</div><div class="finish-stat-lbl">Volumen</div></div>`;
    modal.classList.add('active');
}

function closeFinishModal() {
    const m = document.getElementById('finishModal');
    if(m) 
        m.classList.remove('active');
    currentExercises.forEach(e => e.completed = false);
    switchView('home');
}

function generateInviteLink(groupId) {
    const code = btoa(`group_${groupId}_${currentSession}`).slice(0, 12).toUpperCase();
    return `${window.location.origin}?join=${code}&group=${groupId}`;
}

function joinGroupViaLink(groupId, code) {
    const group = groups.find(g => g.id == groupId);
    if (!group) {
        showToast('Grupo no encontrado');
        return;
    }
    if (group.members.some(m => m === currentSession)) {
        showToast('Ya eres miembro de este grupo');
        return;
    }
    group.members.push(currentSession);
    saveAllData();
    showToast(`¡Te uniste a "${group.name}"!`);
}

function shareGroupInvite(i) {
    const g = groups[i];
    const inviteLink = generateInviteLink(g.id);
    const text = `🏋️ ¡Únete a mi grupo "${g.name}" en A&B Sports!\n\n${inviteLink}`;
    if (navigator.share) {
        navigator.share({ title: 'A&B Sports — Invitación a Grupo', text: text, url: inviteLink }).catch(() => {});
    } else {
        navigator.clipboard.writeText(inviteLink);
        showToast('Enlace copiado');
    }
}

function sendWorkoutToUser(targetUsername) {
    if (!currentExercises.length) {
        showToast('No hay entreno activo');
        return;
    }
    const workoutData = {
        id: Date.now(),
        from: currentSession,
        fromName: user?.name || 'Usuario',
        to: targetUsername,
        date: new Date().toISOString(),
        name: document.getElementById('wkName')?.textContent || 'Entreno',
        tag: document.getElementById('todayTag')?.textContent || 'General',
        exercises: currentExercises.map(e => ({ name: e.name, sets: e.sets, weight: e.weight, muscle: e.muscle })),
        status: 'pending'
    };
    sharedWorkouts.push(workoutData);
    saveAllData();
    showToast(`Entreno enviado a ${targetUsername}`);
}

function loadSharedWorkout(index, type) {
    const list = type === 'received' ? sharedWorkouts.filter(w => w.to === currentSession) : sharedWorkouts.filter(w => w.from === currentSession);
    const w = list[index];
    if (!w) return;
    currentExercises = w.exercises.map(e => ({ name: e.name, sets: e.sets, weight: e.weight, muscle: e.muscle, completed: false }));
    const workoutIndex = sharedWorkouts.indexOf(w);
    if (workoutIndex !== -1) {
        sharedWorkouts[workoutIndex].status = 'accepted';
        saveAllData();
    }
    if(document.getElementById('wkName')) 
        document.getElementById('wkName').textContent = w.name;
    switchView('workout');
    showToast(`Entreno de ${w.fromName} cargado`);
}

function saveAllData() {
    localStorage.setItem('ab_user', JSON.stringify(user));
    localStorage.setItem('ab_workouts', JSON.stringify(workoutLog));
    localStorage.setItem('ab_shared', JSON.stringify(sharedWorkouts));
    localStorage.setItem('ab_connected', JSON.stringify(connectedUsers));
    localStorage.setItem('ab_groups', JSON.stringify(groups));
}

function loadAllData() {
    user = JSON.parse(localStorage.getItem('ab_user')) || { name: 'Atleta', totalWorkouts: 0, totalVolume: 0, streak: 0 };
    workoutLog = JSON.parse(localStorage.getItem('ab_workouts')) || [];
    sharedWorkouts = JSON.parse(localStorage.getItem('ab_shared')) || [];
    connectedUsers = JSON.parse(localStorage.getItem('ab_connected')) || [];
    groups = JSON.parse(localStorage.getItem('ab_groups')) || [];
}

function showToast(msg) {
    const t = document.getElementById('toast');
    if(t) {
        t.textContent = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 3000);
    }
}

function switchView(name) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const v = document.getElementById('view-' + name);
    if(v) v.classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const nav = document.querySelector('[data-view="' + name + '"]');
    if(nav) nav.classList.add('active');
}

loadAllData();
(function() {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('join');
    const groupId = params.get('group');
    if (joinCode && groupId) {
        setTimeout(() => {
            joinGroupViaLink(parseInt(groupId), joinCode);
            window.history.replaceState({}, document.title, window.location.pathname);
        }, 500);
    }
})();
