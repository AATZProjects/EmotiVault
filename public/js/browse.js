// Event Listeners
const filterForm = document.querySelector(".ev-browse-filters");
filterForm.addEventListener("submit", filterEmoticons); // event passed into the filterEmoticons() parameter

const submit = document.querySelector(".ev-browse-filters");
submit.addEventListener("submit", updateEmoticons);

const copyBtns = document.querySelectorAll(".copyBtns");
for( let i = 0; i < copyBtns.length; i++) {
    copyBtns[i].addEventListener("click", copyEmoticon);
}

const starBtns = document.querySelectorAll(".starBtns");
for(let j = 0; j < starBtns.length; j++) {
    starBtns[j].addEventListener("click", addToFavorites);
}

const pageNumber = document.querySelectorAll(".ev-page-number");
for (let p = 0; p < pageNumber.length; p++) {
    pageNumber[p].addEventListener("click", changePage); //event passed into changePage() parameter 
}

const nextBtn = document.querySelectorAll(".nextBtn");
for (let n = 0; n < nextBtn.length; n++) {
    nextBtn[n].addEventListener("click", nextPage); //event passed into nextPage() parameter 
}

const prevBtn = document.querySelectorAll(".prevBtn");
for (let prev = 0; prev < prevBtn.length; prev++) {
    prevBtn[prev].addEventListener("click", prevPage); //event passed into prevPage() parameter 
}

// Global variables
let currentPage = 1;

// Modifies the API parameters with user input filter options
async function getFilteredEmoticons() {
    const category = document.querySelector('[name="category"]').value;
    const mood = document.querySelector('[name="mood"]').value;
    const search = document.querySelector('[name="search"]').value;
    const sortBy = document.querySelector('[name="sort"]').value;

    console.log("category: ", category);
    console.log("mood: ", mood);
    console.log("search: ", search);
    console.log("sort: ", sortBy);

    const response = await fetch(
        `/api/emoticons/filter?category=${category}&mood=${mood}&search=${search}&sortBy=${sortBy}&page=${currentPage}&limit=20`);
    
    const data = await response.json();
    
    updateEmoticons(data.emoticons); //Becomes the emoticons parameter

    console.log("Current page: ", currentPage);
    console.log("Total filtered pages: ", data.num_pages);

} 

async function filterEmoticons(event) {
    //Prevent form from natural browser submit/reload behavior
    event.preventDefault();

    //New filter search resets the page to 1
    currentPage = 1;

    getFilteredEmoticons();
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

        starBtn.className = "ev-icon-button starBtns";
        starBtn.type = "button"
        starBtn.textContent = "☆";
        starBtn.dataset.emoticonId = emoticons[i].emoticonId;
        starBtn.addEventListener("click", addToFavorites);

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

function addToFavorites(event) {
    const favoriteEmoticons = event.target.dataset.emoticon;

    console.log(favoriteEmoticons);
}

// Pagination functions
function nextPage(event) {
    event.preventDefault();

    currentPage++;

    getFilteredEmoticons();
}

function prevPage(event) {
    event.preventDefault();
    
    if (currentPage === 1) {
        return;
    } else {
        currentPage--;
        getFilteredEmoticons();
    }
}

function changePage(event) {
    event.preventDefault();
    currentPage = Number(event.target.dataset.page);

    getFilteredEmoticons();
}