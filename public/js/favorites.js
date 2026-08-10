let numPages = 0;
let currentPage = 1;
let pageSize = 2;

// When the page loads, request the favorites information using the User ID
document.addEventListener("DOMContentLoaded", initPage);
document.querySelector("#first-btn").addEventListener("click", () => {changePage(1)});
document.querySelector("#prev-btn").addEventListener("click", () => {changePage(currentPage - 1)});

async function initPage() {
    let response = await fetch(`/api/userFavorites?page=1&limit=${pageSize}`);            // TODO: REMOVE THE LIMIT LINE WHEN DONE WITH DEBUGGING
    let data = await response.json();
    console.log(data);

    // Procedurally Generate the Rows
    let tableBody = document.querySelector(".favorites-table-body");

    
    for (let emoticonRow of data.emoticons) {
        let tableRow = document.createElement("tr");

        // Emoticon String
        let emoticonString = document.createElement("td");
        emoticonString.className = "ev-table-emoticon";
        emoticonString.innerHTML = emoticonRow.emoticonString;
        tableRow.appendChild(emoticonString);

        // Emoticon Category
        let emoticonCategory = document.createElement("td");
        emoticonCategory.innerHTML = emoticonRow.emoticonCategory;
        tableRow.appendChild(emoticonCategory);

        // Emoticon Mood
        let emoticonMood = document.createElement("td");
        emoticonMood.innerHTML = emoticonRow.emoticonMood;
        tableRow.appendChild(emoticonMood);

        // Date Added
        let dateAdded = document.createElement("td");
        dateAdded.innerHTML = emoticonRow.likedDate;
        tableRow.appendChild(dateAdded);

        // Remove Button
        let removeButtonData = document.createElement("td");
        removeButtonData.className = "ev-table-actions";
        let removeButton = document.createElement("button");
        removeButton.className = "ev-btn ev-btn-danger";
        removeButton.innerHTML = "Remove";
        removeButtonData.appendChild(removeButton);

        removeButton.addEventListener("click", () => {removeLike(emoticonRow.emoticonId)});
        tableRow.appendChild(removeButtonData);

        tableBody.appendChild(tableRow);
    }


    // Procedurally Generate Pages
    numPages = data.num_pages;
    await renderPageButtons();
}

function renderPageButtons() {
    // Render each page as a button
    let paginationBar = document.querySelector("#pagination-bar");

    for (let page = 1; page <= numPages; page++) {
        let pageButton = document.createElement("a");
        pageButton.className = "ev-page-link";
        pageButton.href = "#";

        if (page === currentPage) {
            pageButton.className = "ev-page-link is-active";
        }

        pageButton.innerHTML = page;
        pageButton.id = `page-button-${page}`;

        pageButton.addEventListener("click", () => {changePage(page)});

        paginationBar.appendChild(pageButton);
    }

    // Add on the Next and Last buttons
    let nextButton = document.createElement("a");
    let lastButton = document.createElement("a");
    nextButton.href = "#";
    lastButton.href = "#";

    nextButton.innerHTML = "Next ›";
    lastButton.innerHTML = "Last »";

    nextButton.className = "ev-page-link";
    lastButton.className = "ev-page-link";

    nextButton.id = "next-btn";
    lastButton.id = "last-btn";

    nextButton.addEventListener("click", () => {changePage(currentPage + 1)});
    lastButton.addEventListener("click", () => {changePage(numPages)});
    
    paginationBar.appendChild(nextButton);
    paginationBar.appendChild(lastButton);
}
function changePage(newPage) {
    // If the new page is already the current page, do nothing
    if (newPage === currentPage) {
        return;
    }

    // If the new page is invalid, do nothing
    if (newPage <= 0 || newPage > numPages) {
        return;
    }

    // Remove the active button class and set the new one
    let currentActive = document.querySelector(`#page-button-${currentPage}`);
    currentActive.className = "ev-page-link";

    let newActive = document.querySelector(`#page-button-${newPage}`);
    newActive.className = "ev-page-link is-active";

    currentPage = newPage;

    // UPDATE THE FIRST, PREV, NEXT, AND LAST BUTTONS

    // If we are on page 1, disable first and prev
    if (currentPage === 1) {
        document.querySelector("#first-btn").className = "ev-page-link is-disabled";
        document.querySelector("#prev-btn").className = "ev-page-link is-disabled";
    } else {
        document.querySelector("#first-btn").className = "ev-page-link";
        document.querySelector("#prev-btn").className = "ev-page-link";
    }

    // If we are on last page, disable next and last
    if (currentPage === numPages) {
        document.querySelector("#next-btn").className = "ev-page-link is-disabled";
        document.querySelector("#last-btn").className = "ev-page-link is-disabled";
    } else {
        document.querySelector("#next-btn").className = "ev-page-link";
        document.querySelector("#last-btn").className = "ev-page-link";
    }
}


// TODO: REMOVE EMOTICON FROM LIKE TABLE
async function removeLike(emoticonId) {
    console.log("REQUESTED TO REMOVE EMOTICON " + emoticonId);
}