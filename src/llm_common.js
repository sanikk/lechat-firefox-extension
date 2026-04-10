
export function itemize_prompt(article, message_id) {
    // Adds a quicklink to the "prompts" sidebar
    const prompt_text = article.innerText.trim();
    if (!prompt_text) return;

    const item = document.createElement('div');
    item.title = prompt_text;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    const text_item = document.createElement('span');
    checkbox.value = text_item;
    item.appendChild(checkbox);

    text_item.textContent = prompt_text.split('.')[0].slice(0, 50);
    item.dataset.messageId = message_id;
    item.dataset.answerId = undefined;

    text_item.onclick = () => {
        article.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    item.appendChild(text_item);
    return item;
}
