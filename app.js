// Solicitar permissão para notificações
if ('Notification' in window) {
  Notification.requestPermission();
}

// Estado da aplicação
let state = {
  reminders: [],
  logs: []
};

// Carregar dados salvos
function loadState() {
  const savedState = localStorage.getItem('cosMiniState');
  if (savedState) {
    state = JSON.parse(savedState);
  }
  renderReminders();
  updateStats();
}

// Salvar estado
function saveState() {
  localStorage.setItem('cosMiniState', JSON.stringify(state));
}

// Adicionar novo lembrete
function addReminder() {
  const text = document.getElementById('reminder-text').value.trim();
  const time = document.getElementById('reminder-time').value;
  
  if (!text || !time) return;
  
  const reminder = {
    id: Date.now(),
    text,
    time,
    active: true,
    created: new Date().toISOString()
  };
  
  state.reminders.push(reminder);
  saveState();
  renderReminders();
  scheduleReminder(reminder);
  
  // Limpar inputs
  document.getElementById('reminder-text').value = '';
}

// Renderizar lista de lembretes
function renderReminders() {
  const list = document.getElementById('reminders');
  list.innerHTML = '';
  
  state.reminders.filter(r => r.active).forEach(reminder => {
    const li = document.createElement('li');
    
    const reminderText = document.createElement('span');
    reminderText.textContent = `${reminder.text} - ${reminder.time}`;
    
    const actions = document.createElement('div');
    actions.className = 'reminder-actions';
    
    const completeBtn = document.createElement('button');
    completeBtn.textContent = '✓';
    completeBtn.onclick = () => completeReminder(reminder.id);
    
    const skipBtn = document.createElement('button');
    skipBtn.textContent = '✗';
    skipBtn.onclick = () => skipReminder(reminder.id);
    
    actions.appendChild(completeBtn);
    actions.appendChild(skipBtn);
    
    li.appendChild(reminderText);
    li.appendChild(actions);
    list.appendChild(li);
  });
}

// Agendar notificação
function scheduleReminder(reminder) {
  const [hours, minutes] = reminder.time.split(':');
  
  // Criar data para hoje com a hora especificada
  const reminderTime = new Date();
  reminderTime.setHours(parseInt(hours));
  reminderTime.setMinutes(parseInt(minutes));
  reminderTime.setSeconds(0);
  
  // Se o horário já passou, agendar para amanhã
  if (reminderTime < new Date()) {
    reminderTime.setDate(reminderTime.getDate() + 1);
  }
  
  const timeUntilReminder = reminderTime - new Date();
  
  setTimeout(() => {
    showNotification(reminder);
  }, timeUntilReminder);
}

// Mostrar notificação
function showNotification(reminder) {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(reminder.text, {
      body: 'Toque para registrar',
      icon: '/icon.png' // Adicione um ícone simples
    });
    
    notification.onclick = () => {
      completeReminder(reminder.id);
      notification.close();
    };
    
    // Após 1 hora sem resposta, registrar como indefinido
    setTimeout(() => {
      const log = state.logs.find(log => 
        log.reminderId === reminder.id && 
        new Date(log.reminderTime).toDateString() === new Date().toDateString()
      );
      
      if (!log) {
        logReminderStatus(reminder.id, 'undefined');
      }
    }, 60 * 60 * 1000);
  }
  
  // Reagendar para o próximo dia
  scheduleReminder(reminder);
}

// Completar lembrete
function completeReminder(id) {
  logReminderStatus(id, 'completed');
  updateStats();
}

// Pular lembrete
function skipReminder(id) {
  logReminderStatus(id, 'skipped');
  updateStats();
}

// Registrar status do lembrete
function logReminderStatus(id, status) {
  const reminder = state.reminders.find(r => r.id === id);
  if (!reminder) return;
  
  const log = {
    id: Date.now(),
    reminderId: id,
    reminderText: reminder.text,
    reminderTime: new Date().toISOString(),
    status: status,
    responseTime: new Date().toISOString()
  };
  
  state.logs.push(log);
  saveState();
}

// Atualizar estatísticas simples
function updateStats() {
  const stats = document.getElementById('completion-rate');
  
  if (state.logs.length < 5) {
    stats.textContent = 'Aguardando mais dados...';
    return;
  }
  
  const total = state.logs.length;
  const completed = state.logs.filter(log => log.status === 'completed').length;
  const rate = Math.round((completed / total) * 100);
  
  stats.textContent = `Taxa de conclusão: ${rate}%`;
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  document.getElementById('add-btn').addEventListener('click', addReminder);
});
