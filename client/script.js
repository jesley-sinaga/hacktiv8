document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const attachBtn = document.getElementById('attach-btn');
    const fileInput = document.getElementById('file-input');
    const filePreviewContainer = document.getElementById('file-preview-container');
    const filePreview = document.getElementById('file-preview');
    const removeFileBtn = document.getElementById('remove-file-btn');

    let selectedFile = null;

    // Add initial bot greeting
    addMessage('Halo! Saya NanyaAI. Ada yang bisa saya bantu hari ini? 🌟', 'bot');

    function scrollToBottom() {
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // Basic markdown parsing
    function parseMarkdown(text) {
        let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        const paragraphs = html.split('\n\n');
        return paragraphs.map(p => {
             const lines = p.split('\n').map(line => {
                 if (line.trim().startsWith('* ')) {
                     return `• ${line.replace('* ', '')}`;
                 }
                 return line;
             });
             return `<p>${lines.join('<br>')}</p>`;
        }).join('');
    }

    function addMessage(text, sender, isMarkdown = false, imageSrc = null) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);
        
        let contentHtml = '';
        if (isMarkdown && sender === 'bot') {
            contentHtml = parseMarkdown(text);
        } else {
            contentHtml = `<p>${text}</p>`;
        }

        if (imageSrc) {
            contentHtml += `<img src="${imageSrc}" alt="Uploaded image" />`;
        }

        messageDiv.innerHTML = contentHtml;
        chatBox.appendChild(messageDiv);
        scrollToBottom();
    }

    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.classList.add('typing-indicator');
        indicator.id = 'typing-indicator';
        indicator.innerHTML = '<span></span><span></span><span></span>';
        chatBox.appendChild(indicator);
        scrollToBottom();
    }

    function hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    // File input handling
    attachBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            selectedFile = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = function(e) {
                filePreview.src = e.target.result;
                filePreviewContainer.classList.remove('hidden');
            }
            
            reader.readAsDataURL(selectedFile);
        }
    });

    removeFileBtn.addEventListener('click', () => {
        selectedFile = null;
        fileInput.value = '';
        filePreviewContainer.classList.add('hidden');
        filePreview.src = '';
    });

    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text && !selectedFile) return;

        // Display user message with or without image
        let imageSrc = null;
        if (selectedFile) {
            imageSrc = filePreview.src; // Use preview URL for chat
        }
        addMessage(text || 'Mengirim gambar...', 'user', false, imageSrc);
        
        const currentFile = selectedFile; // Save reference
        
        // Reset inputs
        userInput.value = '';
        removeFileBtn.click(); // Clears file state
        sendBtn.disabled = true;

        showTypingIndicator();

        try {
            let response;
            
            if (currentFile) {
                // Upload file logic
                const formData = new FormData();
                formData.append('prompt', text || 'Tolong deskripsikan gambar ini.');
                formData.append('upload', currentFile);

                response = await fetch('/generate-from-file', {
                    method: 'POST',
                    body: formData // No Content-Type header; fetch sets it with boundary for FormData
                });
            } else {
                // Text only logic
                response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ prompt: text })
                });
            }

            const data = await response.json();
            hideTypingIndicator();

            if (response.ok) {
                addMessage(data.result, 'bot', true);
            } else {
                addMessage('Maaf, terjadi kesalahan: ' + (data.message || 'Unknown error'), 'bot');
            }
        } catch (error) {
            hideTypingIndicator();
            addMessage('Maaf, tidak dapat terhubung ke server.', 'bot');
            console.error('Error:', error);
        } finally {
            sendBtn.disabled = false;
            userInput.focus();
        }
    }

    sendBtn.addEventListener('click', sendMessage);

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});
