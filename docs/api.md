# EmotiVault APIs
EmotiVault contains a set of helpful APIs to retrieve Emoticons from our database.

You can access the daily emoticon, retrieve a collection of emoticons using filters, or even get the full database of emoticons.

# How to Use
Read the documentation for specific APIs to see their intended domain of input parameters and outputs.

***For public use***: the webpage https://emotivault.onrender.com/api/ should be the base URL. Following the URL, you may enter [the listed API](#apis) followed by any of their parameters as indicated in their documentation.

***For internal development***, simply use `/api/` followed by [the listed API](#apis) followed by their parameters indicated in their documentation.

# Errors
If you use an API and pass in invalid arguments, you will receive an error response with data name `error`. It will return a String detailing the reason why the call failed. No emoticon will be returned.

Refer to the [emoticonId API table](#emoticonemoticonid) to see an example of an error in the output.

# APIs
1. [/emoticon/{emoticonId}](#emoticonemoticonid)
2. [/emoticons/all](#emoticonsall)
3. [/emoticons/filter](#emoticonsfilter)
4. [/emoticon-of-the-day](#emoticon-of-the-day)

# /emoticon/{emoticonId}
Returns all information of an emoticon given its ID.

If the input is empty or out of range, an error will return.

Requesting an Emoticon given its ID will return the following information:
- emoticonId
- emoticonName
- emoticonString
- emoticonCategory
- emoticonMood
- emoticonFavorites

| Parameter | Example | Output |
| :---: | :---: | :---: |
| **emoticonId** | /api/emoticon/**21** | {"emoticonId": 21,<br>"emoticonName": "Classic Happy 2",<br>"emoticonString": ":)",<br>"emoticonCategory": "Classic",<br>"emoticonMood": "Happy"} |
| **No Args** | /api/emoticon/ | {"error": "ERROR: Emoticon ID can not be empty."} |
| **emoticonId** | /api/emoticon/**-1** | {"error": "ERROR: Emoticon ID is not in range."} |

# /emoticons/all
Returns the list of emoticons, sorted by emoticon ID by default. 

You are able to specify a `limit` to the data if you don't want to receive the entire list, in which it will return the first `n` elements where `n` is the desired `limit`.

Alternatively, you can rely on the APIs pagination in which the API will return the data in pages. You can access this by using the `page` parameter. The default size of a page is **20 items** but this can be manually adjusted using the `limit` parameter, in case you want to make the design friendly for smaller screens and interfaces.

When using pagination, the first item in the JSON output will be the total number of pages. The second value will be the array of emoticons.

The output of the JSON will be an array of emoticons, each index will contain all information of the emoticon:

```
num_pages
arrayIndex:
    - emoticonId
    - emoticonName
    - emoticonString
    - emoticonCategory
    - emoticonMood
    - emoticonFavorites
```

| Parameter | Example | Output |
| :---: | :---: | :---: |
| **No Args** | /api/emoticons/all | [{1 {...}, 2 {...}, 3 {...}, 4 {...}, -> size{...}}] |
| **page=** | /api/emoticons/all?**page=2** | [{21 {...}, 22 {...}, -> 40 {...}}] |
|**limit=** | /api/emoticons/all?page=3&**limit=2** | [{5 {...}, 6 {...}}] |

# /emoticons/filter
The Emoticons Filter API works similarly to the [/emoticons/all](#emoticonsall) API in the sense that it returns a bulk list of emoticons in the same formatting and can be filtered using pagination and return limits, but also carries its own set of filters and ordering conventions.

Refer to the [/emoticons/all](#emoticonsall) API to see how to utilize the paging system and display filtering.

The `/emoticons/filter` API is unique as it is also able to filter emoticons by category and mood, as well as search by keywords and order the results.

| Parameter | Example | Output |
| :---: | :---: | :---: |
**category=** | .../filter?**category=kaomoji** | All emoticons containing `Koamoji` as their category field.
**mood=** | .../filter?**mood=shock** | All emoticons containing `Shock` as their mood.
**sortBy=** | .../filter?**sortBy=popular** | All emoticons in order from Most Popular to Least Popular (most favorites).
**search=** | .../filter?**search=smile** | All emoticons which the mood, category, or internal name contain the word "smile". 

Here are examples of the filters being used in conjunction with pagination:

|                            Example                            |                                        Notes                                         |
|:-------------------------------------------------------------:|:------------------------------------------------------------------------------------:|
|     api/emoticons/filter?page=1&limit=10&category=classic     | The "limit" field is optional and if let out then the default limit of 20 will apply |
| api/emoticons/filter?category=kaomoji&mood=shock&search=smile |            Since no page number is specified, this will return ALL items             |
|          api/emoticons/filter?sortBy=category&page=3          |  This specifies the sortBy manually and shows page 3 using the default limit of 20   |

You can use any combination and order of filters, simply separate each parameter with '&'.

For a complete list of all possible categories, moods, and orders, refer to [the Emoticon Fields table.](#emoticon-fields)

# /emoticon-of-the-day
The Emoticon of the Day API will return the website's current daily emoticon. The API will return the following information:

```
currentDate,
emoticonId:
    - emoticonId
    - emoticonName
    - emoticonString
    - emoticonCategory
    - emoticonMood
    - emoticonFavorites
```

The API takes no parameters and only returns the daily Emoticon.

| Parameter | Example | Output |
| :---: | :---: | :---: |
| **No args** | /api/emoticon-of-the-day | "date": 2026-07-30,<br>"emoticonId": 21:<br>{"emoticonId": 21,<br>"emoticonName": "Classic Happy 2",<br>"emoticonString": ":)",<br>"emoticonCategory": "Classic",<br>"emoticonMood": "Happy"} 

# Emoticon Fields
These are the possible values that can be stored internally in each Emoticon's database row:

## Category
Saved internally as emoticonCategory

| Name | Display Name | /emoticons/filter/category=___ |
| :---: | :---: | :---: |
| Classic | Classic (Latin) | classic |
Upright | Upright | upright
Unicode | Unicode | unicode
Kaomoji | Kaomoji | kaomoji
Misc | Misc | misc
2Channel | 2Channel | 2channel

## Mood
Saved internally as emoticonMood

| Name/Display Name | /emoticons/filter/mood=___ |
| :---: | :---: |
Happy | happy
Sad | sad
Angry | angry
Love | love
Surprised | surprised
Confused | confused
Embarrassed | embarrassed
Playful | playful
Neutral | neutral
Sleepy | sleepy
Cool | cool
Respect | respect

## Sort By
When using the [/emoticons/filter/](#emoticonsfilter) API, it is permitted to use the Sort By parameter: `?sortBy=`.

These are the allowed values and their outputs.

?sortBy=**___** | Result
:---: | :---:
emoticonId | Emoticons are ordered by their IDs ascending.<br>This is the default sort method when calling [.../all/](#emoticonsall) and [.../filter/](#emoticonsfilter).
category | Emoticons are sorted by their category alphabetically (A -> Z).
mood | Emoticons are sorted by their mood alphabetically (A -> Z).
popular | Emoticons are ordered using their Favorites count, descending numerically (Greatest to Least).
leastPopular | Emoticons are ordered using their Favorites count, ascending numerically (Least to Greatest).