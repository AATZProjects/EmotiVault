// When the page loads, request the favorites information using the User ID
document.addEventListener("DOMContentLoaded", initPage);

async function initPage() {
    let response = await fetch(`/api/userFavorites?page=1&limit=2`);            // TODO: REMOVE THE LIMIT LINE WHEN DONE WITH DEBUGGING
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
        
}

// TODO: REMOVE EMOTICON FROM LIKE TABLE
async function removeLike(emoticonId) {
    console.log("REQUESTED TO REMOVE EMOTICON " + emoticonId);
}