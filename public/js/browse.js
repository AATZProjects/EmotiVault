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
    
    console.log(data);
} 

function updateEmoticons(emoticons) {

    const tbody = document.querySelector("#emoticon-result");
    tbody.replaceChildren();

    for (let i = 0; i < emoticons.length; i++) {
        const row = document.createElement("tr"); 
        const cell = document.createElement("td");

        emoticons.textContent = emoticons[i].emoticonString;
        row.appendChild(cell);

        tbody.appendChild(row);
    }
}