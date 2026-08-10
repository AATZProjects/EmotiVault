const filterForm = document.querySelector(".ev-browse-filters");
filterForm.addEventListener("submit", filterEmoticons);

const submit = document.querySelector(".ev-browse-filters");
submit.addEventListener("submit", updateEmoticons);

async function filterEmoticons(event) {
    event.preventDefault();

    const category = document.querySelector('[name="category"]').value;
    const mood = document.querySelector('[name="mood"]').value;

    console.log("category: ", category);
    console.log("mood: ", mood);

    const response = await fetch(
        `/api/emoticons/filter?category=${category}&mood=${mood}&page=1&limit=20`);
    
    const data = await response.json();
    
    updateEmoticons(data.emoticons);
} 

function updateEmoticons(emoticons) {

    const tbody = document.querySelector("#emoticon-result");
    tbody.replaceChildren();

    for (let i = 0; i < emoticons.length; i++) {
        const tr = document.createElement("tr"); 
        const emoticonString = document.createElement("td");
        const category = document.createElement("td");
        const mood = document.createElement("td");
        const favorites = document.createElement("td");
        const actions = document.createElement("td");

        const copyBtn = document.createElement("button");
        const starBtn = document.createElement("button");
    

        emoticonString.textContent = emoticons[i].emoticonString;
        category.textContent = emoticons[i].emoticonCategory;
        mood.textContent = emoticons[i].emoticonMood;
        favorites.textContent = emoticons[i].emoticonFavorites;

        copyBtn.className = "ev-btn ev-btn-light ev-btn-sm";
        copyBtn.textContent = "Copy";
        starBtn.className = "ev-icon-button";
        starBtn.type = "button"
        starBtn.textContent = "☆";

        actions.appendChild(copyBtn);
        actions.appendChild(starBtn);

        tr.appendChild(emoticonString);
        tr.appendChild(category);
        tr.appendChild(mood);
        tr.appendChild(favorites);
        tr.appendChild(actions);

        tbody.appendChild(tr);
    }
}