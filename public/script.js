document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selections ---
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatContainer = document.getElementById('chat-container');
    const historyList = document.getElementById('history-list');
    const newChatBtn = document.querySelector('.new-chat-btn');
    const fileInput = document.getElementById('fileInput');
    const attachIcon = document.getElementById('attach-icon');
    const recordIcon = document.getElementById('record-icon');
    const loadingSpinner = document.getElementById('loading-spinner');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const splashScreen = document.getElementById('splash-screen');
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menu-toggle');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    // --- Core UI & Event Handlers ---
    window.addEventListener('load', () => { setTimeout(() => { splashScreen.classList.add('is-hidden'); }, 1800); });
    const openSidebar = () => { sidebar.classList.add('is-open'); sidebarOverlay.classList.add('is-active'); };
    const closeSidebar = () => { sidebar.classList.remove('is-open'); sidebarOverlay.classList.remove('is-active'); };
    menuToggle.addEventListener('click', (e) => { e.stopPropagation(); sidebar.classList.contains('is-open') ? closeSidebar() : openSidebar(); });
    sidebarOverlay.addEventListener('click', closeSidebar);
    const getHistory = () => JSON.parse(localStorage.getItem('recipeChatHistory')) || [];
    const saveHistory = (question, answer) => { const history = getHistory(); history.push({ question, answer }); localStorage.setItem('recipeChatHistory', JSON.stringify(history)); loadHistory(); };
    const loadHistory = () => { const history = getHistory(); historyList.innerHTML = ''; history.forEach((item, index) => { const li = document.createElement('li'); li.innerHTML = `<span class="history-text">${item.question}</span><span class="material-icons-outlined history-delete-icon">delete</span>`; const actualIndex = history.length - 1 - index; li.querySelector('.history-text').onclick = () => restoreChatFromHistory(item); li.querySelector('.history-delete-icon').onclick = (e) => { e.stopPropagation(); deleteHistoryItem(actualIndex); }; historyList.prepend(li); }); clearHistoryBtn.style.display = history.length > 0 ? 'inline-flex' : 'none'; };
    const deleteHistoryItem = (indexToDelete) => { let history = getHistory(); history.splice(indexToDelete, 1); localStorage.setItem('recipeChatHistory', JSON.stringify(history)); loadHistory(); };
    const clearAllHistory = () => { if (confirm("Are you sure?")) { localStorage.removeItem('recipeChatHistory'); loadHistory(); startNewChat(); } };
    clearHistoryBtn.addEventListener('click', clearAllHistory);
    const restoreChatFromHistory = (chatItem) => {
        chatContainer.innerHTML = '';
        const userMessageDiv = document.createElement('div'); userMessageDiv.classList.add('message', 'user-message');
        userMessageDiv.innerHTML = `<p>${chatItem.question}</p>`; chatContainer.appendChild(userMessageDiv);
        const aiMessageDiv = document.createElement('div'); aiMessageDiv.classList.add('message', 'ai-message');
        const aiContentDiv = document.createElement('div'); aiContentDiv.classList.add('ai-message-content');
        aiContentDiv.innerHTML = parseMarkdownToHTML(chatItem.answer);
        aiMessageDiv.appendChild(aiContentDiv); chatContainer.appendChild(aiMessageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        if (window.innerWidth < 1024) closeSidebar();
    };
    const showGreeting = () => { chatContainer.innerHTML = ''; const greetingDiv = document.createElement('div'); greetingDiv.classList.add('greeting'); greetingDiv.innerHTML = `<h1>Flourish Feast 🧑‍🍳</h1><p>What culinary creation can I help you with today? 🍲</p>`; chatContainer.appendChild(greetingDiv); };
    const startNewChat = () => { showGreeting(); userInput.value = ''; userInput.placeholder = "Ask for a recipe..."; if (window.innerWidth < 1024) closeSidebar(); };
    newChatBtn.addEventListener('click', startNewChat);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition; let recognition; if (SpeechRecognition) { recognition = new SpeechRecognition(); recognition.continuous = false; recognition.lang = 'en-US'; recognition.interimResults = false; recordIcon.addEventListener('click', () => { if (recordIcon.classList.contains('is-recording')) { recognition.stop(); } else { recognition.start(); } }); recognition.onstart = () => { recordIcon.textContent = 'mic'; recordIcon.classList.add('is-recording'); userInput.placeholder = "Listening..."; }; recognition.onresult = (event) => { const transcript = event.results[0][0].transcript; userInput.value = transcript; setTimeout(() => handleSend(), 300); }; recognition.onerror = (event) => { console.error('Speech error:', event.error); userInput.placeholder = "Couldn't hear that."; }; recognition.onend = () => { recordIcon.textContent = 'mic_none'; recordIcon.classList.remove('is-recording'); userInput.placeholder = "Ask for a recipe..."; }; } else { recordIcon.addEventListener('click', () => alert("Speech recognition not supported in this browser.")); }
    sendBtn.addEventListener('click', () => handleSend());
    userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } });
    attachIcon.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => { if (fileInput.files.length > 0) { userInput.value = `Tell me about this recipe: ${fileInput.files[0].name}`; } });

    // --- FINAL, ROBUST PARSER ---
    function parseMarkdownToHTML(text) {
        const lines = text.split('\n'); let html = ''; let listType = null;
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine.startsWith('* ') && !trimmedLine.match(/^\d+\. /) && listType) { html += listType === 'ul' ? '</ul>' : '</ol>'; listType = null; }
            if (trimmedLine.length === 0) continue;
            if (line.startsWith('### Title:')) { html += `<h1 class="recipe-title">${line.substring(11).replace(/\*\*/g, '')}</h1>`; }
            else if (line.startsWith('## ')) { html += `<h2>${line.substring(3).replace(/\*\*/g, '')}</h2>`; }
            else if (line.startsWith('* ')) { if (listType !== 'ul') { if (listType) html += `</ol>`; html += '<ul>'; listType = 'ul'; } html += `<li>${line.substring(2)}</li>`; }
            else if (line.match(/^\d+\. /)) { if (listType !== 'ol') { if (listType) html += `</ul>`; html += '<ol>'; listType = 'ol'; } html += `<li>${line.substring(line.indexOf(' ') + 1)}</li>`; }
            else { html += `<p>${line}</p>`; }
        }
        if (listType) { html += listType === 'ul' ? '</ul>' : '</ol>'; }
        return html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }
    
    // --- FINAL, STABLE STREAMING LOGIC ---
    const handleSend = async () => {
        const question = userInput.value.trim(); if (!question) return;
        const greeting = document.querySelector('.greeting'); if (greeting) { greeting.remove(); }
        const userMessageDiv = document.createElement('div'); userMessageDiv.classList.add('message', 'user-message');
        userMessageDiv.innerHTML = `<p>${question}</p>`; chatContainer.appendChild(userMessageDiv); userInput.value = '';
        const aiMessageDiv = document.createElement('div'); aiMessageDiv.classList.add('message', 'ai-message');
        const aiContentDiv = document.createElement('div'); aiContentDiv.classList.add('ai-message-content');
        aiMessageDiv.appendChild(aiContentDiv); chatContainer.appendChild(aiMessageDiv);
        loadingSpinner.classList.add('active'); chatContainer.appendChild(loadingSpinner);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        try {
            const response = await fetch('/generate-recipe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: question }), });
            if (!response.ok || !response.body) { throw new Error(`Server error: ${response.status}`); }
            
            const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
            let accumulatedText = ""; loadingSpinner.classList.remove('active');
            
            while (true) {
                const { value, done } = await reader.read(); if (done) break;
                accumulatedText += value;
                aiContentDiv.innerHTML = parseMarkdownToHTML(accumulatedText);
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
            if (!accumulatedText.trim()) { throw new Error("Stream was empty."); }
            saveHistory(question, accumulatedText);
        } catch (error) {
            console.error("Fetch/Stream Error:", error);
            aiContentDiv.innerHTML = `<p>My apologies, I seem to have burned the toast. Please check the server terminal for detailed error logs and ensure your API key and Google Cloud Project are correctly configured.</p>`;
        }
        loadingSpinner.classList.remove('active');
    };

    loadHistory();
    showGreeting();
});