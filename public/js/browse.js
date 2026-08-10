// Event Listeners
const filterForm = document.querySelector(".ev-browse-filters");
filterForm.addEventListener("submit", filterEmoticons);

const submit = document.querySelector(".ev-browse-filters");
submit.addEventListener("submit", updateEmoticons);

const copyBtns = document.querySelectorAll(".copyBtns");
for( let i = 0; i < copyBtns.length; i++) {
    copyBtns[i].addEventListener("click", copyEmoticon);
}

// Modifies the API parameters with user input filter options
async function filterEmoticons(event) {
    event.preventDefault();

    const category = document.querySelector('[name="category"]').value;
    const mood = document.querySelector('[name="mood"]').value;
    const search = document.querySelector('[name="search"]').value;
    const sortBy = document.querySelector('[name="sort"]').value;

    console.log("category: ", category);
    console.log("mood: ", mood);
    console.log("search: ", search);
    console.log("sort: ", sortBy);

    const response = await fetch(
        `/api/emoticons/filter?category=${category}&mood=${mood}&search=${search}&sortBy=${sortBy}&page=1&limit=20`);
    
    const data = await response.json();
    
    updateEmoticons(data.emoticons);
} 


// Updates the table display
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

        copyBtn.className = "ev-btn ev-btn-light ev-btn-sm copyBtns";
        copyBtn.textContent = "Copy";
        copyBtn.dataset.emoticon = emoticons[i].emoticonString;
        copyBtn.addEventListener("click", copyEmoticon);

        starBtn.className = "ev-icon-button";
        starBtn.type = "button"
        starBtn.textContent = "☆";
        starBtn.dataset.emoticon = emoticons[i].emoticonString;

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

function copyEmoticon(event) {
    const copyEmoticon = event.target.dataset.emoticon;

    navigator.clipboard.writeText(copyEmoticon);
    
    console.log(copyEmoticon);
}