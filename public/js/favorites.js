// TODO - Get the user ID from local storage
let userID = 2;

// When the page loads, request the favorites information using the User ID
document.addEventListener("DOMContentLoaded", initPage);

async function initPage() {
    // TODO, if the user ID isn't valid redirect us to the login page
    let response = await fetch(`/api/userFavorites/${userID}`);
    let data = await response.json();

    // Update the Favorites Count
    let likeCountText = document.querySelector("#total-favorites-value");
    likeCountText.innerHTML = data.likeCount;

    // Procedurally Generate the Rows
    let tableBody = document.querySelector(".favorites-table-body");

    for (let emoticon of data.emoticons) {
        // Use the Emoticons API to get the corresponding emoticon information
        let response = await fetch(`/api/emoticon/${emoticon.emoticonId}`);
        let emoticonObject = await response.json();

        let tableRow = document.createElement("tr");

        // Emoticon String
        let emoticonString = document.createElement("td");
        emoticonString.className = "ev-table-emoticon";
        emoticonString.innerHTML = emoticonObject.emoticonString;
        tableRow.appendChild(emoticonString);

        // Emoticon Category
        let emoticonCategory = document.createElement("td");
        emoticonCategory.innerHTML = emoticonObject.emoticonCategory;
        tableRow.appendChild(emoticonCategory);

        // Emoticon Mood
        let emoticonMood = document.createElement("td");
        emoticonMood.innerHTML = emoticonObject.emoticonMood;
        tableRow.appendChild(emoticonMood);

        // Date Added
        let dateAdded = document.createElement("td");
        dateAdded.innerHTML = emoticon.likedDate;
        tableRow.appendChild(dateAdded);

        // Remove Button
        let removeButtonData = document.createElement("td");
        removeButtonData.className = "ev-table-actions";
        let removeButton = document.createElement("button");
        removeButton.className = "ev-btn ev-btn-danger";
        removeButton.innerHTML = "Remove";
        removeButtonData.appendChild(removeButton);

        removeButton.addEventListener("click", () => {removeLike(emoticon.emoticonId)});
        tableRow.appendChild(removeButtonData);

        tableBody.appendChild(tableRow);
    }
}

// TODO: REMOVE EMOTICON FROM LIKE TABLE
async function removeLike(emoticonId) {
    console.log("REQUESTED TO REMOVE EMOTICON " + emoticonId);
}