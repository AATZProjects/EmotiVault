let numPages = 0;
let currentPage = 1;
let pageSize = 15;

// When the page loads, request the favorites information using the User ID
document.addEventListener("DOMContentLoaded", initPage);
document.querySelector("#first-btn").addEventListener("click", () => { changePage(1) });
document.querySelector("#prev-btn").addEventListener("click", () => { changePage(currentPage - 1) });

async function initPage() {
    // Check if there are any emoticons to display
    let response = await fetch(`/api/userFavorites?page=${currentPage}&limit=${pageSize}`);
    let data = await response.json();

    if (data.emoticons === undefined | data.emoticons.length == 0) {
        // Display the add emoticons screen and hide the emoticons
    }

    await renderEmoticons();

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

        pageButton.addEventListener("click", () => { changePage(page) });

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

    nextButton.addEventListener("click", () => { changePage(currentPage + 1) });
    lastButton.addEventListener("click", () => { changePage(numPages) });

    paginationBar.appendChild(nextButton);
    paginationBar.appendChild(lastButton);
}
async function changePage(newPage) {
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
    if (currentActive) {
        currentActive.className = "ev-page-link";
    }

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

    /// Update the actual table elements
    await renderEmoticons();
}

async function renderEmoticons() {
    let response = await fetch(`/api/userFavorites?page=${currentPage}&limit=${pageSize}`);
    let data = await response.json();

    // Remove all of the rows currently being rendered
    document.querySelectorAll(".emoticon-table-row").forEach(row => row.remove());

    // Procedurally Generate the Rows
    let tableBody = document.querySelector(".favorites-table-body");


    for (let emoticonRow of data.emoticons) {
        let tableRow = document.createElement("tr");
        tableRow.className = "emoticon-table-row";

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

        removeButton.addEventListener("click", () => { removeLike(emoticonRow.emoticonId) });
        tableRow.appendChild(removeButtonData);

        tableBody.appendChild(tableRow);
    }

    // Update the num pages to reflect what the API shows
    numPages = data.num_pages;
}


async function removeLike(emoticonId) {

    let num_likes = 0;
    try {
        let response = await fetch(`/api/removeFavorite/${emoticonId}`);
        let data = await response.json();

        // Verify there is no error
        if (typeof data.error !== 'undefined') {
            console.log("There was an error deleting the Emoticon.");
            console.log(data.error);
            return;
        }

        num_likes = data.num_likes ?? 0;
    } catch (error) {
        console.error(error);
        return;
    }

    let oldNumPages = numPages;
    // Re-render the emoticons table
    await renderEmoticons();

    // Update the Like Counter
    document.querySelector("#total-favorites-value").innerHTML = num_likes;

    // If we're back to zero likes, then refresh the page
    if (num_likes === 0) {
        window.location.reload();
    }

    // If our number of pages have updated, delete the last page
    if (oldNumPages > numPages) {
        // Delete the button for the page
        let pageButton = document.querySelector(`#page-button-${oldNumPages}`).remove();
    }

    // If we've went down from the last page, step down the page
    if (currentPage > numPages) {
        await changePage(numPages);
    }


}