
// Global variables
let currentPage = 1;
let numPages = 0;
let limit = 20;

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
    starBtns[j].addEventListener("click", favoriteClick);
}

const pageNumber = document.querySelectorAll(".ev-page-number");
for (let p = 0; p < pageNumber.length; p++) {
    pageNumber[p].addEventListener("click", changePage); //event passed into changePage() parameter 
}

async function initPage() {

    const response = await fetch(`/api/emoticons/all?page=${currentPage}&limit=${limit}`);
    const data = await response.json();
    console.log(data);


    numPages = data.num_pages;
    console.log("num pages: ", numPages);
    updatePaginationBar();
}

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

    numPages = data.num_pages;
    
    updateEmoticons(data.emoticons); //Becomes the emoticons parameter
    updatePaginationBar();

    console.log("Current page: ", currentPage);
    console.log("Total filtered pages: ", data.num_pages);
} 

async function filterEmoticons(event) {
    //Prevent form from natural browser behavior
    event.preventDefault();

    //New filter search resets the page to 1
    currentPage = 1;

    getFilteredEmoticons();
    updatePaginationBar();
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

//Updates the page bar to display number of pages according to the amount of emoicons returned 
function updatePaginationBar() {

    let startPage;
    let endPage;

    // Limit the pages displayed at a time
    if (currentPage <= 5) {
        endPage = 5; //default 
        
        if (endPage > numPages) {
            endPage = numPages;
        }

    } else {
        endPage = currentPage;
    }

    startPage = endPage - 4;

    if (startPage < 1 ) {
        startPage = 1;
    }

    let paginationBar = document.querySelector("#paginationBar");
    paginationBar.replaceChildren();

    let firstBtn = document.createElement("a");
    let prevBtn = document.createElement("a");

    firstBtn.href = "#";
    prevBtn.href = "#";
    
    firstBtn.textContent = "‹‹ First";
    prevBtn.textContent = "‹ Prev";

    firstBtn.className = "ev-page-link firstBtn";
    prevBtn.className = "ev-page-link prevBtn";

    firstBtn.addEventListener("click", firstPage);
    prevBtn.addEventListener("click", prevPage);

    paginationBar.appendChild(firstBtn);
    paginationBar.appendChild(prevBtn);

    for (let page = startPage; page <= endPage; page++) {

        let pageButton = document.createElement("a");
        pageButton.className = "ev-page-link";
        pageButton.href = "#";

        if (page === currentPage) {
            pageButton.className = "ev-page-link is-active";
        }
        
        if (currentPage === 1) {
            prevBtn.className = "ev-page-link prevBtn is-disabled";
            firstBtn.className = "ev-page-link firstBtn is-disabled";
        }

        pageButton.textContent = page;
        pageButton.dataset.page = page;
        pageButton.id = `page-button-${page}`;

        pageButton.addEventListener("click", changePage);

        paginationBar.appendChild(pageButton);
    }

    //Next, and Last buttons

    let nextBtn = document.createElement("a");
    let lastBtn = document.createElement("a");

    nextBtn.href = "#";
    lastBtn.href = "#";

    nextBtn.textContent = "Next ›";
    lastBtn.textContent = "Last ››";

    nextBtn.className = "ev-page-link nextBtn";
    lastBtn.className = "ev-page-link lastBtn";

    nextBtn.addEventListener("click", nextPage);
    lastBtn.addEventListener("click", lastPage);

    if (currentPage === numPages) {
        nextBtn.className = "ev-page-link nextBtn is-disabled";
        lastBtn.className = "ev-page-link lastBtn is-disabled";
    }

    paginationBar.appendChild(nextBtn);
    paginationBar.appendChild(lastBtn);
}

function copyEmoticon(event) {
    const copyEmoticon = event.target.dataset.emoticon;

    navigator.clipboard.writeText(copyEmoticon);
    
    alert("Emoticon copied to clipboard!");
}

// Pagination functions
function nextPage(event) {
    event.preventDefault();
    if (currentPage < numPages){
        currentPage++;
    }
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

function firstPage(event) {
    event.preventDefault();
    currentPage = 1;

    getFilteredEmoticons();
}

function lastPage(event) {
    event.preventDefault();
    currentPage = numPages;

    getFilteredEmoticons();
}

function changePage(event) {
    event.preventDefault();
    currentPage = Number(event.target.dataset.page);

    getFilteredEmoticons();
}
// Responsible for handling add/removale of favorites when the user clicks the star button
async function favoriteClick(event) {
    let favoriteBtn = event.currentTarget;
    let emoticonId = favoriteBtn.dataset.emoticonId;

    if (favoriteBtn.textContent.trim() === "☆") {
        await addToFavorites(event);
    } else {
        await removeFavorites(emoticonId);
        favoriteBtn.textContent = "☆";
    }
    console.log("Removed emoticonId: ", emoticonId);
    console.log("added emoticon: ", favoriteBtn);
}

//Sends the emoticonId to the post route to update the database
async function addToFavorites(event) {
    const favoritedBtn = event.target;
    const emoticonId = favoritedBtn.dataset.emoticonId;

    // send request to the api and make it a POST method
    const response = await fetch("/api/favorites", {
        method: "POST",
        //Tells the server the type of package being sent
        headers: {
            "content-Type": "application/json"
        },

        //body gives the server the emoticonId packaged for HTTP request traversal
        body: JSON.stringify({
            emoticonId: emoticonId
        })
    });

    //Redirect the use to the login page identified by the url built-in property of the response object
    if (response.redirected) {
        window.location.href = response.url;
        return;
    }

    const data = await response.json();

    favoritedBtn.textContent = "★";
    
    alert(data.message);
}

//Displays the currently favorited emoticons by highlighting the star buttons 
async function loadFavorites() {
    let response = await fetch("/api/userFavorites");
    let data = await response.json();
    let favorited; 
    let emoticonId;

    let favoriteBtns = document.querySelectorAll(".starBtns");
    
    for (let i = 0; i < favoriteBtns.length; i++) {
        favorited = favoriteBtns[i];
        emoticonId = Number(favorited.dataset.emoticonId);
        // console.log("emoticon ID: ", emoticonId);
        // console.log("favorited: ", favorited);

        for (let j = 0; j < data.emoticons.length; j++) {
            let favoriteId = data.emoticons[j].emoticonId;

            // console.log("Favorited Id: ", favoriteId);
            if (emoticonId === favoriteId) {
                favorited.textContent = "★";
            }
        }
        // favorited.addEventListener("click", removeFavorites);
    }
    console.log("data: ", data);
}

//Removes the emoticon from the database using local API 
async function removeFavorites(emoticonId) {

    let response = await fetch(`/api/removeFavorite/${emoticonId}`);
    let data = await response.json();

    alert(data.message);
}

initPage();
loadFavorites();